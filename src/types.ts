export enum Role {
  ADMIN = 'admin',
  PACKER = 'packer'
}

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface Shop {
  id: number;
  name: string;
  marketplace: string;
}

export interface PackingItem {
  id: number;
  shop_id: number;
  shop_name?: string;
  resi_number: string;
  drive_link: string;
  user_id: number;
  packer_name?: string;
  timestamp: string;
}

export interface LogEntry {
  id: number;
  description: string;
  username: string;
  timestamp: string;
}

export interface DashboardStats {
  totalPacking: number;
  todayPacking: number;
  dailyChart: { date: string; count: number }[];
}
