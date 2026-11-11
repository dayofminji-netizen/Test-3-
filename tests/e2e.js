// 브라우저 테스트: node tests/e2e.js  (python3 -m http.server 8123 실행 중이어야 함)
const { chromium } = require("playwright");
const URL_ = process.env.APP_URL || "http://localhost:8123/index.html";
const OUT = process.env.SHOT_DIR || ".";
const assert = require("assert");

const FAKE_SR = `
  window.__fakeHeard = ["I'm going to fly a kite"];
  class FakeSR {
    constructor() { this.lang = ""; this.interimResults = false; this.maxAlternatives = 1; }
    start() {
      const heard = window.__fakeHeard.slice();
      const mk = (arr, fin) => { const r = arr.map(t => ({ transcript: t, confidence: .9 })); r.isFinal = fin; return r; };
      setTimeout(() => this.onresult && this.onresult({ results: [mk([heard[0].split(" ").slice(0, 2).join(" ")], false)] }), 200);
      setTimeout(() => this.onresult && this.onresult({ results: [mk(heard, true)] }), 600);
      this._t = setTimeout(() => this.onend && this.onend(), 1500);
    }
    stop() { clearTimeout(this._t); setTimeout(() => this.onend && this.onend(), 50); }
    abort() { this.stop(); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.speechSynthesis && (window.speechSynthesis.speak = () => {});
`;

