/* =========================================================
 * What's your favorite subject? 데이터
 * - 주요 표현
 *     What's your favorite subject?
 *     My favorite subject is ___.
 *     I'm good at ___.
 * - 말하기 문장 : 초급 / 중급 / 고급 각 20개 (과목 10 + 잘하는 것 10)
 * - 카테고리(인덱스별 공통) : subject(과목) / good(잘하는 것)
 * - 과목 10개 · 잘하는 것 10개
 * - 내 소개 카드(3개) 는 app.js 에서 localStorage 에 저장
 * - 이미지 : images/ 폴더의 Canva 이미지(img 경로). 파일이 없으면 이모지로 표시
 * ========================================================= */

/* 한국어 조사: 받침 유무로 을/를, 이야/야 고르기 */
function hasBatchim(w) {
  const c = w.charCodeAt(w.length - 1);
  return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
}
const eulReul = w => w + (hasBatchim(w) ? "을" : "를");
const iya = w => w + (hasBatchim(w) ? "이야" : "야");

/* ===== 과목 10개 ===== */
const SUBJECTS = [
  { key: "korean",   en: "Korean",             ko: "국어",     emoji: "📖", img: "images/subject-korean.png",
    why: "I like reading stories.",      whyKo: "나는 이야기 읽는 것을 좋아해." },
  { key: "english",  en: "English",            ko: "영어",     emoji: "🔤", img: "images/subject-english.png",
    why: "I like English songs.",        whyKo: "나는 영어 노래를 좋아해." },
  { key: "math",     en: "math",               ko: "수학",     emoji: "➗", img: "images/subject-math.png",
    why: "I like numbers.",              whyKo: "나는 숫자를 좋아해." },
  { key: "science",  en: "science",            ko: "과학",     emoji: "🔬", img: "images/subject-science.png",
    why: "I like experiments.",          whyKo: "나는 실험을 좋아해." },
  { key: "social",   en: "social studies",     ko: "사회",     emoji: "🌏", img: "images/subject-social-studies.png",
    why: "I like maps.",                 whyKo: "나는 지도를 좋아해." },
  { key: "music",    en: "music",              ko: "음악",     emoji: "🎵", img: "images/subject-music.png",
    why: "I like singing.",              whyKo: "나는 노래하는 것을 좋아해." },
  { key: "art",      en: "art",                ko: "미술",     emoji: "🎨", img: "images/subject-art.png",
    why: "I like drawing.",              whyKo: "나는 그림 그리는 것을 좋아해." },
  { key: "pe",       en: "P.E.",               ko: "체육",     emoji: "⚽", img: "images/subject-pe.png",
    why: "I like playing soccer.",       whyKo: "나는 축구하는 것을 좋아해." },
  { key: "practical",en: "practical arts",     ko: "실과",     emoji: "🧵", img: "images/subject-practical-arts.png",
    why: "I like making things.",        whyKo: "나는 무언가 만드는 것을 좋아해." },
  { key: "moral",    en: "moral education",    ko: "도덕",     emoji: "🤝", img: "images/subject-moral-education.png",
    why: "I like helping people.",       whyKo: "나는 사람들을 돕는 것을 좋아해." },
];

