# 🍁 What are you going to do? · 나의 계획 말하기

천재(함) 6학년 **9단원 What are you going to do?** 수업용 웹 앱입니다. (계절 테마: 가을)
언제(오늘 오후·오늘 밤·내일·이번 주말·겨울방학) 무엇을 할지 **묻고 대답하는 말하기**를 카드로 고르고, 마이크로 연습합니다.

| 역할 | 표현 |
|------|------|
| 묻기 | **What are you going to do ___?** |
| 대답 | **I'm going to ___.** |

## 사용 방법

- `index.html`을 **Chrome**에서 열면 바로 동작합니다(설치 필요 없음). GitHub Pages로 올려도 됩니다.
- 🎙️ 말하기(음성 인식·녹음)는 **마이크 권한**이 필요하고, 음성 인식은 **인터넷 연결**이 필요합니다(Chrome 음성 인식은 Google 서버 사용).
  - 마이크는 `https://`(GitHub Pages) 또는 `http://localhost` 주소에서 가장 확실하게 동작합니다. `file://`로 열면 브라우저에 따라 마이크가 막힐 수 있어요.

## 기능

### 탭 3개
1. **🎨 활동 카드 (초급)** — `I'm going to fly a kite.`
2. **🎨 활동 카드 (중급)** — 누구와·어디서·무엇을 하러를 붙인 긴 문장 `I'm going to fly a kite on the hill.`
3. **🎤 연습하기** — 탭에 담은 개수 배지(예: `2/5`). 휴대폰에서는 탭 이름이 “초급 카드 / 중급 카드”로 짧아져 한 줄에 들어갑니다.

### 활동 카드 탭 (초급·중급 공통)
- **1️⃣ 질문을 골라요**: Q1~Q5 버튼(번호·이모지·한국어·영어). 계획을 고른 질문은 ✓ + 활동 이모지.
- **말풍선 대화**: 🙋 친구 “What are you going to do this afternoon?” / 🙆 나 “I'm going to ____.”
  한국어 뜻, 줄마다 🔊, [🔊 대화 듣기] [다음 질문 ▶] [🎤 연습하기로 가기], 상태 안내 문구.
- **2️⃣ 할 일 고르기**: 필터 [전체] [📘 교과서 표현] [종류 5개] [⭐ (지금 질문)에 어울리는 것만]
- **카드**: 종류 태그(+📘 교과서, +⭐ 추천), Canva 그림, 문장(단어를 누르면 **뜻 풍선 + 발음**), 한국어, 🔊,
  맨 아래 **“✅ 오늘 오후에 할래요”** → 지금 질문의 대답이 되어 말풍선 빈칸이 채워지고, 질문+대답을 읽어 주고, 연습하기에 바로 담김.
  다시 누르면 빠짐. 질문 하나당 계획 1개(다른 카드를 누르면 바뀜).
- 초급·중급 어느 탭에서 골라도 **같은 계획표**에 저장됩니다(질문별 `{활동id, level}`, localStorage).

### 연습하기 탭 (나의 계획표)
- 맨 위 요약: 🎙️ 총 연습 n회 · 📊 평균 정확도 % · ✅ 연습한 문장 n/5, [🧹 기록 지우기] [🔊 전체 듣기] [🖨️ 인쇄하기]
- **📅 나의 계획표 · My Plans**: 질문 5줄(언제·Q·A·한국어·그림·🔊·✕ 빼기). 비어 있으면 “A. I'm going to ____.” + “활동 카드에서 골라요”.
- 계획이 있는 줄마다 **[🎙️ 말하기] [▶ 내 목소리]** “이번 % · 평균 % · 최고 % · n회”
  - Web Speech API 음성 인식(en-US, interimResults, maxAlternatives 5, 9초 제한) + MediaRecorder 녹음을 동시에 실행
  - 말하는 동안 “👂 들리는 말” 실시간 표시, 끝나면 ▶ 내 목소리로 녹음 재생
  - 기록(횟수·최고·점수 합계→평균)은 localStorage에 저장. 녹음은 새로고침하면 사라집니다.
  - 음성 인식이 없는 브라우저는 4초 녹음만, 둘 다 없으면 버튼 비활성 + “Chrome 권장”
- 🖨️ 인쇄하면 **계획표만** 나옵니다(버튼·마이크 도구 숨김).

## 발음 채점 방식 (`app.js` 위쪽)

