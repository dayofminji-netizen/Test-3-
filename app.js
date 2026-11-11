/* =========================================================
 * What's your favorite subject? · 듣고 따라 말하기 웹 앱
 * - 음성 출력: Web Speech API (SpeechSynthesis)
 * - 단어 클릭: 단어 발음 + 뜻 풍선(popup)
 * - 이미지: images/ 폴더의 Canva 이미지 (없으면 이모지)
 * - 내 소개 만들기: 소개 3개(좋아하는 과목 + 잘하는 것) + 친구의 반응
 * - 소개 연습: 대화를 줄마다 말하기 + 역할극(A/B) 채점
 * - 따라 말하기 채점: Web Speech API (SpeechRecognition)
 * ========================================================= */

/* ---------- 음성 합성 (TTS) ---------- */
const synth = window.speechSynthesis;
let enVoice = null;
let speakRate = 0.85;

function pickVoice() {
  const voices = synth.getVoices();
  enVoice =
    voices.find(v => /en[-_]US/i.test(v.lang)) ||
    voices.find(v => /^en/i.test(v.lang)) ||
    null;
  const status = document.querySelector(".toolbar #voice-status");
  if (status) {
    status.textContent = enVoice ? `음성: ${enVoice.name}` : "영어 음성을 찾는 중...";
  }
}
pickVoice();
if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = pickVoice;

function speak(text, rate, onStart, onEnd) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate || speakRate;
  u.pitch = 1.05;
  if (enVoice) u.voice = enVoice;
  if (onStart) u.onstart = onStart;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

/* ---------- 단어 뜻 풍선(popup) ---------- */
const popup = document.createElement("div");
popup.className = "word-popup hidden";
popup.innerHTML = `
  <div class="wp-word"></div>
  <div class="wp-meaning"></div>
  <button class="wp-listen">단어 다시 듣기</button>`;
document.body.appendChild(popup);

popup.querySelector(".wp-listen").addEventListener("click", e => {
  e.stopPropagation();
  if (popup.dataset.word) speak(popup.dataset.word, 0.8);
});

function showWordPopup(wordEl, rawWord) {
  const key = wordKey(rawWord);
  const plain = rawWord.replace(/[.,!?]+$/, "");
  const meaning = WORD_MEANINGS[key] || WORD_MEANINGS[plain] || "(뜻 정보 없음)";
  popup.dataset.word = key || rawWord;
  popup.querySelector(".wp-word").textContent = rawWord.replace(/[.,!?]+$/, "");
  popup.querySelector(".wp-meaning").textContent = meaning;

  popup.classList.remove("hidden");
  const r = wordEl.getBoundingClientRect();
  const pw = popup.offsetWidth;
  let left = r.left + r.width / 2 - pw / 2 + window.scrollX;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  let top = r.bottom + 8 + window.scrollY;
  popup.style.left = left + "px";
  popup.style.top = top + "px";

  speak(key || rawWord, 0.8);
}

function hidePopup() { popup.classList.add("hidden"); }
document.addEventListener("click", e => {
  if (!popup.contains(e.target) && !e.target.classList.contains("word")) hidePopup();
});

/* ---------- 클릭 가능한 단어로 문장 만들기 ---------- */
function buildWords(sentence) {
  const frag = document.createDocumentFragment();
  sentence.split(/\s+/).forEach((w, i) => {
    if (i > 0) frag.appendChild(document.createTextNode(" "));
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = w;
    span.addEventListener("click", e => {
      e.stopPropagation();
      showWordPopup(span, w);
    });
    frag.appendChild(span);
  });
  return frag;
}

/* ---------- Canva 이미지 ----------
 * 각 문장 데이터의 img 경로(images/*.png)에 Canva에서 만든 이미지를 넣으면 카드에 나타나요.
 * 이미지 파일이 없으면 자동으로 이모지 타일로 바뀌어요. */
function makeVisual(item) {
  const em = document.createElement("div");
  em.className = "emoji";
  em.textContent = item.emoji;
  if (!item.img) return em;
  const img = document.createElement("img");
  img.className = "photo";
  img.loading = "lazy";
  img.alt = item.en;
  img.src = item.img;
  img.addEventListener("error", () => img.replaceWith(em));
  return img;
}

