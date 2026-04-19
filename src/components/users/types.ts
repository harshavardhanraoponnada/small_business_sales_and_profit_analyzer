import { Role } from '@/types';

export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ReportFrequency = 'none' | 'daily' | 'weekly' | 'monthly';
export type ReportFormat = 'pdf' | 'xlsx';
export type ReportScheduleWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface UserListItem {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  reportFrequency: ReportFrequency;
  reportFormat: ReportFormat;
  reportScheduleTime: string;
  reportScheduleWeekday: ReportScheduleWeekday;
  receiveScheduledReports: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserFormPayload {
  username: string;
  email: string;
  password?: string;
  role: Role;
  status: UserStatus;
  reportFrequency: ReportFrequency;
  reportFormat: ReportFormat;
  reportScheduleTime: string;
  reportScheduleWeekday: ReportScheduleWeekday;
  receiveScheduledReports: boolean;
}
