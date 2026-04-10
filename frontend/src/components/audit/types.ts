export interface AuditLogListItem {
  id: string;
  timestamp: string;
  username: string;
  role: string;
  action: string;
  entity: string;
  details: string;
  ipAddress: string;
}
