type AuditLogEntry = {
  timestamp: string;
  action: string;
  oldValue: string;
  newValue: string;
  center: string;
  changedBy: string;
  severity: "Critical" | "Warning" | "Medium" | "Low" | "Info";
};

export type { AuditLogEntry };