/* ---------- 카드 만들기 ---------- */
function makeCard(item, opts) {
  opts = opts || {};
  const div = document.createElement("div");
  div.className = "card" + (opts.tone != null ? " tone-" + opts.tone : "");

  function speakSentence() {
    speak(item.en, null,
      () => div.classList.add("speaking"),
      () => div.classList.remove("speaking"));
  }

  // 윗줄: 태그 + 듣기
  const top = document.createElement("div");
  top.className = "card-top";
  const tag = document.createElement("span");
  tag.className = "card-tag";
  if (opts.index != null) tag.textContent = "CARD " + opts.index;
  const listenAll = document.createElement("button");
  listenAll.className = "listen-all";
  listenAll.textContent = "듣기 ▶";
  listenAll.addEventListener("click", e => { e.stopPropagation(); speakSentence(); });
  top.append(tag, listenAll);

  const visual = makeVisual(item);

  // 안쪽 문장 박스: 문장 + 한글 + 스피커
  const box = document.createElement("div");
  box.className = "sentence-box";
  const txt = document.createElement("div");
  txt.className = "sentence-text";
  const en = document.createElement("div");
  en.className = "en";
  en.appendChild(buildWords(item.en));
  const ko = document.createElement("div");
  ko.className = "ko";
  ko.textContent = item.ko;
  txt.append(en, ko);
  const speakBtn = document.createElement("button");
  speakBtn.className = "speak-btn";
  speakBtn.setAttribute("aria-label", "문장 듣기");
  speakBtn.textContent = "🔊";
  speakBtn.addEventListener("click", e => { e.stopPropagation(); speakSentence(); });
  box.append(txt, speakBtn);

  div.append(top, visual, box);
  return div;
}

function renderGrid(id, list, opts) {
  opts = opts || {};
  const grid = document.getElementById(id);
  grid.innerHTML = "";
  list.forEach((item, i) => {
    const cardOpts = {};
    if (opts.tones) { cardOpts.tone = i % 6; if (!opts.noIndex) cardOpts.index = i + 1; }
    grid.appendChild(makeCard(item, cardOpts));
  });
}

/* ---------- 난이도(초급/중급/고급) + 활동 종류 ---------- */
let currentLevel = "beginner";
let currentCategory = "all";
function currentSuggestions() { return SUGGESTION_LEVELS[currentLevel]; }

function renderSuggestions() {
  const lvl = currentSuggestions();
  const view = [];
  lvl.forEach((item, i) => {
    if (currentCategory === "all" || SUGGESTION_CATEGORIES[i] === currentCategory) {
      view.push(item);
    }
  });
  renderGrid("suggestion-grid", view, { tones: true });
}

document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentLevel = btn.dataset.level;
    synth.cancel();
    hidePopup();
    renderSuggestions();
  });
});

document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.cat;
    synth.cancel();
    hidePopup();
    renderSuggestions();
  });
});

/* ===========================================================
 * 🎒 내 소개 만들기 (소개 3개: 좋아하는 과목 1 + 잘하는 것 1)  +  친구의 반응 1
 * =========================================================== */
const SET_COUNT = 3;
let mySets = [];        // [{ subject, good }] (영어 문구 en 으로 저장)
let myReaction = REACTIONS[1].en;
let curSet = 0;
let stats = {};         // 문장별 정확도 기록

try {
  const saved = JSON.parse(localStorage.getItem("subject_sets") || "null");
  if (saved && Array.isArray(saved.sets)) {
    mySets = saved.sets;
    if (saved.reaction) myReaction = saved.reaction;
  }
} catch (e) {}
while (mySets.length < SET_COUNT) mySets.push({ subject: null, good: null });
try { stats = JSON.parse(localStorage.getItem("subject_stats") || "{}") || {}; } catch (e) {}