(async () => {
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, permissions: ["microphone"] });
  await ctx.addInitScript(FAKE_SR);
  // 테스트 환경은 외부 인터넷이 막혀 있어 나눔스퀘어라운드 CSS는 빈 파일로 대신함
  const stubFont = r => r.fulfill({ status: 200, contentType: "text/css", body: "" });
  await ctx.route(/hangeul\.pstatic\.net/, stubFont);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));
  page.on("dialog", d => d.accept());
  await page.goto(URL_);
  await page.waitForSelector("#tab-basic .card");
  const ok = (cond, msg) => { assert.ok(cond, msg); console.log("✅ " + msg); };

  // 카드 60개 · 그림 로드
  ok(await page.locator("#tab-basic .card").count() === 60, "초급 카드 60개");
  // lazy 이미지까지 모두 스크롤해서 로드
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(800);
  const broken = await page.evaluate(() => [...document.querySelectorAll("#tab-basic .visual img")].filter(i => !i.complete || !i.naturalWidth).length);
  const tiles = await page.locator("#tab-basic .visual .emoji-tile").count();
  if (!process.env.SKIP_IMG) ok(broken === 0 && tiles === 0, "그림 모두 로드 (이모지 대체 0)"); else console.log("(그림 검사 건너뜀: 대체 " + tiles + ")");

  // 단어 풍선
  await page.locator("#tab-basic .chat .w").first().click();
  ok(await page.locator("#word-popup:not(.hidden)").count() === 1, "단어 클릭 → 뜻 풍선");
  await page.locator("h2").first().click();

  // 카드 선택 → 말풍선 · 배지 · 연습하기
  await page.locator('#tab-basic .card[data-id="fly-a-kite"] .choose').click();
  ok((await page.locator("#tab-basic .chat .filled").innerText()).includes("fly a kite"), "말풍선 빈칸 채워짐");
  ok(await page.locator("#plan-count").innerText() === "1/5", "배지 1/5");
  ok((await page.locator("#tab-basic .q-btn").first().innerText()).includes("✓"), "Q1 버튼에 ✓");
  // 다른 카드를 누르면 바뀜
  await page.locator('#tab-basic .card[data-id="play-soccer"] .choose').click();
  ok(await page.locator("#plan-count").innerText() === "1/5", "질문당 계획 1개 (바뀜)");
  // 다시 누르면 빠짐
  await page.locator('#tab-basic .card[data-id="play-soccer"] .choose').click();
  ok(await page.locator("#plan-count").innerText() === "0/5", "다시 누르면 빠짐");
  await page.locator('#tab-basic .card[data-id="fly-a-kite"] .choose').click();

  // 필터
  await page.locator('#tab-basic .chip[data-filter="book"]').click();
  ok(await page.locator("#tab-basic .card").count() === 6, "📘 교과서 필터 6개");
  await page.locator('#tab-basic .chip[data-filter="place"]').click();
  ok(await page.locator("#tab-basic .card").count() === 12, "📍 장소 필터 12개");
  await page.locator('#tab-basic .chip[data-filter="star"]').click();
  const starCount = await page.locator("#tab-basic .card").count();
  ok(starCount > 0 && starCount < 60 && await page.locator("#tab-basic .card .tag.star").count() === starCount, "⭐ 추천 필터");
  await page.locator('#tab-basic .chip[data-filter="all"]').click();

  // 다음 질문 → 중급 탭에서 선택 (공유)
  await page.locator("#tab-basic .js-next").click();
  await page.locator('.tab-btn[data-tab="mid"]').click();
  ok((await page.locator("#tab-mid .q-btn.active").innerText()).includes("오늘 밤"), "중급 탭: 현재 질문 Q2 공유");
  ok((await page.locator('#tab-mid .card[data-id="read-a-book"] .sentence').innerText()).includes("under the ginkgo tree"), "중급 문장");
  await page.locator('#tab-mid .card[data-id="read-a-book"] .choose').click();
  ok(await page.locator("#plan-count").innerText() === "2/5", "중급 선택 → 같은 계획표 2/5");
  ok((await page.locator("#tab-mid .q-btn").first().innerText()).includes("✓"), "중급 탭에 초급 계획 ✓ 표시");

  // 연습하기 탭
  await page.locator('.tab-btn[data-tab="practice"]').click();
  ok(await page.locator(".plan-row.done").count() === 2, "계획표 2줄 채워짐");
  ok((await page.locator('.plan-row[data-q="q2"] .plan-a').innerText()).includes("under the ginkgo tree"), "중급 문장 계획표 반영");
  ok((await page.locator('.plan-row[data-q="q3"]').innerText()).includes("활동 카드에서 골라요"), "빈 줄 안내");
  await page.screenshot({ path: OUT + "/shot-desktop-practice.png", fullPage: true });

  // 말하기 (가짜 마이크 + 가짜 인식)
  const row = page.locator('.plan-row[data-q="q1"]');
  await row.locator(".js-speak").click();
  await page.waitForFunction(() => document.querySelector('.plan-row[data-q="q1"] .live').textContent.includes("들리는 말"));
  ok(true, "👂 들리는 말 실시간 표시");
  await row.locator(".result:not(.hidden)").waitFor({ timeout: 8000 });
  ok((await row.locator(".result .score").innerText()).includes("100%"), "정확히 말하면 100%");
  await page.waitForFunction(() => !document.querySelector('.plan-row[data-q="q1"] .js-play').disabled, null, { timeout: 5000 });
  ok(true, "▶ 내 목소리 활성 (녹음됨)");
  const played = await page.evaluate(() => new Promise(res => {
    const orig = Audio.prototype.play;
    Audio.prototype.play = function () { res(this.src.startsWith("blob:")); Audio.prototype.play = orig; return Promise.resolve(); };
    document.querySelector('.plan-row[data-q="q1"] .js-play').click();
  }));
  ok(played, "녹음 재생 (blob)");

  await page.evaluate(() => { window.__fakeHeard = ["I'm going to fly a cat", "I'm going to fly a cap"]; });
  await row.locator(".js-speak").click();
  await page.waitForFunction(() => document.querySelector('.plan-row[data-q="q1"] .stats').textContent.includes("2회"), null, { timeout: 8000 });
  const st = await row.locator(".stats").innerText();
  ok(/이번 73% · 평균 87% · 최고 100% · 2회/.test(st), "점수·평균·최고·횟수: " + st);
  ok(await row.locator(".wchip.miss").count() === 1, "놓친 단어 칩 🟥");
  ok((await row.locator(".retry").innerText()).includes("kite"), "다시 들어 볼 단어 kite");
  ok((await row.locator(".heard").innerText()).includes("fly a cat"), "컴퓨터가 들은 말 표시");
  ok(await page.locator("#sum-count").innerText() === "2", "요약: 총 연습 2회");
  ok(await page.locator("#sum-avg").innerText() === "87%", "요약: 평균 87%");
  ok(await page.locator("#sum-done").innerText() === "1/5", "요약: 연습한 문장 1/5");
  await page.screenshot({ path: OUT + "/shot-desktop-result.png", fullPage: true });

  // 새로고침해도 기록 유지
  await page.reload();
  await page.locator('.tab-btn[data-tab="practice"]').click();
  ok((await page.locator('.plan-row[data-q="q1"] .stats').innerText()).includes("2회"), "새로고침 후 기록 유지(localStorage)");

  // 기록 지우기
  await page.locator("#btn-clear").click();
  ok(await page.locator("#sum-count").innerText() === "0", "기록 지우기");

  // ✕ 빼기
  await page.locator('.plan-row[data-q="q2"] .js-remove').click();
  ok(await page.locator(".plan-row.done").count() === 1 && await page.locator("#plan-count").innerText() === "1/5", "✕ 빼기");

  // 인쇄 버튼 + 인쇄 모양
  await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
  await page.locator("#btn-print").click();
  ok(await page.evaluate(() => window.__printed), "🖨️ 인쇄 버튼 → window.print");
  await page.emulateMedia({ media: "print" });
  ok(!(await page.locator(".js-speak").first().isVisible()) && !(await page.locator(".tabs").isVisible()) && await page.locator("#plan-list").isVisible(), "인쇄: 계획표만 (버튼·마이크 숨김)");
  await page.screenshot({ path: OUT + "/shot-print.png", fullPage: true });
  await page.emulateMedia({ media: "screen" });

  // 데스크톱 스크린샷
  await page.locator('.tab-btn[data-tab="basic"]').click();
  await page.screenshot({ path: OUT + "/shot-desktop-basic.png" });

  // 휴대폰 390px
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await phone.addInitScript(FAKE_SR);
  await phone.route(/hangeul\.pstatic\.net/, stubFont);
  const p2 = await phone.newPage();
  p2.on("pageerror", e => errors.push(String(e)));
  p2.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await p2.goto(URL_);
  await p2.waitForSelector("#tab-basic .card");
  const noScroll = async () => p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  ok(await noScroll(), "390px 초급: 가로 스크롤 없음");
  const tabH = await p2.evaluate(() => [...document.querySelectorAll(".tab-btn")].map(b => b.getBoundingClientRect().height));
  ok(tabH.every(h => h < 50), "휴대폰 탭 한 줄 (" + tabH.map(Math.round).join(",") + ")");
  ok((await p2.locator(".tab-btn").first().innerText()).includes("초급 카드"), "휴대폰 탭 짧은 이름");
  await p2.locator('#tab-basic .card[data-id="pc-room"] .choose').click();
  await p2.waitForTimeout(700);
  const visBroken = await p2.evaluate(() => [...document.querySelectorAll("#tab-basic .visual img")].filter(i => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && !i.naturalWidth; }).length);
  ok(visBroken === 0, "휴대폰: 화면에 보이는 그림 모두 로드");
  await p2.screenshot({ path: OUT + "/shot-phone-basic.png" });
  await p2.locator('.tab-btn[data-tab="mid"]').click();
  ok(await noScroll(), "390px 중급: 가로 스크롤 없음");
  await p2.screenshot({ path: OUT + "/shot-phone-mid.png", fullPage: false });
  await p2.locator('.tab-btn[data-tab="practice"]').click();
  ok(await noScroll(), "390px 연습하기: 가로 스크롤 없음");
  await p2.locator('.plan-row[data-q="q1"] .js-speak').click();
  await p2.locator('.plan-row[data-q="q1"] .result:not(.hidden)').waitFor({ timeout: 8000 });
  ok(await noScroll(), "390px 결과 표시 후에도 가로 스크롤 없음");
  await p2.screenshot({ path: OUT + "/shot-phone-practice.png", fullPage: true });

  ok(errors.length === 0, "콘솔 오류 0개" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  console.log("모든 브라우저 테스트 통과");
})().then(() => process.exit(0)).catch(e => { console.error("❌", e.message); process.exit(1); });
