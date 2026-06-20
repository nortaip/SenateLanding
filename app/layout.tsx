import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = "https://senatepos.com";
const TITLE = "Senate POS — The Complete Restaurant Operating System";
const DESCRIPTION =
  "Senate POS is an enterprise-grade restaurant operating system. Manage sales, tables, kitchen operations, inventory, staff, and reporting from a single platform — across Back Office, Windows POS, Mobile POS, and Kitchen Display.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Senate POS",
  },
  description: DESCRIPTION,
  applicationName: "Senate POS",
  generator: "Next.js",
  keywords: [
    "restaurant POS",
    "restaurant operating system",
    "point of sale",
    "kitchen display system",
    "KDS",
    "restaurant management software",
    "back office management",
    "inventory management",
    "QR ordering",
    "multi-branch restaurant",
    "cloud POS",
    "Senate POS",
  ],
  authors: [{ name: "Senate POS" }],
  creator: "Senate POS",
  publisher: "Senate POS",
  alternates: { canonical: SITE_URL },
  category: "technology",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Senate POS",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@senatepos",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#081120",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Senate POS",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Windows, Android, iOS, Web",
  description: DESCRIPTION,
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "49",
    highPrice: "299",
    priceCurrency: "USD",
    offerCount: "3",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "1280",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