1. **정리**: 줄임말 펼치기(I'm→i am, I'll→i will, gonna→going to …), 동음어 통일(too/two→to, four→for, an→a …),
   한 글자씩 들린 말 붙이기(“p c room” → pc room).
2. **정렬**: 목표 문장과 들린 말을 단어 **순서대로** 동적 계획법(가중치 최대 정렬)으로 맞춥니다.
3. **단어 점수**: 같음 1 · 철자 1글자 차이 0.85 · 소리 비슷 0.7(자음만 통일: r/l, f/p, v/b, th/s, c/k, z/s … 모음은 그대로라 kite≠cat) · 비슷한 편 0.5 · 그 외 0
4. **가중치**: 핵심 단어 1(going 포함) · 작은 단어(i, am, a, the, to, my, at, on, in, with …) 0.3 · 지명(대문자 고유명사) 0.6
5. **감점**: 덧붙인 말(정렬되지 않은 단어)은 개당 3%, 최대 10%. 보너스 없음.
6. 음성 인식 후보 최대 5개 중 **최고 점수** 사용.
7. 결과: ⭐ 85% 이상 / 👍 60% 이상 / 🔁 그 아래, 단어 칩(🟩 맞음 · 🟨 비슷함 · 🟥 놓침, I'm은 한 칩),
   “🔁 다시 들어 볼 단어: 🔊 kite”, “컴퓨터가 들은 말: …”

| “I'm going to fly a kite.”에 대해 들린 말 | 점수 |
|---|---|
| I'm going to fly a kite | 100 |
| I'm going to fly a **cat** | 73 |
| fly a kite (앞부분 빠짐) | 55 |
| kite a fly to going am I (순서 뒤섞임) | 14 |

## 활동 목록 (5종류 × 12개 = 60개, 📘 = 교과서 표현)

#### 🏠 집·학교에서

| 그림 파일 | 초급 | 중급 | 추천 질문 |
|---|---|---|---|
| `stay-home.png` | 📘 stay home (집에 있을) | stay home and read comic books | Q1 Q2 Q4 |
| `clean-my-room.png` | 📘 clean my room (내 방을 청소할) | clean my room with my brother | Q1 Q3 Q4 |
| `study-math.png` | 📘 study math (수학 공부를 할) | study math for the test | Q1 Q2 Q3 |
| `do-my-homework.png` | do my homework (숙제를 할) | do my homework after school | Q1 Q2 |
| `read-a-book.png` | read a book (책을 읽을) | read a book under the ginkgo tree | Q2 Q4 |
| `play-computer-games.png` | play computer games (컴퓨터 게임을 할) | play computer games with my cousin | Q1 Q2 Q4 |
| `watch-a-movie.png` | watch a movie (영화를 볼) | watch a funny movie on TV | Q2 Q4 |
| `bake-cookies.png` | bake cookies (쿠키를 구울) | bake pumpkin cookies in the kitchen | Q1 Q4 |
| `practice-the-piano.png` | practice the piano (피아노 연습을 할) | practice the piano for the school concert | Q1 Q2 Q3 |
| `draw-pictures.png` | draw pictures (그림을 그릴) | draw pictures of autumn leaves | Q1 Q3 |
| `go-to-bed-early.png` | go to bed early (일찍 잘) | go to bed early for the field trip | Q2 |
| `make-leaf-bookmarks.png` | make leaf bookmarks (나뭇잎 책갈피를 만들) | make leaf bookmarks for my friends | Q1 Q3 |

#### ⚽ 운동·놀이

| 그림 파일 | 초급 | 중급 | 추천 질문 |
|---|---|---|---|
| `watch-a-baseball-game.png` | 📘 watch a baseball game (야구 경기를 볼) | watch a baseball game at the stadium | Q2 Q3 Q4 |
| `play-soccer.png` | play soccer (축구를 할) | play soccer with my friends at the park | Q1 Q3 Q4 |
| `fly-a-kite.png` | fly a kite (연을 날릴) | fly a kite on the hill | Q1 Q3 Q4 |
| `ride-my-bike.png` | ride my bike (자전거를 탈) | ride my bike along the river | Q1 Q3 Q4 |
| `play-badminton.png` | play badminton (배드민턴을 칠) | play badminton with my dad | Q1 Q3 Q4 |
| `go-swimming.png` | go swimming (수영하러 갈) | go swimming at the indoor pool | Q3 Q4 |
| `play-basketball.png` | play basketball (농구를 할) | play basketball in the school gym | Q1 Q3 |
| `go-inline-skating.png` | go inline skating (인라인스케이트를 탈) | go inline skating at the park | Q1 Q4 |
| `jump-rope.png` | jump rope (줄넘기를 할) | jump rope with my classmates | Q1 Q3 |
| `play-dodgeball.png` | play dodgeball (피구를 할) | play dodgeball in the playground | Q1 Q3 |
| `go-hiking.png` | go hiking (등산하러 갈) | go hiking on Mount Bukhan | Q3 Q4 |
| `play-table-tennis.png` | play table tennis (탁구를 칠) | play table tennis at the community center | Q1 Q2 Q3 |

#### 📍 장소에 가기

| 그림 파일 | 초급 | 중급 | 추천 질문 |
|---|---|---|---|
| `pc-room.png` | go to a PC room (PC방에 갈) | go to a PC room with my friends | Q1 Q3 Q4 |
| `comic-book-cafe.png` | go to a comic book cafe (만화 카페에 갈) | go to a comic book cafe to read comics | Q1 Q4 |
| `coin-karaoke.png` | go to a coin karaoke (코인노래방에 갈) | go to a coin karaoke with my best friend | Q1 Q2 Q4 |
| `library.png` | go to the library (도서관에 갈) | go to the library to borrow books | Q1 Q3 Q4 |
| `bookstore.png` | go to a bookstore (서점에 갈) | go to a bookstore to buy a comic book | Q1 Q4 |
| `shopping-mall.png` | go to the shopping mall (쇼핑몰에 갈) | go to the shopping mall to buy a new jacket | Q3 Q4 |
| `bakery.png` | go to a bakery (빵집에 갈) | go to a bakery to buy sweet potato bread | Q1 Q3 |
| `escape-room.png` | go to an escape room (방탈출 카페에 갈) | go to an escape room with my cousins | Q1 Q4 |
| `trampoline-park.png` | go to a trampoline park (트램펄린 파크에 갈) | go to a trampoline park to jump high | Q1 Q4 |
| `cat-cafe.png` | go to a cat cafe (고양이 카페에 갈) | go to a cat cafe to play with cats | Q1 Q4 |
| `hair-salon.png` | go to the hair salon (미용실에 갈) | go to the hair salon to get a haircut | Q1 Q3 |
| `dentist.png` | go to the dentist (치과에 갈) | go to the dentist with my mom | Q1 Q3 |

#### 👨‍👩‍👧 가족과 함께

| 그림 파일 | 초급 | 중급 | 추천 질문 |
|---|---|---|---|
| `visit-my-grandparents.png` | 📘 visit my grandparents (조부모님 댁에 갈) | visit my grandparents in the countryside | Q3 Q4 Q5 |
| `pick-apples.png` | pick apples (사과를 딸) | pick apples at the farm with my family | Q3 Q4 |
| `see-autumn-leaves.png` | see autumn leaves (단풍 구경을 할) | see autumn leaves on Mount Naejang | Q3 Q4 |
| `gather-chestnuts.png` | gather chestnuts (밤을 주울) | gather chestnuts in the forest with my grandpa | Q3 Q4 |
| `dig-sweet-potatoes.png` | dig sweet potatoes (고구마를 캘) | dig sweet potatoes on the farm with my grandma | Q3 Q4 |
| `lantern-festival.png` | go to a festival (축제에 갈) | go to a lantern festival in Jinju | Q2 Q4 |
| `have-a-picnic.png` | have a picnic (소풍을 갈) | have a picnic at the park with my family | Q3 Q4 |
| `cook-dinner.png` | cook dinner (저녁을 요리할) | cook dinner with my dad for my mom | Q2 Q4 |
| `go-to-the-zoo.png` | go to the zoo (동물원에 갈) | go to the zoo to see the pandas | Q3 Q4 |
| `walk-my-dog.png` | walk my dog (강아지를 산책시킬) | walk my dog in the park with my sister | Q1 Q2 |
| `go-to-the-market.png` | go to the market (시장에 갈) | go to the market to buy persimmons | Q1 Q3 Q4 |
| `make-kimchi.png` | make kimchi (김치를 담글) | make kimchi with my family | Q4 Q5 |

#### ✈️ 가족 여행

| 그림 파일 | 초급 | 중급 | 추천 질문 |
|---|---|---|---|
| `go-camping.png` | 📘 go camping (캠핑하러 갈) | go camping by the lake with my family | Q4 Q5 |
| `jeju-island.png` | go to Jeju Island (제주도에 갈) | go to Jeju Island by plane | Q4 Q5 |
| `gyeongju.png` | go to Gyeongju (경주에 갈) | go to Gyeongju to see old temples | Q4 Q5 |
| `busan.png` | go to Busan (부산에 갈) | go to Busan to see the sea | Q4 Q5 |
| `mount-seorak.png` | go to Mount Seorak (설악산에 갈) | go to Mount Seorak by car | Q4 Q5 |
| `jeonju.png` | go to Jeonju (전주에 갈) | go to Jeonju to eat bibimbap | Q4 Q5 |
| `amusement-park.png` | go to an amusement park (놀이공원에 갈) | go to an amusement park to ride a roller coaster | Q4 Q5 |
| `hot-spring.png` | go to a hot spring (온천에 갈) | go to a hot spring with my grandparents | Q4 Q5 |
| `japan.png` | go to Japan (일본에 갈) | go to Japan to eat sushi | Q5 |
| `vietnam.png` | go to Vietnam (베트남에 갈) | go to Vietnam to eat rice noodles | Q5 |
| `aquarium.png` | go to the aquarium (아쿠아리움에 갈) | go to the aquarium in Yeosu | Q4 Q5 |
| `train-trip.png` | take a train trip (기차 여행을 할) | take a train trip to Gangneung | Q4 Q5 |

- 질문별 추천: Q1 오늘 오후 · Q2 오늘 밤 · Q3 내일 · Q4 이번 주말 · Q5 겨울방학
- 가을 테마라 눈사람·스키 같은 다른 계절 활동은 넣지 않고 사과 따기·단풍 구경·밤 줍기·고구마 캐기·김장 등을 넣었습니다.

## 그림 바꾸는 법

- 그림은 `images/<활동id>.png` 입니다(위 표의 파일 이름). 같은 이름으로 파일을 바꿔 넣으면 끝이에요.
- 그림이 없거나 불러오지 못하면 카드에 **이모지 타일**이 자동으로 나옵니다.
- 모든 그림은 Canva **generate-image**(LANDSCAPE_4_3)로 같은 틀의 프롬프트를 써서 만들었습니다.
  `data.js`의 각 활동 `scene`이 장면 설명입니다.
  ```
  Cute flat vector illustration for an elementary school English flashcard: <scene>.
  Warm autumn colors, simple clean shapes, white background, no text, no letters.
  ```
- 현재 그림은 Canva 미리보기 크기(약 200×150)로 저장되어 있어 카드에서는 `object-fit: contain`, 흰 배경으로 보여 줍니다.
  더 선명한 그림이 필요하면 Canva에서 열어 내려받은 뒤 같은 이름으로 덮어쓰세요.
- 온천(`hot-spring`)은 처음 프롬프트가 Canva 안전 필터에 걸려 “옷을 입고 족욕하는 장면”으로 바꿔 만들었습니다.

## 활동·문장 바꾸는 법 (`data.js`)

```js
A("fly-a-kite", "sport", "fly a kite", "연을 날릴", "🪁", ["q1", "q3", "q4"],
  "fly a kite on the hill", "언덕에서 연을 날릴", "<그림 장면>")
//  id         종류      초급 동사구    "나는 ___ 거야"  이모지  추천 질문
//  중급 동사구             중급 한국어
```
- 새 단어를 쓰면 `WORDS`(단어 뜻 사전)에도 넣어 주세요. 아래 테스트가 누락 단어를 알려 줍니다.

## 테스트

```bash
node tests/scoring.test.js          # 채점 함수 단위 테스트
node tests/check-data.js            # 활동 60개·사전 누락 0·그림 누락 0 확인
python3 -m http.server 8123 &       # 다른 창에서 서버 실행 후
node tests/e2e.js                   # Playwright: 탭·카드·필터·가짜 마이크/음성 인식·인쇄·390px
```

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 화면 구조(헤더·탭 3개·연습하기 틀) |
| `style.css` | 가을 테마 디자인, 떨어지는 단풍잎, 휴대폰 대응, 인쇄 스타일 |
| `data.js` | 질문 5개, 종류 5개, 활동 60개, 단어 뜻 사전 |
| `app.js` | 발음 채점 + 화면 로직(카드·말풍선·계획표·음성 인식·녹음) |
| `images/` | Canva로 만든 활동 그림 60장 (`<활동id>.png`) |
| `tests/` | 채점·데이터·브라우저 테스트 |
