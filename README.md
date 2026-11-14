<p align="center"><img src="apps/user-app/src/assets/images/symbol_logo.svg" width="72" alt="일한만큼 로고"></p>

<h1 align="center">일한만큼 — Frontend</h1>

<p align="center">이주노동자가 근무를 기록하고, 받아야 할 임금과 실제 받은 임금을 비교해<br>모국어로 진정서를 준비하고 상담기관에 도움을 요청할 수 있게 돕는 웹앱</p>

<p align="center"><b>사용자 앱</b>(모바일 웹) · <b>상담기관 관리자 웹</b> · 2026 해커톤</p>

<p align="center">
<img src="docs/screenshots/user/a_hoa_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%A7%84%EC%A0%95%EC%84%9C_%EC%83%81%EB%8B%B4%EC%A0%91%EC%88%98/01_home.png" alt="홈" width="190">
<img src="docs/screenshots/user/a_hoa_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%A7%84%EC%A0%95%EC%84%9C_%EC%83%81%EB%8B%B4%EC%A0%91%EC%88%98/10_salary_2026-10.png" alt="급여 비교" width="190">
<img src="docs/screenshots/user/a_hoa_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%A7%84%EC%A0%95%EC%84%9C_%EC%83%81%EB%8B%B4%EC%A0%91%EC%88%98/83_clock-in_%EC%99%84%EB%A3%8C.png" alt="출근 완료" width="190">
<img src="docs/screenshots/user/b_tuan_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%9D%B4%EC%83%81%ED%8C%A8%ED%84%B4_%EC%A7%84%EC%A0%95%EC%84%9C%EC%97%86%EC%9D%8C/73_petition_new_%EB%B9%84%EA%B5%90%EC%84%A0%ED%83%9D.png" alt="진정서 초안" width="190">
</p>

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| **GPS·사진 출퇴근** | 근무지 반경 100m 안에서만 인증 후 사진과 서버 시각으로 기록. 사후 입력 기록은 별도 표시 |
| **AI 서류 분석** | 근로계약서·급여명세서 사진에서 시급·근무시간·공제·지급액 추출, 모국어 요약·번역, 근로자 확인 후 확정 |
| **급여 비교** | 근무기록과 계약 조건으로 받아야 할 임금을 계산해 실제 수령액과 비교(최저임금·숙식비 공제·휴게시간 검토) |
| **진정서 작성** | 불일치 결과로 한국어 진정서 초안 + 모국어 번역을 나란히 PDF로. 금액·날짜는 계산값 그대로 |
| **상담 연결** | 공유 범위를 직접 선택해 상담기관에 신청, 모국어↔한국어 자동 번역 메시지 |
| **관리자 웹** | 상담기관 담당자가 사건 접수·긴급도 분류·담당자 배정·추가 자료 요청·전문기관 연계·종결 처리 |

## 화면

### 사용자 앱 (모바일)

**근무 기록 → 계약서 분석 → 급여 비교**
<p align="center">
<img src="docs/screenshots/user/a_hoa_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%A7%84%EC%A0%95%EC%84%9C_%EC%83%81%EB%8B%B4%EC%A0%91%EC%88%98/85_home_clock-out_%EC%A0%84.png" alt="근무 중 홈" width="190">
<img src="docs/screenshots/user/a_hoa_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%A7%84%EC%A0%95%EC%84%9C_%EC%83%81%EB%8B%B4%EC%A0%91%EC%88%98/07_contract_detail.png" alt="계약서 AI 분석" width="190">
<img src="docs/screenshots/user/a_hoa_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%A7%84%EC%A0%95%EC%84%9C_%EC%83%81%EB%8B%B4%EC%A0%91%EC%88%98/13_salary_comparison.png" alt="급여 비교 상세" width="190">
<img src="docs/screenshots/user/b_tuan_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%9D%B4%EC%83%81%ED%8C%A8%ED%84%B4_%EC%A7%84%EC%A0%95%EC%84%9C%EC%97%86%EC%9D%8C/20_reports.png" alt="리포트" width="190">
</p>

**체불이 있을 때 → 진정서 → 상담**
<p align="center">
<img src="docs/screenshots/user/a_hoa_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%A7%84%EC%A0%95%EC%84%9C_%EC%83%81%EB%8B%B4%EC%A0%91%EC%88%98/32_petition_detail.png" alt="진정서 상세" width="190">
<img src="docs/screenshots/user/a_hoa_%EB%B6%88%EC%9D%BC%EC%B9%98_%EC%A7%84%EC%A0%95%EC%84%9C_%EC%83%81%EB%8B%B4%EC%A0%91%EC%88%98/42_consultation_detail.png" alt="상담 상세" width="190">
<img src="docs/screenshots/user/f_bat_%EC%B6%94%EA%B0%80%EC%9E%90%EB%A3%8C%EC%9A%94%EC%B2%AD/42_consultation_detail.png" alt="추가 자료 요청" width="190">
<img src="docs/screenshots/user/h_anh_%EC%83%81%EB%8B%B4%EC%A2%85%EA%B2%B0/42_consultation_detail.png" alt="상담 종결" width="190">
</p>

