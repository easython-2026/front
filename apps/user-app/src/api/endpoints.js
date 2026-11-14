
const API = "/api/v1";

export const ENDPOINTS = {
  // ========================================
  // 0. 인증
  // ========================================

  auth: {
    signup: {
      method: "POST",
      path: `${API}/auth/signup`,
    },

    login: {
      method: "POST",
      path: `${API}/auth/login`,
    },

    logout: {
      method: "POST",
      path: `${API}/auth/logout`,
    },

    refresh: {
      method: "POST",
      path: `${API}/auth/refresh`,
    },

    checkEmail: {
      method: "GET",
      path: `${API}/auth/email/check`,
    },

    requestPasswordReset: {
      method: "POST",
      path: `${API}/auth/password/reset-request`,
    },

    resetPassword: {
      method: "POST",
      path: `${API}/auth/password/reset`,
    },
  },

  // ========================================
  // 1. 회원 및 개인정보 설정
  // ========================================

  user: {
    // 내 정보 조회
    getMe: {
      method: "GET",
      path: `${API}/users/me`,
    },

    // 내 정보 수정
    updateMe: {
      method: "PATCH",
      path: `${API}/users/me`,
    },

    // 회원 탈퇴
    deleteAccount: {
      method: "DELETE",
      path: `${API}/users/me`,
    },

    // 근무장소 및 사업장 조회
    getWorkplace: {
      method: "GET",
      path: `${API}/users/me/workplace`,
    },

    // 근무장소 및 사업장 등록·수정
    updateWorkplace: {
      method: "PUT",
      path: `${API}/users/me/workplace`,
    },

    // 개인정보 동의 상태 조회
    getConsents: {
      method: "GET",
      path: `${API}/users/me/consents`,
    },

    // 위치·카메라 동의 변경
    updateConsents: {
      method: "PATCH",
      path: `${API}/users/me/consents`,
    },

    // 월급날 및 알림 설정 변경
    updateSettings: {
      method: "PATCH",
      path: `${API}/users/me/settings`,
    },

    // 개인정보 삭제 요청
    requestDataDeletion: {
      method: "POST",
      path: `${API}/users/me/data-deletion-requests`,
    },

    // 지원 언어 목록
    getLanguages: {
      method: "GET",
      path: `${API}/languages`,
    },
  },

  // ========================================
  // 2. 내 정보 및 사업장 관리
  // 22단계 Profile.jsx / Workplace.jsx 호환
  // ========================================

  accountSettings: {
    // 사용자 기본 정보 조회
    getProfile: {
      method: "GET",
      path: `${API}/users/me`,
    },

    // 사용자 이름 및 언어 수정
    updateProfile: {
      method: "PATCH",
      path: `${API}/users/me`,
    },

    // 근무장소 및 사업장 조회
    getWorkplace: {
      method: "GET",
      path: `${API}/users/me/workplace`,
    },

    // 근무장소 및 사업장 저장
    saveWorkplace: {
      method: "PUT",
      path: `${API}/users/me/workplace`,
    },
  },

  // ========================================
  // 3. 근로계약서
  // ========================================

  contract: {
    // 계약서 목록
    getList: {
      method: "GET",
      path: `${API}/contracts`,
    },

    // 계약서 업로드
    upload: {
      method: "POST",
      path: `${API}/contracts`,
    },

    // 계약서 상세
    getDetail: {
      method: "GET",
      path: `${API}/contracts/{contractId}`,
    },

    // 추출 계약 조건 수정
    updateTerms: {
      method: "PATCH",
      path: `${API}/contracts/{contractId}/terms`,
    },

    // 계약 조건 최종 확정
    confirmTerms: {
      method: "POST",
      path: `${API}/contracts/{contractId}/confirm`,
    },

    // AI 재분석
    reanalyze: {
      method: "POST",
      path: `${API}/contracts/{contractId}/reanalyze`,
    },

    // 계약서 삭제
    delete: {
      method: "DELETE",
      path: `${API}/contracts/{contractId}`,
    },
  },

  // ========================================
  // 4. 출퇴근 및 근무기록
  // ========================================

  attendance: {
    // 오늘 출퇴근 현황
    getToday: {
      method: "GET",
      path: `${API}/attendance/today`,
    },

    // 주간 근무기록
    getWeekly: {
      method: "GET",
      path: `${API}/attendance/weekly`,
    },

    // 월간 근무기록
    getMonthly: {
      method: "GET",
      path: `${API}/attendance/monthly`,
    },

    // GPS 위치 검증
    locationCheck: {
      method: "POST",
      path: `${API}/attendance/location-check`,
    },

    // 출근 기록
    clockIn: {
      method: "POST",
      path: `${API}/attendance/clock-in`,
    },

    // 퇴근 기록
    clockOut: {
      method: "POST",
      path: `${API}/attendance/clock-out`,
    },

    // 개별 근무기록 조회
    getRecord: {
      method: "GET",
      path: `${API}/attendance/records/{recordId}`,
    },

    // 근무기록 등록
    addRecord: {
      method: "POST",
      path: `${API}/attendance/records`,
    },

    // 근무기록 수정
    updateRecord: {
      method: "PATCH",
      path: `${API}/attendance/records/{recordId}`,
    },

    // 휴게시간 등록·수정
    updateBreak: {
      method: "PUT",
      path: `${API}/attendance/records/{recordId}/break`,
    },

    // 근무기록 누락 조회
    getIssues: {
      method: "GET",
      path: `${API}/attendance/issues`,
    },

    // 이상 근무기록 조회
    getAnomalies: {
      method: "GET",
      path: `${API}/attendance/anomalies`,
    },

    // 사후 수동 근무기록 등록
    addManualRecord: {
      method: "POST",
      path: `${API}/attendance/records`,
    },
  },

  // ========================================
  // 5. 급여 관리 및 임금 비교
  // ========================================

  salary: {
    // 급여명세서 파일 업로드
    uploadStatement: {
      method: "POST",
      path: `${API}/payroll/statements`,
    },

    // 급여명세서 상세
    getStatement: {
      method: "GET",
      path: `${API}/payroll/statements/{statementId}`,
    },

    // 급여명세서 OCR 추출값 수정·확정
    updateStatement: {
      method: "PATCH",
      path: `${API}/payroll/statements/{statementId}`,
    },

    // 실제 수령액 직접 입력
    addManualStatement: {
      method: "POST",
      path: `${API}/payroll/statements/manual`,
    },

    // 임금 비교 결과 목록
    getComparisons: {
      method: "GET",
      path: `${API}/payroll/comparisons`,
    },

    // 임금 비교 실행
    calculateComparison: {
      method: "POST",
      path: `${API}/payroll/comparisons`,
    },

    // 임금 비교 결과 상세
    getComparison: {
      method: "GET",
      path: `${API}/payroll/comparisons/{comparisonId}`,
    },
  },

  // ========================================
  // 6. 리포트 · 증거 · 진정서
  // ========================================

  report: {
    // 월별 근무·임금 리포트
    getMonthly: {
      method: "GET",
      path: `${API}/reports/monthly`,
    },

    // 증거 목록
    getEvidences: {
      method: "GET",
      path: `${API}/evidences`,
    },

    // 진정서 목록
    getComplaints: {
      method: "GET",
      path: `${API}/complaints`,
    },

    // 진정서 생성
    createComplaint: {
      method: "POST",
      path: `${API}/complaints`,
    },

    // 진정서 상세 조회
    getComplaint: {
      method: "GET",
      path: `${API}/complaints/{complaintId}`,
    },

    // 진정서 수정·검토 확정
    updateComplaint: {
      method: "PATCH",
      path: `${API}/complaints/{complaintId}`,
    },

    // 진정서 증거 전체 교체
    updateComplaintEvidences: {
      method: "PUT",
      path: `${API}/complaints/{complaintId}/evidences`,
    },

    // 진정서 PDF 다운로드
    downloadComplaintPdf: {
      method: "GET",
      path: `${API}/complaints/{complaintId}/pdf`,
    },
  },

  // ========================================
  // 7. 상담기관 연결 및 상담 관리
  // ========================================

  consultation: {
    // 상담기관 목록
    getAgencies: {
      method: "GET",
      path: `${API}/consultation-agencies`,
    },

    // 내 상담 목록
    getList: {
      method: "GET",
      path: `${API}/consultations`,
    },

    // 상담 신청
    create: {
      method: "POST",
      path: `${API}/consultations`,
    },

    // 상담 상세
    getDetail: {
      method: "GET",
      path: `${API}/consultations/{consultationId}`,
    },

    // 상담 메시지 목록
    getMessages: {
      method: "GET",
      path: `${API}/consultations/{consultationId}/messages`,
    },

    // 노동자 메시지 전송
    sendMessage: {
      method: "POST",
      path: `${API}/consultations/{consultationId}/messages`,
    },

    // 상담 정보 공유 동의 철회
    revokeConsent: {
      method: "DELETE",
      path: `${API}/consultations/{consultationId}/consent`,
    },
  },

  // ========================================
  // 8. 웹앱 내부 알림
  // ========================================

  notification: {
    // 알림 목록 및 월급날 팝업 조회
    getList: {
      method: "GET",
      path: `${API}/notifications`,
    },

    // 알림 읽음 처리
    // API 명세 기준 PATCH
    markAsRead: {
      method: "PATCH",
      path: `${API}/notifications/{notificationId}/read`,
    },
  },

  // ========================================
  // 9. 데모 데이터
  // ========================================

  demo: {
    // 시연 환경에서만 사용
    seed: {
      method: "POST",
      path: `${API}/demo/seed`,
    },
  },
};