function persist() {
  try {
    localStorage.setItem("subject_sets", JSON.stringify({ sets: mySets, reaction: myReaction }));
    localStorage.setItem("subject_stats", JSON.stringify(stats));
  } catch (e) {}
}
const findSubject  = en => SUBJECTS.find(x => x.en === en) || null;
const findGood     = en => GOOD_ATS.find(x => x.en === en) || null;
const findReaction = en => REACTIONS.find(x => x.en === en) || REACTIONS[1];
function setComplete(s) { return !!(findSubject(s.subject) && findGood(s.good)); }
function completeCount() { return mySets.filter(setComplete).length; }

const subjectLine = sb => ({ en: `My favorite subject is ${sb.en}.`, ko: `내가 가장 좋아하는 과목은 ${iya(sb.ko)}.` });
const goodLine    = g  => ({ en: `I'm good at ${g.en}.`, ko: `나는 ${eulReul(g.ko)} 잘해.` });

/* 소개 → 대화 줄 (A: 묻는 친구 · B: 나) */
function setLines(s) {
  const sb = findSubject(s.subject), g = findGood(s.good), r = findReaction(myReaction);
  return [
    { who: "A", en: QUESTION.en, ko: QUESTION.ko },
    Object.assign({ who: "B" }, subjectLine(sb)),
    Object.assign({ who: "B" }, goodLine(g)),
    { who: "A", en: r.en, ko: r.ko },
  ];
}

function makeChip(text, cls, isOn, onClick) {
  const c = document.createElement("button");
  c.className = "chip " + cls + (isOn ? " on" : "");
  c.textContent = text;
  c.addEventListener("click", onClick);
  return c;
}
function setBlank(id, en) {
  const el = document.getElementById(id);
  el.classList.toggle("filled", !!en);
  if (en) { el.innerHTML = ""; el.appendChild(buildWords(en)); }
  else el.textContent = "________";
}
function updateSetBadge() {
  const c = document.getElementById("set-count");
  if (c) c.textContent = `${completeCount()}/${SET_COUNT}`;
  document.querySelectorAll("#set-tabs .set-tab").forEach((b, i) => {
    b.classList.toggle("active", i === curSet);
    b.classList.toggle("done", setComplete(mySets[i]));
    const sb = findSubject(mySets[i].subject), g = findGood(mySets[i].good);
    b.textContent = `소개 ${i + 1} ${sb ? sb.emoji : ""}${g ? g.emoji : ""}${setComplete(mySets[i]) ? " ✓" : ""}`;
  });
}

function renderBuilder() {
  const s = mySets[curSet];
  const sbWrap = document.getElementById("build-subjects");
  const goodRow = document.getElementById("build-good");
  const reactRow = document.getElementById("build-reaction");
  sbWrap.innerHTML = ""; goodRow.innerHTML = ""; reactRow.innerHTML = "";

  BUILD_CATS.forEach(cat => {
    const items = SUBJECTS.filter(a => SUBJECT_CAT[a.key] === cat.key);
    const title = document.createElement("div");
    title.className = "chip-group-title";
    title.textContent = cat.label;
    const row = document.createElement("div");
    row.className = "chip-row wrap";
    items.forEach(a => {
      row.appendChild(makeChip(`${a.emoji} ${a.en} · ${a.ko}`, "act", s.subject === a.en, () => {
        s.subject = a.en; persist(); renderBuilder(); updateSetPreview(true);
      }));
    });
    sbWrap.append(title, row);
  });
  const usedElsewhere = new Set(mySets.filter((x, i) => i !== curSet).map(x => x.good).filter(Boolean));
  GOOD_ATS.forEach(g => {
    const chip = makeChip(`${g.emoji} ${g.en} · ${g.ko}`, "place", s.good === g.en, () => {
      s.good = g.en; persist(); renderBuilder(); updateSetPreview(true);
    });
    if (usedElsewhere.has(g.en)) { chip.classList.add("used"); chip.title = "다른 소개에서 이미 골랐어요"; }
    goodRow.appendChild(chip);
  });
  REACTIONS.forEach(r => {
    reactRow.appendChild(makeChip(`${r.emoji} ${r.en}`, "when", myReaction === r.en, () => {
      myReaction = r.en; persist(); renderBuilder(); updateSetPreview(); speak(r.en);
    }));
  });
  updateSetBadge();
}

