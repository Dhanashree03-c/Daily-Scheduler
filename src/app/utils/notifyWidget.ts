import type { Task } from "../types";

export const NOTIFICATION_WIDGET_EVENT = "notification-widget";

export interface WidgetPayload {
  task: Task;
  title: string;
  body: string;
  /** e.g. "Reminds at 8:50 AM" or "Starts at 9:00 AM" */
  whenLabel: string;
  preview?: boolean;
}

/** Show the floating in-app notification widget (and any listeners). */
export function showNotificationWidget(payload: WidgetPayload) {
  window.dispatchEvent(new CustomEvent<WidgetPayload>(NOTIFICATION_WIDGET_EVENT, { detail: payload }));
}
