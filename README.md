# トークセロ

オセロの一手ごとに質問に答え、答えられた時だけ石を返せる、2人用の会話ゲーム（Next.js / PWA）。
仕様は「トークセロ UI/UX設計書」に従っています。

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # src/engine などの単体テスト（Vitest）
npm run lint     # 型チェック
npm run build    # 静的サイトとして out/ に書き出す
```

## スマホで遊ぶ

サーバー処理がない静的サイトなので、どこにでも置けます。

### A. GitHub Pages（おすすめ・無料）

1. GitHub のリポジトリで **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする（最初の1回だけ）
2. ブランチに push すると `.github/workflows/deploy-pages.yml` が自動でビルド・公開する（Actions タブから手動実行も可）
3. スマホの Chrome / Safari で `https://<ユーザー名>.github.io/<リポジトリ名>/` を開く
4. ホーム画面に追加すると全画面・縦固定のアプリとして起動する
   - Android Chrome: 右上「⋮」→「ホーム画面に追加」または「アプリをインストール」
   - iPhone Safari: 共有ボタン →「ホーム画面に追加」

### B. Vercel / Netlify / Cloudflare Pages

リポジトリを取り込むだけで動きます（ビルドコマンド `npm run build`、公開ディレクトリ `out`）。ルートで配信する場合は `NEXT_PUBLIC_BASE_PATH` は不要です。

### C. 同じ Wi-Fi の PC から配信（お試し用）

```bash
npm run build
cd out && python3 -m http.server 8080
```

スマホで `http://<PCのIPアドレス>:8080/` を開く。遊べるが HTTPS ではないため、「アプリとしてインストール」は使えない。

## 質問データ（設定 → 質問データ）

- **インポート**: JSON形式の `.txt` ファイルを選ぶか、テキストを貼り付けて取り込む。取り込んだ質問は localStorage に保存され、ゲームでは内蔵の質問より優先して使われる（足りない分は内蔵で補充）。
- **エクスポート**: 「インポートした質問」または「すべての質問（内蔵＋インポート）」を同じ形式の `.txt` で保存。
- **外部AI用プロンプト**: ふたりの関係を選ぶと、そのモードの注文表（60問）でJSONを出力させるプロンプトを表示・コピーできる。すでに持っている質問（直近使用＋インポート済み、最大120件）は避けるよう指示が入る。

形式:

```json
{"questions":[
  {"category":"HOBBY","depth":1,"text":"休みの日の朝、最初にしたいことは？"}
]}
```

- `category`: HOBBY / MEMORY / IF / VALUES / LOVE / YOU
- `depth`: 1（かるめ）/ 2（ふかめ）/ 3（とっておき）
- `text`: 40文字以内、末尾は「？」（半角 `?` は自動で置き換え）
- 前後の文章やコードブロック記号があっても読める。形式に合わないもの・既存と同じ質問は取り込まない。

AIによる自動生成は現在は外している（APIキー不要）。

## 構成

- `src/engine/` — 純TypeScript のゲームロジック（合法手・返す石・質問配置・検証と補充・インポート）
- `src/game/` — 第7章の状態遷移（`useReducer` + Context）
- `src/lib/` — 外部AI用プロンプト、localStorage ラッパー、ゲーム用の質問抽出
- `src/data/questions_ja.json` — 内蔵質問バンク（オフライン・失敗時用）
- `src/app/questions/page.tsx` — 質問データ（インポート・エクスポート・外部AI用プロンプト）
- `src/app/play/page.tsx` — S3〜S9 を1ページ内で切り替え
