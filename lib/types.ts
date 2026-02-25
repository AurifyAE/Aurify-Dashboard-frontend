export interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "user" | "moderator";
  status: "active" | "inactive" | "suspended";
  avatar?: string;
  lastLogin: string;
  createdAt: string;
}

export interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ip?: string;
  status: "success" | "failed" | "warning";
}

export interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  systemHealth: SystemHealth;
  recentActivities: ActivityLog[];
}
