import type { LucideIcon } from "lucide-react";
import {
  Monitor,
  LayoutDashboard,
  Smartphone,
  ChefHat,
  Boxes,
  Users,
  BarChart3,
  QrCode,
  RefreshCw,
  WifiOff,
  Network,
  ShieldCheck,
  CloudUpload,
  Zap,
  Printer,
  LineChart,
} from "lucide-react";

export type EcosystemItem = {
  id: string;
  name: string;
  tag: string;
  icon: LucideIcon;
  description: string;
  points: string[];
};

export const ecosystem: EcosystemItem[] = [
  {
    id: "back-office",
    name: "Back Office",
    tag: "Command Center",
    icon: LayoutDashboard,
    description:
      "A cloud command center for menus, pricing, branches, and finance — total control from any browser.",
    points: ["Menu & pricing engine", "Multi-branch control", "Live finance overview"],
  },
  {
    id: "windows-pos",
    name: "Windows POS",
    tag: "Front of House",
    icon: Monitor,
    description:
      "A lightning-fast Windows terminal built for high-volume service with full offline resilience.",
    points: ["Sub-second checkout", "Table & floor maps", "Works fully offline"],
  },
  {
    id: "mobile-pos",
    name: "Mobile POS",
    tag: "Tableside",
    icon: Smartphone,
    description:
      "Take orders and payments tableside or curbside. Fire to the kitchen the moment you tap.",
    points: ["Tableside ordering", "Tap-to-pay ready", "Instant kitchen fire"],
  },
  {
    id: "kds",
    name: "Kitchen Display",
    tag: "Back of House",
    icon: ChefHat,
    description:
      "Replace paper tickets with a smart KDS that routes, times, and prioritizes every order.",
    points: ["Station routing", "Prep timers & SLAs", "Bump-bar ready"],
  },
  {
    id: "inventory",
    name: "Inventory Management",
    tag: "Supply",
    icon: Boxes,
    description:
      "Track stock to the ingredient, automate purchase orders, and kill waste with recipe costing.",
    points: ["Recipe-level tracking", "Auto purchase orders", "Waste & variance alerts"],
  },
  {
    id: "staff",
    name: "Staff Management",
    tag: "People",
    icon: Users,
    description:
      "Schedules, clock-in, tips, and granular permissions for every role across every branch.",
    points: ["Shift scheduling", "Time & attendance", "Role-based access"],
  },
  {
    id: "reporting",
    name: "Reporting & Analytics",
    tag: "Insight",
    icon: BarChart3,
    description:
      "Real-time dashboards and exportable financials that turn service data into decisions.",
    points: ["Live sales dashboards", "Profit & loss", "Exportable reports"],
  },
  {
    id: "qr-ordering",
    name: "QR Ordering",
    tag: "Guest",
    icon: QrCode,
    description:
      "Let guests scan, browse, order, and pay from their phone — orders flow straight to the kitchen.",
    points: ["Contactless menu", "Scan-to-pay", "Direct to KDS"],
  },
];

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    icon: RefreshCw,
    title: "Real-time Synchronization",
    description:
      "Every order, edit, and payment syncs across devices and branches in milliseconds.",
  },
  {
    icon: WifiOff,
    title: "Offline Mode",
    description:
      "Internet drops, service doesn't. Keep selling offline and auto-sync when you reconnect.",
  },
  {
    icon: Network,
    title: "Multi-Branch Support",
    description:
      "Run one outlet or a thousand from a single account with per-branch controls.",
  },
  {
    icon: ShieldCheck,
    title: "Role & Permission System",
    description:
      "Granular, role-based access so every staff member sees exactly what they should.",
  },
  {
    icon: CloudUpload,
    title: "Cloud Backup",
    description:
      "Encrypted, automatic backups mean your data is always safe and instantly restorable.",
  },
  {
    icon: Zap,
    title: "Fast Performance",
    description:
      "Engineered for rush hour — sub-second response even at peak transaction volume.",
  },
  {
    icon: Printer,
    title: "Printer Integration",
    description:
      "Plug-and-play with kitchen, receipt, and label printers across every station.",
  },
  {
    icon: LineChart,
    title: "Advanced Reporting",
    description:
      "Deep analytics on sales, staff, and inventory — drill from chain to single item.",
  },
];

export type Screenshot = {
  id: string;
  title: string;
  blurb: string;
  device: "desktop" | "mobile" | "tablet";
  accent: string;
};

export const screenshots: Screenshot[] = [
  {
    id: "back-office-dashboard",
    title: "Back Office Dashboard",
    blurb: "Your entire operation, at a glance.",
    device: "desktop",
    accent: "#d4af37",
  },
  {
    id: "sales-analytics",
    title: "Sales Analytics",
    blurb: "Revenue trends, live and exportable.",
    device: "desktop",
    accent: "#5eead4",
  },
  {
    id: "table-management",
    title: "Table Management",
    blurb: "Drag-and-drop floor plans by section.",
    device: "desktop",
    accent: "#93c5fd",
  },
  {
    id: "mobile-ordering",
    title: "Mobile Ordering",
    blurb: "Fire orders from anywhere on the floor.",
    device: "mobile",
    accent: "#d4af37",
  },
  {
    id: "kitchen-orders",
    title: "Kitchen Orders Screen",
    blurb: "Smart routing and live prep timers.",
    device: "tablet",
    accent: "#fca5a5",
  },
  {
    id: "inventory-module",
    title: "Inventory Module",
    blurb: "Track stock down to the ingredient.",
    device: "desktop",
    accent: "#86efac",
  },
  {
    id: "staff-permissions",
    title: "Staff Permissions",
    blurb: "Role-based access for every member.",
    device: "desktop",
    accent: "#c4b5fd",
  },
  {
    id: "financial-reports",
    title: "Financial Reports",
    blurb: "P&L and tax-ready financials.",
    device: "desktop",
    accent: "#d4af37",
  },
];

