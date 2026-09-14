# プレゼン資料（社内説明・9枚）

- 公開URL（Claude Design。閲覧・文字の修正・PNG/PDF書き出し）: https://claude.ai/code/artifact/0f5eb430-df0d-424a-bed3-32d73b2ba52b
- PDF: `麻雀_社内説明.pdf`（このフォルダ。そのまま配れる）
- 話す台本: [../プレゼンの進め方.md](../プレゼンの進め方.md)
- `gen.py` … スライド9枚（`Main.dc.html` = 表紙、`S02`〜`S09`）と `canvas.json`、PDF用の `deck.html` を生成するスクリプト。文言を直すときはここを編集して `python3 gen.py`
- 見た目はアプリ本体（index.html）と同じ配色（卓の緑・金・象牙）と書体（ヒラギノ明朝／角ゴ）。牌はCSSで描画
- 構成：表紙 / ねらい / 全体像（道場・物語・自由対局） / 物語「雀荘 翠」 / 初心者の助け / 本格ルール / 演出と音 / 現状 / 次のステップと費用

## PDFを作り直す

`python3 gen.py` のあと、このフォルダで:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf="麻雀_社内説明.pdf" "file://$PWD/deck.html"
```
