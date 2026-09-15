# スライド生成（社内説明資料 #0001）

社内説明スライド（9枚）の生成元。できあがった文書は `docs/` にある。

- 公開URL（Claude Design。閲覧・文字の修正・PNG/PDF書き出し）: https://claude.ai/code/artifact/0f5eb430-df0d-424a-bed3-32d73b2ba52b
- PDF: [docs/20260915_DOC_0001_ALL_社内説明資料（麻雀4人打ち）.pdf](../../docs/20260915_DOC_0001_ALL_社内説明資料（麻雀4人打ち）.pdf)
- 説明文書: [docs/20260915_DOC_0001_ALL_社内説明資料（麻雀4人打ち）.md](../../docs/20260915_DOC_0001_ALL_社内説明資料（麻雀4人打ち）.md)
- 話す台本: [docs/20260915_DOC_0002_ALL_プレゼンの進め方（麻雀4人打ち）.md](../../docs/20260915_DOC_0002_ALL_プレゼンの進め方（麻雀4人打ち）.md)
- `gen.py` … スライド9枚（`Main.dc.html` = 表紙、`S02`〜）と `canvas.json`、PDF用の `deck.html` を生成し、PDF を `docs/` に書き出す
- 見た目はアプリ本体（index.html）と同じ配色（卓の緑・金・象牙）と書体（ヒラギノ明朝／角ゴ）。牌はCSSで描画
- 構成：表紙 / ねらい / 全体像（道場・物語・自由対局／みんなで対戦） / 物語「雀荘 翠」 / 初心者の助け / 本格ルール / 演出と音 / 現状 / 次のステップと費用

## 作り直す

文言は `gen.py` を直す。アプリのフォルダで:

```bash
python3 tools/slides/gen.py
```

```bash
bash docs/manager/generate_docs_json.sh
```
