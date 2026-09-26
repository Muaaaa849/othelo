import { MODES, MODE_NOTES } from "@/engine/orders";
import type { Mode } from "@/engine/types";
import { CATEGORIES, DEPTHS } from "@/engine/types";

export const SYSTEM_PROMPT = `あなたは、2人が仲良くなるための会話ゲーム用の質問を作る専門家です。
指定された注文表どおりの数・カテゴリ・深さで質問を作り、指定のJSONだけを出力します。
楽しく、答えやすく、答えた後に会話が広がる質問を作ってください。`;

export function orderLines(mode: Mode): string {
  const order = MODES[mode].order;
  const lines: string[] = [];
  for (const d of DEPTHS) {
    for (const c of CATEGORIES) {
      if (order[d][c] > 0) lines.push(`depth${d} / ${c}: ${order[d][c]}問`);
    }
  }
  return lines.join("\n");
}

export function avoidList(avoid: readonly string[]): string {
  return avoid.length === 0 ? "（なし）" : avoid.map((t) => `- ${t}`).join("\n");
}

export function buildUserPrompt(mode: Mode, avoid: readonly string[]): string {
  const m = MODES[mode];
  return `# ゲームの説明
2人が1台のスマホでオセロをします。石を置くたびにそのマスの質問に答え、答えられた時だけ相手の石を返せます。
盤の中央ほど軽い質問、外側ほど深い質問が置かれ、ゲームが進むほど会話が深まります。

# 2人の関係
${m.label}：${m.description}
${MODE_NOTES[mode]}

# カテゴリ
- HOBBY（趣味・好き）：好きなもの、休日の過ごし方、ハマっていること
- MEMORY（思い出）：子どもの頃、学生時代、過去の出来事や失敗談
- IF（もしも）：仮定や想像で答える質問（例：無人島に1つ持っていくなら？）
- VALUES（価値観）：考え方、大事にしていること、許せないこと、人生観
- LOVE（恋愛）：恋愛観、理想のデート、好きなタイプ
- YOU（あなたのこと）：目の前の相手について答える質問。必ず「相手」という言葉を入れる（例：相手の第一印象は？）

# 深さ
- depth 1（かるめ）：誰でも10秒以内に答えられる。恥ずかしくない
- depth 2（ふかめ）：少し考える。自分のエピソードや本音が少し出る
- depth 3（とっておき）：普段は人に言わない本音。ただし答えて傷つく内容ではない

# 注文表（この数ちょうどで作ること。合計60問）
${orderLines(mode)}

# ルール
1. 日本語で、1問40文字以内。末尾は必ず「？」。
2. くだけた口語にする（例：「〜は？」「〜ってある？」）。敬語は使わない。
3. 「はい／いいえ」だけで答え終わる質問にしない。理由やエピソードが出る形にする。
4. 60問すべて違う内容にする。言い回しだけ違う似た質問も禁止。
5. 次の内容は絶対に作らない：性的な内容、身体的特徴、収入や貯金の金額、病気・トラウマ・家族の不幸・被害経験、政治や宗教の立場、その場にいない特定の人の悪口。
6. 次の質問は最近使ったので、同じ質問や似た質問は作らない：
${avoidList(avoid)}

# 出力形式
次の形のJSONだけを出力する。前後に説明文やコードブロック記号を付けない。
{"questions":[{"category":"HOBBY","depth":1,"text":"休みの日の朝、最初にしたいことは？"}]}
- category は HOBBY / MEMORY / IF / VALUES / LOVE / YOU のどれか
- depth は 1 / 2 / 3 の数値
- questions の要素数は60`;
}