export type Workflow = {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const workflow: Workflow[] = [
  {
    step: "01",
    title: "Customer Order",
    description: "Guest orders at the table, counter, or by scanning a QR code.",
    icon: QrCode,
  },
  {
    step: "02",
    title: "POS",
    description: "The order is captured instantly on Windows or Mobile POS.",
    icon: Monitor,
  },
  {
    step: "03",
    title: "Kitchen Display",
    description: "Tickets route automatically to the right kitchen station.",
    icon: ChefHat,
  },
  {
    step: "04",
    title: "Preparation",
    description: "Cooks track prep with live timers and SLA prioritization.",
    icon: ChefHat,
  },
  {
    step: "05",
    title: "Payment",
    description: "Settle by card, cash, or scan-to-pay — split any way.",
    icon: Smartphone,
  },
  {
    step: "06",
    title: "Reporting",
    description: "Every transaction flows straight into live analytics.",
    icon: BarChart3,
  },
];

export type Stat = {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
};

export const stats: Stat[] = [
  { value: 480, suffix: "M+", label: "Orders Processed" },
  { value: 92, suffix: "K+", label: "Active Users" },
  { value: 14, suffix: "K+", label: "Restaurants Using Senate POS" },
  { value: 99.99, suffix: "%", label: "Uptime", decimals: 2 },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Senate POS unified four branches into one dashboard. We cut closing time in half and finally trust our numbers.",
    name: "Layla Hadid",
    role: "Owner",
    company: "Cedar & Sage Group",
    initials: "LH",
  },
  {
    quote:
      "The kitchen display alone transformed our service. Tickets never get lost and ticket times dropped by 22%.",
    name: "Marcus Reyes",
    role: "General Manager",
    company: "Harbor House",
    initials: "MR",
  },
  {
    quote:
      "Offline mode saved us during an outage on our busiest night. The team didn't even notice the internet was down.",
    name: "Sofia Bianchi",
    role: "Operations Manager",
    company: "Trattoria Nove",
    initials: "SB",
  },
  {
    quote:
      "Checkout is so fast the queue never builds. New cashiers are confident within their first shift.",
    name: "Daniel Okafor",
    role: "Head Cashier",
    company: "Lumen Lounge",
    initials: "DO",
  },
  {
    quote:
      "Recipe-level inventory exposed exactly where we were losing margin. ROI in the first month.",
    name: "Amira Khan",
    role: "Owner",
    company: "Spice Route Cafe",
    initials: "AK",
  },
  {
    quote:
      "Rolling Senate POS across 30 locations was painless. Permissions and reporting scale with us.",
    name: "Thomas Becker",
    role: "Director of Operations",
    company: "Urban Plate Chain",
    initials: "TB",
  },
];

export type Plan = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  highlighted?: boolean;
  features: string[];
  cta: string;
};

export const plans: Plan[] = [
  {
    name: "Starter",
    price: "$49",
    cadence: "/ terminal / mo",
    tagline: "For single cafes and small restaurants getting started.",
    cta: "Start Free Trial",
    features: [
      "1 branch, up to 2 terminals",
      "Windows & Mobile POS",
      "Kitchen Display System",
      "Core reporting",
      "QR ordering",
      "Email support",
    ],
  },
  {
    name: "Business",
    price: "$129",
    cadence: "/ terminal / mo",
    tagline: "For growing restaurants and small chains that need more.",
    highlighted: true,
    cta: "Request Demo",
    features: [
      "Up to 10 branches",
      "Everything in Starter",
      "Inventory & recipe costing",
      "Staff scheduling & permissions",
      "Advanced analytics",
      "Priority 24/7 support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "/ tailored",
    tagline: "For large chains and franchises operating at scale.",
    cta: "Talk to Sales",
    features: [
      "Unlimited branches & terminals",
      "Everything in Business",
      "Dedicated success manager",
      "Custom integrations & API",
      "SSO & enterprise security",
      "99.99% uptime SLA",
    ],
  },
];

export const trustedLogos = [
  "Harbor House",
  "Cedar & Sage",
  "Lumen Lounge",
  "Trattoria Nove",
  "Spice Route",
  "Urban Plate",
  "The Gilded Fork",
  "Olive & Ember",
  "Nori Bar",
  "Copper Kitchen",
];

export const trustStats = [
  { value: "14K+", label: "Restaurants" },
  { value: "60+", label: "Countries" },
  { value: "480M+", label: "Orders / year" },
  { value: "4.9/5", label: "Avg. rating" },
];
