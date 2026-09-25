#!/usr/bin/env node
/*
 * 点数計算の突き合わせツール
 *   index.html の中の evaluate()（役・翻・符）と payments()（支払い）を Node で読み込み、
 *   既知の手と点数表と比べる。ブラウザなしで動く（DOM は空の代役を入れる）。
 *
 * 使い方:  node tools/scoring_check.js
 * 結果:    1行ずつ OK / NG を出し、NG があれば終了コード 1
 */
const fs = require('fs'), vm = require('vm'), path = require('path');

/* ---------- index.html の script を読み込む ---------- */
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/.exec(html);
if (!m) { console.error('index.html に script が見つかりません'); process.exit(2); }

// 何をされても壊れない「空の要素」。getElementById などはこれを返す
function fakeEl() {
  const f = function () {};
  const p = new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive || k === 'toString' || k === 'valueOf') return () => '';
      if (k === Symbol.iterator) return function* () {};
      if (k === 'then') return undefined;
      if (k === 'length') return 0;
      if (k === 'hidden') return true;
      if (k === 'textContent' || k === 'innerHTML' || k === 'value' || k === 'className' || k === 'id') return '';
      if (k === 'dataset') return {};
      if (k === 'children' || k === 'childNodes') return [];
      return p;
    },
    set() { return true; },
    apply() { return p; },
    has() { return true; },
  });
  return p;
}
const store = () => { const d = {}; return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: k => { delete d[k]; }, key: i => Object.keys(d)[i] || null, get length() { return Object.keys(d).length; } }; };
const sandbox = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, TextEncoder, TextDecoder, URL,
  crypto: require('crypto').webcrypto,
  performance: { now: () => Date.now() },
  requestAnimationFrame: cb => setTimeout(cb, 16), cancelAnimationFrame: clearTimeout,
  localStorage: store(), sessionStorage: store(),
  location: { hash: '', pathname: '/', search: '', hostname: 'localhost' },
  history: { replaceState() {} },
  navigator: { userAgent: 'node', language: 'ja' },
  screen: { orientation: { lock: () => Promise.resolve() } },
  innerWidth: 1024, innerHeight: 640,
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  getComputedStyle: () => fakeEl(),
  addEventListener() {}, removeEventListener() {},
  confirm: () => false, alert() {},
  Image: function () {},
  document: fakeEl(),
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
try { vm.runInContext(m[1], sandbox, { filename: 'index.html(script)' }); }
catch (e) { console.error('読み込み中の例外（無視して続けます）:', e && e.message); }
let api;
try { api = vm.runInContext('({evaluate, payments, rankName, isAgari, nt, paoShares})', sandbox); }
catch (e) { console.error('関数を取り出せません:', e && e.message); process.exit(2); }
const { evaluate, payments, rankName, paoShares } = api;

/* ---------- 牌の表記 ---------- */
// "123m 45p 6s E P" → 牌番号。萬 0-8、筒 9-17、索 18-26、東南西北白發中 27-33。赤5は "0m/0p/0s"
const HON = { E: 27, S: 28, W: 29, N: 30, P: 31, F: 32, C: 33 };
function tiles(str) {
  const out = [];
  for (const tok of str.trim().split(/\s+/)) {
    if (HON[tok] != null) { out.push(HON[tok]); continue; }
    const suit = tok.slice(-1), base = { m: 0, p: 9, s: 18 }[suit];
    if (base == null) throw new Error('牌の表記が不正: ' + tok);
    for (const ch of tok.slice(0, -1)) {
      if (ch === '0') out.push(base + 4 + 0.5); else out.push(base + (+ch) - 1);
    }
  }
  return out;
}
const pon = (t, from = 1) => ({ t: 'trip', tile: t, k: 3, concealed: false, from, called: t, reds: [] });
const chi = (low, from = 3) => ({ t: 'seq', tile: low, k: 3, concealed: false, from, called: low, reds: [] });
const ankan = (t) => ({ t: 'trip', tile: t, k: 4, concealed: true, kan: true, reds: [] });
const minkan = (t, from = 1) => ({ t: 'trip', tile: t, k: 4, concealed: false, kan: true, from, called: t, reds: [] });
const ctxOf = (o) => Object.assign({ seatWind: 1, roundWind: 0, tsumo: false, riichi: false, doubleRiichi: false, ippatsu: false,
  concealed: true, winTile: 0, chankan: false, haitei: false, houtei: false, rinshan: false, doraTiles: [], uraTiles: null }, o);