let lastSetSpoken = "";
function updateSetPreview(autoSpeak) {
  const s = mySets[curSet];
  const sb = findSubject(s.subject), g = findGood(s.good), r = findReaction(myReaction);
  setBlank("set-subject", sb && sb.en);
  setBlank("set-good", g && g.en);
  document.getElementById("set-subject-ko").textContent = `내가 가장 좋아하는 과목은 ${sb ? iya(sb.ko) : "________(이)야"}.`;
  document.getElementById("set-good-ko").textContent = `나는 ${g ? eulReul(g.ko) : "________을(를)"} 잘해.`;
  const q = document.getElementById("set-question");
  q.innerHTML = ""; q.appendChild(buildWords(QUESTION.en));
  const rl = document.getElementById("set-reaction-line");
  rl.innerHTML = ""; rl.appendChild(buildWords(r.en));
  document.getElementById("set-reaction-ko").textContent = r.ko;

  const status = document.getElementById("set-status");
  const complete = setComplete(s);
  status.className = "dlg-status" + (complete ? " ok" : "");
  if (!sb && !g) status.textContent = `소개 ${curSet + 1} · 1️⃣ 좋아하는 과목을 골라보세요 👇`;
  else if (!sb) status.textContent = `소개 ${curSet + 1} · 1️⃣ 좋아하는 📚 과목을 골라요 👇`;
  else if (!g) status.textContent = `소개 ${curSet + 1} · 2️⃣ 내가 ⭐ 잘하는 것을 골라요 👇`;
  else status.textContent = `✅ 소개 ${curSet + 1} 완성! ${completeCount() < SET_COUNT ? "다음 소개도 만들어 보세요." : "세 소개 모두 완성! 📝 워크시트에 적고 🎤 연습으로 가요."}`;
  renderSheetSummary();
  document.getElementById("set-listen").disabled = !complete;
  updateSetBadge();
  // 자동 읽기는 사용자가 칩을 눌러 고른 직후에만
  if (complete && autoSpeak) {
    const en = setLines(s).map(l => l.en).join(" ");
    if (en !== lastSetSpoken) { lastSetSpoken = en; speak(en); }
  } else if (!complete) lastSetSpoken = "";
}

document.querySelectorAll("#set-tabs .set-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    curSet = +btn.dataset.set; synth.cancel(); lastSetSpoken = "";
    renderBuilder(); updateSetPreview();
  });
});
document.getElementById("set-speak-question").addEventListener("click", () => speak(QUESTION.en));
document.getElementById("set-speak-subject").addEventListener("click", () => {
  const sb = findSubject(mySets[curSet].subject); if (sb) speak(subjectLine(sb).en);
});
document.getElementById("set-speak-good").addEventListener("click", () => {
  const g = findGood(mySets[curSet].good); if (g) speak(goodLine(g).en);
});
document.getElementById("set-speak-reaction").addEventListener("click", () => speak(findReaction(myReaction).en));
document.getElementById("set-listen").addEventListener("click", () => {
  const s = mySets[curSet];
  if (setComplete(s)) speak(setLines(s).map(l => l.en).join(" "));
});
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
document.getElementById("set-random").addEventListener("click", () => {
  const s = mySets[curSet];
  const used = new Set(mySets.filter((x, i) => i !== curSet).map(x => x.good));
  const pool = GOOD_ATS.filter(g => !used.has(g.en));
  s.subject = pick(SUBJECTS).en;
  s.good = pick(pool.length ? pool : GOOD_ATS).en;
  persist(); renderBuilder(); updateSetPreview(true);
});
document.getElementById("set-clear").addEventListener("click", () => {
  mySets[curSet] = { subject: null, good: null };
  synth.cancel(); persist(); renderBuilder(); updateSetPreview();
});


