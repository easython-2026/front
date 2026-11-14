# 일한만큼 화면 캡처 (2026-11 해커톤, 배포 서버 기준)

- 캡처 대상: 배포된 사이트 `https://일한만큼.kro.kr` (사용자 앱 `/`, 관리자 웹 `/admin/`) — 운영 API·실제 AI 응답
- 사용자 앱: 휴대폰 크기 390×844, 2배 해상도, 페이지 전체(스크롤 포함). 관리자 웹: 1440×900, 1.5배
- 모든 데이터는 시연용 가상 데이터(이름·사업장·계약 내용 모두 가상)
- 총 264장

## 폴더(계정·상황)별

| 폴더 | 계정 | 상황 |
| --- | --- | --- |
| `user/0_공개화면/` (6장) | - | 로그인 전 화면: 온보딩 3장, 로그인, 회원가입, 비밀번호 재설정 |
| `user/a_hoa_불일치_진정서_상담접수/` (48장) | hoa.demo | 표준근로계약서(시급 9,860·휴게 30분·숙식비 40만) → 10월 체불 2,226,745원, 진정서 확정, 상담 접수 |
| `user/b_tuan_불일치_이상패턴_진정서없음/` (37장) | tuan.demo | 10월 체불 886,750원·11월 677,625원, 이상 근무 패턴(무휴게·사후 수정), 진정서 작성 전 |
| `user/c_nam_체불없음/` (35장) | ok.demo | 최저임금 이상 계약, 10월 예상=실제 1,816,320원(차액 0, 비교 완료) |
| `user/d_mai_신규가입_빈상태/` (30장) | new.demo | 가입 직후, 데이터 없음(빈 화면·안내 문구) |
| `user/e_siti_상담검토중/` (8장) | siti.demo | 상담 검토 중(담당자 배정·안내 메시지) |
| `user/f_bat_추가자료요청/` (8장) | bat.demo | 상담기관이 추가 자료 요청 |
| `user/g_raj_노무사연계/` (8장) | raj.demo | 최저임금 미달, 노무사 연계 |
| `user/h_anh_상담종결/` (8장) | anh.demo | 상담 종결·처리 결과 공유 |
| `user/i_minh_진정서없이상담/` (7장) | minh.demo | 진정서 없이 상담 신청(접수) |
| `admin/` (69장) | staff@agency.org | 관리자 웹: 메뉴 5개 + 사건 7건 × (사건 개요·근무/증빙 자료·상담 업무 처리 + 업무 하위 6개) |

## 파일 이름 규칙(사용자 앱)

`01_home` 홈 · `02~04` 출퇴근 · `05~08` 근로계약서 · `10~14` 급여 비교 · `20~22` 리포트/증거 · `30~32` 진정서 · `40~42` 상담 · `50` 알림 · `60~66` 내 정보/설정 · `70~71` 출퇴근 GPS 인증 · `72` 급여 화면 버튼별 시트 · `73` 진정서 비교 선택 · `74` 상담 신청 진입 · `80~91` 출근→근무 중→퇴근 전체 흐름(hoa) · `00_home_월급날팝업` 월급날 팝업

## 전체 목록