/* ---------- 期待値（切り上げ満貫なし・標準の点数表） ---------- */
function basePts(fu, han) {
  if (han >= 13) return 8000; if (han >= 11) return 6000; if (han >= 8) return 4000; if (han >= 6) return 3000; if (han >= 5) return 2000;
  return Math.min(fu * Math.pow(2, han + 2), 2000);
}
function expPay(fu, han, dealer, tsumo) {
  const b = basePts(fu, han), r = x => Math.ceil(x / 100) * 100;
  if (tsumo) { if (dealer) { const e = r(b * 2); return { each: e, total: e * 3 }; } const nd = r(b), d = r(b * 2); return { nd, d, total: nd * 2 + d }; }
  return { total: dealer ? r(b * 6) : r(b * 4) };
}

/* ---------- 手の検査 ---------- */
// hand: 和了牌を含む14枚（副露は除く）。melds: 副露。ctx: 状況。exp: {han, fu, yaku:[含まれるべき役名], none:true=役なし}
const CASES = [
  { n: '平和ツモ（20符2翻）', hand: '123m 456m 234p 678s 99p', win: '8s', ctx: { tsumo: true }, exp: { han: 2, fu: 20, yaku: ['平和', '門前清自摸和'] } },
  { n: '平和ロン（30符1翻）', hand: '123m 456m 234p 678s 99p', win: '8s', ctx: {}, exp: { han: 1, fu: 30, yaku: ['平和'] } },
  { n: '断幺 嵌張ロン（40符1翻）', hand: '234m 567m 345p 678s 88p', win: '4p', ctx: {}, exp: { han: 1, fu: 40, yaku: ['断幺九'] } },
  { n: '断幺 赤ドラ 嵌張ロン（40符2翻）', hand: '234m 067m 345p 678s 88p', win: '4p', ctx: {}, exp: { han: 2, fu: 40, yaku: ['断幺九'] } },
  { n: '七対子ロン（25符2翻）', hand: '11m 33m 55p 77p 22s 44s 99s', win: '9s', ctx: {}, exp: { han: 2, fu: 25, yaku: ['七対子'] } },
  { n: '七対子ツモ（25符3翻）', hand: '11m 33m 55p 77p 22s 44s 99s', win: '9s', ctx: { tsumo: true }, exp: { han: 3, fu: 25, yaku: ['七対子', '門前清自摸和'] } },
  { n: '白 暗刻 両面ロン（40符1翻）', hand: 'P P P 234m 456p 789s 22m', win: '4m', ctx: {}, exp: { han: 1, fu: 40, yaku: ['白'] } },
  { n: '断幺 暗刻 ツモ（30符2翻）', hand: '222m 345p 678s 567m 88p', win: '7m', ctx: { tsumo: true }, exp: { han: 2, fu: 30, yaku: ['断幺九', '門前清自摸和'] } },
  { n: '一盃口 平和ロン（30符2翻）', hand: '334455m 234p 678s 99p', win: '8s', ctx: {}, exp: { han: 2, fu: 30, yaku: ['一盃口', '平和'] } },
  { n: '三色同順 平和 断幺ロン（30符4翻）', hand: '234m 234p 234s 567m 88p', win: '4s', ctx: {}, exp: { han: 4, fu: 30, yaku: ['三色同順', '平和', '断幺九'] } },
  { n: '三色 平和 断幺 立直一発ツモ（跳満）', hand: '234m 234p 234s 567m 88p', win: '4s', ctx: { tsumo: true, riichi: true, ippatsu: true }, exp: { han: 7, fu: 20, yaku: ['三色同順', '平和', '断幺九', '立直', '一発', '門前清自摸和'] } },
  { n: '立直ツモ断幺平和ドラ1（満貫）', hand: '234m 567m 345p 678s 88p', win: '8s', ctx: { tsumo: true, riichi: true, doraTiles: [1] }, exp: { han: 5, fu: 20, yaku: ['立直', '門前清自摸和', '断幺九', '平和'] } },
  { n: '対々和 白 鳴き（50符3翻）', hand: '999s C C', win: 'C', melds: [pon(0), pon(13), pon(31)], ctx: { concealed: false }, exp: { han: 3, fu: 50, yaku: ['対々和', '白'] } },
  { n: '混一色 一気通貫 發 鳴き（30符4翻）', hand: '123s 456s 789s 99s', win: '9s', melds: [pon(32)], ctx: { concealed: false }, exp: { han: 4, fu: 30, yaku: ['混一色', '一気通貫', '發'] } },
  { n: '混一色 發 鳴き（30符3翻）', hand: '123s 456s 678s 99s', win: '9s', melds: [pon(32)], ctx: { concealed: false }, exp: { han: 3, fu: 30, yaku: ['混一色', '發'] } },
  { n: '清一色 一気通貫 門前ロン（倍満）', hand: '123m 456m 789m 222m 99m', win: '9m', ctx: {}, exp: { han: 8, fu: null, yaku: ['清一色', '一気通貫'] } },
  { n: '九蓮宝燈 ロン（役満）', hand: '123m 456m 789m 111m 99m', win: '9m', ctx: {}, exp: { han: 13, fu: null, yaku: ['九蓮宝燈'], only: true } },
  { n: '国士無双 ロン（役満）', hand: '19m 19p 19s E S W N P F C 1m', win: '1m', ctx: {}, exp: { han: 13, fu: null, yaku: ['国士無双'], only: true } },
  { n: '大三元 鳴き ロン（役満・他の役を数えない）', hand: '234m 99p', win: '4m', melds: [pon(31), pon(32), pon(33)], ctx: { concealed: false }, exp: { han: 13, fu: null, yaku: ['大三元'], only: true } },
  { n: '字一色 七対子（役満）', hand: 'E E S S W W N N P P F F C C', win: 'C', ctx: {}, exp: { han: 13, fu: null, yaku: ['字一色'], only: true } },
  { n: '四暗刻 単騎ツモ（役満）', hand: '111m 333p 555s 777s 99m', win: '9m', ctx: { tsumo: true }, exp: { han: 13, fu: null, yaku: ['四暗刻'], only: true } },
  { n: '役なし（鳴き・平和形・東の雀頭）', hand: '345p 678s 456s E E', win: '5s', melds: [pon(1)], ctx: { concealed: false }, exp: { none: true } },
  { n: '大四喜 鳴き ロン（役満）', hand: 'N N N 99m', win: '9m', melds: [pon(27), pon(28), pon(29)], ctx: { concealed: false }, exp: { han: 13, fu: null, yaku: ['大四喜'], only: true } },
  { n: '小四喜 鳴き ロン（役満）', hand: 'W W W N N 234p', win: '4p', melds: [pon(27), pon(28)], ctx: { concealed: false }, exp: { han: 13, fu: null, yaku: ['小四喜'], only: true } },
  { n: '四槓子（暗槓2・大明槓2）ツモ（役満）', hand: '9m 9m', win: '9m', melds: [ankan(0), ankan(13), minkan(20), minkan(31)], ctx: { tsumo: true, concealed: false }, exp: { han: 13, fu: null, yaku: ['四槓子'], only: true } },
  { n: '四暗刻（暗槓を含む）ツモ（役満）', hand: '333p 555s 777s 99m', win: '9m', melds: [ankan(0)], ctx: { tsumo: true }, exp: { han: 13, fu: null, yaku: ['四暗刻'], only: true } },
  { n: '緑一色 ロン（役満）', hand: '234s 234s 666s 888s F F', win: '8s', ctx: {}, exp: { han: 13, fu: null, yaku: ['緑一色'], only: true } },
  { n: '天和（役満）', hand: '123m 456m 234p 678s 99p', win: '8s', ctx: { tsumo: true, tenhou: true }, exp: { han: 13, fu: null, yaku: ['天和'], only: true } },
  { n: '地和（役満）', hand: '123m 456m 234p 678s 99p', win: '8s', ctx: { tsumo: true, chiihou: true }, exp: { han: 13, fu: null, yaku: ['地和'], only: true } },
  { n: '喰いタン ロン（30符1翻）', hand: '234m 567m 345p 88p', win: '5p', melds: [chi(19)], ctx: { concealed: false }, exp: { han: 1, fu: 30, yaku: ['断幺九'] } },
];

