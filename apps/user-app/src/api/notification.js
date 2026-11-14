
import { apiRequest } from "./client";

// 알림 목록 (월급날 팝업 포함)
export const getNotifications = (query = {}) =>
  apiRequest("notification", "getList", {
    query,
  });

// 알림 읽음 처리
export const markNotificationAsRead = (
  notificationId
) =>
  apiRequest("notification", "markAsRead", {
    params: { notificationId },
  });
