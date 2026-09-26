# トークセロ

オセロの一手ごとに質問に答え、答えられた時だけ石を返せる、2人用の会話ゲーム（Next.js / PWA）。
仕様は「トークセロ UI/UX設計書」に従っています。

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # src/engine などの単体テスト（Vitest）
npm run lint     # 型チェック
npm run build
```

## 環境変数（サーバーのみ）

| 変数 | 説明 |
| --- | --- |
| `ANTHROPIC_API_KEY` | 質問生成に使う。未設定なら内蔵質問バンクで遊べる |
| `QUESTION_MODEL` | 既定値 `claude-haiku-4-5` |

`.env.example` を `.env.local` にコピーして設定します。Vercel ではプロジェクトの環境変数に設定してください。

## 構成

- `src/engine/` — 純TypeScript のゲームロジック（合法手・返す石・質問配置・検証と補充）
- `src/game/` — 第7章の状態遷移（`useReducer` + Context）
- `src/lib/` — プロンプト組み立て、サーバー専用の質問生成、localStorage ラッパー
- `src/data/questions_ja.json` — 内蔵質問バンク（オフライン・失敗時用）
- `src/app/api/questions/route.ts` — 質問生成 API（APIキーはサーバー側のみ）
- `src/app/play/page.tsx` — S3〜S9 を1ページ内で切り替え