let fails = 0;
const ok = (b, msg) => { console.log((b ? 'OK  ' : 'NG  ') + msg); if (!b) fails++; };
for (const c of CASES) {
  const hand = tiles(c.hand), win = tiles(c.win)[0];
  const ctx = ctxOf(Object.assign({ winTile: Math.floor(win) }, c.ctx || {}));
  let ev;
  try { ev = evaluate(hand, c.melds || [], ctx); } catch (e) { ok(false, `${c.n}: evaluate が例外 ${e.message}`); continue; }
  if (c.exp.none) { ok(ev == null, `${c.n}: 役なし → ${ev ? '役あり(' + ev.yaku.map(y => y.n).join(',') + ')' : 'null'}`); continue; }
  if (!ev) { ok(false, `${c.n}: 役なし扱いになった`); continue; }
  const names = ev.yaku.map(y => y.n);
  const hanOk = ev.han === c.exp.han, fuOk = c.exp.fu == null || ev.fu === c.exp.fu;
  const yakuOk = (c.exp.yaku || []).every(y => names.includes(y)) && (!c.exp.only || names.every(y => c.exp.yaku.includes(y)));
  ok(hanOk && fuOk && yakuOk, `${c.n}: ${ev.han}翻 ${ev.fu}符 [${names.join(' ')}]` + (hanOk && fuOk && yakuOk ? '' : ` ← 期待 ${c.exp.han}翻 ${c.exp.fu == null ? '-' : c.exp.fu}符 ${(c.exp.yaku || []).join(',')}`));
}