/* ---- 음성 인식 (정확도 측정) ---- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const srSupported = !!SR;
let rec = srSupported ? new SR() : null;
if (rec) { rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 5; }
let recBusy = false;

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z\s']/g, "").replace(/\s+/g, " ").trim();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function wordsClose(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return Math.abs(a.length - b.length) <= 1 && levenshtein(a, b) <= 1;
}
const STOPWORDS = new Set(["a", "an", "the", "to", "of", "on", "in", "at", "for", "but", "i", "i'm", "i'll"]);
function scoreMatch(target, heard) {
  const t = normalize(target).split(" ").filter(Boolean);
  const h = normalize(heard).split(" ").filter(Boolean);
  let content = t.filter(w => !STOPWORDS.has(w));
  if (!content.length) content = t;
  let hit = 0;
  content.forEach(w => { if (h.some(x => wordsClose(x, w))) hit++; });
  let score = hit / content.length;
  if (score >= 0.5) score = Math.min(1, score + 0.12);
  return score;
}
function practiceAttempt(target, cb) {
  if (!rec || recBusy) { cb.onend && cb.onend(); return; }
  recBusy = true;
  let score = 0, heard = "", errCode = null;
  rec.onresult = e => {
    const alts = e.results[0];
    for (let i = 0; i < alts.length; i++) {
      const s = scoreMatch(target, alts[i].transcript);
      if (s > score) { score = s; heard = alts[i].transcript; }
    }
  };
  rec.onerror = ev => { errCode = ev.error; };
  rec.onend = () => {
    recBusy = false;
    if (errCode && score === 0) cb.onerror && cb.onerror(errCode);
    else cb.onresult && cb.onresult(Math.round(score * 100), heard);
    cb.onend && cb.onend();
  };
  try { rec.start(); } catch (e) { recBusy = false; cb.onend && cb.onend(); }
}

/* ---- 말한 뒤 콜백 (음성이 없어도 넘어가도록 안전장치) ---- */
function speakThen(text, cb) {
  let done = false;
  const finish = () => { if (!done) { done = true; cb(); } };
  const timer = setTimeout(finish, Math.min(9000, 1500 + text.length * 90));
  speak(text, null, null, () => { clearTimeout(timer); finish(); });
}

function statsText(en, last) {
  const s = stats[en] || { attempts: 0, best: 0 };
  return `정확도 <b class="acc">${last != null ? last + "%" : "--"}</b>` +
    ` · 최고 <b class="best">${s.best ? s.best + "%" : "--"}</b>` +
    ` · <b>${s.attempts}</b>회`;
}
function recordScore(en, score) {
  const s = stats[en] || { attempts: 0, best: 0 };
  s.attempts++; s.best = Math.max(s.best, score); stats[en] = s; persist();
}
function feedbackHtml(score, heard) {
  const h = `<span class="heard">내 발음: ${heard || "(못 들었어요)"}</span>`;
  if (score >= 75) return ["good", `⭐ 훌륭해요! ${score}% ${h}`];
  if (score >= 45) return ["good", `👍 좋아요! 한 번 더! ${score}% ${h}`];
  return ["bad", `🔁 다시 또박또박! ${score}% ${h}`];
}

/* 한 문장 연습 줄: [🔊] 문장/뜻 [🎙️ 말하기] 점수 → 피드백 */
function makeSpeakRow(en, ko, who) {
  const row = document.createElement("div");
  row.className = "prow" + (who ? " who-" + who.toLowerCase() : "");

  const speakBtn = document.createElement("button");
  speakBtn.className = "speak-btn small";
  speakBtn.setAttribute("aria-label", "듣기");
  speakBtn.textContent = "🔊";
  speakBtn.addEventListener("click", () => speak(en));

  const txt = document.createElement("div");
  txt.className = "prow-text";
  if (who) { const w = document.createElement("span"); w.className = "prow-who"; w.textContent = who; txt.appendChild(w); }
  const enEl = document.createElement("div"); enEl.className = "en"; enEl.appendChild(buildWords(en));
  const koEl = document.createElement("div"); koEl.className = "ko"; koEl.textContent = ko;
  txt.append(enEl, koEl);

  const mic = document.createElement("button");
  mic.className = "mic-btn";
  mic.innerHTML = '<span class="mic-ico">🎙️</span><span class="mic-txt">말하기</span>';
  const score = document.createElement("div");
  score.className = "pstats";
  score.innerHTML = statsText(en, null);
  const fb = document.createElement("div");
  fb.className = "mic-feedback";

  if (!srSupported) { mic.disabled = true; mic.title = "이 브라우저는 음성 인식을 지원하지 않아요 (Chrome 권장)"; }

  function attempt(after) {
    if (recBusy || !srSupported) { after && after(); return; }
    mic.classList.add("recording");
    row.classList.add("active");
    fb.className = "mic-feedback"; fb.textContent = "🔴 듣고 있어요... 또박또박 말해보세요!";
    practiceAttempt(en, {
      onresult: (s, heard) => {
        recordScore(en, s);
        score.innerHTML = statsText(en, s);
        const [cls, html] = feedbackHtml(s, heard);
        fb.className = "mic-feedback " + cls; fb.innerHTML = html;
      },
      onerror: err => {
        fb.className = "mic-feedback bad";
        fb.textContent = err === "not-allowed" ? "마이크 권한을 허용해 주세요." : "다시 시도해 주세요.";
      },
      onend: () => { mic.classList.remove("recording"); row.classList.remove("active"); after && after(); }
    });
  }
  mic.addEventListener("click", () => attempt());

  const main = document.createElement("div");
  main.className = "prow-main";
  main.append(speakBtn, txt, mic, score);
  row.append(main, fb);
  row._attempt = attempt;
  row._who = who;
  row._en = en;
  return row;
}