| 파일 | 설명 |
| --- | --- |
| `admin/01_login.png` | 관리자 로그인 |
| `admin/02_대시보드.png` | 메뉴: 대시보드 |
| `admin/03_사건목록.png` | 메뉴: 사건 목록 |
| `admin/04_종결상담내역.png` | 메뉴: 종결 상담 내역 |
| `admin/05_상담메시지함.png` | 메뉴: 상담 메시지함 |
| `admin/06_기관담당자.png` | 메뉴: 기관 담당자 |
| `admin/10_case_RECEIVED_TranThiHoa_1_사건개요.png` | Tran Thi Hoa · RECEIVED · 차액 2226745 |
| `admin/10_case_RECEIVED_TranThiHoa_2_근무증빙자료.png` | Tran Thi Hoa · 근무·증빙 자료 |
| `admin/10_case_RECEIVED_TranThiHoa_3_상담업무처리.png` | Tran Thi Hoa · 상담 업무 처리 |
| `admin/10_case_RECEIVED_TranThiHoa_40_업무_사건처리관리.png` | Tran Thi Hoa · 업무 처리 > 사건 처리 관리 |
| `admin/10_case_RECEIVED_TranThiHoa_41_업무_추가자료요청.png` | Tran Thi Hoa · 업무 처리 > 추가 자료 요청 |
| `admin/10_case_RECEIVED_TranThiHoa_42_업무_전문가연계.png` | Tran Thi Hoa · 업무 처리 > 전문가 연계 |
| `admin/10_case_RECEIVED_TranThiHoa_43_업무_상담메시지.png` | Tran Thi Hoa · 업무 처리 > 상담 메시지 |
| `admin/10_case_RECEIVED_TranThiHoa_44_업무_상담결과및종결.png` | Tran Thi Hoa · 업무 처리 > 상담 결과 및 종결 |
| `admin/10_case_RECEIVED_TranThiHoa_45_업무_상담처리기록.png` | Tran Thi Hoa · 업무 처리 > 상담 처리 기록 |
| `admin/11_case_CLOSED_PhamDucAnh_1_사건개요.png` | Pham Duc Anh · CLOSED · 차액 286840 |
| `admin/11_case_CLOSED_PhamDucAnh_2_근무증빙자료.png` | Pham Duc Anh · 근무·증빙 자료 |
| `admin/11_case_CLOSED_PhamDucAnh_3_상담업무처리.png` | Pham Duc Anh · 상담 업무 처리 |
| `admin/11_case_CLOSED_PhamDucAnh_40_업무_사건처리관리.png` | Pham Duc Anh · 업무 처리 > 사건 처리 관리 |
| `admin/11_case_CLOSED_PhamDucAnh_41_업무_추가자료요청.png` | Pham Duc Anh · 업무 처리 > 추가 자료 요청 |
| `admin/11_case_CLOSED_PhamDucAnh_42_업무_전문가연계.png` | Pham Duc Anh · 업무 처리 > 전문가 연계 |
| `admin/11_case_CLOSED_PhamDucAnh_43_업무_상담메시지.png` | Pham Duc Anh · 업무 처리 > 상담 메시지 |
| `admin/11_case_CLOSED_PhamDucAnh_44_업무_상담결과및종결.png` | Pham Duc Anh · 업무 처리 > 상담 결과 및 종결 |
| `admin/11_case_CLOSED_PhamDucAnh_45_업무_상담처리기록.png` | Pham Duc Anh · 업무 처리 > 상담 처리 기록 |
| `admin/12_case_REFERRED_RajKumar_1_사건개요.png` | Raj Kumar · REFERRED · 차액 2228500 |
| `admin/12_case_REFERRED_RajKumar_2_근무증빙자료.png` | Raj Kumar · 근무·증빙 자료 |
| `admin/12_case_REFERRED_RajKumar_3_상담업무처리.png` | Raj Kumar · 상담 업무 처리 |
| `admin/12_case_REFERRED_RajKumar_40_업무_사건처리관리.png` | Raj Kumar · 업무 처리 > 사건 처리 관리 |
| `admin/12_case_REFERRED_RajKumar_41_업무_추가자료요청.png` | Raj Kumar · 업무 처리 > 추가 자료 요청 |
| `admin/12_case_REFERRED_RajKumar_42_업무_전문가연계.png` | Raj Kumar · 업무 처리 > 전문가 연계 |
| `admin/12_case_REFERRED_RajKumar_43_업무_상담메시지.png` | Raj Kumar · 업무 처리 > 상담 메시지 |
| `admin/12_case_REFERRED_RajKumar_44_업무_상담결과및종결.png` | Raj Kumar · 업무 처리 > 상담 결과 및 종결 |
| `admin/12_case_REFERRED_RajKumar_45_업무_상담처리기록.png` | Raj Kumar · 업무 처리 > 상담 처리 기록 |
| `admin/13_case_INFO_REQUESTED_BatErdene_1_사건개요.png` | Bat-Erdene · INFO_REQUESTED · 차액 799000 |
| `admin/13_case_INFO_REQUESTED_BatErdene_2_근무증빙자료.png` | Bat-Erdene · 근무·증빙 자료 |
| `admin/13_case_INFO_REQUESTED_BatErdene_3_상담업무처리.png` | Bat-Erdene · 상담 업무 처리 |
| `admin/13_case_INFO_REQUESTED_BatErdene_40_업무_사건처리관리.png` | Bat-Erdene · 업무 처리 > 사건 처리 관리 |
| `admin/13_case_INFO_REQUESTED_BatErdene_41_업무_추가자료요청.png` | Bat-Erdene · 업무 처리 > 추가 자료 요청 |
| `admin/13_case_INFO_REQUESTED_BatErdene_42_업무_전문가연계.png` | Bat-Erdene · 업무 처리 > 전문가 연계 |
| `admin/13_case_INFO_REQUESTED_BatErdene_43_업무_상담메시지.png` | Bat-Erdene · 업무 처리 > 상담 메시지 |
| `admin/13_case_INFO_REQUESTED_BatErdene_44_업무_상담결과및종결.png` | Bat-Erdene · 업무 처리 > 상담 결과 및 종결 |
| `admin/13_case_INFO_REQUESTED_BatErdene_45_업무_상담처리기록.png` | Bat-Erdene · 업무 처리 > 상담 처리 기록 |
| `admin/14_case_REVIEWING_SitiRahma_1_사건개요.png` | Siti Rahma · REVIEWING · 차액 1034375 |
| `admin/14_case_REVIEWING_SitiRahma_2_근무증빙자료.png` | Siti Rahma · 근무·증빙 자료 |
| `admin/14_case_REVIEWING_SitiRahma_3_상담업무처리.png` | Siti Rahma · 상담 업무 처리 |
| `admin/14_case_REVIEWING_SitiRahma_40_업무_사건처리관리.png` | Siti Rahma · 업무 처리 > 사건 처리 관리 |
| `admin/14_case_REVIEWING_SitiRahma_41_업무_추가자료요청.png` | Siti Rahma · 업무 처리 > 추가 자료 요청 |
| `admin/14_case_REVIEWING_SitiRahma_42_업무_전문가연계.png` | Siti Rahma · 업무 처리 > 전문가 연계 |
| `admin/14_case_REVIEWING_SitiRahma_43_업무_상담메시지.png` | Siti Rahma · 업무 처리 > 상담 메시지 |
| `admin/14_case_REVIEWING_SitiRahma_44_업무_상담결과및종결.png` | Siti Rahma · 업무 처리 > 상담 결과 및 종결 |
| `admin/14_case_REVIEWING_SitiRahma_45_업무_상담처리기록.png` | Siti Rahma · 업무 처리 > 상담 처리 기록 |
| `admin/15_case_RECEIVED_TranVanMinh_1_사건개요.png` | Tran Van Minh · RECEIVED · 차액 928460 |
| `admin/15_case_RECEIVED_TranVanMinh_2_근무증빙자료.png` | Tran Van Minh · 근무·증빙 자료 |
| `admin/15_case_RECEIVED_TranVanMinh_3_상담업무처리.png` | Tran Van Minh · 상담 업무 처리 |
| `admin/15_case_RECEIVED_TranVanMinh_40_업무_사건처리관리.png` | Tran Van Minh · 업무 처리 > 사건 처리 관리 |
| `admin/15_case_RECEIVED_TranVanMinh_41_업무_추가자료요청.png` | Tran Van Minh · 업무 처리 > 추가 자료 요청 |
| `admin/15_case_RECEIVED_TranVanMinh_42_업무_전문가연계.png` | Tran Van Minh · 업무 처리 > 전문가 연계 |
| `admin/15_case_RECEIVED_TranVanMinh_43_업무_상담메시지.png` | Tran Van Minh · 업무 처리 > 상담 메시지 |
| `admin/15_case_RECEIVED_TranVanMinh_44_업무_상담결과및종결.png` | Tran Van Minh · 업무 처리 > 상담 결과 및 종결 |
| `admin/15_case_RECEIVED_TranVanMinh_45_업무_상담처리기록.png` | Tran Van Minh · 업무 처리 > 상담 처리 기록 |
| `admin/16_case_RECEIVED_NguyenThiLan_1_사건개요.png` | Nguyen Thi Lan · RECEIVED · 차액 1168580 |
| `admin/16_case_RECEIVED_NguyenThiLan_2_근무증빙자료.png` | Nguyen Thi Lan · 근무·증빙 자료 |
| `admin/16_case_RECEIVED_NguyenThiLan_3_상담업무처리.png` | Nguyen Thi Lan · 상담 업무 처리 |
| `admin/16_case_RECEIVED_NguyenThiLan_40_업무_사건처리관리.png` | Nguyen Thi Lan · 업무 처리 > 사건 처리 관리 |
| `admin/16_case_RECEIVED_NguyenThiLan_41_업무_추가자료요청.png` | Nguyen Thi Lan · 업무 처리 > 추가 자료 요청 |
| `admin/16_case_RECEIVED_NguyenThiLan_42_업무_전문가연계.png` | Nguyen Thi Lan · 업무 처리 > 전문가 연계 |
| `admin/16_case_RECEIVED_NguyenThiLan_43_업무_상담메시지.png` | Nguyen Thi Lan · 업무 처리 > 상담 메시지 |
| `admin/16_case_RECEIVED_NguyenThiLan_44_업무_상담결과및종결.png` | Nguyen Thi Lan · 업무 처리 > 상담 결과 및 종결 |
| `admin/16_case_RECEIVED_NguyenThiLan_45_업무_상담처리기록.png` | Nguyen Thi Lan · 업무 처리 > 상담 처리 기록 |
| `user/0_공개화면/01_onboarding_1.png` | 온보딩 1 |
| `user/0_공개화면/01_onboarding_2.png` | 온보딩 2 |
| `user/0_공개화면/01_onboarding_3.png` | 온보딩 3 |
| `user/0_공개화면/02_login.png` | /login |
| `user/0_공개화면/03_signup.png` | /signup |
| `user/0_공개화면/04_forgot_password.png` | /forgot-password |
| `user/a_hoa_불일치_진정서_상담접수/01_home.png` | 표준근로계약서·10월 체불(2,226,745원)·진정서 확정·상담 접수(신규) |
| `user/a_hoa_불일치_진정서_상담접수/02_attendance.png` | /attendance |
| `user/a_hoa_불일치_진정서_상담접수/03_attendance_history.png` | /attendance/history |
| `user/a_hoa_불일치_진정서_상담접수/04_attendance_record.png` | /attendance/a2be3184-c4db-4c46-8bfc-ab0ebf957783 |
| `user/a_hoa_불일치_진정서_상담접수/05_contracts.png` | /contracts |
| `user/a_hoa_불일치_진정서_상담접수/06_contracts_list.png` | /contracts/list |
| `user/a_hoa_불일치_진정서_상담접수/07_contract_detail.png` | /contracts/617a496a-99c4-4c7f-acbf-c2a3410206f0 |
| `user/a_hoa_불일치_진정서_상담접수/08_contract_upload.png` | /contracts/new |
| `user/a_hoa_불일치_진정서_상담접수/10_salary_2026-10.png` | /salary?month=2026-10 |
| `user/a_hoa_불일치_진정서_상담접수/11_salary_2026-11.png` | /salary?month=2026-11 |
| `user/a_hoa_불일치_진정서_상담접수/12_salary_statement.png` | /salary/statements/e6f7f209-4ab5-4a18-9285-4b4849b5e869 |
| `user/a_hoa_불일치_진정서_상담접수/13_salary_comparison.png` | /salary/73dc42f2-21a8-4148-93dd-372a9fbecd95 |
| `user/a_hoa_불일치_진정서_상담접수/14_salary_upload.png` | /salary/upload |
| `user/a_hoa_불일치_진정서_상담접수/20_reports.png` | /reports |
| `user/a_hoa_불일치_진정서_상담접수/21_reports_evidences.png` | /reports/evidences |
| `user/a_hoa_불일치_진정서_상담접수/22_evidences.png` | /reports/evidences |
| `user/a_hoa_불일치_진정서_상담접수/30_petitions.png` | /petitions |
| `user/a_hoa_불일치_진정서_상담접수/31_petition_new.png` | /petitions/new |
| `user/a_hoa_불일치_진정서_상담접수/32_petition_detail.png` | /petitions/4355ed1a-d447-4551-a90b-f4b1066b3e99 |
| `user/a_hoa_불일치_진정서_상담접수/40_consultations.png` | /consultations |
| `user/a_hoa_불일치_진정서_상담접수/41_consultation_new.png` | /consultations/new |
| `user/a_hoa_불일치_진정서_상담접수/42_consultation_detail.png` | /consultations/838562a4-eb43-4a91-a385-cae44728d053 |
| `user/a_hoa_불일치_진정서_상담접수/50_notifications.png` | /notifications |
| `user/a_hoa_불일치_진정서_상담접수/60_profile.png` | /profile |
| `user/a_hoa_불일치_진정서_상담접수/61_profile_consents.png` | /profile/consents |
| `user/a_hoa_불일치_진정서_상담접수/62_permission_location.png` | /profile/permissions/location |
| `user/a_hoa_불일치_진정서_상담접수/63_permission_camera.png` | /profile/permissions/camera |
| `user/a_hoa_불일치_진정서_상담접수/64_data_deletion.png` | /profile/data-deletion |
| `user/a_hoa_불일치_진정서_상담접수/65_workplace.png` | /workplace |
| `user/a_hoa_불일치_진정서_상담접수/66_business_info.png` | /workplace/business |
| `user/a_hoa_불일치_진정서_상담접수/70_clockin_gps인증.png` | 출근: GPS 인증(미디어센터 좌표) |
| `user/a_hoa_불일치_진정서_상담접수/71_clockout_gps인증.png` | 퇴근: GPS 인증 |
| `user/a_hoa_불일치_진정서_상담접수/72_salary_0_실제수령액입력.png` | "실제 수령액 입력" 클릭 후 |
| `user/a_hoa_불일치_진정서_상담접수/72_salary_1_명세서촬영.png` | "명세서 촬영" 클릭 후 |
| `user/a_hoa_불일치_진정서_상담접수/72_salary_2_조건보기.png` | "조건 보기" 클릭 후 |
| `user/a_hoa_불일치_진정서_상담접수/72_salary_3_변경.png` | "변경" 클릭 후 |
| `user/a_hoa_불일치_진정서_상담접수/73_petition_new_비교선택.png` | 진정서: 불일치 비교 선택 후 |
| `user/a_hoa_불일치_진정서_상담접수/74_consultation_new_진입.png` | /consultations/new |
| `user/a_hoa_불일치_진정서_상담접수/80_home_clock-in_전.png` | 출근 전 홈 |
| `user/a_hoa_불일치_진정서_상담접수/81_clock-in_GPS인증.png` | 출근: GPS 인증 완료, 촬영 대기 |
| `user/a_hoa_불일치_진정서_상담접수/82_clock-in_촬영확인.png` | 출근: 사진 확인(기록 저장) |
| `user/a_hoa_불일치_진정서_상담접수/83_clock-in_완료.png` | 출근 기록 완료(서버 시각) |
| `user/a_hoa_불일치_진정서_상담접수/85_home_clock-out_전.png` | 근무 중 홈 |
| `user/a_hoa_불일치_진정서_상담접수/86_clock-out_GPS인증.png` | 퇴근: GPS 인증 완료 |
| `user/a_hoa_불일치_진정서_상담접수/87_clock-out_촬영확인.png` | 퇴근: 사진 확인 |
| `user/a_hoa_불일치_진정서_상담접수/88_clock-out_완료.png` | 퇴근 기록 완료 |
| `user/a_hoa_불일치_진정서_상담접수/90_home_퇴근후.png` | 오늘 기록 완료 홈 |
| `user/a_hoa_불일치_진정서_상담접수/91_attendance_오늘기록.png` | 출퇴근 화면(오늘 기록) |
| `user/b_tuan_불일치_이상패턴_진정서없음/01_home.png` | 10·11월 체불·이상 근무 패턴(무휴게·사후 수정)·진정서 작성 전 |
| `user/b_tuan_불일치_이상패턴_진정서없음/02_attendance.png` | /attendance |
| `user/b_tuan_불일치_이상패턴_진정서없음/03_attendance_history.png` | /attendance/history |
| `user/b_tuan_불일치_이상패턴_진정서없음/04_attendance_record.png` | /attendance/b0444641-63bf-4070-9b4c-752f3d2028a1 |
| `user/b_tuan_불일치_이상패턴_진정서없음/05_contracts.png` | /contracts |
| `user/b_tuan_불일치_이상패턴_진정서없음/06_contracts_list.png` | /contracts/list |
| `user/b_tuan_불일치_이상패턴_진정서없음/07_contract_detail.png` | /contracts/ae70db37-15b4-4a3f-8e11-1cfccb4d89bc |
| `user/b_tuan_불일치_이상패턴_진정서없음/08_contract_upload.png` | /contracts/new |
| `user/b_tuan_불일치_이상패턴_진정서없음/10_salary_2026-10.png` | /salary?month=2026-10 |
| `user/b_tuan_불일치_이상패턴_진정서없음/11_salary_2026-11.png` | /salary?month=2026-11 |
| `user/b_tuan_불일치_이상패턴_진정서없음/12_salary_statement.png` | /salary/statements/39c04b9d-ae70-49dc-8743-a4324140361e |
| `user/b_tuan_불일치_이상패턴_진정서없음/13_salary_comparison.png` | /salary/9396af6b-09a3-4765-b269-fee798f02283 |
| `user/b_tuan_불일치_이상패턴_진정서없음/14_salary_upload.png` | /salary/upload |
| `user/b_tuan_불일치_이상패턴_진정서없음/20_reports.png` | /reports |
| `user/b_tuan_불일치_이상패턴_진정서없음/21_reports_evidences.png` | /reports/evidences |
| `user/b_tuan_불일치_이상패턴_진정서없음/22_evidences.png` | /reports/evidences |
| `user/b_tuan_불일치_이상패턴_진정서없음/30_petitions.png` | /petitions |
| `user/b_tuan_불일치_이상패턴_진정서없음/31_petition_new.png` | /petitions/new |
| `user/b_tuan_불일치_이상패턴_진정서없음/32_petition_detail.png` | /petitions/cc65534a-287e-4a29-8276-d6ad134f8bb1 |
| `user/b_tuan_불일치_이상패턴_진정서없음/40_consultations.png` | /consultations |
| `user/b_tuan_불일치_이상패턴_진정서없음/41_consultation_new.png` | /consultations/new |
| `user/b_tuan_불일치_이상패턴_진정서없음/50_notifications.png` | /notifications |
| `user/b_tuan_불일치_이상패턴_진정서없음/60_profile.png` | /profile |
| `user/b_tuan_불일치_이상패턴_진정서없음/61_profile_consents.png` | /profile/consents |
| `user/b_tuan_불일치_이상패턴_진정서없음/62_permission_location.png` | /profile/permissions/location |
| `user/b_tuan_불일치_이상패턴_진정서없음/63_permission_camera.png` | /profile/permissions/camera |
| `user/b_tuan_불일치_이상패턴_진정서없음/64_data_deletion.png` | /profile/data-deletion |
| `user/b_tuan_불일치_이상패턴_진정서없음/65_workplace.png` | /workplace |
| `user/b_tuan_불일치_이상패턴_진정서없음/66_business_info.png` | /workplace/business |
| `user/b_tuan_불일치_이상패턴_진정서없음/70_clockin_gps인증.png` | 출근: GPS 인증(미디어센터 좌표) |
| `user/b_tuan_불일치_이상패턴_진정서없음/71_clockout_gps인증.png` | 퇴근: GPS 인증 |
| `user/b_tuan_불일치_이상패턴_진정서없음/72_salary_0_실제수령액입력.png` | "실제 수령액 입력" 클릭 후 |
| `user/b_tuan_불일치_이상패턴_진정서없음/72_salary_1_명세서촬영.png` | "명세서 촬영" 클릭 후 |
| `user/b_tuan_불일치_이상패턴_진정서없음/72_salary_2_조건보기.png` | "조건 보기" 클릭 후 |
| `user/b_tuan_불일치_이상패턴_진정서없음/72_salary_3_변경.png` | "변경" 클릭 후 |
| `user/b_tuan_불일치_이상패턴_진정서없음/73_petition_new_비교선택.png` | 진정서: 불일치 비교 선택 후 |
| `user/b_tuan_불일치_이상패턴_진정서없음/74_consultation_new_진입.png` | /consultations/new |
| `user/c_nam_체불없음/01_home.png` | 최저임금 이상 계약·10월 예상=실제(차액 0, MATCH) |
| `user/c_nam_체불없음/02_attendance.png` | /attendance |
| `user/c_nam_체불없음/03_attendance_history.png` | /attendance/history |
| `user/c_nam_체불없음/04_attendance_record.png` | /attendance/8e4852b6-40ee-463f-8379-9b3534ac12b8 |
| `user/c_nam_체불없음/05_contracts.png` | /contracts |
| `user/c_nam_체불없음/06_contracts_list.png` | /contracts/list |
| `user/c_nam_체불없음/07_contract_detail.png` | /contracts/812f0f10-3c95-49a5-a398-6d76ba106bfb |
| `user/c_nam_체불없음/08_contract_upload.png` | /contracts/new |
| `user/c_nam_체불없음/10_salary_2026-10.png` | /salary?month=2026-10 |
| `user/c_nam_체불없음/11_salary_2026-11.png` | /salary?month=2026-11 |
| `user/c_nam_체불없음/12_salary_statement.png` | /salary/statements/153a4daa-9a26-47f4-9bc2-bfd086cdeff6 |
| `user/c_nam_체불없음/13_salary_comparison.png` | /salary/e651b753-cc01-474a-9f5d-9278651a12cb |
| `user/c_nam_체불없음/14_salary_upload.png` | /salary/upload |
| `user/c_nam_체불없음/20_reports.png` | /reports |
| `user/c_nam_체불없음/21_reports_evidences.png` | /reports/evidences |
| `user/c_nam_체불없음/22_evidences.png` | /reports/evidences |
| `user/c_nam_체불없음/30_petitions.png` | /petitions |
| `user/c_nam_체불없음/31_petition_new.png` | /petitions/new |
| `user/c_nam_체불없음/40_consultations.png` | /consultations |
| `user/c_nam_체불없음/41_consultation_new.png` | /consultations/new |
| `user/c_nam_체불없음/50_notifications.png` | /notifications |
| `user/c_nam_체불없음/60_profile.png` | /profile |
| `user/c_nam_체불없음/61_profile_consents.png` | /profile/consents |
| `user/c_nam_체불없음/62_permission_location.png` | /profile/permissions/location |
| `user/c_nam_체불없음/63_permission_camera.png` | /profile/permissions/camera |
| `user/c_nam_체불없음/64_data_deletion.png` | /profile/data-deletion |
| `user/c_nam_체불없음/65_workplace.png` | /workplace |
| `user/c_nam_체불없음/66_business_info.png` | /workplace/business |
| `user/c_nam_체불없음/70_clockin_gps인증.png` | 출근: GPS 인증(미디어센터 좌표) |
| `user/c_nam_체불없음/71_clockout_gps인증.png` | 퇴근: GPS 인증 |
| `user/c_nam_체불없음/72_salary_0_실제수령액입력.png` | "실제 수령액 입력" 클릭 후 |
| `user/c_nam_체불없음/72_salary_1_명세서촬영.png` | "명세서 촬영" 클릭 후 |
| `user/c_nam_체불없음/72_salary_2_조건보기.png` | "조건 보기" 클릭 후 |
| `user/c_nam_체불없음/72_salary_3_변경.png` | "변경" 클릭 후 |
| `user/c_nam_체불없음/74_consultation_new_진입.png` | /consultations/new |
| `user/d_mai_신규가입_빈상태/01_home.png` | 가입 직후 아무 데이터 없음(빈 화면들) |
| `user/d_mai_신규가입_빈상태/02_attendance.png` | /attendance |
| `user/d_mai_신규가입_빈상태/03_attendance_history.png` | /attendance/history |
| `user/d_mai_신규가입_빈상태/05_contracts.png` | /contracts |
| `user/d_mai_신규가입_빈상태/06_contracts_list.png` | /contracts/list |
| `user/d_mai_신규가입_빈상태/08_contract_upload.png` | /contracts/new |
| `user/d_mai_신규가입_빈상태/10_salary_2026-10.png` | /salary?month=2026-10 |
| `user/d_mai_신규가입_빈상태/11_salary_2026-11.png` | /salary?month=2026-11 |
| `user/d_mai_신규가입_빈상태/14_salary_upload.png` | /salary/upload |
| `user/d_mai_신규가입_빈상태/20_reports.png` | /reports |
| `user/d_mai_신규가입_빈상태/21_reports_evidences.png` | /reports/evidences |
| `user/d_mai_신규가입_빈상태/22_evidences.png` | /reports/evidences |
| `user/d_mai_신규가입_빈상태/30_petitions.png` | /petitions |
| `user/d_mai_신규가입_빈상태/31_petition_new.png` | /petitions/new |
| `user/d_mai_신규가입_빈상태/40_consultations.png` | /consultations |
| `user/d_mai_신규가입_빈상태/41_consultation_new.png` | /consultations/new |
| `user/d_mai_신규가입_빈상태/50_notifications.png` | /notifications |
| `user/d_mai_신규가입_빈상태/60_profile.png` | /profile |
| `user/d_mai_신규가입_빈상태/61_profile_consents.png` | /profile/consents |
| `user/d_mai_신규가입_빈상태/62_permission_location.png` | /profile/permissions/location |
| `user/d_mai_신규가입_빈상태/63_permission_camera.png` | /profile/permissions/camera |
| `user/d_mai_신규가입_빈상태/64_data_deletion.png` | /profile/data-deletion |
| `user/d_mai_신규가입_빈상태/65_workplace.png` | /workplace |
| `user/d_mai_신규가입_빈상태/66_business_info.png` | /workplace/business |
| `user/d_mai_신규가입_빈상태/70_clockin_gps인증.png` | 출근: GPS 인증(미디어센터 좌표) |
| `user/d_mai_신규가입_빈상태/71_clockout_gps인증.png` | 퇴근: GPS 인증 |
| `user/d_mai_신규가입_빈상태/72_salary_0_실제수령액입력.png` | "실제 수령액 입력" 클릭 후 |
| `user/d_mai_신규가입_빈상태/72_salary_1_명세서촬영.png` | "명세서 촬영" 클릭 후 |
| `user/d_mai_신규가입_빈상태/72_salary_2_조건보기.png` | "조건 보기" 클릭 후 |
| `user/d_mai_신규가입_빈상태/72_salary_3_변경.png` | "변경" 클릭 후 |
| `user/e_siti_상담검토중/01_home.png` | 상담 검토 중(담당자 배정·메시지) |
| `user/e_siti_상담검토중/10_salary_2026-10.png` | /salary?month=2026-10 |
| `user/e_siti_상담검토중/13_salary_comparison.png` | /salary/79d60c14-0743-4f29-bb8d-625e076d40eb |
| `user/e_siti_상담검토중/30_petitions.png` | /petitions |
| `user/e_siti_상담검토중/32_petition_detail.png` | /petitions/13c77e5b-ebe9-47d3-80d2-daca7e8a5baa |
| `user/e_siti_상담검토중/40_consultations.png` | /consultations |
| `user/e_siti_상담검토중/42_consultation_detail.png` | /consultations/8a68a952-eb7b-45b8-ae73-3730778f9edf |
| `user/e_siti_상담검토중/50_notifications.png` | /notifications |
| `user/f_bat_추가자료요청/01_home.png` | 상담기관이 추가 자료 요청 |
| `user/f_bat_추가자료요청/10_salary_2026-10.png` | /salary?month=2026-10 |
| `user/f_bat_추가자료요청/13_salary_comparison.png` | /salary/86e8c66b-c0c2-4a3a-892c-3134b10d697b |
| `user/f_bat_추가자료요청/30_petitions.png` | /petitions |
| `user/f_bat_추가자료요청/32_petition_detail.png` | /petitions/78ddcab3-4966-4578-931d-875ad4de4059 |
| `user/f_bat_추가자료요청/40_consultations.png` | /consultations |
| `user/f_bat_추가자료요청/42_consultation_detail.png` | /consultations/df0b76f8-c5be-461e-9a69-10f23946fd00 |
| `user/f_bat_추가자료요청/50_notifications.png` | /notifications |
| `user/g_raj_노무사연계/01_home.png` | 최저임금 미달·노무사 연계 |
| `user/g_raj_노무사연계/10_salary_2026-10.png` | /salary?month=2026-10 |
| `user/g_raj_노무사연계/13_salary_comparison.png` | /salary/8e8219c8-af75-4247-9690-3f203f54e0eb |
| `user/g_raj_노무사연계/30_petitions.png` | /petitions |
| `user/g_raj_노무사연계/32_petition_detail.png` | /petitions/8e1b44d0-63db-4a9f-8328-0642d1b6bea8 |
| `user/g_raj_노무사연계/40_consultations.png` | /consultations |
| `user/g_raj_노무사연계/42_consultation_detail.png` | /consultations/354de7c0-1953-4dc7-b423-3774af411278 |
| `user/g_raj_노무사연계/50_notifications.png` | /notifications |
| `user/h_anh_상담종결/01_home.png` | 상담 종결·처리 결과 공유 |
| `user/h_anh_상담종결/10_salary_2026-10.png` | /salary?month=2026-10 |
| `user/h_anh_상담종결/13_salary_comparison.png` | /salary/d2049385-76c9-492b-8af3-49211345d8be |
| `user/h_anh_상담종결/30_petitions.png` | /petitions |
| `user/h_anh_상담종결/32_petition_detail.png` | /petitions/adb5958a-4d6b-4aaf-8104-73b49b68504a |
| `user/h_anh_상담종결/40_consultations.png` | /consultations |
| `user/h_anh_상담종결/42_consultation_detail.png` | /consultations/183f0689-bc65-4fca-ba78-1b1f14e57e1d |
| `user/h_anh_상담종결/50_notifications.png` | /notifications |
| `user/i_minh_진정서없이상담/01_home.png` | 진정서 없이 상담 신청(접수) |
| `user/i_minh_진정서없이상담/10_salary_2026-10.png` | /salary?month=2026-10 |
| `user/i_minh_진정서없이상담/13_salary_comparison.png` | /salary/1c2172dc-552f-4b47-98d3-78e44f94ab6b |
| `user/i_minh_진정서없이상담/30_petitions.png` | /petitions |
| `user/i_minh_진정서없이상담/40_consultations.png` | /consultations |
| `user/i_minh_진정서없이상담/42_consultation_detail.png` | /consultations/16f0c4ca-a93f-46fb-a7ba-dcd0a78eb0f9 |
| `user/i_minh_진정서없이상담/50_notifications.png` | /notifications |
