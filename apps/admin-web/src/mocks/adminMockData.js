
export const mockAdmin = {
    id: "st1-demo",
    name: "이상담",
    agencyId: "ag1-demo",
    agencyName: "OO이주민지원센터",
    role: "ADMIN",
  };
  
  export const mockDashboard = {
    newCount: 1,
    inProgressCount: 2,
    closedCount: 1,
    highUrgencyCount: 1,
    unreadMessageCount: 1,
  };
  
  export const mockConsultations = [
    {
      id: "co1-demo",
      workerName: "Tuan",
      workerLanguage: "vi",
      headline: "10월 임금 일부 미지급 의심",
      differenceAmount: 246800,
      status: "RECEIVED",
      urgencyLevel: null,
      aiSuggestedUrgency: "HIGH",
      assignee: null,
      hasNewMessage: true,
      receivedAt: "2026-11-12T09:42:00+09:00",
    },
    {
      id: "co2-demo",
      workerName: "Minh",
      workerLanguage: "vi",
      headline: "근무시간과 지급액 차이 확인 필요",
      differenceAmount: 118400,
      status: "REVIEWING",
      urgencyLevel: "MEDIUM",
      aiSuggestedUrgency: "LOW",
      assignee: {
        id: "st1-demo",
        name: "이상담",
      },
      hasNewMessage: false,
      receivedAt: "2026-11-11T16:18:00+09:00",
    },
    {
      id: "co3-demo",
      workerName: "Ravi",
      workerLanguage: "en",
      headline: "숙식비 공제 내역 추가 확인 필요",
      differenceAmount: 502100,
      status: "INFO_REQUESTED",
      urgencyLevel: null,
      aiSuggestedUrgency: "MEDIUM",
      assignee: null,
      hasNewMessage: false,
      receivedAt: "2026-11-09T11:05:00+09:00",
    },
    {
      id: "co4-demo",
      workerName: "An",
      workerLanguage: "vi",
      headline: "상담 절차 및 자료 검토 완료",
      differenceAmount: 0,
      status: "CLOSED",
      urgencyLevel: "LOW",
      aiSuggestedUrgency: "LOW",
      assignee: {
        id: "st1-demo",
        name: "이상담",
      },
      hasNewMessage: false,
      receivedAt: "2026-11-05T14:30:00+09:00",
    },
  ];
  