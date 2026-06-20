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
  Tablet,
  BellRing,
  BookOpen,
  Activity,
  RefreshCw,
  WifiOff,
  Network,
  ShieldCheck,
  CloudUpload,
  Zap,
  Printer,
  LineChart,
} from "lucide-react";

/**
 * Structural / non-translatable metadata. All display text lives in
 * `lib/i18n.ts` and is zipped with these arrays by index.
 */

export const ecosystemMeta: { id: string; icon: LucideIcon }[] = [
  { id: "back-office", icon: LayoutDashboard },
  { id: "windows-pos", icon: Monitor },
  { id: "mobile-pos", icon: Smartphone },
  { id: "kds", icon: ChefHat },
  { id: "inventory", icon: Boxes },
  { id: "staff", icon: Users },
  { id: "reporting", icon: BarChart3 },
  { id: "qr-ordering", icon: QrCode },
  { id: "kiosk-reservation", icon: Tablet },
  { id: "waiter-calling", icon: BellRing },
  { id: "qr-menu", icon: BookOpen },
  { id: "staff-monitoring", icon: Activity },
];

export const featureIcons: LucideIcon[] = [
  RefreshCw,
  WifiOff,
  Network,
  ShieldCheck,
  CloudUpload,
  Zap,
  Printer,
  LineChart,
];

export type ScreenshotMeta = {
  id: string;
  device: "desktop" | "mobile" | "tablet";
  accent: string;
};

export const screenshotMeta: ScreenshotMeta[] = [
  { id: "back-office-dashboard", device: "desktop", accent: "#d4af37" },
  { id: "sales-analytics", device: "desktop", accent: "#5eead4" },
  { id: "table-management", device: "desktop", accent: "#93c5fd" },
  { id: "mobile-ordering", device: "mobile", accent: "#d4af37" },
  { id: "kitchen-orders", device: "tablet", accent: "#fca5a5" },
  { id: "inventory-module", device: "desktop", accent: "#86efac" },
  { id: "staff-permissions", device: "desktop", accent: "#c4b5fd" },
  { id: "financial-reports", device: "desktop", accent: "#d4af37" },
];

export const workflowMeta: { step: string; icon: LucideIcon }[] = [
  { step: "01", icon: QrCode },
  { step: "02", icon: Monitor },
  { step: "03", icon: ChefHat },
  { step: "04", icon: ChefHat },
  { step: "05", icon: Smartphone },
  { step: "06", icon: BarChart3 },
];

export type StatMeta = { value: number; suffix: string; decimals?: number };

export const statMeta: StatMeta[] = [
  { value: 480, suffix: "M+" },
  { value: 92, suffix: "K+" },
  { value: 14, suffix: "K+" },
  { value: 99.99, suffix: "%", decimals: 2 },
];

export const planMeta: { highlighted?: boolean }[] = [
  {},
  { highlighted: true },
  {},
];

export const testimonialMeta: { name: string; company: string; initials: string }[] = [
  { name: "Layla Hadid", company: "Cedar & Sage Group", initials: "LH" },
  { name: "Marcus Reyes", company: "Harbor House", initials: "MR" },
  { name: "Sofia Bianchi", company: "Trattoria Nove", initials: "SB" },
  { name: "Daniel Okafor", company: "Lumen Lounge", initials: "DO" },
  { name: "Amira Khan", company: "Spice Route Cafe", initials: "AK" },
  { name: "Thomas Becker", company: "Urban Plate Chain", initials: "TB" },
];

/** Brand names — proper nouns, not translated. */
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

export const trustStatValues = ["14K+", "60+", "480M+", "4.9/5"];