/* ===========================================================
 * 📝 워크시트에 적기
 * =========================================================== */
function sheetRow(label, en, ko) {
  const row = document.createElement("div");
  row.className = "sheet-row" + (en ? "" : " empty");
  const lab = document.createElement("div"); lab.className = "sheet-label"; lab.textContent = label;
  const val = document.createElement("div"); val.className = "sheet-val";
  if (en) {
    const e = document.createElement("div"); e.className = "en"; e.appendChild(buildWords(en));
    const k = document.createElement("div"); k.className = "ko"; k.textContent = ko;
    val.append(e, k);
  } else val.textContent = "아직 고르지 않았어요";
  const btn = document.createElement("button");
  btn.className = "speak-btn small"; btn.textContent = "🔊"; btn.disabled = !en;
  btn.addEventListener("click", () => en && speak(en));
  row.append(lab, val, btn);
  return row;
}
function renderSheetSummary() {
  const box = document.getElementById("sheet-summary");
  if (!box) return;
  box.innerHTML = "";
  box.appendChild(sheetRow("친구에게 묻기", QUESTION.en, QUESTION.ko));
  mySets.forEach((s, i) => {
    const sb = findSubject(s.subject), g = findGood(s.good);
    const a = sb && subjectLine(sb), b = g && goodLine(g);
    box.appendChild(sheetRow(`좋아하는 과목 ${i + 1}`, a && a.en, a && a.ko));
    box.appendChild(sheetRow(`잘하는 것 ${i + 1}`, b && b.en, b && b.ko));
  });
}

/* ===========================================================
 * 👫 짝 활동 카드 (묻기 → 대답하기)
 * =========================================================== */
function renderPairCards() {
  const box = document.getElementById("pair-cards");
  box.innerHTML = "";
  const done = mySets.map((s, i) => [s, i]).filter(([s]) => setComplete(s));
  if (!done.length) {
    const p = document.createElement("p"); p.className = "practice-empty";
    p.innerHTML = "아직 만든 소개가 없어요! <b>🎒 내 소개 만들기</b>에서 먼저 만들어요.";
    box.appendChild(p); return;
  }
  done.forEach(([s, i]) => {
    const sb = findSubject(s.subject), g = findGood(s.good);
    const card = document.createElement("div");
    card.className = "pair-card tone-" + (i % 6);
    const head = document.createElement("div"); head.className = "pair-head";
    head.innerHTML = `<span class="card-tag tag-combo">소개 ${i + 1}</span><span class="pair-emoji">${sb.emoji}${g.emoji}</span>`;
    const ask = document.createElement("div"); ask.className = "pair-line friend";
    ask.innerHTML = `<div class="pair-who">🙋 묻기 (친구에게 / 친구가 나에게)</div>`;
    const q = document.createElement("div"); q.className = "pair-en"; q.appendChild(buildWords(QUESTION.en));
    ask.appendChild(q);
    const a1 = document.createElement("div"); a1.className = "pair-line me";
    a1.innerHTML = `<div class="pair-who">😀 나의 대답</div>`;
    const e1 = document.createElement("div"); e1.className = "pair-en"; e1.appendChild(buildWords(subjectLine(sb).en));
    const e2 = document.createElement("div"); e2.className = "pair-en"; e2.appendChild(buildWords(goodLine(g).en));
    a1.append(e1, e2);
    const memo = document.createElement("div"); memo.className = "pair-line friend";
    memo.innerHTML = `<div class="pair-who">✍️ 친구의 대답 적기</div>
      <div class="pair-choice"><span class="pair-ok">이름: ________</span><span class="pair-ok">과목: ________</span><span class="pair-ok">잘하는 것: ________</span></div>`;
    const tools = document.createElement("div"); tools.className = "ptools";
    const b1 = document.createElement("button"); b1.className = "btn small primary"; b1.textContent = "🔊 질문 듣기";
    b1.addEventListener("click", () => speak(QUESTION.en));
    const b2 = document.createElement("button"); b2.className = "btn small"; b2.textContent = "🔊 대답 듣기";
    b2.addEventListener("click", () => speak(`${subjectLine(sb).en} ${goodLine(g).en}`));
    tools.append(b1, b2);
    card.append(head, ask, a1, memo, tools);
    box.appendChild(card);
  });
}

