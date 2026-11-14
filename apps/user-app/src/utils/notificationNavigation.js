
export function getNotificationPath(notification) {
  const type = notification?.type;
  const payload = notification?.payload ?? {};

  const month = payload.month;
  const comparisonId = payload.comparisonId;
  const consultationId = payload.consultationId;

  switch (type) {
    case "PAYDAY":
      return month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
        ? `/salary?month=${encodeURIComponent(month)}`
        : "/salary";

    case "MISSING_RECORD":
      return "/attendance/history";

    case "MISMATCH":
      return comparisonId
        ? `/salary/${encodeURIComponent(comparisonId)}`
        : "/salary";

    case "CONSULTATION_UPDATE":
    case "INFO_REQUEST":
      return consultationId
        ? `/consultations/${encodeURIComponent(consultationId)}`
        : "/consultations";

    default:
      if (month && /^\d{4}-\d{2}$/.test(month)) {
        return `/reports?month=${encodeURIComponent(month)}`;
      }

      return null;
  }
}