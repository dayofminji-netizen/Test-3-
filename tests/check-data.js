// 데이터 점검: node tests/check-data.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8") + ";this.D={QUESTIONS,ACTIVITIES,WORDS,CATS,answerEn}", ctx);
const { QUESTIONS, ACTIVITIES, WORDS, CATS, answerEn } = ctx.D;
let bad = 0;
const check = (cond, msg) => { console.log((cond ? "✅ " : "❌ ") + msg); if (!cond) bad++; };
check(ACTIVITIES.length === 60, "활동 60개 (" + ACTIVITIES.length + ")");
CATS.forEach(c => check(ACTIVITIES.filter(a => a.cat === c.id).length === 12, c.ko + " 12개"));
const ids = ACTIVITIES.map(a => a.id);
check(new Set(ids).size === ids.length, "id 중복 없음");
const BOOK = ["stay home", "watch a baseball game", "go camping", "clean my room", "study math", "visit my grandparents"];
check(BOOK.every(b => ACTIVITIES.some(a => a.en === b && a.book)), "교과서 표현 6개 모두 📘");
CATS.forEach(c => {
  const list = ACTIVITIES.filter(a => a.cat === c.id), firstNon = list.findIndex(a => !a.book);
  check(list.slice(firstNon).every(a => !a.book), c.ko + ": 📘 표현이 맨 앞");
});
check(ACTIVITIES.every(a => a.when.length && a.when.every(w => QUESTIONS.some(q => q.id === w))), "추천 질문 id 올바름");
const sentences = QUESTIONS.map(q => q.q);
ACTIVITIES.forEach(a => sentences.push(answerEn(a, "basic"), answerEn(a, "mid")));
const miss = new Set();
sentences.forEach(s => s.split(/\s+/).forEach(w => { const k = w.replace(/[^A-Za-z']/g, "").toLowerCase(); if (k && !WORDS[k]) miss.add(k); }));
check(miss.size === 0, "단어 뜻 사전 누락 0 " + (miss.size ? [...miss].join(", ") : ""));
const noImg = ids.filter(id => !fs.existsSync(path.join(root, "images", id + ".png")));
check(noImg.length === 0, "그림 누락 0 " + noImg.join(" "));
const bannedSeason = /snow|ski|sled|beach|swim in the sea|cherry blossom/i;
check(!ACTIVITIES.some(a => bannedSeason.test(a.en + " " + a.mid.en)), "다른 계절 활동 없음");
process.exit(bad ? 1 : 0);