**체불이 없을 때 · 처음 가입했을 때**
<p align="center">
<img src="docs/screenshots/user/c_nam_%EC%B2%B4%EB%B6%88%EC%97%86%EC%9D%8C/10_salary_2026-10.png" alt="차액 0원" width="190">
<img src="docs/screenshots/user/c_nam_%EC%B2%B4%EB%B6%88%EC%97%86%EC%9D%8C/31_petition_new.png" alt="불일치 없음" width="190">
<img src="docs/screenshots/user/d_mai_%EC%8B%A0%EA%B7%9C%EA%B0%80%EC%9E%85_%EB%B9%88%EC%83%81%ED%83%9C/01_home.png" alt="신규 가입 홈" width="190">
<img src="docs/screenshots/user/0_%EA%B3%B5%EA%B0%9C%ED%99%94%EB%A9%B4/01_onboarding_1.png" alt="온보딩" width="190">
</p>

### 관리자 웹

<p align="center">
<img src="docs/screenshots/admin/02_%EB%8C%80%EC%8B%9C%EB%B3%B4%EB%93%9C.png" alt="대시보드" width="420">
<img src="docs/screenshots/admin/03_%EC%82%AC%EA%B1%B4%EB%AA%A9%EB%A1%9D.png" alt="사건 목록" width="420">
</p>
<p align="center">
<img src="docs/screenshots/admin/13_case_INFO_REQUESTED_BatErdene_1_%EC%82%AC%EA%B1%B4%EA%B0%9C%EC%9A%94.png" alt="사건 개요" width="420">
<img src="docs/screenshots/admin/13_case_INFO_REQUESTED_BatErdene_3_%EC%83%81%EB%8B%B4%EC%97%85%EB%AC%B4%EC%B2%98%EB%A6%AC.png" alt="상담 업무 처리" width="420">
</p>

> 운영 서버(현재 종료)에서 실제 API로 찍은 화면입니다. 전체 264장(사용자 앱 9개 상황 · 관리자 웹 69장)은 [`docs/screenshots/`](docs/screenshots/README.md)에 있습니다. 모든 데이터는 시연용 가상 데이터입니다.

## 프로젝트 구조

```
front/
├─ apps/
│  ├─ user-app/     # 사용자(이주노동자) 모바일 웹 — React 19 · React Router · Vite
│  │  └─ src/{api,pages,components,context,hooks,styles,utils}
│  └─ admin-web/    # 상담기관 관리자 웹 — /admin/ 경로에서 서비스
├─ docs/screenshots # 배포 서버 기준 화면 캡처
└─ package.json     # npm workspaces
```

- `apps/user-app/src/api/` — 엔드포인트 정의(`endpoints.js`)와 도메인별 호출 함수. 모든 요청은 `client.js`의 `apiRequest`를 거치며 `Authorization: Bearer` 토큰을 붙인다.
- 서버 응답은 `{ success, data, message, errorCode }` 형태로 오고, 화면은 `data`만 꺼내 쓴다.

## 실행

```bash
npm install
```

```bash
npm run dev:user     # http://localhost:5173
```

```bash
npm run dev:admin    # http://localhost:5174/admin/
```

환경변수(`apps/<앱>/.env.local`):

```bash
VITE_API_BASE_URL=http://localhost:8080   # 로컬 백엔드(easython-2026/back). 운영 서버는 종료됨
```

빌드: `npm run build:user`, `npm run build:admin`

## 배포 (해커톤 기간 운영 구성 · 현재 종료)

> 해커톤이 끝나 서버를 내렸기 때문에 아래 주소는 더 이상 접속되지 않습니다. 실제 동작 화면은 [`docs/screenshots/`](docs/screenshots/README.md)의 캡처(운영 당시 실제 API·AI 응답)로 확인할 수 있습니다.

| 경로 | 대상 |
| --- | --- |
| `https://일한만큼.kro.kr/` | 사용자 앱 (Vercel) |
| `https://일한만큼.kro.kr/admin/` | 관리자 웹 (Vercel, Vite `base: '/admin/'` + `BrowserRouter basename="/admin"`) |
| `https://일한만큼.kro.kr/api/v1/` | 백엔드 API ([easython-2026/back](https://github.com/easython-2026/back)) |

한 도메인 아래에서 백엔드의 nginx가 경로별로 나눠 보내 프론트와 API가 같은 출처(CORS 불필요)였습니다. 각 앱은 SPA 새로고침을 위해 `vercel.json`에서 모든 경로를 `index.html`로 보냅니다.

## 기술 스택

React 19 · React Router 8 · Vite 8 · npm workspaces · Vercel

## 팀

| 역할 | 이름 |
| --- | --- |
| Frontend | 장서인 · 김보경 |
| Backend | 이서린 · 최희수 |
