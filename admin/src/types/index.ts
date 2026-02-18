// Type definitions for admin dashboard

export interface Incident {
  id: number;
  latitude: number;
  longitude: number;
  status: 'reported' | 'acknowledged' | 'dispatched' | 'resolved' | 'cancelled';
  city_id: number | null;
  reported_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  notified_responders: number[] | null;
  notes: string | null;
  city?: City;
}

export interface Responder {
  id: number;
  name: string;
  type: 'CDRRMO' | 'PNP' | 'BFP' | 'MDRRMO' | 'Barangay';
  phone: string;
  latitude: number;
  longitude: number;
  city_id: number | null;
  is_active: boolean;
  created_at: string;
  city?: City;
}

export interface City {
  id: number;
  name: string;
  region: string;
  province: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface DashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  resolvedToday: number;
  totalResponders: number;
  avgResponseTime: number;
}