/* ===== 잘하는 것 10개 ===== */
const GOOD_ATS = [
  { key: "soccer",   en: "soccer",             ko: "축구",         emoji: "⚽", img: "images/good-soccer.png",
    more: "I play soccer every day.",      moreKo: "나는 매일 축구를 해." },
  { key: "swimming", en: "swimming",           ko: "수영",         emoji: "🏊", img: "images/good-swimming.png",
    more: "I can swim very fast.",         moreKo: "나는 아주 빠르게 수영할 수 있어." },
  { key: "singing",  en: "singing",            ko: "노래하기",     emoji: "🎤", img: "images/good-singing.png",
    more: "I sing K-pop songs.",           moreKo: "나는 케이팝 노래를 불러." },
  { key: "dancing",  en: "dancing",            ko: "춤추기",       emoji: "💃", img: "images/good-dancing.png",
    more: "I dance with my friends.",      moreKo: "나는 친구들과 춤을 춰." },
  { key: "drawing",  en: "drawing",            ko: "그림 그리기",  emoji: "✏️", img: "images/good-drawing.png",
    more: "I draw cartoons.",              moreKo: "나는 만화를 그려." },
  { key: "cooking",  en: "cooking",            ko: "요리하기",     emoji: "🍳", img: "images/good-cooking.png",
    more: "I can make fried rice.",        moreKo: "나는 볶음밥을 만들 수 있어." },
  { key: "running",  en: "running",            ko: "달리기",       emoji: "🏃", img: "images/good-running.png",
    more: "I run very fast.",              moreKo: "나는 아주 빨리 달려." },
  { key: "piano",    en: "playing the piano",  ko: "피아노 치기",  emoji: "🎹", img: "images/good-playing-the-piano.png",
    more: "I practice every day.",         moreKo: "나는 매일 연습해." },
  { key: "jumprope", en: "jumping rope",       ko: "줄넘기",       emoji: "🪢", img: "images/good-jumping-rope.png",
    more: "I can do double jumps.",        moreKo: "나는 이단 뛰기를 할 수 있어." },
  { key: "writing",  en: "writing stories",    ko: "이야기 쓰기",  emoji: "📝", img: "images/good-writing-stories.png",
    more: "I write funny stories.",        moreKo: "나는 재미있는 이야기를 써." },
];

/* 카테고리: 같은 인덱스끼리 같은 종류 (0~9 과목 · 10~19 잘하는 것) */
const SUGGESTION_CATEGORIES = [
  ...SUBJECTS.map(() => "subject"),
  ...GOOD_ATS.map(() => "good"),
];

/* ===== 말하기 문장 (초급 / 중급 / 고급) ===== */
const SUGGESTION_LEVELS = {
  beginner: [
    ...SUBJECTS.map(s => ({ en: `My favorite subject is ${s.en}.`, ko: `내가 가장 좋아하는 과목은 ${iya(s.ko)}.`, emoji: s.emoji, img: s.img })),
    ...GOOD_ATS.map(g => ({ en: `I'm good at ${g.en}.`, ko: `나는 ${eulReul(g.ko)} 잘해.`, emoji: g.emoji, img: g.img })),
  ],
  intermediate: [
    ...SUBJECTS.map(s => ({ en: `What's your favorite subject? My favorite subject is ${s.en}.`,
                            ko: `네가 가장 좋아하는 과목은 뭐니? 내가 가장 좋아하는 과목은 ${iya(s.ko)}.`, emoji: s.emoji, img: s.img })),
    ...GOOD_ATS.map(g => ({ en: `I'm good at ${g.en}. ${g.more}`, ko: `나는 ${eulReul(g.ko)} 잘해. ${g.moreKo}`, emoji: g.emoji, img: g.img })),
  ],
  advanced: [
    ...SUBJECTS.map(s => ({ en: `My favorite subject is ${s.en}. ${s.why}`,
                            ko: `내가 가장 좋아하는 과목은 ${iya(s.ko)}. ${s.whyKo}`, emoji: s.emoji, img: s.img })),
    ...GOOD_ATS.map((g, i) => {
      const s = SUBJECTS[[7, 7, 5, 5, 6, 8, 7, 5, 7, 0][i]];   // 잘하는 것과 어울리는 과목
      return { en: `My favorite subject is ${s.en}. I'm good at ${g.en}.`,
               ko: `내가 가장 좋아하는 과목은 ${iya(s.ko)}. 나는 ${eulReul(g.ko)} 잘해.`, emoji: g.emoji, img: g.img };
    }),
  ],
};

/* ===== 질문 표현 ===== */
const QUESTION = { en: "What's your favorite subject?", ko: "네가 가장 좋아하는 과목은 뭐니?", emoji: "❓", img: "images/question.png" };

/* 질문에 대한 반응 (친구의 대답을 듣고) */
const REACTIONS = [
  { en: "Me, too!",       ko: "나도 그래!",     emoji: "🙌", img: "images/react-me-too.png" },
  { en: "Cool!",          ko: "멋지다!",        emoji: "😎", img: "images/react-cool.png" },
  { en: "Great!",         ko: "좋다!",          emoji: "👍", img: "images/react-great.png" },
  { en: "That's nice.",   ko: "그거 좋네.",      emoji: "😊", img: "images/react-nice.png" },
  { en: "Wow, amazing!",  ko: "와, 대단하다!",   emoji: "🤩", img: "images/react-amazing.png" },
];

