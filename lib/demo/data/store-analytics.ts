// Demo Store Analytics Data
// All dates are relative to new Date() so data always looks fresh.

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface TopProduct {
  name: string;
  units_sold: number;
  revenue: number;
}

export interface DailyOrderVolume {
  date: string;
  order_count: number;
}

export interface CustomerMetrics {
  total_customers: number;
  returning_customers: number;
  new_this_month: number;
  avg_order_value: number;
}

export interface HourlyTraffic {
  hour: number;
  label: string;
  orders: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ─── Daily Revenue (last 30 days) ─────────────────────────────────────

const dailyRevenueAmounts = [
  487.30, 523.10, 312.45, 645.80, 578.20, 401.15, 356.90,
  489.75, 612.40, 298.55, 534.60, 471.25, 683.10, 390.85,
  425.70, 567.90, 601.35, 349.20, 712.45, 455.60, 388.95,
  529.40, 643.80, 478.15, 365.50, 591.70, 502.30, 438.65,
  674.20, 553.90,
];

export const DEMO_DAILY_REVENUE: DailyRevenue[] = dailyRevenueAmounts.map(
  (revenue, i) => ({
    date: formatDate(daysAgoDate(30 - i)),
    revenue,
  })
);

// ─── Top Products ─────────────────────────────────────────────────────

export const DEMO_TOP_PRODUCTS: TopProduct[] = [
  { name: "Coca-Cola Classic 20oz", units_sold: 184, revenue: 458.16 },
  { name: "Poland Spring Water 16.9oz", units_sold: 167, revenue: 332.33 },
  { name: "Arizona Iced Tea 23oz", units_sold: 142, revenue: 183.18 },
  { name: "Takis Fuego", units_sold: 128, revenue: 421.12 },
  { name: "Large Eggs Dozen", units_sold: 115, revenue: 573.85 },
  { name: "Whole Milk 1 Gallon", units_sold: 102, revenue: 610.98 },
  { name: "Doritos Nacho Cheese", units_sold: 98, revenue: 293.02 },
  { name: "White Bread Loaf", units_sold: 94, revenue: 375.06 },
  { name: "Bananas (per lb)", units_sold: 89, revenue: 70.31 },
  { name: "Ramen Noodles Chicken 3oz", units_sold: 87, revenue: 42.63 },
];

// ─── Order Volume (last 7 days) ───────────────────────────────────────

const weeklyOrderCounts = [18, 24, 15, 31, 27, 22, 19];

export const DEMO_ORDER_VOLUME: DailyOrderVolume[] = weeklyOrderCounts.map(
  (order_count, i) => ({
    date: formatDate(daysAgoDate(7 - i)),
    order_count,
  })
);

// ─── Customer Metrics ─────────────────────────────────────────────────

export const DEMO_CUSTOMER_METRICS: CustomerMetrics = {
  total_customers: 342,
  returning_customers: 156,
  new_this_month: 28,
  avg_order_value: 23.45,
};

// ─── Hourly Traffic (orders per hour, 0-23) ───────────────────────────

export const DEMO_HOURLY_TRAFFIC: HourlyTraffic[] = [
  { hour: 0, label: "12 AM", orders: 0 },
  { hour: 1, label: "1 AM", orders: 0 },
  { hour: 2, label: "2 AM", orders: 0 },
  { hour: 3, label: "3 AM", orders: 0 },
  { hour: 4, label: "4 AM", orders: 0 },
  { hour: 5, label: "5 AM", orders: 1 },
  { hour: 6, label: "6 AM", orders: 3 },
  { hour: 7, label: "7 AM", orders: 7 },
  { hour: 8, label: "8 AM", orders: 12 },
  { hour: 9, label: "9 AM", orders: 9 },
  { hour: 10, label: "10 AM", orders: 6 },
  { hour: 11, label: "11 AM", orders: 14 },
  { hour: 12, label: "12 PM", orders: 22 },
  { hour: 13, label: "1 PM", orders: 18 },
  { hour: 14, label: "2 PM", orders: 10 },
  { hour: 15, label: "3 PM", orders: 8 },
  { hour: 16, label: "4 PM", orders: 11 },
  { hour: 17, label: "5 PM", orders: 16 },
  { hour: 18, label: "6 PM", orders: 21 },
  { hour: 19, label: "7 PM", orders: 19 },
  { hour: 20, label: "8 PM", orders: 13 },
  { hour: 21, label: "9 PM", orders: 8 },
  { hour: 22, label: "10 PM", orders: 4 },
  { hour: 23, label: "11 PM", orders: 1 },
];