/* ---------- 喰いタンなし（設定で門前のみにした時は役なし） ---------- */
{
  vm.runInContext('KUITAN=false;', sandbox);
  const ev = evaluate(tiles('234m 567m 345p 88p'), [chi(19)], ctxOf({ winTile: 13, concealed: false }));
  vm.runInContext('KUITAN=true;', sandbox);
  ok(ev == null, `喰いタンなし → 鳴いた断幺九は役なし: ${ev ? '役あり(' + ev.yaku.map(y => y.n).join(',') + ')' : 'null'}`);
}

/* ---------- 責任払い（パオ）の分担 ---------- */
console.log('--- 責任払い（{支払う人: 額}） ---');
const PAO = [
  { n: 'ツモ 32000 本場なし → パオが全額', a: [32000, 0, true, -1, 2], exp: { 2: 32000 } },
  { n: 'ツモ 32000 1本場 → パオが本場も', a: [32000, 1, true, -1, 2], exp: { 2: 32300 } },
  { n: '親の役満ロン 48000 → 振り込みとパオで折半', a: [48000, 0, false, 1, 2], exp: { 1: 24000, 2: 24000 } },
  { n: 'ロン 32000 2本場 → 本場は振り込んだ人', a: [32000, 2, false, 3, 0], exp: { 0: 16000, 3: 16600 } },
];
const norm = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
for (const c of PAO) { const got = paoShares(...c.a); ok(norm(got) === norm(c.exp), `${c.n}: ${JSON.stringify(got)}`); }

/* ---------- 支払いの表 ---------- */
console.log('--- 支払い（子ロン／親ロン／子ツモ／親ツモ） ---');
const GRID = [[20, 2], [20, 3], [20, 4], [25, 2], [25, 3], [25, 4], [30, 1], [30, 2], [30, 3], [30, 4], [40, 1], [40, 2], [40, 3], [40, 4], [50, 1], [50, 2], [50, 3], [60, 1], [60, 2], [60, 3], [70, 1], [70, 2], [70, 3], [80, 2], [90, 2], [110, 2], [30, 5], [30, 6], [30, 7], [30, 8], [30, 10], [30, 11], [30, 12], [30, 13]];
for (const [fu, han] of GRID) {
  const parts = [];
  let good = true;
  for (const [dealer, tsumo] of [[false, false], [true, false], [false, true], [true, true]]) {
    const got = payments(fu, han, dealer, tsumo), exp = expPay(fu, han, dealer, tsumo);
    const same = tsumo ? (dealer ? got.each === exp.each && got.total === exp.total : got.nd === exp.nd && got.d === exp.d && got.total === exp.total) : got.total === exp.total;
    if (!same) good = false;
    parts.push(tsumo ? (dealer ? `${got.each}all` : `${got.nd}/${got.d}`) : `${got.total}`);
  }
  ok(good, `${fu}符${han}翻 ${rankName(fu, han) || '-'}: ${parts.join('  ')}` + (good ? '' : `  ← 期待 子ロン${expPay(fu, han, false, false).total} 親ロン${expPay(fu, han, true, false).total}`));
}
console.log(fails ? `\nNG ${fails} 件` : '\nすべて一致');
process.exit(fails ? 1 : 0);
