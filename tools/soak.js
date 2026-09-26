#!/usr/bin/env node
/*
 * 連続対局の耐久テスト
 *   node tools/soak.js [分] [同時に回す卓の数]   （既定 5分・4卓。puppeteer-core は tools/screenshots.sh と同じ場所 ~/.cache/sui-shots に入っている前提）
 *   手元の Google Chrome を裏で動かし、自由対局を自分の席も自動で打って何局も回す（リーチ・ポン・チーも混ぜる）。
 *   例外、局ごとの不変条件（牌の総数136枚・点数の合計＋供託＝100000）、60秒以上進まない停滞を報告する。
 *   終了コード: 0=問題なし / 1=例外・不変条件の崩れ・停滞あり
 */
const path = require('path');
const puppeteer = require('puppeteer-core');
const MIN = +(process.argv[2] || 5), N = +(process.argv[3] || 4);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?t=soak';

// ページの中で動かす準備（自分の席の自動打ち、確認の自動応答、結果画面の自動送り、不変条件の検査）
const SETUP = `
localStorage.removeItem('mjSaveGame'); lsSet('mjHelpSeen','1');
SPEED='fast'; SPEEDS.fast={draw:30,react:30,call:40,think:[15,30]}; think=()=>20;
window.__soak={hands:0,games:0,errors:[],invariant:[],riichi:0,calls:0,aborts:0,nagashi:0,t0:Date.now()};
window.onerror=(m,src,l)=>{__soak.errors.push(String(m)+' @'+l);};
window.addEventListener('unhandledrejection',e=>{__soak.errors.push('rej '+(e.reason&&e.reason.message||e.reason));});
humanTurn=function(){const pid=VIEW,p=G.players[pid];if(!G||G.over||G.turn!==pid||G.phase!=='discard')return;
  if(p.drawn>=0&&isAgari(p.hand,p.melds.length)){const ev=evaluate(p.hand,p.melds,buildCtx(pid,true,p.drawn));if(ev)return win(pid,pid,true,p.drawn);}
  if(!p.riichi&&p.melds.every(m=>m.concealed)&&p.score>=1000&&G.wall.length>=4&&shanten(p.hand,p.melds.length)===0&&Math.random()<.7){const idx=chooseTenpaiDiscard(p);if(idx>=0){p.pendingRiichi=true;__soak.riichi++;return humanDiscard(idx,true);}}
  if(p.riichi){const i=p.hand.indexOf(p.drawn);return humanDiscard(i>=0?i:0,true);}
  if(!p.riichi&&G.wall.length>0){const ks=kanOptions(p);if(ks.length&&Math.random()<.5)return doKan(pid,ks[0].tile,ks[0].kind);}
  humanDiscard(chooseBestDiscard(p),true);};
askDecision=function(pid,req,cb){setTimeout(()=>{if(req.kind==='ron')return cb({a:'ron'});if(req.kind==='pon'&&Math.random()<.5){__soak.calls++;return cb({a:req.canKan&&Math.random()<.3?'kan':'pon'});}if(req.kind==='chi'&&Math.random()<.3){__soak.calls++;return cb({a:'chi',k:0});}cb({a:'pass'});},20);};
const chk=()=>{try{const tiles=G.players.reduce((a,p)=>a+p.hand.length+p.melds.reduce((b,m)=>b+(m.k||3),0)+p.discards.length,0)+G.wall.length+G.dead.length;const claimed=G.players.reduce((a,p)=>a+p.discards.filter(d=>typeof d==='object'&&d.claimed).length,0);const total=tiles-claimed;const sum=G.players.reduce((a,p)=>a+p.score,0)+(G.riichiSticks||0)*1000;if(total!==136)__soak.invariant.push('tiles '+total+' hand#'+__soak.hands);if(sum!==100000)__soak.invariant.push('score '+sum+' hand#'+__soak.hands);if(G.abort)__soak.aborts++;}catch(e){__soak.errors.push('chk '+e.message);}};
const _ec=endCheck;endCheck=function(){chk();return _ec.apply(null,arguments);};
const _sr=showResult;showResult=function(){_sr.apply(null,arguments);__soak.hands++;setTimeout(()=>{const b=document.getElementById('nextBtn');if(b&&document.getElementById('overlay').style.display==='flex'){b.classList.remove('hidden');b.click();}},250);};
const _sd=showDraw;showDraw=function(t,nag){_sd.apply(null,arguments);__soak.hands++;if(nag&&nag.some(Boolean))__soak.nagashi++;setTimeout(()=>{const b=document.getElementById('nextBtn');if(b)b.click();},250);};
const _sf=showFinal;showFinal=function(){__soak.games++;_sf.apply(null,arguments);setTimeout(()=>{const b=document.getElementById('nextBtn');if(b)b.click();},250);};
showHome();startFreeGame();
`;
const STATE = `({hands:__soak.hands,games:__soak.games,errors:__soak.errors,inv:__soak.invariant,riichi:__soak.riichi,calls:__soak.calls,aborts:__soak.aborts,nagashi:__soak.nagashi,round:document.getElementById('roundName').textContent,turn:G&&G.turn,phase:G&&G.phase,wall:G&&G.wall.length,over:G&&G.over,overlay:document.getElementById('overlay').style.display})`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell',
    args: ['--mute-audio', '--no-first-run', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const pages = [];
  for (let i = 0; i < N; i++) {   // 卓ごとに別の保存領域（記録が混ざらない）
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 932, height: 430, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.log(`卓${i + 1} pageerror:`, e.message));
    await page.goto(URL + i, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(SETUP);
    pages.push({ page, sig: '', sigAt: Date.now(), lastHands: -1 });
  }
  const t0 = Date.now();
  let bad = false;
  outer: while (Date.now() - t0 < MIN * 60000) {
    await new Promise(r => setTimeout(r, 5000));
    for (let i = 0; i < pages.length; i++) {
      const P = pages[i];
      const s = await P.page.evaluate(STATE);
      const now = `${s.round}|${s.turn}|${s.phase}|${s.wall}|${s.hands}|${s.overlay}`;
      if (now !== P.sig) { P.sig = now; P.sigAt = Date.now(); }
      if (s.hands !== P.lastHands) { P.lastHands = s.hands;
        console.log(`${Math.round((Date.now() - t0) / 1000)}s 卓${i + 1}  局 ${s.hands}  半荘 ${s.games}  リーチ ${s.riichi}  鳴き ${s.calls}  途中流局 ${s.aborts}  流し満貫 ${s.nagashi}  例外 ${s.errors.length}  不変条件 ${s.inv.length}`); }
      if (s.errors.length || s.inv.length) { console.log(`卓${i + 1} 問題:`, JSON.stringify({ errors: s.errors, inv: s.inv, state: now })); bad = true; break outer; }
      if (Date.now() - P.sigAt > 60000) { console.log(`卓${i + 1} 停滞（60秒以上進まない）:`, now); bad = true; break outer; }
    }
  }
  const tot = { hands: 0, games: 0, riichi: 0, calls: 0, aborts: 0, nagashi: 0, errors: 0, inv: 0 };
  for (const P of pages) { const f = await P.page.evaluate(STATE); tot.hands += f.hands; tot.games += f.games; tot.riichi += f.riichi; tot.calls += f.calls; tot.aborts += f.aborts; tot.nagashi += f.nagashi; tot.errors += f.errors.length; tot.inv += f.inv.length; }
  console.log('結果（合計）:', JSON.stringify(tot));
  await browser.close();
  process.exit(bad || tot.errors || tot.inv ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
