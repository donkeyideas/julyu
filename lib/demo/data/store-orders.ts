// Demo Store Orders Data
// All dates are relative to new Date() so data always looks fresh.

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderType = "pickup" | "delivery";

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  order_type: OrderType;
  delivery_address: string | null;
  notes: string;
  ordered_at: string;
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function daysAgo(days: number, hourOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hourOffset);
  return d.toISOString();
}

function minutesAgo(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

export const DEMO_ORDERS: Order[] = [
  // ─── Pending Orders (5) ─────────────────────────────────────────────
  {
    id: "ord-001",
    order_number: "ORD-4821",
    customer_name: "Maria Gonzalez",
    customer_email: "maria.g@email.com",
    customer_phone: "(718) 555-0198",
    items: [
      { name: "Whole Milk 1 Gallon", quantity: 1, price: 5.99 },
      { name: "Large Eggs Dozen", quantity: 1, price: 4.99 },
      { name: "White Bread Loaf", quantity: 2, price: 3.99 },
      { name: "Bananas (per lb)", quantity: 3, price: 0.79 },
    ],
    subtotal: 21.33,
    tax: 1.90,
    total: 23.23,
    status: "pending",
    order_type: "delivery",
    delivery_address: "345 Prospect Pl, Apt 4B, Brooklyn, NY 11238",
    notes: "Please leave at the door",
    ordered_at: minutesAgo(8),
  },
  {
    id: "ord-002",
    order_number: "ORD-4822",
    customer_name: "James Wilson",
    customer_email: "jwilson@email.com",
    customer_phone: "(718) 555-0211",
    items: [
      { name: "Coca-Cola Classic 20oz", quantity: 2, price: 2.49 },
      { name: "Doritos Nacho Cheese", quantity: 1, price: 2.99 },
      { name: "Snickers Bar", quantity: 3, price: 2.29 },
    ],
    subtotal: 14.84,
    tax: 1.32,
    total: 16.16,
    status: "pending",
    order_type: "pickup",
    delivery_address: null,
    notes: "",
    ordered_at: minutesAgo(15),
  },
  {
    id: "ord-003",
    order_number: "ORD-4823",
    customer_name: "Ayesha Patel",
    customer_email: "ayesha.p@email.com",
    customer_phone: "(718) 555-0177",
    items: [
      { name: "Jasmine Rice 5lb", quantity: 1, price: 6.99 },
      { name: "Coconut Milk 13.5oz", quantity: 2, price: 2.49 },
      { name: "Soy Sauce 10oz", quantity: 1, price: 3.49 },
      { name: "Sriracha Hot Chili Sauce 17oz", quantity: 1, price: 4.49 },
      { name: "Cilantro Bunch", quantity: 2, price: 0.99 },
    ],
    subtotal: 22.93,
    tax: 2.04,
    total: 24.97,
    status: "pending",
    order_type: "delivery",
    delivery_address: "789 Dean St, Brooklyn, NY 11238",
    notes: "Ring buzzer twice",
    ordered_at: minutesAgo(22),
  },
  {
    id: "ord-004",
    order_number: "ORD-4824",
    customer_name: "Robert Chen",
    customer_email: "rchen@email.com",
    customer_phone: "(718) 555-0233",
    items: [
      { name: "Poland Spring Water 16.9oz", quantity: 4, price: 1.99 },
      { name: "Red Bull Energy 8.4oz", quantity: 2, price: 3.99 },
    ],
    subtotal: 15.94,
    tax: 1.42,
    total: 17.36,
    status: "pending",
    order_type: "pickup",
    delivery_address: null,
    notes: "Need ASAP",
    ordered_at: minutesAgo(35),
  },
  {
    id: "ord-005",
    order_number: "ORD-4825",
    customer_name: "Destiny Johnson",
    customer_email: "destiny.j@email.com",
    customer_phone: "(718) 555-0144",
    items: [
      { name: "Advil Ibuprofen 24ct", quantity: 1, price: 7.99 },
      { name: "Tissue Box 85ct", quantity: 2, price: 2.99 },
      { name: "Tropicana Orange Juice 15.2oz", quantity: 1, price: 2.99 },
      { name: "Chicken Noodle Soup", quantity: 2, price: 1.99 },
    ],
    subtotal: 21.94,
    tax: 1.95,
    total: 23.89,
    status: "pending",
    order_type: "delivery",
    delivery_address: "456 Bergen St, Apt 2A, Brooklyn, NY 11217",
    notes: "Feeling sick, please hurry",
    ordered_at: minutesAgo(42),
  },

  // ─── Accepted Orders (3) ────────────────────────────────────────────
  {
    id: "ord-006",
    order_number: "ORD-4818",
    customer_name: "Kevin Brown",
    customer_email: "kbrown@email.com",
    customer_phone: "(718) 555-0190",
    items: [
      { name: "Hot Pockets Pepperoni 2-Pack", quantity: 2, price: 3.99 },
      { name: "Coca-Cola 2 Liter", quantity: 1, price: 3.49 },
      { name: "Lay's Classic Potato Chips", quantity: 1, price: 2.99 },
    ],
    subtotal: 14.46,
    tax: 1.29,
    total: 15.75,
    status: "accepted",
    order_type: "pickup",
    delivery_address: null,
    notes: "",
    ordered_at: hoursAgo(1),
  },
  {
    id: "ord-007",
    order_number: "ORD-4817",
    customer_name: "Sandra Rivera",
    customer_email: "srivera@email.com",
    customer_phone: "(718) 555-0168",
    items: [
      { name: "Sazon Seasoning 8-Pack", quantity: 2, price: 1.99 },
      { name: "Sofrito 12oz", quantity: 1, price: 2.49 },
      { name: "Recaito Cooking Base 12oz", quantity: 1, price: 2.99 },
      { name: "Yellow Rice Mix 8oz", quantity: 3, price: 1.49 },
      { name: "Black Beans 15.5oz", quantity: 2, price: 1.49 },
    ],
    subtotal: 17.41,
    tax: 1.55,
    total: 18.96,
    status: "accepted",
    order_type: "delivery",
    delivery_address: "222 Flatbush Ave, Apt 6C, Brooklyn, NY 11217",
    notes: "Cooking for a party tonight!",
    ordered_at: hoursAgo(1),
  },
  {
    id: "ord-008",
    order_number: "ORD-4816",
    customer_name: "Derek Thompson",
    customer_email: "dthompson@email.com",
    customer_phone: "(718) 555-0205",
    items: [
      { name: "Paper Towels 2-Roll", quantity: 1, price: 6.99 },
      { name: "Toilet Paper 4-Pack", quantity: 2, price: 5.99 },
      { name: "Trash Bags 13 Gallon 15ct", quantity: 1, price: 5.49 },
      { name: "All-Purpose Cleaner 32oz", quantity: 1, price: 3.99 },
    ],
    subtotal: 28.45,
    tax: 2.53,
    total: 30.98,
    status: "accepted",
    order_type: "delivery",
    delivery_address: "98 Park Pl, Brooklyn, NY 11217",
    notes: "",
    ordered_at: hoursAgo(2),
  },

  // ─── Preparing Orders (4) ──────────────────────────────────────────
  {
    id: "ord-009",
    order_number: "ORD-4813",
    customer_name: "Lisa Chang",
    customer_email: "lchang@email.com",
    customer_phone: "(718) 555-0122",
    items: [
      { name: "Turkey Breast Deli Sliced", quantity: 1, price: 5.99 },
      { name: "Wheat Bread Loaf", quantity: 1, price: 4.49 },
      { name: "American Cheese Singles", quantity: 1, price: 4.99 },
      { name: "Tomatoes Roma (per lb)", quantity: 2, price: 1.99 },
    ],
    subtotal: 19.45,
    tax: 1.73,
    total: 21.18,
    status: "preparing",
    order_type: "pickup",
    delivery_address: null,
    notes: "Making sandwiches for the kids",
    ordered_at: hoursAgo(2),
  },
  {
    id: "ord-010",
    order_number: "ORD-4812",
    customer_name: "Marcus Williams",
    customer_email: "mwilliams@email.com",
    customer_phone: "(718) 555-0156",
    items: [
      { name: "Frozen Pizza Pepperoni", quantity: 2, price: 7.99 },
      { name: "Ice Cream Vanilla 1 Pint", quantity: 1, price: 5.99 },
      { name: "Sprite 20oz", quantity: 2, price: 2.49 },
    ],
    subtotal: 26.95,
    tax: 2.40,
    total: 29.35,
    status: "preparing",
    order_type: "delivery",
    delivery_address: "501 Carlton Ave, Brooklyn, NY 11238",
    notes: "Movie night supplies!",
    ordered_at: hoursAgo(3),
  },
  {
    id: "ord-011",
    order_number: "ORD-4811",
    customer_name: "Patricia Morales",
    customer_email: "pmorales@email.com",
    customer_phone: "(718) 555-0187",
    items: [
      { name: "Green Plantains (each)", quantity: 4, price: 0.89 },
      { name: "Chorizo Mexican Style", quantity: 1, price: 3.99 },
      { name: "Crema Mexicana", quantity: 1, price: 3.99 },
      { name: "Corn Tortillas 30ct", quantity: 1, price: 2.99 },
    ],
    subtotal: 14.53,
    tax: 1.29,
    total: 15.82,
    status: "preparing",
    order_type: "pickup",
    delivery_address: null,
    notes: "",
    ordered_at: hoursAgo(3),
  },
  {
    id: "ord-012",
    order_number: "ORD-4810",
    customer_name: "Nathan Harris",
    customer_email: "nharris@email.com",
    customer_phone: "(718) 555-0201",
    items: [
      { name: "Gatorade Cool Blue 28oz", quantity: 3, price: 2.99 },
      { name: "Beef Jerky Original", quantity: 1, price: 5.99 },
      { name: "Sunflower Seeds Original", quantity: 2, price: 2.49 },
    ],
    subtotal: 19.94,
    tax: 1.77,
    total: 21.71,
    status: "preparing",
    order_type: "delivery",
    delivery_address: "710 St. Marks Ave, Brooklyn, NY 11216",
    notes: "Game day snacks",
    ordered_at: hoursAgo(3),
  },

  // ─── Ready Orders (3) ──────────────────────────────────────────────
  {
    id: "ord-013",
    order_number: "ORD-4808",
    customer_name: "Angela Davis",
    customer_email: "adavis@email.com",
    customer_phone: "(718) 555-0133",
    items: [
      { name: "Colgate Toothpaste 6oz", quantity: 1, price: 3.99 },
      { name: "Deodorant Sport Fresh", quantity: 1, price: 5.49 },
      { name: "Hand Sanitizer 8oz", quantity: 2, price: 4.49 },
    ],
    subtotal: 18.46,
    tax: 1.64,
    total: 20.10,
    status: "ready",
    order_type: "pickup",
    delivery_address: null,
    notes: "Will pick up in 10 min",
    ordered_at: hoursAgo(4),
  },
  {
    id: "ord-014",
    order_number: "ORD-4807",
    customer_name: "Emmanuel Okafor",
    customer_email: "eokafor@email.com",
    customer_phone: "(718) 555-0172",
    items: [
      { name: "Ramen Noodles Chicken 3oz", quantity: 10, price: 0.49 },
      { name: "Large Eggs Dozen", quantity: 1, price: 4.99 },
      { name: "Arizona Iced Tea 23oz", quantity: 3, price: 1.29 },
    ],
    subtotal: 12.76,
    tax: 1.14,
    total: 13.90,
    status: "ready",
    order_type: "delivery",
    delivery_address: "88 Underhill Ave, Apt 3F, Brooklyn, NY 11238",
    notes: "",
    ordered_at: hoursAgo(4),
  },
  {
    id: "ord-015",
    order_number: "ORD-4806",
    customer_name: "Samantha Lee",
    customer_email: "slee@email.com",
    customer_phone: "(718) 555-0219",
    items: [
      { name: "Greek Yogurt Strawberry", quantity: 3, price: 1.99 },
      { name: "Oat Milk Original", quantity: 1, price: 5.49 },
      { name: "Nature Valley Granola Bar", quantity: 4, price: 1.79 },
      { name: "Bananas (per lb)", quantity: 2, price: 0.79 },
    ],
    subtotal: 20.62,
    tax: 1.84,
    total: 22.46,
    status: "ready",
    order_type: "pickup",
    delivery_address: null,
    notes: "Healthy breakfast items",
    ordered_at: hoursAgo(5),
  },

  // ─── Out For Delivery Orders (2) ───────────────────────────────────
  {
    id: "ord-016",
    order_number: "ORD-4804",
    customer_name: "Rosa Hernandez",
    customer_email: "rhernandez@email.com",
    customer_phone: "(718) 555-0145",
    items: [
      { name: "Whole Milk 1 Gallon", quantity: 1, price: 5.99 },
      { name: "Large Eggs Dozen", quantity: 2, price: 4.99 },
      { name: "Butter Unsalted", quantity: 1, price: 5.49 },
      { name: "Flour Tortillas 8ct", quantity: 2, price: 3.49 },
      { name: "Avocados (each)", quantity: 4, price: 1.99 },
    ],
    subtotal: 37.40,
    tax: 3.33,
    total: 40.73,
    status: "out_for_delivery",
    order_type: "delivery",
    delivery_address: "320 Eastern Pkwy, Apt 5D, Brooklyn, NY 11225",
    notes: "Call when outside",
    ordered_at: hoursAgo(5),
  },
  {
    id: "ord-017",
    order_number: "ORD-4803",
    customer_name: "David Kim",
    customer_email: "dkim@email.com",
    customer_phone: "(718) 555-0166",
    items: [
      { name: "Coffee Bustelo Instant 7.05oz", quantity: 1, price: 5.99 },
      { name: "Cream Cheese Original", quantity: 1, price: 3.99 },
      { name: "Bagels Plain 6-Pack", quantity: 1, price: 4.99 },
    ],
    subtotal: 14.97,
    tax: 1.33,
    total: 16.30,
    status: "out_for_delivery",
    order_type: "delivery",
    delivery_address: "155 Washington Ave, Brooklyn, NY 11205",
    notes: "Leave with doorman",
    ordered_at: hoursAgo(6),
  },

  // ─── Delivered Orders (10) ─────────────────────────────────────────
  {
    id: "ord-018",
    order_number: "ORD-4798",
    customer_name: "Jennifer Adams",
    customer_email: "jadams@email.com",
    customer_phone: "(718) 555-0129",
    items: [
      { name: "Frozen Chicken Tenders 25oz", quantity: 1, price: 8.99 },
      { name: "Frozen French Fries 28oz", quantity: 1, price: 4.99 },
      { name: "Coca-Cola 2 Liter", quantity: 1, price: 3.49 },
    ],
    subtotal: 17.47,
    tax: 1.55,
    total: 19.02,
    status: "delivered",
    order_type: "delivery",
    delivery_address: "44 Lincoln Pl, Brooklyn, NY 11217",
    notes: "",
    ordered_at: hoursAgo(8),
  },
  {
    id: "ord-019",
    order_number: "ORD-4792",
    customer_name: "Miguel Santos",
    customer_email: "msantos@email.com",
    customer_phone: "(718) 555-0183",
    items: [
      { name: "Jarritos Mandarin 12.5oz", quantity: 4, price: 1.79 },
      { name: "Takis Fuego", quantity: 2, price: 3.29 },
      { name: "Plantain Chips", quantity: 1, price: 2.49 },
    ],
    subtotal: 16.23,
    tax: 1.44,
    total: 17.67,
    status: "delivered",
    order_type: "pickup",
    delivery_address: null,
    notes: "",
    ordered_at: daysAgo(1, 2),
  },
  {
    id: "ord-020",
    order_number: "ORD-4785",
    customer_name: "Taylor Robinson",
    customer_email: "trobinson@email.com",
    customer_phone: "(718) 555-0150",
    items: [
      { name: "Laundry Detergent Pods 16ct", quantity: 1, price: 7.99 },
      { name: "Bleach 32oz", quantity: 1, price: 3.49 },
      { name: "Dish Soap Lemon 19oz", quantity: 1, price: 3.99 },
      { name: "Sponges 3-Pack", quantity: 1, price: 2.99 },
    ],
    subtotal: 18.46,
    tax: 1.64,
    total: 20.10,
    status: "delivered",
    order_type: "delivery",
    delivery_address: "671 Vanderbilt Ave, Brooklyn, NY 11238",
    notes: "Spring cleaning!",
    ordered_at: daysAgo(1, 5),
  },
  {
    id: "ord-021",
    order_number: "ORD-4778",
    customer_name: "Alicia Foster",
    customer_email: "afoster@email.com",
    customer_phone: "(718) 555-0194",
    items: [
      { name: "2% Reduced Fat Milk Half Gallon", quantity: 1, price: 3.99 },
      { name: "Shredded Mozzarella", quantity: 2, price: 4.49 },
      { name: "Pepperoni Sliced 6oz", quantity: 1, price: 3.49 },
      { name: "Frozen Pizza Pepperoni", quantity: 1, price: 7.99 },
    ],
    subtotal: 24.45,
    tax: 2.18,
    total: 26.63,
    status: "delivered",
    order_type: "delivery",
    delivery_address: "410 Sterling Pl, Apt 1, Brooklyn, NY 11238",
    notes: "",
    ordered_at: daysAgo(2, 3),
  },
  {
    id: "ord-022",
    order_number: "ORD-4770",
    customer_name: "Chris Morgan",
    customer_email: "cmorgan@email.com",
    customer_phone: "(718) 555-0207",
    items: [
      { name: "Monster Energy Original 16oz", quantity: 2, price: 3.49 },
      { name: "Hot Cheetos Limon", quantity: 1, price: 2.99 },
    ],
    subtotal: 9.97,
    tax: 0.89,
    total: 10.86,
    status: "delivered",
    order_type: "pickup",
    delivery_address: null,
    notes: "",
    ordered_at: daysAgo(2, 6),
  },
  {
    id: "ord-023",
    order_number: "ORD-4763",
    customer_name: "Fatima Al-Rashid",
    customer_email: "falrashid@email.com",
    customer_phone: "(718) 555-0161",
    items: [
      { name: "Jasmine Rice 5lb", quantity: 1, price: 6.99 },
      { name: "Chickpeas 15.5oz", quantity: 3, price: 1.49 },
      { name: "Diced Tomatoes 14.5oz", quantity: 2, price: 1.49 },
      { name: "Coconut Milk 13.5oz", quantity: 2, price: 2.49 },
      { name: "Yellow Onions 3lb Bag", quantity: 1, price: 2.99 },
      { name: "Garlic Head", quantity: 3, price: 0.99 },
    ],
    subtotal: 24.40,
    tax: 2.17,
    total: 26.57,
    status: "delivered",
    order_type: "delivery",
    delivery_address: "230 Classon Ave, Apt 8A, Brooklyn, NY 11205",
    notes: "Leave at front door, I will be home",
    ordered_at: daysAgo(3, 1),
  },
  {
    id: "ord-024",
    order_number: "ORD-4755",
    customer_name: "Brian O'Malley",
    customer_email: "bomalley@email.com",
    customer_phone: "(718) 555-0178",
    items: [
      { name: "Bacon Hardwood Smoked", quantity: 1, price: 7.49 },
      { name: "Large Eggs Dozen", quantity: 1, price: 4.99 },
      { name: "Hamburger Buns 8-Pack", quantity: 1, price: 4.49 },
      { name: "Ground Beef 80/20 1lb", quantity: 2, price: 6.99 },
    ],
    subtotal: 30.95,
    tax: 2.75,
    total: 33.70,
    status: "delivered",
    order_type: "delivery",
    delivery_address: "812 Pacific St, Brooklyn, NY 11238",
    notes: "BBQ prep",
    ordered_at: daysAgo(4, 2),
  },
  {
    id: "ord-025",
    order_number: "ORD-4748",
    customer_name: "Diana Cruz",
    customer_email: "dcruz@email.com",
    customer_phone: "(718) 555-0136",
    items: [
      { name: "Frozen Empanadas Beef 10ct", quantity: 2, price: 6.49 },
      { name: "Valentina Hot Sauce 12.5oz", quantity: 1, price: 1.99 },
      { name: "Limes (each)", quantity: 6, price: 0.50 },
    ],
    subtotal: 17.97,
    tax: 1.60,
    total: 19.57,
    status: "delivered",
    order_type: "pickup",
    delivery_address: null,
    notes: "",
    ordered_at: daysAgo(5, 3),
  },
  {
    id: "ord-026",
    order_number: "ORD-4741",
    customer_name: "Kwame Asante",
    customer_email: "kasante@email.com",
    customer_phone: "(718) 555-0214",
    items: [
      { name: "Chicken Breast Boneless 1lb", quantity: 2, price: 5.99 },
      { name: "Yellow Rice Mix 8oz", quantity: 2, price: 1.49 },
      { name: "Black Beans 15.5oz", quantity: 1, price: 1.49 },
      { name: "Adobo All-Purpose Seasoning", quantity: 1, price: 2.99 },
      { name: "Avocados (each)", quantity: 2, price: 1.99 },
    ],
    subtotal: 23.42,
    tax: 2.08,
    total: 25.50,
    status: "delivered",
    order_type: "delivery",
    delivery_address: "59 Lefferts Pl, Brooklyn, NY 11238",
    notes: "Meal prep for the week",
    ordered_at: daysAgo(5, 7),
  },
  {
    id: "ord-027",
    order_number: "ORD-4734",
    customer_name: "Vanessa Reyes",
    customer_email: "vreyes@email.com",
    customer_phone: "(718) 555-0148",
    items: [
      { name: "Pan Sobao (Puerto Rican Bread)", quantity: 2, price: 3.99 },
      { name: "Coffee Bustelo Instant 7.05oz", quantity: 1, price: 5.99 },
      { name: "Evaporated Milk 12oz", quantity: 1, price: 1.99 },
    ],
    subtotal: 15.96,
    tax: 1.42,
    total: 17.38,
    status: "delivered",
    order_type: "pickup",
    delivery_address: null,
    notes: "Desayuno para la familia",
    ordered_at: daysAgo(6, 1),
  },

  // ─── Cancelled Orders (3) ──────────────────────────────────────────
  {
    id: "ord-028",
    order_number: "ORD-4800",
    customer_name: "Alex Turner",
    customer_email: "aturner@email.com",
    customer_phone: "(718) 555-0225",
    items: [
      { name: "Modelo Especial 24oz Can", quantity: 6, price: 3.99 },
      { name: "Limes (each)", quantity: 4, price: 0.50 },
    ],
    subtotal: 25.94,
    tax: 2.31,
    total: 28.25,
    status: "cancelled",
    order_type: "delivery",
    delivery_address: "177 Myrtle Ave, Brooklyn, NY 11201",
    notes: "Cancelled - changed plans",
    ordered_at: hoursAgo(7),
  },
  {
    id: "ord-029",
    order_number: "ORD-4780",
    customer_name: "Nicole West",
    customer_email: "nwest@email.com",
    customer_phone: "(718) 555-0159",
    items: [
      { name: "Oat Milk Original", quantity: 2, price: 5.49 },
      { name: "Greek Yogurt Strawberry", quantity: 4, price: 1.99 },
    ],
    subtotal: 18.94,
    tax: 1.69,
    total: 20.63,
    status: "cancelled",
    order_type: "pickup",
    delivery_address: null,
    notes: "Customer did not show up",
    ordered_at: daysAgo(2, 4),
  },
  {
    id: "ord-030",
    order_number: "ORD-4760",
    customer_name: "Tony Russo",
    customer_email: "trusso@email.com",
    customer_phone: "(718) 555-0202",
    items: [
      { name: "Salami Genoa Sliced", quantity: 1, price: 6.49 },
      { name: "Cream Cheese Original", quantity: 1, price: 3.99 },
      { name: "Bagels Plain 6-Pack", quantity: 1, price: 4.99 },
      { name: "Tomatoes Roma (per lb)", quantity: 1, price: 1.99 },
    ],
    subtotal: 17.46,
    tax: 1.55,
    total: 19.01,
    status: "cancelled",
    order_type: "delivery",
    delivery_address: "432 Fulton St, Brooklyn, NY 11216",
    notes: "Address was wrong, could not deliver",
    ordered_at: daysAgo(3, 5),
  },
];

/**
 * Filter orders by status.
 */
export function getOrdersByStatus(status: string): Order[] {
  return DEMO_ORDERS.filter(
    (order) => order.status.toLowerCase() === status.toLowerCase()
  );
}