/* ===== 내 소개 카드 만들기 ===== */
const BUILD_CATS = [
  { key: "core",  label: "📘 주요 과목" },
  { key: "arts",  label: "🎨 예체능 · 기타 과목" },
];
const SUBJECT_CAT = { korean: "core", english: "core", math: "core", science: "core", social: "core",
                      music: "arts", art: "arts", pe: "arts", practical: "arts", moral: "arts" };

/* ===== 단어 뜻 사전 ===== */
function wordKey(w) {
  return w.toLowerCase().replace(/^[^a-z0-9'.:]+/, "").replace(/[^a-z0-9':]+$/, "").replace(/\.$/, "") || w.toLowerCase();
}

const WORD_MEANINGS = {
  "what's": "무엇이 ~이니? (what is)",
  "what": "무엇",
  "your": "너의",
  "my": "나의",
  "favorite": "가장 좋아하는",
  "subject": "과목",
  "is": "~이다",
  "i'm": "나는 ~이다 (I am)",
  "i": "나는",
  "good": "좋은, 잘하는 (be good at: ~을 잘하다)",
  "at": "~에 (good at: ~을 잘하는)",
  "korean": "국어, 한국어",
  "english": "영어",
  "math": "수학",
  "science": "과학",
  "social": "사회의 (social studies: 사회 과목)",
  "studies": "공부, 학문 (social studies: 사회)",
  "music": "음악",
  "art": "미술",
  "p.e": "체육 (physical education)",
  "p.e.": "체육 (physical education)",
  "practical": "실용적인 (practical arts: 실과)",
  "arts": "예술, 기술 (practical arts: 실과)",
  "moral": "도덕의 (moral education: 도덕)",
  "education": "교육",
  "soccer": "축구",
  "swimming": "수영, 수영하기",
  "singing": "노래하기",
  "dancing": "춤추기",
  "drawing": "그림 그리기",
  "cooking": "요리하기",
  "running": "달리기",
  "playing": "(악기를) 연주하기, (운동을) 하기",
  "the": "그 (악기 앞에: play the piano)",
  "piano": "피아노",
  "jumping": "뛰기 (jumping rope: 줄넘기)",
  "rope": "줄 (jump rope: 줄넘기하다)",
  "writing": "쓰기",
  "stories": "이야기들 (story)",
  "like": "좋아하다",
  "reading": "읽기",
  "songs": "노래들 (song)",
  "numbers": "숫자들 (number)",
  "experiments": "실험들 (experiment)",
  "maps": "지도들 (map)",
  "making": "만들기",
  "things": "물건들, 것들",
  "helping": "돕기",
  "people": "사람들",
  "play": "(운동을) 하다, 놀다",
  "every": "모든, 매~",
  "day": "날, 하루",
  "can": "~할 수 있다",
  "swim": "수영하다",
  "very": "아주, 매우",
  "fast": "빨리, 빠른",
  "sing": "노래하다",
  "k-pop": "케이팝",
  "dance": "춤추다",
  "with": "~와 함께",
  "friends": "친구들",
  "draw": "그리다",
  "cartoons": "만화 (cartoon)",
  "make": "만들다",
  "fried": "볶은, 튀긴",
  "rice": "밥, 쌀",
  "run": "달리다",
  "practice": "연습하다",
  "do": "하다",
  "double": "두 번의, 이중의 (double jump: 이단 뛰기)",
  "jumps": "뛰기 (jump)",
  "write": "쓰다",
  "funny": "재미있는, 웃긴",
  "me": "나",
  "too": "~도 (Me, too: 나도)",
  "cool": "멋진",
  "great": "아주 좋은, 훌륭한",
  "that's": "그것은 ~이다 (that is)",
  "nice": "좋은, 멋진",
  "wow": "와 (감탄)",
  "amazing": "놀라운, 대단한",
  "a": "하나의",
};
