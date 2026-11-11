# What's your favorite subject? · 좋아하는 과목과 잘하는 것 말하기

영어 **좋아하는 과목 묻고 답하기 · 잘하는 것 말하기** 단원 학습용 웹앱입니다.
과목 10개와 잘하는 것 10가지를 듣고, 따라 말하고, 나만의 소개 대화를 만들어 짝과 연습할 수 있도록 만들었습니다.
(이전 *Can you come to the ___?* 페이지와 같은 구성)

## 주요 표현

| 역할 | 표현 |
|------|------|
| 묻기 | **What's your favorite subject?** |
| 대답 | **My favorite subject is ___.** |
| 잘하는 것 | **I'm good at ___.** |
| 반응 | Me, too! · Cool! · Great! · That's nice. · Wow, amazing! |

## 기능

- 🗣️ **말해 보기** — 초급·중급·고급 난이도 × 2가지 종류(📚 과목 / ⭐ 잘하는 것), **총 60문장**
  - 📚 과목 10개: Korean · English · math · science · social studies · music · art · P.E. · practical arts · moral education
  - ⭐ 잘하는 것 10개: soccer · swimming · singing · dancing · drawing · cooking · running · playing the piano · jumping rope · writing stories
- 📚 **좋아하는 과목** — 질문 카드 + `My favorite subject is ___.` 빈칸에 과목 10개 중 골라 채우기
- ⭐ **잘하는 것** — `I'm good at ___.` 빈칸에 10가지 중 골라 채우기 + 친구 말에 반응하기 카드 5개
- 🎒 **내 소개 만들기** (워크시트 2번) — **소개 3개**(좋아하는 과목 1 + 잘하는 것 1)와 친구의 반응 1개를 고름
  - 말풍선 대화 빈칸이 채워지는 것을 확인 · 🎲 무작위 채우기 · 브라우저에 저장
  - 📝 **워크시트에 적기** 표: 영어 문장을 보고 옮겨 적기
- 🎤 **연습 · 짝 활동** (워크시트 3번) — 👫 짝 활동 카드(질문·나의 대답·친구 대답 적는 칸) + 컴퓨터와 미리 연습
  - `질문 → 좋아하는 과목 → 잘하는 것 → 반응` 대화를 줄마다 🎙️ 말하기로 정확도 측정
  - 🎭 역할극: 내가 A(묻기) 또는 B(대답하기)를 맡으면 컴퓨터가 상대 역할을 읽어 주고 내 차례에 마이크가 켜짐 (Chrome 권장)
- 🖼️ **Canva 이미지** — 카드 그림은 `images/` 폴더의 Canva 이미지를 사용 (없으면 이모지로 표시). 파일 이름과 Canva 프롬프트는 [`images/README.md`](images/README.md) 참고
- 단어 클릭 시 **뜻 풍선 + 발음**, 말하기 **속도 조절** 슬라이더

브라우저 내장 **Web Speech API**(음성 합성·음성 인식)를 사용합니다.
내 소개 카드와 연습 기록은 브라우저(localStorage)에 저장됩니다.

## 사용 방법

`index.html`을 브라우저(크롬 권장)에서 열면 됩니다. 별도 설치가 필요 없습니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 화면 구조(탭·섹션) |
| `style.css`  | 디자인 |
| `data.js`    | 과목·잘하는 것·질문·반응 문장, 단어 뜻 데이터 |
| `app.js`     | 음성·단어 풍선·소개 만들기·연습(역할극) 채점 로직 |
| `images/`    | Canva에서 만든 카드 이미지 |
