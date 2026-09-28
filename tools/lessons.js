#!/usr/bin/env node
/*
 * 道場のレッスンと物語（第0章・第一章）の通し確認
 *   node tools/lessons.js [1項目あたりの秒数] [stages] [開始位置]   （既定 200秒。stages を付けると第二章〜第六章の13項目（戦は半荘まるごと、岐路・序・結末を含む）。開始位置で途中から。puppeteer-core は ~/.cache/sui-shots）
 *   手元の Chrome を裏で動かし、コーチの指示（光っている牌・ボタン）、会話の送り、選択肢、結果画面を自動で押して
 *   各レッスン・各節を最後まで進める。練習の一局など自由に打つ場面は自分の席も自動で打つ。
 *   進めなくなった項目（時間切れ）と例外を報告する。終了コード 0=すべて通過 / 1=通らない項目あり
 */
const path = require('path');
const puppeteer = require('puppeteer-core');
const LIMIT = +(process.argv[2] || 200), STAGES = process.argv[3] === 'stages', FROM = +(process.argv[4] || 0);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?t=lessons';

const SETUP = `
lsSet('mjHelpSeen','1'); SPEED='fast'; SPEEDS.fast={draw:30,react:30,call:40,think:[15,30]}; think=()=>20;
window.__drv={steps:0,errors:[],log:[]};
window.onerror=(m,src,l)=>{__drv.errors.push(String(m)+' @'+l);};
window.addEventListener('unhandledrejection',e=>{__drv.errors.push('rej '+(e.reason&&e.reason.message||e.reason));});
// 自由に打つ場面（レッスン以外）は自動で打つ
const __ht=humanTurn, __ad=askDecision;
humanTurn=function(){if(!G||G.tutorial)return __ht.apply(this,arguments);const pid=VIEW,p=G.players[pid];if(G.over||G.turn!==pid||G.phase!=='discard')return;
  if(p.drawn>=0&&isAgari(p.hand,p.melds.length)){const ev=evaluate(p.hand,p.melds,buildCtx(pid,true,p.drawn));if(ev)return win(pid,pid,true,p.drawn);}
  if(!p.riichi&&p.melds.every(m=>m.concealed)&&p.score>=1000&&G.wall.length>=4&&shanten(p.hand,p.melds.length)===0&&Math.random()<.7){const idx=chooseTenpaiDiscard(p);if(idx>=0){p.pendingRiichi=true;return humanDiscard(idx,true);}}
  if(p.riichi){const i=p.hand.indexOf(p.drawn);return humanDiscard(i>=0?i:0,true);}
  humanDiscard(chooseBestDiscard(p),true);};
askDecision=function(pid,req,cb){if(G&&G.tutorial)return __ad.apply(this,arguments);setTimeout(()=>{if(req.kind==='ron')return cb({a:'ron'});if(req.kind==='pon'&&Math.random()<.4)return cb({a:'pon'});if(req.kind==='chi'&&Math.random()<.3)return cb({a:'chi',k:0});cb({a:'pass'});},20);};
const _sr=showResult;showResult=function(){_sr.apply(null,arguments);setTimeout(()=>{if(G&&G.tutorial)return;const b=document.getElementById('nextBtn');if(b&&document.getElementById('overlay').style.display==='flex'){b.classList.remove('hidden');b.click();}},300);};
const _sd=showDraw;showDraw=function(){_sd.apply(null,arguments);setTimeout(()=>{if(G&&G.tutorial)return;const b=document.getElementById('nextBtn');if(b)b.click();},300);};
window.__stageDone=false;const _ssr=showStageResult;showStageResult=function(){__stageDone=true;return _ssr.apply(null,arguments);};
window.__driveTick=function(){try{
  const skip=/やめる|中断|もどる|最初から|もう一度|やり直|あの日に戻る/;
  {const ov0=document.getElementById('overlay');if(ov0.style.display==='flex'&&[...document.querySelectorAll('#modal .btn')].some(b=>/あの日に戻る|もう一度/.test(b.innerText)))window.__stageEndSeen=true;}
  const vn=document.getElementById('vn');
  if(vn&&!vn.hidden){const ch=document.querySelector('#vnChoices button');if(ch){ch.click();__drv.steps++;__drv.log.push('choice:'+ch.innerText.slice(0,6));return;}vnAdvance();__drv.steps++;return;}
  const ov=document.getElementById('overlay');
  if(ov.style.display==='flex'){const nb=document.getElementById('nextBtn');if(nb){nb.classList.remove('hidden');nb.click();__drv.steps++;__drv.log.push('next');return;}
    const cb=[...document.querySelectorAll('#modal .btn')].filter(b=>!skip.test(b.innerText))[0];if(cb){cb.click();__drv.steps++;__drv.log.push('modal:'+cb.innerText.slice(0,8));return;}}
  // 説明の段（info）では光っている牌は「例」なので押さず、コーチの「次へ」を押す
  const coachBtn=()=>{const all=[...document.querySelectorAll('#coachBtns button')].filter(b=>!skip.test(b.innerText));if(!all.length)return null;const isQuiz=document.getElementById('coachBtns').classList.contains('quizrow');return {b:isQuiz?all[(__drv.qi=(__drv.qi||0)+1)%all.length]:all[all.length-1],isQuiz};};
  {const coach=document.getElementById('coach');if(coach&&!coach.hidden){const c=coachBtn();if(c){c.b.click();__drv.steps++;__drv.log.push((c.isQuiz?'quiz:':'coach:')+c.b.innerText.slice(0,8));return;}}}
  const tp=document.querySelector('#myHand .tile.pulse');if(tp){tp.click();__drv.steps++;__drv.log.push('tile');return;}
  const bp=document.querySelector('#actions .btn.pulse');if(bp){bp.click();__drv.steps++;__drv.log.push('btn:'+bp.innerText.slice(0,6));return;}
  const coach=document.getElementById('coach');
  if(coach&&!coach.hidden){const all=[...document.querySelectorAll('#coachBtns button')].filter(b=>!skip.test(b.innerText));
    if(all.length){const isQuiz=document.getElementById('coachBtns').classList.contains('quizrow');const b=isQuiz?all[(__drv.qi=(__drv.qi||0)+1)%all.length]:all[all.length-1];b.click();__drv.steps++;__drv.log.push((isQuiz?'quiz:':'coach:')+b.innerText.slice(0,8));return;}}
  // 「どれでもいいから1枚捨てる」の段：光る牌もボタンもない自分の手番なら、右端の牌を捨てる
  if(G&&G.tutorial&&!G.over&&G.turn===VIEW&&G.phase==='discard'){const els=document.querySelectorAll('#myHand .tile');if(els.length){els[els.length-1].click();__drv.steps++;__drv.log.push('anytile');return;}}
}catch(e){__drv.errors.push('drv '+e.message);}};
`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell',
    args: ['--mute-audio', '--no-first-run', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 932, height: 430, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('dialog', async d => { console.log('dialog（キャンセル扱い）:', d.message().slice(0, 60)); try { await d.dismiss(); } catch (e) {} });
  await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(SETUP);
  // 項目の一覧（道場8つ、第0章3節、第一章の各節）
  const items = STAGES
    ? await page.evaluate(`(()=>{if(!HERO.origin){HERO=Object.assign(blankHero(),{name:'テスト',origin:'student'});saveHero();}const L=(typeof STAGE_LABELS!=='undefined')?STAGE_LABELS:[];return L.map((n,i)=>({kind:'stage',id:i,name:n}));})()`)
    : await page.evaluate(`[].concat(
    LESSONS.map(L=>({kind:'lesson',id:L.id,name:'道場：'+L.t})),
    ZERO.map((z,i)=>({kind:'zero',id:i,name:'第0章 第'+(i+1)+'節：'+z.t})),
    STORY.map((c,i)=>({kind:'story',id:i,name:'第一章 '+(c.final?'終節':'第'+(i+1)+'節')+'：'+c.t})))`);
  const results = [];
  let bad = false;
  for (const it of items.filter((x, i) => i >= FROM)) {
    const t0 = Date.now();
    await page.evaluate((it) => {
      __drv = { steps: 0, errors: [], log: [] };
      clearInterval(window.__drvT);
      hideTalk(); document.getElementById('overlay').style.display = 'none'; document.getElementById('coach').hidden = true;
      if (G) { G.over = true; G.gen++; }
      if (it.kind === 'lesson') { localStorage.removeItem('mjLesson_' + it.id); tut = { lesson: it.id, mode: '', phase: '', i: 0 }; showHome(); showDojo(); const b = [...document.querySelectorAll('button')].find(x => x.innerText.includes(it.name.split('：')[1])); if (b) b.click(); else __drv.errors.push('道場のボタンが見つからない'); }
      if (it.kind === 'zero') { if (!HERO.origin) { HERO = Object.assign(blankHero(), { name: 'テスト', origin: 'student' }); saveHero(); } lsSet('mjZero', String(it.id)); showHome(); zeroStart(it.id); }
      if (it.kind === 'story') { if (!HERO.origin) { HERO = Object.assign(blankHero(), { name: 'テスト', origin: 'student' }); saveHero(); } lsSet('mjZero', String(ZERO.length)); lsSet('mjStory', String(it.id)); showHome(); storyStart(it.id); }
      if (it.kind === 'stage') { __stageDone = false; localStorage.removeItem('mjSaveGame'); lsSet('mjZero', String(ZERO.length)); lsSet('mjStory', String(STORY.length)); lsSet('mjStage', String(it.id));
        if (!storyPath()[it.id] && !HERO.route) { HERO.route = 'protect'; saveHero(); }
        window.__endBefore = Object.keys(localStorage).filter(k => k.startsWith('mjEnd_')).length; window.__stName = (storyPath()[it.id] || {}).t || '?'; window.__stageEndSeen = false;
        showHome(); startStage(it.id); }
      window.__drvT = setInterval(__driveTick, 300);
    }, it);
    let done = false, last = '';
    while (Date.now() - t0 < LIMIT * 1000) {
      await new Promise(r => setTimeout(r, 2000));
      const s = await Promise.race([new Promise(r => setTimeout(() => r({ ok: false, steps: -1, errors: ['evaluate が20秒応答しない（ダイアログか無限ループの疑い）'], log: '' }), 20000)), page.evaluate((it) => {
        let ok;
        if (it.kind === 'lesson') ok = lsGet('mjLesson_' + it.id) === '1';
        else if (it.kind === 'zero') ok = zeroProgress() >= it.id + 1;
        else if (it.kind === 'stage') { const st = storyPath()[it.id]; const endNow = Object.keys(localStorage).filter(k => k.startsWith('mjEnd_')).length;
          if (st && (st.scene || st.teach)) ok = stageProgress() >= it.id + 1;
          else if (st && (st.ending || st.p2final || st.id === 'master')) ok = (endNow > window.__endBefore && document.getElementById('vn').hidden) || !!window.__stageEndSeen;   // 勝って結末まで、または負けて「もう一度」の画面まで
          else ok = !!window.__stageDone; }
        else ok = storyProgress() >= it.id + 1;
        return { ok, steps: __drv.steps, errors: __drv.errors, log: __drv.log.slice(-12).join(' ') };
      }, it)]);
      last = s.log;
      if (s.errors.length) { console.log(`NG  ${it.name}: 例外 ${JSON.stringify(s.errors.slice(0, 3))}  直前: ${s.log}`); bad = true; results.push({ ...it, ok: false }); break; }
      if (s.ok) { done = true; const nm = it.kind === 'stage' ? await page.evaluate('window.__stName') : ''; const lost = it.kind === 'stage' ? await page.evaluate('!!window.__stageEndSeen') : false; console.log(`OK  ${it.name}${nm ? '：' + nm : ''}: ${Math.round((Date.now() - t0) / 1000)}s  ${s.steps}操作${lost ? '（負けて「もう一度」の画面まで）' : ''}`); results.push({ ...it, ok: true }); break; }
    }
    if (!done && !results.find(r => r === it || (r.kind === it.kind && r.id === it.id))) { console.log(`NG  ${it.name}: ${LIMIT}秒で終わらない  直前: ${last}`); bad = true; results.push({ ...it, ok: false }); }
    await page.evaluate(() => { clearInterval(window.__drvT); });
  }
  await browser.close();
  console.log(bad ? '通らない項目あり' : 'すべて通過');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
