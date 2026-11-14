
import { mockConsultations } from "./adminMockData";

// 사건 목록의 ID와 상세 화면의 ID가 일치하도록 구성
const detailOverrides = {
  "co1-demo": {
    summary: {
      ko: "10월 근무기록과 실제 지급액 사이에 차이가 있어 추가 검토가 필요한 사건입니다.",
    },
    timeline: [
      {
        date: "2026-10-01",
        clockInAt: "2026-10-01T08:00:00+09:00",
        clockOutAt: "2026-10-01T18:05:00+09:00",
        breakMinutes: null,
        workedMinutes: 605,
        source: "DEVICE",
        flags: ["NO_BREAK"],
        edits: [],
      },
      {
        date: "2026-10-02",
        clockInAt: "2026-10-02T08:03:00+09:00",
        clockOutAt: "2026-10-02T17:32:00+09:00",
        breakMinutes: 60,
        workedMinutes: 509,
        source: "DEVICE",
        flags: [],
        edits: [],
      },
      {
        date: "2026-10-03",
        clockInAt: "2026-10-03T08:10:00+09:00",
        clockOutAt: "2026-10-03T18:00:00+09:00",
        breakMinutes: 60,
        workedMinutes: 530,
        source: "DEVICE",
        flags: ["EDITED"],
        edits: [
          {
            field: "BREAK",
            before: null,
            after: "60",
            reason: "휴게시간 누락 수정",
          },
        ],
      },
    ],
    wageComparison: {
      expectedAmount: 2246800,
      actualAmount: 2000000,
      differenceAmount: 246800,
      items: [],
      uncertainties: [
        {
          code: "MISSING_BREAK",
          message: "일부 근무일의 휴게시간 확인이 필요합니다.",
        },
      ],
      appliedConditions: {},
    },
    consent: {
      sharedScope: ["SUMMARY", "ATTENDANCE", "WAGE"],
      agreedAt: "2026-11-12T09:42:00+09:00",
    },
  },
};

export const mockConsultationDetails = Object.fromEntries(
  mockConsultations.map((item) => {
    const override = detailOverrides[item.id];

    return [
      item.id,
      {
        id: item.id,
        status: item.status,
        worker: {
          name: item.workerName,
          language: item.workerLanguage,
        },
        summary: override?.summary || {
          ko: item.headline,
        },

        // 공유 범위에 포함된 경우에만 제공하는 예시
        timeline: override?.timeline ?? null,
        wageComparison: override?.wageComparison ?? {
          expectedAmount: null,
          actualAmount: null,
          differenceAmount: item.differenceAmount,
          items: [],
          uncertainties: [],
          appliedConditions: {},
        },

        contract: null,
        evidences: [],
        complaintDraft: null,

        urgencyLevel: item.urgencyLevel,
        aiSuggestedUrgency: item.aiSuggestedUrgency,
        assignee: item.assignee,

        infoRequests: [],
        referrals: [],
        result:
          item.status === "CLOSED"
            ? {
                content: "상담 처리 완료",
                actionTaken: "상담 안내 완료",
                closeReason: "상담 종결",
              }
            : null,

        consent: override?.consent || {
          sharedScope: ["SUMMARY", "WAGE"],
          agreedAt: item.receivedAt,
        },

        disclaimer:
          "참고용 자료이며 법적 판단이 아닙니다. 최종 판단은 노무사·노동청 확인이 필요합니다.",
      },
    ];
  })
);