/* ===========================================================
 * 🎤 컴퓨터와 미리 연습하기 (소개별 대화: 줄마다 말하기 + 역할극)
 * =========================================================== */
function makeSetCard(s, idx) {
  const card = document.createElement("div");
  card.className = "pcard pcard-dialog";
  const sb = findSubject(s.subject), g = findGood(s.good);

  const top = document.createElement("div");
  top.className = "card-top";
  const left = document.createElement("div"); left.className = "ptag-left";
  const tag = document.createElement("span"); tag.className = "card-tag tag-combo"; tag.textContent = `🎒 소개 ${idx + 1}`;
  const title = document.createElement("span"); title.className = "pset-title"; title.textContent = `${sb.emoji} ${sb.en} · ${g.emoji} ${g.en}`;
  left.append(tag, title);
  top.append(left);
  card.appendChild(top);

  const body = document.createElement("div");
  const tools = document.createElement("div"); tools.className = "ptools";
  const roleNote = document.createElement("div"); roleNote.className = "role-note";
  card.append(body, tools, roleNote);

  let playing = false;
  const rows = setLines(s).map(l => makeSpeakRow(l.en, l.ko, l.who));
  rows.forEach(r => body.appendChild(r));

  const allBtn = document.createElement("button");
  allBtn.className = "btn small"; allBtn.textContent = "🔊 전체 듣기";
  allBtn.addEventListener("click", () => speak(rows.map(r => r._en).join(" ")));
  const roleA = document.createElement("button");
  roleA.className = "btn small primary"; roleA.textContent = "🎭 내가 A (묻기)";
  const roleB = document.createElement("button");
  roleB.className = "btn small primary"; roleB.textContent = "🎭 내가 B (대답하기)";
  roleA.addEventListener("click", () => rolePlay("A", [roleA, roleB]));
  roleB.addEventListener("click", () => rolePlay("B", [roleA, roleB]));
  tools.append(allBtn, roleA, roleB);

  function rolePlay(me, btns) {
    if (playing || recBusy) return;
    if (!srSupported) { roleNote.textContent = "이 브라우저는 음성 인식을 지원하지 않아요 (Chrome 권장)"; return; }
    playing = true; btns.forEach(b => b.disabled = true);
    let i = 0;
    const step = () => {
      rows.forEach(r => r.classList.remove("turn"));
      if (i >= rows.length) {
        playing = false; btns.forEach(b => b.disabled = false);
        roleNote.textContent = "🎉 역할극 끝! 잘했어요. 이번엔 다른 역할도 해 볼까요?";
        return;
      }
      const r = rows[i]; i++;
      r.classList.add("turn");
      if (r._who === me) {
        roleNote.textContent = `🎙️ 내 차례! "${r._en}" 라고 말해보세요.`;
        r._attempt(() => setTimeout(step, 500));
      } else {
        roleNote.textContent = `👂 컴퓨터(${r._who})가 말해요. 잘 들어보세요.`;
        speakThen(r._en, () => setTimeout(step, 400));
      }
    };
    step();
  }
  return card;
}

