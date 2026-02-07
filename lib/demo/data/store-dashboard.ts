// Demo Store Dashboard Data
// All dates are relative to new Date() so data always looks fresh.

export interface StoreDashboardStats {
  products: number;
  pendingOrders: number;
  totalOrders: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
}

export interface StoreOwner {
  business_name: string;
  business_type: string;
  name: string;
  email: string;
  phone: string;
  commission_rate: number;
  accepts_orders: boolean;
  application_status: string;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface StoreInfo {
  name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  is_active: boolean;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  delivery_radius_miles: number;
  opening_hours: Record<string, DayHours>;
}

export const DEMO_STORE_STATS: StoreDashboardStats = {
  products: 847,
  pendingOrders: 23,
  totalOrders: 1234,
  todayRevenue: 2341.50,
  weeklyRevenue: 14567.80,
  monthlyRevenue: 52340.00,
};

export const DEMO_STORE_OWNER: StoreOwner = {
  business_name: "Martinez Corner Market",
  business_type: "Corner Store",
  name: "Carlos Martinez",
  email: "carlos@martinezmarket.com",
  phone: "(718) 555-0142",
  commission_rate: 12,
  accepts_orders: true,
  application_status: "approved",
};

export const DEMO_STORE_INFO: StoreInfo = {
  name: "Martinez Corner Market",
  street_address: "1247 Atlantic Ave",
  city: "Brooklyn",
  state: "NY",
  zip_code: "11216",
  phone: "(718) 555-0142",
  is_active: true,
  accepts_delivery: true,
  accepts_pickup: true,
  delivery_radius_miles: 3,
  opening_hours: {
    monday: { open: "06:00", close: "23:00", closed: false },
    tuesday: { open: "06:00", close: "23:00", closed: false },
    wednesday: { open: "06:00", close: "23:00", closed: false },
    thursday: { open: "06:00", close: "23:00", closed: false },
    friday: { open: "06:00", close: "00:00", closed: false },
    saturday: { open: "07:00", close: "00:00", closed: false },
    sunday: { open: "08:00", close: "22:00", closed: false },
  },
};
