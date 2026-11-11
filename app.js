/* =========================================================
 * What are you going to do? · 앱 로직
 * 1) 발음 채점 (Node 테스트 가능: module.exports)
 * 2) 화면(활동 카드 초급·중급 / 연습하기)
 * ========================================================= */

/* ================= 1) 발음 채점 ================= */
const CONTRACTIONS = {
  "i'm": "i am", "im": "i am", "i'll": "i will", "i've": "i have", "i'd": "i would",
  "you're": "you are", "we're": "we are", "they're": "they are", "he's": "he is", "she's": "she is",
  "it's": "it is", "that's": "that is", "what's": "what is", "let's": "let us",
  "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "can not", "cannot": "can not",
  "won't": "will not", "isn't": "is not", "aren't": "are not", "gonna": "going to", "wanna": "want to"
};
const HOMOPHONES = { too: "to", two: "to", four: "for", fore: "for", an: "a", hi: "high", bye: "by", eye: "i", ice: "i" };
const SMALL_WORDS = new Set(["i", "am", "a", "an", "the", "to", "my", "at", "on", "in", "with", "for", "of", "and", "by", "is", "are"]);

/* 문장 → 비교용 낱말들 */
function normWords(text) {
  let s = String(text || "").toLowerCase().replace(/[’‘`]/g, "'").replace(/-/g, " ").replace(/[^a-z0-9' ]+/g, " ");
  let out = [];
  s.split(/\s+/).filter(Boolean).forEach(w => {
    const exp = CONTRACTIONS[w] || w;
    exp.split(" ").forEach(x => {
      x = x.replace(/'s$/, "").replace(/'/g, "");
      if (!x) return;
      out.push(HOMOPHONES[x] || x);
    });
  });
  // 한 글자씩 들린 말 붙이기: "p c" → "pc" (a, i 는 낱말이므로 제외)
  const joined = [];
  for (let i = 0; i < out.length;) {
    if (out[i].length === 1 && out[i] !== "a" && out[i] !== "i") {
      let j = i, buf = "";
      while (j < out.length && out[j].length === 1 && out[j] !== "a" && out[j] !== "i") buf += out[j++];
      if (j - i >= 2) { joined.push(buf); i = j; continue; }
    }
    joined.push(out[i++]);
  }
  return joined;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
/* 자음만 비슷한 소리로 통일 (모음은 그대로 → kite ≠ cat) */
function soundKey(w) {
  return w.replace(/ph/g, "f").replace(/th/g, "s").replace(/ck/g, "k").replace(/q/g, "k").replace(/x/g, "ks")
    .replace(/c/g, "k").replace(/r/g, "l").replace(/f/g, "p").replace(/v/g, "b").replace(/z/g, "s")
    .replace(/(.)\1+/g, "$1");
}
/* 단어 점수: 같음 1 · 철자 1글자 차이 0.85 · 소리 비슷 0.7 · 비슷한 편 0.5 · 그 외 0 */
function wordScore(t, h) {
  if (t === h) return 1;
  const minLen = Math.min(t.length, h.length);
  if (minLen >= 3 && levenshtein(t, h) === 1) return 0.85;
  if (minLen >= 2 && soundKey(t) === soundKey(h)) return 0.7;
  if (minLen >= 3 && (t.startsWith(h) || h.startsWith(t))) return 0.5;
  if (minLen >= 5 && levenshtein(t, h) <= 2) return 0.5;
  if (minLen >= 4 && levenshtein(soundKey(t), soundKey(h)) <= 1) return 0.5;
  return 0;
}

/* 목표 문장 → 화면 단어(칩) + 비교 단어(가중치) */
function targetTokens(sentence) {
  const display = String(sentence).split(/\s+/).filter(Boolean);
  const tokens = [];
  display.forEach((dw, di) => {
    const clean = dw.replace(/[^A-Za-z0-9'’-]/g, "");
    const proper = di > 0 && /^[A-Z]/.test(clean) && !/^I('|’|$)/.test(clean);
    normWords(clean).forEach(w => {
      const weight = SMALL_WORDS.has(w) ? 0.3 : proper ? 0.6 : 1;
      tokens.push({ w, weight, di });
    });
  });
  return { display, tokens };
}

/* 단어 순서대로 동적 계획법 정렬 */
function scoreOne(sentence, heardText) {
  const { display, tokens } = targetTokens(sentence);
  const heard = normWords(heardText);
  const n = tokens.length, m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const sim = Array.from({ length: n }, (_, i) => heard.map(h => wordScore(tokens[i].w, h)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    let best = Math.max(dp[i - 1][j], dp[i][j - 1]);
    const s = sim[i - 1][j - 1];
    if (s > 0) best = Math.max(best, dp[i - 1][j - 1] + tokens[i - 1].weight * s);
    dp[i][j] = best;
  }
  // 되짚기
  const got = new Array(n).fill(0);
  let matched = 0, i = n, j = m;
  while (i > 0 && j > 0) {
    const s = sim[i - 1][j - 1];
    if (s > 0 && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + tokens[i - 1].weight * s)) < 1e-9) {
      got[i - 1] = s; matched++; i--; j--;
    } else if (Math.abs(dp[i][j] - dp[i - 1][j]) < 1e-9) i--;
    else j--;
  }
  const total = tokens.reduce((a, t) => a + t.weight, 0) || 1;
  const extras = m - matched;
  const penalty = Math.min(10, extras * 3);
  const score = Math.max(0, Math.min(100, Math.round(100 * dp[n][m] / total - penalty)));
  // 화면 단어별 상태 (I'm 은 한 칩)
  const chips = display.map((d, di) => {
    const ts = tokens.map((t, k) => ({ t, s: got[k] })).filter(x => x.t.di === di);
    let status = "ok";
    if (ts.length) {
      if (ts.every(x => x.s === 1)) status = "ok";
      else if (ts.every(x => x.s === 0)) status = "miss";
      else status = "near";
    }
    return { text: d, status };
  });
  return { score, chips, heard: heardText, extras };
}

/* 후보(최대 5개) 중 최고 점수 */
function scoreSpeech(sentence, alternatives) {
  const alts = (alternatives || []).filter(a => a && a.trim()).slice(0, 5);
  if (!alts.length) return null;
  return alts.map(a => scoreOne(sentence, a)).reduce((b, r) => (r.score > b.score ? r : b));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { normWords, wordScore, soundKey, scoreOne, scoreSpeech, targetTokens };
}

/* ================= 2) 화면 ================= */
if (typeof window !== "undefined" && typeof document !== "undefined") (function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const actById = id => ACTIVITIES.find(a => a.id === id);
  const catById = id => CATS.find(c => c.id === id);
  const qById = id => QUESTIONS.find(q => q.id === id);

  /* ----- 저장 ----- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 무시 */ } }
  };
  let plans = store.get("wayg-plans", {});     // { q1: { id, level } }
  let stats = store.get("wayg-stats", {});     // { "I'm going to ...": { count, best, sum, last } }
  Object.keys(plans).forEach(k => { if (!qById(k) || !actById(plans[k].id)) delete plans[k]; });
  const savePlans = () => store.set("wayg-plans", plans);
  const saveStats = () => store.set("wayg-stats", stats);
  const recordings = {};                        // { q1: blobURL } (새로고침하면 사라짐)

  let currentQ = "q1";
  const filters = { basic: "all", mid: "all" };

  /* ----- 음성 합성 ----- */
  let voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices().filter(v => /^en(-|_)/i.test(v.lang));
    voice = vs.find(v => /en-US/i.test(v.lang) && /Google|Samantha|Female|Zira|Jenny|Aria/i.test(v.name)) ||
            vs.find(v => /en-US/i.test(v.lang)) || vs[0] || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speakSeq(texts, onDone) {
    if (!("speechSynthesis" in window)) { onDone && onDone(); return; }
    speechSynthesis.cancel();
    const list = texts.filter(Boolean);
    let i = 0;
    const next = () => {
      if (i >= list.length) { onDone && onDone(); return; }
      const u = new SpeechSynthesisUtterance(list[i++]);
      u.lang = "en-US"; u.rate = 0.85; if (voice) u.voice = voice;
      u.onend = next; u.onerror = next;
      speechSynthesis.speak(u);
    };
    next();
  }
  const speak = t => speakSeq([t]);

  /* ----- 단어 뜻 풍선 ----- */
  const popup = $("#word-popup");
  function wordsHtml(sentence) {
    return String(sentence).split(/\s+/).filter(Boolean).map(w => {
      const key = w.replace(/[^A-Za-z']/g, "").toLowerCase();
      return WORDS[key] ? `<span class="w" tabindex="0" data-w="${esc(key)}">${esc(w)}</span>` : esc(w);
    }).join(" ");
  }
  function showPopup(target) {
    const key = target.dataset.w;
    popup.innerHTML = `<b>${esc(target.textContent.replace(/[.?!,]/g, ""))}</b> ${esc(WORDS[key] || "")}`;
    popup.classList.remove("hidden");
    const r = target.getBoundingClientRect();
    const pw = popup.offsetWidth, ph = popup.offsetHeight;
    const left = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - pw - 8));
    popup.style.left = left + "px";
    popup.style.top = (r.top + window.scrollY - ph - 10) + "px";
    speak(target.textContent.replace(/[.?!,]/g, ""));
  }
  document.addEventListener("click", e => {
    const w = e.target.closest(".w");
    if (w) { showPopup(w); e.stopPropagation(); return; }
    if (!e.target.closest("#word-popup")) popup.classList.add("hidden");
  });
  document.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("w")) { e.preventDefault(); showPopup(e.target); }
    if (e.key === "Escape") popup.classList.add("hidden");
  });
  window.addEventListener("scroll", () => popup.classList.add("hidden"), { passive: true });

  /* ----- 그림 (없으면 이모지 타일) ----- */
  function visual(a, cls) {
    const box = el("div", cls);
    const img = new Image();
    img.alt = a.en; img.loading = "lazy"; img.src = a.img;
    img.onerror = () => { box.innerHTML = ""; box.appendChild(el("div", "emoji-tile", a.emoji)); };
    box.appendChild(img);
    return box;
  }

  /* ----- 탭 ----- */
  function switchTab(name) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + name));
    popup.classList.add("hidden");
    if (name === "practice") renderPractice(); else renderCardTab(name);
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll(".tab-btn").forEach(b => b.addEventListener("click", () => switchTab(b.dataset.tab)));

  function planCount() { return Object.keys(plans).length; }
  function updateBadge() { $("#plan-count").textContent = planCount() + "/5"; }

  /* ===== 활동 카드 탭 ===== */
  function buildCardTab(level) {
    const sec = $("#tab-" + level);
    sec.innerHTML = `
      <div class="block">
        <h2>1️⃣ 질문을 골라요</h2>
        <div class="q-row"></div>
        <div class="chat"></div>
        <div class="chat-actions">
          <button class="btn js-listen">🔊 대화 듣기</button>
          <button class="btn soft js-next">다음 질문 ▶</button>
          <button class="btn red js-go">🎤 연습하기로 가기</button>
        </div>
        <p class="status" aria-live="polite"></p>
      </div>
      <div class="block">
        <h2>2️⃣ 할 일 고르기 <span class="hint">${level === "mid" ? "중급: 누구와 · 어디서 · 무엇을 하러를 붙인 긴 문장" : "초급: 짧은 문장"}</span></h2>
        <div class="filters"></div>
        <div class="card-grid"></div>
      </div>`;
    sec.querySelector(".js-listen").addEventListener("click", () => {
      const q = qById(currentQ), p = plans[currentQ];
      speakSeq([q.q, p ? answerEn(actById(p.id), p.level) : "I'm going to ..."]);
    });
    sec.querySelector(".js-next").addEventListener("click", () => {
      const i = QUESTIONS.findIndex(q => q.id === currentQ);
      currentQ = QUESTIONS[(i + 1) % QUESTIONS.length].id;
      renderCardTab(level);
      speak(qById(currentQ).q);
    });
    sec.querySelector(".js-go").addEventListener("click", () => switchTab("practice"));
  }

  function renderQRow(level) {
    const row = $("#tab-" + level + " .q-row");
    row.innerHTML = "";
    QUESTIONS.forEach((q, i) => {
      const p = plans[q.id];
      const b = el("button", "q-btn" + (q.id === currentQ ? " active" : ""),
        `<span class="q-num">Q${i + 1}</span><span class="q-emoji">${q.emoji}</span>` +
        `<span class="q-ko">${q.ko}</span><span class="q-en">${q.en}</span>` +
        (p ? `<span class="q-done" title="계획 있음">✓${actById(p.id).emoji}</span>` : ""));
      b.dataset.q = q.id;
      b.addEventListener("click", () => { currentQ = q.id; renderCardTab(level); speak(q.q); });
      row.appendChild(b);
    });
  }

  function renderChat(level) {
    const q = qById(currentQ), p = plans[currentQ], a = p && actById(p.id);
    const chat = $("#tab-" + level + " .chat");
    const ans = a ? (p.level === "mid" ? a.mid.en : a.en) : null;
    chat.innerHTML = `
      <div class="bubble-line friend">
        <div class="who">🙋<small>친구</small></div>
        <div class="bubble"><div class="say">${wordsHtml(q.q)} <button class="mini js-sq" aria-label="질문 듣기">🔊</button></div>
          <div class="mean">${q.qKo}</div></div>
      </div>
      <div class="bubble-line me">
        <div class="who">🙆<small>나</small></div>
        <div class="bubble"><div class="say">${a ? `${wordsHtml("I'm going to")} <span class="filled">${wordsHtml(ans)}</span>.` :
          `I'm going to <span class="blank">____</span>.`} <button class="mini js-sa" aria-label="대답 듣기">🔊</button></div>
          <div class="mean">${a ? answerKo(a, p.level) : "나는 ____ 거야."}</div></div>
      </div>`;
    chat.querySelector(".js-sq").addEventListener("click", () => speak(q.q));
    chat.querySelector(".js-sa").addEventListener("click", () => speak(a ? answerEn(a, p.level) : "I'm going to ..."));
    const status = $("#tab-" + level + " .status");
    status.textContent = a
      ? `✅ ${q.ko} 계획: ${a.emoji} ${answerKo(a, p.level)} · 연습하기에 담겼어요 (${planCount()}/5)`
      : `👇 아래 카드에서 ‘✅ ${q.koWhen} 할래요’를 눌러 대답을 골라요.`;
  }

  function renderFilters(level) {
    const box = $("#tab-" + level + " .filters");
    const q = qById(currentQ);
    const opts = [["all", "전체"], ["book", "📘 교과서 표현"]]
      .concat(CATS.map(c => [c.id, c.emoji + " " + c.ko]))
      .concat([["star", `⭐ ${q.ko}에 어울리는 것만`]]);
    box.innerHTML = "";
    opts.forEach(([id, label]) => {
      const b = el("button", "chip" + (filters[level] === id ? " active" : ""), label);
      b.dataset.filter = id;
      b.addEventListener("click", () => { filters[level] = id; renderFilters(level); renderGrid(level); });
      box.appendChild(b);
    });
  }

  function renderGrid(level) {
    const grid = $("#tab-" + level + " .card-grid");
    const f = filters[level], q = qById(currentQ);
    const list = ACTIVITIES.filter(a =>
      f === "all" ? true : f === "book" ? a.book : f === "star" ? a.when.includes(currentQ) : a.cat === f);
    grid.innerHTML = "";
    if (!list.length) { grid.appendChild(el("p", "empty", "카드가 없어요.")); return; }
    list.forEach(a => {
      const cat = catById(a.cat);
      const p = plans[currentQ];
      const chosen = p && p.id === a.id && p.level === level;
      const card = el("div", `card c-${a.cat}` + (chosen ? " chosen" : ""));
      card.dataset.id = a.id;
      const tags = el("div", "card-tags",
        `<span class="tag">${cat.emoji} ${cat.ko}</span>` +
        (a.book ? `<span class="tag book">📘 교과서</span>` : "") +
        (a.when.includes(currentQ) ? `<span class="tag star">⭐ 추천</span>` : ""));
      card.appendChild(tags);
      card.appendChild(visual(a, "visual"));
      card.appendChild(el("div", "card-body",
        `<div class="sentence">${wordsHtml(answerEn(a, level))}</div><div class="ko">${answerKo(a, level)}</div>`));
      const foot = el("div", "card-foot");
      const sp = el("button", "mini", "🔊"); sp.setAttribute("aria-label", "문장 듣기");
      sp.addEventListener("click", () => speak(answerEn(a, level)));
      const ch = el("button", "choose" + (chosen ? " on" : ""), chosen ? `✔ 골랐어요 · 빼기` : `✅ ${q.koWhen} 할래요`);
      ch.addEventListener("click", () => choose(level, a));
      foot.appendChild(sp); foot.appendChild(ch);
      card.appendChild(foot);
      grid.appendChild(card);
    });
  }

  function choose(level, a) {
    const q = qById(currentQ), p = plans[currentQ];
    if (p && p.id === a.id && p.level === level) {
      delete plans[currentQ];
      savePlans(); delete recordings[currentQ];
      renderAllAfterPlanChange(level);
      $("#tab-" + level + " .status").textContent = `↩️ ${q.ko} 계획을 뺐어요. 다른 카드를 골라 봐요.`;
      return;
    }
    plans[currentQ] = { id: a.id, level };
    savePlans(); delete recordings[currentQ];
    renderAllAfterPlanChange(level);
    speakSeq([q.q, answerEn(a, level)]);
  }
  function renderAllAfterPlanChange(level) {
    updateBadge();
    renderQRow(level); renderChat(level); renderGrid(level);
  }

  function renderCardTab(level) {
    renderQRow(level); renderChat(level); renderFilters(level); renderGrid(level);
  }

  /* ===== 연습하기 ===== */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const supportMsg = SR ? "🎙️ 말하기를 누르고 문장을 영어로 말해요. 마이크 권한을 허용해 주세요."
    : canRecord ? "⚠️ 이 브라우저는 음성 인식이 없어 4초 녹음만 돼요. 채점은 Chrome 권장!"
    : "⚠️ 이 브라우저는 마이크를 쓸 수 없어요. Chrome 권장!";

  function statOf(en) { return stats[en] || { count: 0, best: 0, sum: 0, last: null }; }
  function statsText(en) {
    const s = statOf(en);
    if (!s.count) return "아직 연습 전이에요";
    return `이번 ${s.last}% · 평균 ${Math.round(s.sum / s.count)}% · 최고 ${s.best}% · ${s.count}회`;
  }
  function renderSummary() {
    let count = 0, sum = 0;
    Object.values(stats).forEach(s => { count += s.count; sum += s.sum; });
    $("#sum-count").textContent = count;
    $("#sum-avg").textContent = count ? Math.round(sum / count) + "%" : "-";
    const done = QUESTIONS.filter(q => { const p = plans[q.id]; return p && statOf(answerEn(actById(p.id), p.level)).count > 0; }).length;
    $("#sum-done").textContent = done + "/5";
    $("#mic-support").textContent = supportMsg;
  }

  function renderPractice() {
    renderSummary();
    const list = $("#plan-list");
    list.innerHTML = "";
    QUESTIONS.forEach(q => {
      const p = plans[q.id], a = p && actById(p.id);
      const row = el("div", "plan-row" + (a ? " done" : ""));
      row.dataset.q = q.id;
      row.appendChild(el("div", "plan-when", `<span class="e">${q.emoji}</span>${q.ko}<span class="en">${q.en}</span>`));
      const main = el("div", "plan-main");
      main.innerHTML = `<div class="plan-q">Q. ${wordsHtml(q.q)}</div>` + (a
        ? `<div class="plan-a">A. ${wordsHtml(answerEn(a, p.level))}</div><div class="ko">${answerKo(a, p.level)}</div>`
        : `<div class="plan-a empty-a">A. I'm going to ____.</div><div class="ko">🎨 활동 카드에서 골라요</div>`);
      row.appendChild(main);
      const side = el("div", "plan-side");
      if (a) {
        side.appendChild(visual(a, "thumb"));
        const btns = el("div", "plan-btns");
        const sp = el("button", "mini", "🔊"); sp.setAttribute("aria-label", "듣기");
        sp.addEventListener("click", () => speakSeq([q.q, answerEn(a, p.level)]));
        const rm = el("button", "mini js-remove", "✕"); rm.setAttribute("aria-label", "빼기");
        rm.addEventListener("click", () => { delete plans[q.id]; delete recordings[q.id]; savePlans(); updateBadge(); renderPractice(); });
        btns.appendChild(sp); btns.appendChild(rm);
        side.appendChild(btns);
        main.appendChild(speakTool(q, answerEn(a, p.level)));
      } else {
        side.appendChild(el("div", "thumb", `<div class="emoji-tile">❔</div>`));
      }
      row.appendChild(side);
      list.appendChild(row);
    });
  }

  function speakTool(q, en) {
    const wrap = el("div", "speak-tool-wrap");
    const tool = el("div", "speak-tool");
    const rec = el("button", "btn rec js-speak", "🎙️ 말하기");
    const play = el("button", "btn soft js-play", "▶ 내 목소리");
    const st = el("span", "stats", statsText(en));
    play.disabled = !recordings[q.id];
    if (!SR && !canRecord) { rec.disabled = true; st.textContent = "Chrome 권장 (이 브라우저는 마이크를 쓸 수 없어요)"; }
    tool.append(rec, play, st);
    const live = el("div", "live");
    const result = el("div", "result hidden");
    wrap.append(tool, live, result);

    play.addEventListener("click", () => {
      if (!recordings[q.id]) return;
      const au = new Audio(recordings[q.id]);
      au.play().catch(() => { live.textContent = "녹음을 재생하지 못했어요."; });
    });

    let session = null;
    rec.addEventListener("click", () => {
      if (session) { session.stop(); return; }
      session = startAttempt(q, en, {
        onStart() { rec.classList.add("on"); rec.textContent = "⏹️ 그만"; live.textContent = "👂 듣고 있어요… 문장을 말해 봐요!"; result.classList.add("hidden"); },
        onInterim(t) { live.textContent = "👂 들리는 말: " + t; },
        onRecording() { play.disabled = false; },
        onEnd(alts, err) {
          session = null;
          rec.classList.remove("on"); rec.textContent = "🎙️ 말하기";
          if (err) { live.textContent = err; return; }
          if (!SR) { live.textContent = "🎧 녹음했어요! ▶ 내 목소리로 들어 봐요. (채점은 Chrome에서)"; return; }
          const r = scoreSpeech(en, alts);
          if (!r) { live.textContent = "🤔 잘 안 들렸어요. 마이크 가까이에서 다시 말해 봐요."; return; }
          live.textContent = "";
          const s = statOf(en);
          s.count++; s.sum += r.score; s.best = Math.max(s.best, r.score); s.last = r.score;
          stats[en] = s; saveStats();
          st.textContent = statsText(en);
          showResult(result, r);
          renderSummary();
        }
      });
    });
    return wrap;
  }

  function showResult(box, r) {
    const icon = r.score >= 85 ? "⭐" : r.score >= 60 ? "👍" : "🔁";
    const msg = r.score >= 85 ? "아주 잘했어요!" : r.score >= 60 ? "좋아요! 조금만 더!" : "다시 해 봐요!";
    const retry = [];
    r.chips.forEach(c => {
      const w = c.text.replace(/[.?!,]/g, "");
      const small = SMALL_WORDS.has(w.toLowerCase()) && w !== "I";
      if (c.status !== "ok" && !small && !retry.includes(w)) retry.push(w);
    });
    box.innerHTML = `<div class="score">${icon} ${r.score}% <small>${msg}</small></div>
      <div class="wchips">${r.chips.map(c => `<span class="wchip ${c.status}">${esc(c.text)}</span>`).join("")}</div>
      <div class="hint">🟩 맞음 · 🟨 비슷함 · 🟥 놓침</div>
      ${retry.length ? `<div class="retry">🔁 다시 들어 볼 단어: ${retry.map(w => `<button data-say="${esc(w)}">🔊 ${esc(w)}</button>`).join("")}</div>` : ""}
      <div class="heard">컴퓨터가 들은 말: “${esc(r.heard)}”</div>`;
    box.querySelectorAll("[data-say]").forEach(b => b.addEventListener("click", () => speak(b.dataset.say)));
    box.classList.remove("hidden");
  }

  /* 음성 인식 + 녹음 동시에 */
  function startAttempt(q, en, cb) {
    let recorder = null, stream = null, recog = null, timer = null, ended = false;
    const alts = [];
    let finalAlts = null;
    if ("speechSynthesis" in window) speechSynthesis.cancel();

    function stopRecorder() {
      try { if (recorder && recorder.state !== "inactive") recorder.stop(); } catch (e) { /* 무시 */ }
    }
    function finish(err) {
      if (ended) return; ended = true;
      clearTimeout(timer);
      stopRecorder();
      cb.onEnd(finalAlts || alts, err);
    }
    function startRecorder() {
      if (!canRecord) return Promise.resolve();
      return navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
        stream = s;
        const chunks = [];
        recorder = new MediaRecorder(s);
        recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          if (chunks.length) {
            if (recordings[q.id]) URL.revokeObjectURL(recordings[q.id]);
            recordings[q.id] = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
            cb.onRecording();
          }
        };
        recorder.start();
        if (ended) stopRecorder();
      }).catch(() => { /* 녹음 실패해도 인식은 진행 */ });
    }

    cb.onStart();
    if (SR) {
      recog = new SR();
      recog.lang = "en-US";
      recog.interimResults = true;
      recog.maxAlternatives = 5;
      recog.continuous = false;
      recog.onresult = e => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          text += res[0].transcript + " ";
          if (res.isFinal) {
            const list = [];
            for (let k = 0; k < res.length && k < 5; k++) list.push(res[k].transcript);
            finalAlts = list;
          }
        }
        alts.length = 0; alts.push(text.trim());
        cb.onInterim(text.trim());
      };
      recog.onerror = e => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") finish("🔒 마이크 권한을 허용해 주세요. (주소창 왼쪽 자물쇠 → 마이크 허용)");
        else if (e.error === "no-speech") finish();
        else if (e.error === "network") finish("🌐 음성 인식에 인터넷 연결이 필요해요.");
      };
      recog.onend = () => finish();
      startRecorder().then(() => {
        if (ended) return;
        try { recog.start(); } catch (e) { finish("음성 인식을 시작하지 못했어요. 다시 눌러 주세요."); }
      });
      timer = setTimeout(() => { try { recog.stop(); } catch (e) { finish(); } }, 9000);
      return { stop() { try { recog.stop(); } catch (e) { finish(); } } };
    }
    // 음성 인식이 없으면 4초 녹음만
    startRecorder().then(() => { if (!recorder) finish("마이크를 쓸 수 없어요. Chrome 권장!"); });
    timer = setTimeout(() => finish(), 4000);
    return { stop() { finish(); } };
  }

  $("#btn-clear").addEventListener("click", () => {
    if (!confirm("연습 기록을 모두 지울까요?")) return;
    stats = {}; saveStats();
    Object.keys(recordings).forEach(k => { URL.revokeObjectURL(recordings[k]); delete recordings[k]; });
    renderPractice();
  });
  $("#btn-play-all").addEventListener("click", () => {
    const texts = [];
    QUESTIONS.forEach(q => { const p = plans[q.id]; if (p) texts.push(q.q, answerEn(actById(p.id), p.level)); });
    if (!texts.length) { alert("아직 계획이 없어요. 활동 카드에서 골라요!"); return; }
    speakSeq(texts);
  });
  $("#btn-print").addEventListener("click", () => window.print());

  /* ----- 시작 ----- */
  buildCardTab("basic");
  buildCardTab("mid");
  renderCardTab("basic");
  updateBadge();
})();
