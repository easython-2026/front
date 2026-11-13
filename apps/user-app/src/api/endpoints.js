
const API = "/api/v1";

export const ENDPOINTS = {
  // 0. 인증
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

  // 0, 5. 회원 및 설정
  user: {
    getMe: {
      method: "GET",
      path: `${API}/users/me`,
    },
    updateMe: {
      method: "PATCH",
      path: `${API}/users/me`,
    },
    deleteAccount: {
      method: "DELETE",
      path: `${API}/users/me`,
    },
    getWorkplace: {
      method: "GET",
      path: `${API}/users/me/workplace`,
    },
    updateWorkplace: {
      method: "PUT",
      path: `${API}/users/me/workplace`,
    },
    getConsents: {
      method: "GET",
      path: `${API}/users/me/consents`,
    },
    updateConsents: {
      method: "PATCH",
      path: `${API}/users/me/consents`,
    },
    updateSettings: {
      method: "PATCH",
      path: `${API}/users/me/settings`,
    },
    requestDataDeletion: {
      method: "POST",
      path: `${API}/users/me/data-deletion-requests`,
    },
    getLanguages: {
      method: "GET",
      path: `${API}/languages`,
    },
  },

  // 1. 근로계약서
  contract: {
    getList: {
      method: "GET",
      path: `${API}/contracts`,
    },
    upload: {
      method: "POST",
      path: `${API}/contracts`,
    },
    getDetail: {
      method: "GET",
      path: `${API}/contracts/{contractId}`,
    },
    updateTerms: {
      method: "PATCH",
      path: `${API}/contracts/{contractId}/terms`,
    },
    confirmTerms: {
      method: "POST",
      path: `${API}/contracts/{contractId}/confirm`,
    },
    reanalyze: {
      method: "POST",
      path: `${API}/contracts/{contractId}/reanalyze`,
    },
    delete: {
      method: "DELETE",
      path: `${API}/contracts/{contractId}`,
    },
  },

  // 2. 출퇴근 및 근무기록
  attendance: {
    getToday: {
      method: "GET",
      path: `${API}/attendance/today`,
    },
    getWeekly: {
      method: "GET",
      path: `${API}/attendance/weekly`,
    },
    getMonthly: {
      method: "GET",
      path: `${API}/attendance/monthly`,
    },
    locationCheck: {
      method: "POST",
      path: `${API}/attendance/location-check`,
    },
    clockIn: {
      method: "POST",
      path: `${API}/attendance/clock-in`,
    },
    clockOut: {
      method: "POST",
      path: `${API}/attendance/clock-out`,
    },
    getRecord: {
      method: "GET",
      path: `${API}/attendance/records/{recordId}`,
    },
    addRecord: {
      method: "POST",
      path: `${API}/attendance/records`,
    },
    updateRecord: {
      method: "PATCH",
      path: `${API}/attendance/records/{recordId}`,
    },
    updateBreak: {
      method: "PUT",
      path: `${API}/attendance/records/{recordId}/break`,
    },
    getIssues: {
      method: "GET",
      path: `${API}/attendance/issues`,
    },
    getAnomalies: {
      method: "GET",
      path: `${API}/attendance/anomalies`,
    },
  },

  // 3. 급여 비교
  salary: {
    uploadStatement: {
      method: "POST",
      path: `${API}/payroll/statements`,
    },
    getStatement: {
      method: "GET",
      path: `${API}/payroll/statements/{statementId}`,
    },
    updateStatement: {
      method: "PATCH",
      path: `${API}/payroll/statements/{statementId}`,
    },
    addManualStatement: {
      method: "POST",
      path: `${API}/payroll/statements/manual`,
    },
    getComparisons: {
      method: "GET",
      path: `${API}/payroll/comparisons`,
    },
    calculateComparison: {
      method: "POST",
      path: `${API}/payroll/comparisons`,
    },
    getComparison: {
      method: "GET",
      path: `${API}/payroll/comparisons/{comparisonId}`,
    },
  },

  // 4. 리포트 및 진정서
  report: {
    getMonthly: {
      method: "GET",
      path: `${API}/reports/monthly`,
    },
    getEvidences: {
      method: "GET",
      path: `${API}/evidences`,
    },
    getComplaints: {
      method: "GET",
      path: `${API}/complaints`,
    },
    createComplaint: {
      method: "POST",
      path: `${API}/complaints`,
    },
    getComplaint: {
      method: "GET",
      path: `${API}/complaints/{complaintId}`,
    },
    updateComplaint: {
      method: "PATCH",
      path: `${API}/complaints/{complaintId}`,
    },
    updateComplaintEvidences: {
      method: "PUT",
      path: `${API}/complaints/{complaintId}/evidences`,
    },
    downloadComplaintPdf: {
      method: "GET",
      path: `${API}/complaints/{complaintId}/pdf`,
    },
  },

  // 4. 상담 연결
  consultation: {
    getAgencies: {
      method: "GET",
      path: `${API}/consultation-agencies`,
    },
    getList: {
      method: "GET",
      path: `${API}/consultations`,
    },
    create: {
      method: "POST",
      path: `${API}/consultations`,
    },
    getDetail: {
      method: "GET",
      path: `${API}/consultations/{consultationId}`,
    },
    getMessages: {
      method: "GET",
      path: `${API}/consultations/{consultationId}/messages`,
    },
    sendMessage: {
      method: "POST",
      path: `${API}/consultations/{consultationId}/messages`,
    },
    revokeConsent: {
      method: "DELETE",
      path: `${API}/consultations/{consultationId}/consent`,
    },
  },

  // 알림
  notification: {
    getList: {
      method: "GET",
      path: `${API}/notifications`,
    },
    markAsRead: {
      method: "PATCH",
      path: `${API}/notifications/{notificationId}/read`,
    },
  },

  // 시연용 데이터
  demo: {
    seed: {
      method: "POST",
      path: `${API}/demo/seed`,
    },
  },
};
