# 雀荘 翠 iOSアプリ（Capacitor）

Webアプリ本体（`../index.html`）をそのまま同梱した iOS アプリのプロジェクトです。

- **ビルド・申請は岩崎さんが実施** → 手順は [`岩崎さんへの引き渡し手順.md`](岩崎さんへの引き渡し手順.md)
- この README は開発側（アプリを作る人）向けのメモ

## 現在の状態（2026-09-25）

| 項目 | 状態 |
|------|------|
| Capacitor プロジェクト | 構築済み（`work.ltv.sui` ／ 表示名「雀荘 翠」／ Capacitor 7） |
| Xcode プロジェクト | 生成済み（`ios/App/App.xcworkspace`） |
| Web アプリの同梱 | `npm run sync` で `../index.html` などを `ios/App/App/public/` にコピー |
| アプリアイコン・スプラッシュ | 生成済み（`assets/icon.png` 1024px 全面、`assets/logo.png` から） |
| ネイティブ機能 | 触覚フィードバック（`@capacitor/haptics`。本体の `haptic()` が使う） |
| 画面の向き | 横向きのみ（`Info.plist` の `UISupportedInterfaceOrientations` を Landscape だけに。iPad も同じ＋`UIRequiresFullScreen`） |
| CocoaPods | `pod install` 済み（4 pods）。Xcode のない環境で作ったので、**実機ビルドと動作確認は未実施** |
| スクリーンショット | `screenshots/` に 3 サイズ×5 場面（`tools/screenshots.sh` で再生成） |

## 構成

```
ios-app/
├── package.json              npm 設定（Capacitor 本体・iOS・Haptics・App）
├── capacitor.config.json     アプリID・名前・WebView の設定（contentInset: never＝安全域は本体の CSS が処理）
├── sync-web.sh               ../ の Web 資産を www/ にコピー
├── assets/icon.png, logo.png アイコン元画像（1024px）
├── screenshots/              App Store 用スクリーンショット
├── www/                      同梱する Web 資産（自動生成・git 管理外）
└── ios/                      Xcode プロジェクト（App/App.xcworkspace を開く）
```

## よく使うコマンド

```bash
npm install          # 初回、または node_modules を消したあと
npm run sync         # ../index.html を直したあと：www/ にコピー → iOS プロジェクトへ反映（pod install も走る）
npm run open         # Xcode で開く（Xcode のある Mac だけ）
npm run icons        # assets/icon.png を差し替えたあとアイコン一式を作り直す
bash ../tools/screenshots.sh   # スクリーンショットを撮り直す（Node.js と Google Chrome が必要。約1分半）
```

## 注意

- `node_modules/` は 100MB 近くあり Dropbox の同期を重くする。使い終わったら消してよい（`npm install` で戻る）
- `pod install` は UTF-8 の端末で実行する（`LANG=en_US.UTF-8` を付けると確実）
- 本体を直したら **必ず `npm run sync`**。同梱されるのは `ios/App/App/public/` の中身で、`../index.html` を直しただけでは反映されない
- オンライン対戦（みんなで対戦→オンライン）は通信する。プライバシーの説明は `../support.html#privacy`