function renderPractice() {
  renderPairCards();
  const empty = document.getElementById("practice-empty");
  const list = document.getElementById("practice-list");
  list.innerHTML = "";
  const done = mySets.map((s, i) => [s, i]).filter(([s]) => setComplete(s));
  if (!done.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";
  done.forEach(([s, i]) => list.appendChild(makeSetCard(s, i)));
  if (done.length < SET_COUNT) {
    const note = document.createElement("p");
    note.className = "practice-empty";
    note.innerHTML = `아직 <b>${SET_COUNT - done.length}개</b> 소개가 비어 있어요. <b>🎒 내 소개 만들기</b>에서 마저 만들어 보세요.`;
    list.appendChild(note);
  }
}


/* ---------- 질문 · 반응 카드 ---------- */
function renderAnswerGrids() {
  renderGrid("accept-grid", [QUESTION], { tones: true, noIndex: true });
  renderGrid("reaction-grid", REACTIONS, { tones: true, noIndex: true });
  renderSubjectFill();
  renderGoodFill();
}

let fillSubject = null;
let fillGood = null;
let lastFillSpoken = "";

function fillActions(wrap, en) {
  wrap.innerHTML = "";
  if (!en) return;
  const listenBtn = document.createElement("button");
  listenBtn.className = "btn primary";
  listenBtn.textContent = "🔊 문장 듣기";
  listenBtn.addEventListener("click", () => speak(en));
  wrap.append(listenBtn);
  if (en !== lastFillSpoken) { lastFillSpoken = en; speak(en); }
}

/* ---------- 빈칸 채우기: My favorite subject is ___. ---------- */
function renderSubjectFill() {
  const row = document.getElementById("refuse-chips");
  row.innerHTML = "";
  SUBJECTS.forEach(sb => {
    row.appendChild(makeChip(`${sb.emoji} ${sb.en} · ${sb.ko}`, "act", fillSubject === sb, () => {
      fillSubject = sb; renderSubjectFill();
    }));
  });
  const blank = document.getElementById("refuse-blank");
  const koEl = document.getElementById("refuse-ko");
  const actions = document.getElementById("refuse-actions");
  if (fillSubject) {
    const l = subjectLine(fillSubject);
    setBlank("refuse-blank", fillSubject.en);
    koEl.textContent = l.ko;
    fillActions(actions, l.en);
  } else {
    setBlank("refuse-blank", null);
    koEl.textContent = "내가 가장 좋아하는 과목은 ________(이)야.";
    fillActions(actions, null);
  }
}

/* ---------- 빈칸 채우기: I'm good at ___. ---------- */
function renderGoodFill() {
  const row = document.getElementById("meet-good-chips");
  row.innerHTML = "";
  GOOD_ATS.forEach(g => {
    row.appendChild(makeChip(`${g.emoji} ${g.en} · ${g.ko}`, "place", fillGood === g, () => {
      fillGood = g; renderGoodFill();
    }));
  });
  const koEl = document.getElementById("meet-ko");
  const actions = document.getElementById("meet-actions");
  if (fillGood) {
    const l = goodLine(fillGood);
    setBlank("meet-good-blank", fillGood.en);
    koEl.textContent = l.ko;
    fillActions(actions, l.en);
  } else {
    setBlank("meet-good-blank", null);
    koEl.textContent = "나는 ________을(를) 잘해.";
    fillActions(actions, null);
  }
}


/* ---------- 초기 렌더 ---------- */
renderSuggestions();
renderAnswerGrids();
renderBuilder();
updateSetPreview();
renderSheetSummary();

/* ---------- 탭 전환 ---------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    synth.cancel();
    hidePopup();
    if (btn.dataset.tab === "practice") renderPractice();
    if (btn.dataset.tab === "build") { lastSetSpoken = ""; renderBuilder(); updateSetPreview(); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* ---------- 속도 조절 ---------- */
document.getElementById("rate").addEventListener("input", e => {
  speakRate = parseFloat(e.target.value);
});
