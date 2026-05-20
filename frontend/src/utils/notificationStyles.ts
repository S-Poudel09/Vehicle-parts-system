export type NotificationType = "Info" | "Success" | "Warning" | "Error" | string;

export function notificationDotClass(type: NotificationType): string {
  switch (type) {
    case "Success":
      return "bg-emerald-500";
    case "Info":
      return "bg-blue-500";
    case "Error":
      return "bg-red-500";
    case "Warning":
    default:
      return "bg-amber-500";
  }
}

export function notificationBadgeClass(type: NotificationType): string {
  switch (type) {
    case "Success":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "Info":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "Error":
      return "bg-red-50 text-red-700 ring-red-600/20";
    case "Warning":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

export function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
