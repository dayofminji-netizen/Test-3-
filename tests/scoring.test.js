// 채점 함수 단위 테스트: node tests/scoring.test.js
const assert = require("assert");
const { scoreOne, scoreSpeech, normWords, wordScore } = require("../app.js");
const T = "I'm going to fly a kite.";
const cases = [
  ["정확", "I'm going to fly a kite", 100, 0],
  ["줄임말 펼침", "I am going to fly a kite", 100, 0],
  ["fly a cat", "I'm going to fly a cat", 73, 2],
  ["fly a kite만", "fly a kite", 55, 2],
  ["순서 뒤섞임", "kite a fly to going am I", 14, 3],
];
let fail = 0;
for (const [name, heard, exp, tol] of cases) {
  const r = scoreOne(T, heard);
  const ok = Math.abs(r.score - exp) <= tol;
  if (!ok) fail++;
  console.log(`${ok ? "✅" : "❌"} ${name}: "${heard}" → ${r.score} (기대 약 ${exp})`, r.chips.map(c => c.text + ":" + c.status).join(" "));
}
// 정규화
assert.deepStrictEqual(normWords("I'm going two the p c room"), ["i", "am", "going", "to", "the", "pc", "room"]);
assert.deepStrictEqual(normWords("four"), ["for"]);
// 단어 점수
assert.strictEqual(wordScore("kite", "kite"), 1);
assert.strictEqual(wordScore("kite", "kit"), 0.85);
assert.strictEqual(wordScore("light", "right"), 0.85); // 1글자 차이가 먼저
assert.strictEqual(wordScore("ride", "lied"), 0);
assert.strictEqual(wordScore("fly", "ply"), 0.85);
assert.strictEqual(wordScore("very", "belly"), 0.7);   // v/b · r/l 소리 비슷
assert.strictEqual(wordScore("kite", "cat"), 0);       // 모음 유지
assert.strictEqual(wordScore("camping", "camp"), 0.5); // 비슷한 편
// PC방 · 지명
assert.strictEqual(scoreOne("I'm going to go to a PC room.", "I'm going to go to a p c room").score, 100);
const jeju = scoreOne("I'm going to go to Jeju Island.", "I'm going to go to");
assert.ok(jeju.score > 60 && jeju.score < 80, "지명 가중치 0.6: " + jeju.score);
// I'm 은 한 칩
assert.strictEqual(scoreOne(T, "going to fly a kite").chips[0].text, "I'm");
assert.strictEqual(scoreOne(T, "going to fly a kite").chips[0].status, "miss");
// 덧붙인 말 감점 최대 10%
assert.strictEqual(scoreOne(T, "um so I'm going to fly a kite yes yes yes ok").score, 90);
// 후보 중 최고 점수
assert.strictEqual(scoreSpeech(T, ["I'm going to fly a cat", "I'm going to fly a kite"]).score, 100);
assert.strictEqual(scoreSpeech(T, []), null);
if (fail) { console.log(fail + " 개 실패"); process.exit(1); }
console.log("모든 채점 테스트 통과");
