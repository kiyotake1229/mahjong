#!/usr/bin/env node
/*
 * App Store 用スクリーンショット（tools/screenshots.sh から呼ばれる）
 *   node tools/screenshots.js <出力先> ：puppeteer-core で手元の Google Chrome を動かし、
 *   index.html?shot=<場面>&demo=1 を横向き3サイズ（倍率3）で撮る
 */
const path = require('path'), fs = require('fs');
const puppeteer = require('puppeteer-core');
const OUT = process.argv[2] || path.join(__dirname, '..', 'ios-app', 'screenshots');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SIZES = [['6.7inch', 932, 430], ['6.5inch', 896, 414], ['5.5inch', 736, 414]];   // pt（倍率3で実機の画素数）
const SCENES = [['home', 2500], ['table', 2500], ['result', 5200], ['story', 3000], ['records', 2500]];   // 場面, 待ち時間ms
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio', '--no-first-run', '--disable-gpu'] });
  try {
    for (const [name, w, h] of SIZES) {
      for (const [scene, wait] of SCENES) {
        const ctx = await browser.createBrowserContext();   // 1枚ごとに空の保存領域（demo=1 の見本データはここにだけ書かれる）
        const page = await ctx.newPage();
        await page.setViewport({ width: w, height: h, deviceScaleFactor: 3 });
        await page.goto(`${URL}?shot=${scene}&demo=1`, { waitUntil: 'load', timeout: 30000 });
        await new Promise(r => setTimeout(r, wait));
        const file = path.join(OUT, `${name}_${scene}.png`);
        await page.screenshot({ path: file });
        await ctx.close();
        console.log('  ' + file);
      }
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
