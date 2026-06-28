export type Lang = "en" | "az" | "ru";

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "az", label: "Azərbaycan", short: "AZ" },
  { code: "ru", label: "Русский", short: "RU" },
];

const en = {
  nav: {
    ecosystem: "Ecosystem",
    screenshots: "Screenshots",
    features: "Features",
    pricing: "Pricing",
    about: "Company",
    signIn: "Sign in",
    requestDemo: "Request Demo",
  },
  hero: {
    badge: "The restaurant operating system, reimagined",
    headlineTop: "The Complete",
    headlineAccent: "Restaurant Operating System",
    subtitle:
      "Manage sales, tables, kitchen operations, inventory, staff, and reporting from a single platform — built for restaurants, cafes, food courts, lounges, and chains.",
    requestDemo: "Request Demo",
    watchVideo: "Watch Video",
    explore: "Explore Platform",
    note: "No credit card required · 14-day trial · Setup in under an hour",
    deviceDesktop: "Desktop Back Office",
    deviceMobile: "Mobile POS",
    deviceKitchen: "Kitchen Display",
  },
  trusted: {
    title: "Trusted by ambitious restaurants & chains worldwide",
    statLabels: ["Restaurants", "Countries", "Orders / year", "Avg. rating"],
  },
  ecosystem: {
    eyebrow: "Product Ecosystem",
    titleTop: "One platform. ",
    titleAccent: "Every part of service.",
    subtitle:
      "Senate POS isn't a single app — it's a connected ecosystem that runs the front of house, the kitchen, the back office, and everything in between.",
    items: [
      {
        name: "Back Office",
        tag: "Command Center",
        description:
          "A cloud command center for menus, pricing, branches, and finance — total control from any browser.",
        points: ["Menu & pricing engine", "Multi-branch control", "Live finance overview"],
      },
      {
        name: "Windows POS",
        tag: "Front of House",
        description:
          "A lightning-fast Windows terminal built for high-volume service with full offline resilience.",
        points: ["Sub-second checkout", "Table & floor maps", "Works fully offline"],
      },
      {
        name: "Mobile POS",
        tag: "Tableside",
        description:
          "Take orders and payments tableside or curbside. Fire to the kitchen the moment you tap.",
        points: ["Tableside ordering", "Tap-to-pay ready", "Instant kitchen fire"],
      },
      {
        name: "Kitchen Display",
        tag: "Back of House",
        description:
          "Replace paper tickets with a smart KDS that routes, times, and prioritizes every order.",
        points: ["Station routing", "Prep timers & SLAs", "Bump-bar ready"],
      },
      {
        name: "Inventory Management",
        tag: "Supply",
        description:
          "Track stock to the ingredient, automate purchase orders, and kill waste with recipe costing.",
        points: ["Recipe-level tracking", "Auto purchase orders", "Waste & variance alerts"],
      },
      {
        name: "Staff Management",
        tag: "People",
        description:
          "Schedules, clock-in, tips, and granular permissions for every role across every branch.",
        points: ["Shift scheduling", "Time & attendance", "Role-based access"],
      },
      {
        name: "Reporting & Analytics",
        tag: "Insight",
        description:
          "Real-time dashboards and exportable financials that turn service data into decisions.",
        points: ["Live sales dashboards", "Profit & loss", "Exportable reports"],
      },
      {
        name: "QR Ordering",
        tag: "Guest",
        description:
          "Let guests scan, browse, order, and pay from their phone — orders flow straight to the kitchen.",
        points: ["Contactless menu", "Scan-to-pay", "Direct to KDS"],
      },
      {
        name: "Kiosk & Reservation",
        tag: "Self-Service",
        description:
          "Self-service kiosk ordering plus table reservations and waitlists — guests order or book without waiting on staff.",
        points: ["Self-order kiosk", "Table reservations", "Walk-up & pre-order"],
      },
      {
        name: "Waiter Calling",
        tag: "Service",
        description:
          "Guests call a waiter, request the bill, or ask for help from the table — staff get instant alerts on their device.",
        points: ["One-tap call waiter", "Request bill or help", "Instant staff alerts"],
      },
      {
        name: "QR Menu",
        tag: "Guest",
        description:
          "A beautiful digital menu guests open by scanning — photos, descriptions, allergens, and prices, updated in real time.",
        points: ["Contactless digital menu", "Photos & allergen info", "Updates instantly"],
      },
      {
        name: "Staff Monitoring",
        tag: "Oversight",
        description:
          "See who did what, and when. Track logins, voids, discounts, and performance across every shift and branch.",
        points: ["Action & audit logs", "Void & discount tracking", "Per-staff performance"],
      },
    ],
  },
  screenshots: {
    eyebrow: "Product Tour",
    titleTop: "Designed to be lived in, ",
    titleAccent: "shift after shift.",
    subtitle:
      "A look inside the interfaces your team will use every day — clear, fast, and built for the pace of a real restaurant.",
    scrollHint: "Scroll to explore",
    items: [
      { title: "Back Office Dashboard", blurb: "Your entire operation, at a glance." },
      { title: "Sales Analytics", blurb: "Revenue trends, live and exportable." },
      { title: "Table Management", blurb: "Drag-and-drop floor plans by section." },
      { title: "Mobile Ordering", blurb: "Fire orders from anywhere on the floor." },
      { title: "Kitchen Orders Screen", blurb: "Smart routing and live prep timers." },
      { title: "Inventory Module", blurb: "Track stock down to the ingredient." },
      { title: "Staff Permissions", blurb: "Role-based access for every member." },
      { title: "Financial Reports", blurb: "P&L and tax-ready financials." },
    ],
  },
  spotlight: {
    eyebrow: "Deeper Dive",
    titleTop: "More than a POS — ",
    titleAccent: "a full operation.",
    subtitle:
      "Take a closer look at two of the modules operators rely on most.",
    learnMore: "Learn more",
    blocks: [
      {
        tag: "Kiosk & Reservation Mode",
        name: "Let guests serve themselves",
        description:
          "Turn any tablet into a self-service kiosk for walk-up ordering, or switch on reservation mode so guests book tables and pre-order ahead. Every kiosk order and booking flows into the same kitchen and reporting pipeline — no separate system to manage.",
        points: [
          "Self-order kiosk mode",
          "Table reservations & waitlist",
          "Pre-orders & scheduled pickup",
          "Branded, multi-language screens",
        ],
      },
      {
        tag: "Inventory Management",
        name: "Know your stock to the gram",
        description:
          "Track inventory at the ingredient level with recipe costing, automatic purchase orders at reorder points, supplier management, and full stock counts. Spot waste and variance before they eat your margin.",
        points: [
          "Recipe-level stock tracking",
          "Auto purchase orders & reorder points",
          "Supplier & cost management",
          "Stock counts, waste & variance reports",
        ],
      },
    ],
  },
  features: {
    eyebrow: "Platform Features",
    titleTop: "Enterprise muscle, ",
    titleAccent: "without the enterprise drag.",
    subtitle:
      "The capabilities serious operators demand — engineered to be invisible until the moment you need them.",
    items: [
      {
        title: "Real-time Synchronization",
        description:
          "Every order, edit, and payment syncs across devices and branches in milliseconds.",
      },
      {
        title: "Offline Mode",
        description:
          "Internet drops, service doesn't. Keep selling offline and auto-sync when you reconnect.",
      },
      {
        title: "Multi-Branch Support",
        description:
          "Run one outlet or a thousand from a single account with per-branch controls.",
      },
      {
        title: "Role & Permission System",
        description:
          "Granular, role-based access so every staff member sees exactly what they should.",
      },
      {
        title: "Cloud Backup",
        description:
          "Encrypted, automatic backups mean your data is always safe and instantly restorable.",
      },
      {
        title: "Fast Performance",
        description:
          "Engineered for rush hour — sub-second response even at peak transaction volume.",
      },
      {
        title: "Printer Integration",
        description:
          "Plug-and-play with kitchen, receipt, and label printers across every station.",
      },
      {
        title: "Advanced Reporting",
        description:
          "Deep analytics on sales, staff, and inventory — drill from chain to single item.",
      },
    ],
  },
  workflow: {
    eyebrow: "How It Works",
    titleTop: "From the first tap to ",
    titleAccent: "the final report.",
    subtitle:
      "Every order flows through one connected pipeline — no double entry, no lost tickets, no blind spots.",
    items: [
      { title: "Customer Order", description: "Guest orders at the table, counter, or by scanning a QR code." },
      { title: "POS", description: "The order is captured instantly on Windows or Mobile POS." },
      { title: "Kitchen Display", description: "Tickets route automatically to the right kitchen station." },
      { title: "Preparation", description: "Cooks track prep with live timers and SLA prioritization." },
      { title: "Payment", description: "Settle by card, cash, or scan-to-pay — split any way." },
      { title: "Reporting", description: "Every transaction flows straight into live analytics." },
    ],
  },
  stats: {
    labels: ["Orders Processed", "Active Users", "Restaurants Using Senate POS", "Uptime"],
  },
  testimonials: {
    eyebrow: "Loved by Operators",
    titleTop: "Owners, managers, and cashiers ",
    titleAccent: "all agree.",
    subtitle:
      "From single-location cafes to 30-branch chains, teams run smoother on Senate POS.",
    items: [
      {
        quote:
          "Senate POS unified four branches into one dashboard. We cut closing time in half and finally trust our numbers.",
        role: "Owner",
      },
      {
        quote:
          "The kitchen display alone transformed our service. Tickets never get lost and ticket times dropped by 22%.",
        role: "General Manager",
      },
      {
        quote:
          "Offline mode saved us during an outage on our busiest night. The team didn't even notice the internet was down.",
        role: "Operations Manager",
      },
      {
        quote:
          "Checkout is so fast the queue never builds. New cashiers are confident within their first shift.",
        role: "Head Cashier",
      },
      {
        quote:
          "Recipe-level inventory exposed exactly where we were losing margin. ROI in the first month.",
        role: "Owner",
      },
      {
        quote:
          "Rolling Senate POS across 30 locations was painless. Permissions and reporting scale with us.",
        role: "Director of Operations",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    titleTop: "Plans that scale ",
    titleAccent: "from one table to a thousand.",
    subtitle:
      "Transparent pricing with no hidden fees. Start free, upgrade when you're ready.",
    mostPopular: "Most Popular",
    footnote:
      "All plans include real-time sync, offline mode, cloud backup, and free updates.",
    plans: [
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
    ],
  },
  finalCta: {
    titleTop: "Ready to Transform Your ",
    titleAccent: "Restaurant Operations?",
    subtitle:
      "Join 14,000+ restaurants running smarter, faster service on Senate POS. See the full platform in action.",
    requestDemo: "Request Demo",
    watchVideo: "Watch Video",
    learnMore: "Learn More",
    note: "14-day free trial · No credit card · Cancel anytime",
  },
  about: {
    eyebrow: "About Senate Group",
    titleTop: "The team behind ",
    titleAccent: "Senate POS.",
    description:
      "Senate POS is the flagship restaurant platform from Senate Group — a hospitality technology company on a mission to give every restaurant, cafe, and chain the tools enterprise giants take for granted. We build one connected ecosystem, backed by hands-on local support, so operators can focus on what they do best: hospitality.",
    pillars: [
      {
        title: "Hospitality-first",
        description: "Built with and for restaurant operators — every feature earns its place on a real floor.",
      },
      {
        title: "One connected ecosystem",
        description: "POS, kitchen, inventory, staff, and guest tools that genuinely talk to each other.",
      },
      {
        title: "Local, hands-on support",
        description: "Onboarding, training, and support from people who answer when you need them.",
      },
      {
        title: "Always improving",
        description: "Continuous updates shaped by feedback from thousands of daily users.",
      },
    ],
  },
  footer: {
    brandDesc:
      "The complete restaurant operating system. One platform to run sales, kitchen, inventory, staff, and reporting.",
    columns: [
      {
        title: "Products",
        links: ["Back Office", "Windows POS", "Mobile POS", "Kitchen Display", "Inventory", "QR Ordering"],
      },
      {
        title: "Documentation",
        links: ["Getting Started", "Guides", "API Reference", "Integrations", "Changelog", "Status"],
      },
      {
        title: "Support",
        links: ["Help Center", "Community", "Training", "Onboarding", "System Status", "Security"],
      },
      {
        title: "Contact",
        links: ["Contact Us", "Talk to Sales", "Partnerships", "Careers", "Press Kit", "About Us"],
      },
    ],
    copyright: "© {year} Senate POS. All rights reserved.",
    legal: ["Privacy Policy", "Terms of Service", "Cookies"],
  },
};

export type Dict = typeof en;

const az: Dict = {
  nav: {
    ecosystem: "Ekosistem",
    screenshots: "Ekran Görüntüləri",
    features: "İmkanlar",
    pricing: "Qiymətlər",
    about: "Şirkət",
    signIn: "Daxil ol",
    requestDemo: "Demo Tələb Et",
  },
  hero: {
    badge: "Restoran əməliyyat sistemi yenidən düşünüldü",
    headlineTop: "Tam",
    headlineAccent: "Restoran Əməliyyat Sistemi",
    subtitle:
      "Satışları, masaları, mətbəx əməliyyatlarını, anbarı, işçi heyətini və hesabatları vahid platformadan idarə edin — restoranlar, kafelər, yemək məkanları, lonçlar və şəbəkələr üçün hazırlanıb.",
    requestDemo: "Demo Tələb Et",
    watchVideo: "Videoya Bax",
    explore: "Platformanı Kəşf Et",
    note: "Kart tələb olunmur · 14 günlük sınaq · Bir saatdan az quraşdırma",
    deviceDesktop: "Masaüstü Back Office",
    deviceMobile: "Mobil POS",
    deviceKitchen: "Mətbəx Ekranı",
  },
  trusted: {
    title: "Dünya üzrə iddialı restoranlar və şəbəkələr tərəfindən etibar edilir",
    statLabels: ["Restoran", "Ölkə", "Sifariş / il", "Orta reytinq"],
  },
  ecosystem: {
    eyebrow: "Məhsul Ekosistemi",
    titleTop: "Bir platforma. ",
    titleAccent: "Xidmətin hər hissəsi.",
    subtitle:
      "Senate POS tək bir tətbiq deyil — o, zalı, mətbəxi, back office-i və aralarındakı hər şeyi idarə edən birləşmiş ekosistemdir.",
    items: [
      {
        name: "Back Office",
        tag: "İdarəetmə Mərkəzi",
        description:
          "Menyular, qiymətlər, filiallar və maliyyə üçün bulud idarəetmə mərkəzi — istənilən brauzerdən tam nəzarət.",
        points: ["Menyu və qiymət mühərriki", "Çoxfilial nəzarəti", "Canlı maliyyə icmalı"],
      },
      {
        name: "Windows POS",
        tag: "Zal",
        description:
          "Yüksək həcmli xidmət üçün yaradılmış, tam oflayn dayanıqlığa malik ildırım sürətli Windows terminalı.",
        points: ["Saniyəaltı ödəniş", "Masa və zal sxemləri", "Tam oflayn işləyir"],
      },
      {
        name: "Mobil POS",
        tag: "Masada",
        description:
          "Sifariş və ödənişləri masada və ya çöldə qəbul edin. Toxunan kimi mətbəxə göndərin.",
        points: ["Masada sifariş", "Toxun-və-ödə hazır", "Ani mətbəx göndərişi"],
      },
      {
        name: "Mətbəx Ekranı",
        tag: "Mətbəx",
        description:
          "Kağız çekləri hər sifarişi yönləndirən, vaxtını ölçən və prioritetləşdirən ağıllı KDS ilə əvəz edin.",
        points: ["Stansiya yönləndirməsi", "Hazırlıq taymerləri və SLA", "Bump-bar dəstəyi"],
      },
      {
        name: "Anbar İdarəetməsi",
        tag: "Təchizat",
        description:
          "Ehtiyatı inqrediyent səviyyəsində izləyin, satınalma sifarişlərini avtomatlaşdırın və resept maya dəyəri ilə itkiləri aradan qaldırın.",
        points: ["Resept səviyyəsində izləmə", "Avtomatik satınalma sifarişləri", "İtki və fərq xəbərdarlıqları"],
      },
      {
        name: "İşçi İdarəetməsi",
        tag: "İnsanlar",
        description:
          "Hər filialda hər rol üçün cədvəllər, qeydiyyat, bəxşişlər və dəqiq icazələr.",
        points: ["Növbə planlaması", "Vaxt və davamiyyət", "Rola əsaslanan giriş"],
      },
      {
        name: "Hesabat və Analitika",
        tag: "Təhlil",
        description:
          "Xidmət məlumatlarını qərarlara çevirən real vaxt panelləri və ixrac edilə bilən maliyyə hesabatları.",
        points: ["Canlı satış panelləri", "Mənfəət və zərər", "İxrac edilə bilən hesabatlar"],
      },
      {
        name: "QR Sifariş",
        tag: "Qonaq",
        description:
          "Qonaqlar telefonlarından skan edib, baxıb, sifariş verib ödəsinlər — sifarişlər birbaşa mətbəxə axır.",
        points: ["Təmassız menyu", "Skan-və-ödə", "Birbaşa KDS-ə"],
      },
      {
        name: "Kiosk və Rezervasiya",
        tag: "Self-Servis",
        description:
          "Self-servis kiosk sifarişi, masa rezervasiyası və növbə — qonaqlar işçini gözləmədən sifariş verir və ya yer ayırdır.",
        points: ["Self-sifariş kioskı", "Masa rezervasiyası", "Gəliş və ön-sifariş"],
      },
      {
        name: "Ofisiant Çağırma",
        tag: "Xidmət",
        description:
          "Qonaqlar masadan ofisiant çağırır, hesab istəyir və ya kömək tələb edir — işçilər cihazlarında ani bildiriş alır.",
        points: ["Bir toxunuşla ofisiant", "Hesab və ya kömək istəyi", "Ani işçi bildirişi"],
      },
      {
        name: "QR Menyu",
        tag: "Qonaq",
        description:
          "Qonaqların skan edib açdığı gözəl rəqəmsal menyu — şəkillər, təsvirlər, allergenlər və qiymətlər real vaxtda yenilənir.",
        points: ["Təmassız rəqəmsal menyu", "Şəkil və allergen məlumatı", "Ani yenilənmə"],
      },
      {
        name: "İşçi Nəzarəti",
        tag: "Nəzarət",
        description:
          "Kimin nə vaxt nə etdiyini görün. Girişləri, ləğvləri, endirimləri və performansı hər növbə və filial üzrə izləyin.",
        points: ["Əməliyyat və audit jurnalı", "Ləğv və endirim izləməsi", "İşçi üzrə performans"],
      },
    ],
  },
  screenshots: {
    eyebrow: "Məhsul Turu",
    titleTop: "İçində yaşamaq üçün dizayn edilib, ",
    titleAccent: "növbədən növbəyə.",
    subtitle:
      "Komandanızın hər gün istifadə edəcəyi interfeyslərə bir baxış — aydın, sürətli və real restoran tempi üçün qurulub.",
    scrollHint: "Kəşf etmək üçün sürüşdürün",
    items: [
      { title: "Back Office Paneli", blurb: "Bütün əməliyyatınız bir baxışda." },
      { title: "Satış Analitikası", blurb: "Gəlir trendləri, canlı və ixrac edilə bilən." },
      { title: "Masa İdarəetməsi", blurb: "Bölmələr üzrə sürüklə-burax zal sxemləri." },
      { title: "Mobil Sifariş", blurb: "Zalın istənilən yerindən sifariş göndərin." },
      { title: "Mətbəx Sifarişləri Ekranı", blurb: "Ağıllı yönləndirmə və canlı hazırlıq taymerləri." },
      { title: "Anbar Modulu", blurb: "Ehtiyatı inqrediyent səviyyəsinə qədər izləyin." },
      { title: "İşçi İcazələri", blurb: "Hər üzv üçün rola əsaslanan giriş." },
      { title: "Maliyyə Hesabatları", blurb: "Mənfəət/zərər və vergiyə hazır hesabatlar." },
    ],
  },
  spotlight: {
    eyebrow: "Daha Ətraflı",
    titleTop: "Sadəcə POS deyil — ",
    titleAccent: "tam əməliyyat.",
    subtitle:
      "Operatorların ən çox güvəndiyi iki modula daha yaxından baxın.",
    learnMore: "Ətraflı",
    blocks: [
      {
        tag: "Kiosk və Rezervasiya Rejimi",
        name: "Qonaqlar özləri sifariş versin",
        description:
          "İstənilən planşeti gəliş sifarişləri üçün self-servis kioska çevirin və ya rezervasiya rejimini aktiv edin ki, qonaqlar masa ayırtsın və əvvəlcədən sifariş versin. Hər kiosk sifarişi və rezervasiya eyni mətbəx və hesabat axınına düşür — idarə ediləcək ayrı sistem yoxdur.",
        points: [
          "Self-sifariş kiosk rejimi",
          "Masa rezervasiyası və növbə",
          "Ön-sifariş və planlı götürmə",
          "Brendli, çoxdilli ekranlar",
        ],
      },
      {
        tag: "Anbar İdarəetməsi",
        name: "Ehtiyatınızı qrama qədər bilin",
        description:
          "Ehtiyatı resept maya dəyəri, yenidən sifariş nöqtələrində avtomatik satınalma, təchizatçı idarəetməsi və tam inventarizasiya ilə inqrediyent səviyyəsində izləyin. İtki və fərqi marjanızı yeməmişdən aşkarlayın.",
        points: [
          "Resept səviyyəsində izləmə",
          "Avtomatik satınalma və yenidən sifariş nöqtələri",
          "Təchizatçı və xərc idarəetməsi",
          "İnventarizasiya, itki və fərq hesabatları",
        ],
      },
    ],
  },
  features: {
    eyebrow: "Platforma İmkanları",
    titleTop: "Korporativ güc, ",
    titleAccent: "korporativ əziyyət olmadan.",
    subtitle:
      "Ciddi operatorların tələb etdiyi imkanlar — onlara ehtiyacınız olan ana qədər görünməz olacaq şəkildə hazırlanıb.",
    items: [
      {
        title: "Real Vaxt Sinxronizasiyası",
        description:
          "Hər sifariş, dəyişiklik və ödəniş cihazlar və filiallar arasında millisaniyələrdə sinxronlaşır.",
      },
      {
        title: "Oflayn Rejim",
        description:
          "İnternet kəsilir, xidmət yox. Oflayn satışa davam edin və yenidən qoşulanda avtomatik sinxronlaşdırın.",
      },
      {
        title: "Çoxfilial Dəstəyi",
        description:
          "Bir filialı və ya minini vahid hesabdan, filial üzrə nəzarətlə idarə edin.",
      },
      {
        title: "Rol və İcazə Sistemi",
        description:
          "Dəqiq, rola əsaslanan giriş — hər işçi tam görməli olduğunu görür.",
      },
      {
        title: "Bulud Ehtiyat Nüsxəsi",
        description:
          "Şifrələnmiş, avtomatik ehtiyat nüsxələri məlumatlarınızın həmişə təhlükəsiz və ani bərpa edilə bilən olmasını təmin edir.",
      },
      {
        title: "Sürətli Performans",
        description:
          "Ən qızğın saatlar üçün hazırlanıb — pik əməliyyat həcmində belə saniyəaltı reaksiya.",
      },
      {
        title: "Printer İnteqrasiyası",
        description:
          "Hər stansiyada mətbəx, çek və etiket printerləri ilə qoş-və-işlət.",
      },
      {
        title: "Qabaqcıl Hesabat",
        description:
          "Satış, işçi və anbar üzrə dərin analitika — şəbəkədən tək məhsula qədər təhlil edin.",
      },
    ],
  },
  workflow: {
    eyebrow: "Necə İşləyir",
    titleTop: "İlk toxunuşdan ",
    titleAccent: "son hesabata qədər.",
    subtitle:
      "Hər sifariş vahid birləşmiş boru kəmərindən keçir — ikiqat daxiletmə yox, itən çek yox, kor nöqtə yox.",
    items: [
      { title: "Müştəri Sifarişi", description: "Qonaq masada, kassada və ya QR kodu skan edərək sifariş verir." },
      { title: "POS", description: "Sifariş Windows və ya Mobil POS-da ani qeydə alınır." },
      { title: "Mətbəx Ekranı", description: "Çeklər avtomatik olaraq doğru mətbəx stansiyasına yönlənir." },
      { title: "Hazırlıq", description: "Aşpazlar hazırlığı canlı taymerlər və SLA prioritetləşdirməsi ilə izləyir." },
      { title: "Ödəniş", description: "Kart, nağd və ya skan-və-ödə ilə hesablaşın — istənilən şəkildə bölün." },
      { title: "Hesabat", description: "Hər əməliyyat birbaşa canlı analitikaya axır." },
    ],
  },
  stats: {
    labels: ["İşlənmiş Sifariş", "Aktiv İstifadəçi", "Senate POS İstifadə Edən Restoran", "İşləmə Müddəti"],
  },
  testimonials: {
    eyebrow: "Operatorlar Tərəfindən Sevilir",
    titleTop: "Sahiblər, menecerlər və kassirlər ",
    titleAccent: "hamısı razıdır.",
    subtitle:
      "Tək məkanlı kafelərdən 30 filiallı şəbəkələrə qədər komandalar Senate POS ilə daha rahat işləyir.",
    items: [
      {
        quote:
          "Senate POS dörd filialı bir panelə birləşdirdi. Bağlanış vaxtını yarıya endirdik və nəhayət rəqəmlərimizə güvənirik.",
        role: "Sahib",
      },
      {
        quote:
          "Təkcə mətbəx ekranı xidmətimizi dəyişdi. Çeklər heç vaxt itmir və çek vaxtları 22% azaldı.",
        role: "Baş Menecer",
      },
      {
        quote:
          "Oflayn rejim ən yüklü gecəmizdə kəsilmə zamanı bizi xilas etdi. Komanda internetin kəsildiyini hiss belə etmədi.",
        role: "Əməliyyat Meneceri",
      },
      {
        quote:
          "Ödəniş o qədər sürətlidir ki, növbə heç vaxt yığılmır. Yeni kassirlər ilk növbələrində özlərinə əmin olurlar.",
        role: "Baş Kassir",
      },
      {
        quote:
          "Resept səviyyəsində anbar marjanı tam harada itirdiyimizi göstərdi. İlk ayda investisiya özünü çıxardı.",
        role: "Sahib",
      },
      {
        quote:
          "Senate POS-u 30 məkanda tətbiq etmək problemsiz oldu. İcazələr və hesabatlar bizimlə birlikdə miqyaslanır.",
        role: "Əməliyyatlar Direktoru",
      },
    ],
  },
  pricing: {
    eyebrow: "Qiymətlər",
    titleTop: "Bir masadan minə qədər ",
    titleAccent: "miqyaslanan planlar.",
    subtitle:
      "Gizli ödənişsiz şəffaf qiymətlər. Pulsuz başlayın, hazır olduqda yüksəldin.",
    mostPopular: "Ən Populyar",
    footnote:
      "Bütün planlara real vaxt sinxronizasiyası, oflayn rejim, bulud ehtiyat nüsxəsi və pulsuz yeniləmələr daxildir.",
    plans: [
      {
        name: "Başlanğıc",
        price: "$49",
        cadence: "/ terminal / ay",
        tagline: "İşə başlayan tək kafe və kiçik restoranlar üçün.",
        cta: "Pulsuz Sınağa Başla",
        features: [
          "1 filial, 2 terminala qədər",
          "Windows və Mobil POS",
          "Mətbəx Ekranı Sistemi",
          "Əsas hesabatlar",
          "QR sifariş",
          "E-poçt dəstəyi",
        ],
      },
      {
        name: "Biznes",
        price: "$129",
        cadence: "/ terminal / ay",
        tagline: "Daha çoxa ehtiyacı olan böyüyən restoran və kiçik şəbəkələr üçün.",
        cta: "Demo Tələb Et",
        features: [
          "10 filiala qədər",
          "Başlanğıcdakı hər şey",
          "Anbar və resept maya dəyəri",
          "İşçi planlaması və icazələr",
          "Qabaqcıl analitika",
          "Prioritet 24/7 dəstək",
        ],
      },
      {
        name: "Korporativ",
        price: "Fərdi",
        cadence: "/ fərdi",
        tagline: "Geniş miqyasda işləyən böyük şəbəkə və franşizalar üçün.",
        cta: "Satışla Əlaqə",
        features: [
          "Limitsiz filial və terminal",
          "Biznesdəki hər şey",
          "Fərdi uğur meneceri",
          "Fərdi inteqrasiyalar və API",
          "SSO və korporativ təhlükəsizlik",
          "99.99% işləmə SLA",
        ],
      },
    ],
  },
  finalCta: {
    titleTop: "Restoran Əməliyyatlarınızı ",
    titleAccent: "Dəyişməyə Hazırsınız?",
    subtitle:
      "Senate POS-da daha ağıllı, daha sürətli xidmət göstərən 14,000+ restorana qoşulun. Platformanı tam fəaliyyətdə görün.",
    requestDemo: "Demo Tələb Et",
    watchVideo: "Videoya Bax",
    learnMore: "Ətraflı",
    note: "14 günlük pulsuz sınaq · Kart yoxdur · İstənilən vaxt ləğv edin",
  },
  about: {
    eyebrow: "Senate Group Haqqında",
    titleTop: "Senate POS-un ",
    titleAccent: "arxasındakı komanda.",
    description:
      "Senate POS — Senate Group-un flaqman restoran platformasıdır. Senate Group qonaqpərvərlik texnologiyaları şirkətidir; məqsədimiz hər restorana, kafeyə və şəbəkəyə nəhəng korporasiyaların adi saydığı alətləri verməkdir. Biz vahid, birləşmiş ekosistem qururuq və canlı yerli dəstəklə operatorların ən yaxşı bacardıqları işə — qonaqpərvərliyə fokuslanmasına imkan veririk.",
    pillars: [
      {
        title: "Əvvəlcə qonaqpərvərlik",
        description: "Restoran operatorları ilə və onlar üçün qurulub — hər funksiya real zalda yerini qazanır.",
      },
      {
        title: "Vahid birləşmiş ekosistem",
        description: "Bir-biri ilə həqiqətən danışan POS, mətbəx, anbar, işçi və qonaq alətləri.",
      },
      {
        title: "Yerli, canlı dəstək",
        description: "Ehtiyacınız olanda cavab verən insanlardan adaptasiya, təlim və dəstək.",
      },
      {
        title: "Daim təkmilləşir",
        description: "Minlərlə gündəlik istifadəçinin rəyi ilə formalaşan davamlı yeniləmələr.",
      },
    ],
  },
  footer: {
    brandDesc:
      "Tam restoran əməliyyat sistemi. Satış, mətbəx, anbar, işçi və hesabatları idarə etmək üçün vahid platforma.",
    columns: [
      {
        title: "Məhsullar",
        links: ["Back Office", "Windows POS", "Mobil POS", "Mətbəx Ekranı", "Anbar", "QR Sifariş"],
      },
      {
        title: "Sənədləşmə",
        links: ["Başlanğıc", "Bələdçilər", "API Sənədləri", "İnteqrasiyalar", "Dəyişiklik Jurnalı", "Status"],
      },
      {
        title: "Dəstək",
        links: ["Yardım Mərkəzi", "İcma", "Təlim", "Adaptasiya", "Sistem Statusu", "Təhlükəsizlik"],
      },
      {
        title: "Əlaqə",
        links: ["Bizimlə Əlaqə", "Satışla Əlaqə", "Tərəfdaşlıqlar", "Karyera", "Press Kit", "Haqqımızda"],
      },
    ],
    copyright: "© {year} Senate POS. Bütün hüquqlar qorunur.",
    legal: ["Məxfilik Siyasəti", "İstifadə Şərtləri", "Kukilər"],
  },
};

const ru: Dict = {
  nav: {
    ecosystem: "Экосистема",
    screenshots: "Скриншоты",
    features: "Возможности",
    pricing: "Цены",
    about: "Компания",
    signIn: "Войти",
    requestDemo: "Запросить демо",
  },
  hero: {
    badge: "Операционная система ресторана — переосмыслено",
    headlineTop: "Полноценная",
    headlineAccent: "операционная система ресторана",
    subtitle:
      "Управляйте продажами, столами, кухонными операциями, складом, персоналом и отчётностью с единой платформы — создано для ресторанов, кафе, фуд-кортов, лаунджей и сетей.",
    requestDemo: "Запросить демо",
    watchVideo: "Смотреть видео",
    explore: "Изучить платформу",
    note: "Без кредитной карты · 14 дней пробного периода · Настройка менее чем за час",
    deviceDesktop: "Десктоп Back Office",
    deviceMobile: "Мобильный POS",
    deviceKitchen: "Кухонный дисплей",
  },
  trusted: {
    title: "Нам доверяют амбициозные рестораны и сети по всему миру",
    statLabels: ["Ресторанов", "Стран", "Заказов / год", "Средний рейтинг"],
  },
  ecosystem: {
    eyebrow: "Экосистема продукта",
    titleTop: "Одна платформа. ",
    titleAccent: "Каждая часть сервиса.",
    subtitle:
      "Senate POS — это не отдельное приложение, а единая экосистема, которая управляет залом, кухней, бэк-офисом и всем, что между ними.",
    items: [
      {
        name: "Back Office",
        tag: "Центр управления",
        description:
          "Облачный центр управления меню, ценами, филиалами и финансами — полный контроль из любого браузера.",
        points: ["Движок меню и цен", "Управление филиалами", "Финансы в реальном времени"],
      },
      {
        name: "Windows POS",
        tag: "Зал",
        description:
          "Молниеносный Windows-терминал для высокой нагрузки с полной автономной работой.",
        points: ["Оплата за доли секунды", "Схемы столов и зала", "Работает полностью офлайн"],
      },
      {
        name: "Мобильный POS",
        tag: "У стола",
        description:
          "Принимайте заказы и оплату у стола или на улице. Отправка на кухню одним касанием.",
        points: ["Заказ у стола", "Поддержка tap-to-pay", "Мгновенная отправка на кухню"],
      },
      {
        name: "Кухонный дисплей",
        tag: "Кухня",
        description:
          "Замените бумажные чеки умной системой KDS, которая маршрутизирует, отслеживает и приоритизирует каждый заказ.",
        points: ["Маршрутизация по станциям", "Таймеры и SLA", "Поддержка bump-bar"],
      },
      {
        name: "Управление складом",
        tag: "Снабжение",
        description:
          "Отслеживайте запасы до ингредиента, автоматизируйте заказы поставщикам и устраняйте потери с расчётом себестоимости рецептов.",
        points: ["Учёт на уровне рецептов", "Авто-заказы поставщикам", "Оповещения о потерях"],
      },
      {
        name: "Управление персоналом",
        tag: "Люди",
        description:
          "Графики, отметки прихода, чаевые и детальные права для каждой роли во всех филиалах.",
        points: ["Планирование смен", "Учёт рабочего времени", "Доступ по ролям"],
      },
      {
        name: "Отчёты и аналитика",
        tag: "Аналитика",
        description:
          "Дашборды в реальном времени и экспортируемая финансовая отчётность, превращающие данные в решения.",
        points: ["Живые дашборды продаж", "Прибыль и убытки", "Экспортируемые отчёты"],
      },
      {
        name: "QR-заказ",
        tag: "Гость",
        description:
          "Гости сканируют, просматривают, заказывают и оплачивают со своего телефона — заказы сразу попадают на кухню.",
        points: ["Бесконтактное меню", "Сканируй и плати", "Напрямую в KDS"],
      },
      {
        name: "Киоск и бронирование",
        tag: "Самообслуживание",
        description:
          "Самозаказ через киоск, бронирование столов и лист ожидания — гости заказывают или бронируют без ожидания персонала.",
        points: ["Киоск самозаказа", "Бронирование столов", "Приём и предзаказ"],
      },
      {
        name: "Вызов официанта",
        tag: "Сервис",
        description:
          "Гости вызывают официанта, просят счёт или помощь прямо со стола — персонал получает мгновенные уведомления на устройство.",
        points: ["Вызов официанта в одно касание", "Запрос счёта или помощи", "Мгновенные уведомления"],
      },
      {
        name: "QR-меню",
        tag: "Гость",
        description:
          "Красивое цифровое меню, которое гости открывают сканированием — фото, описания, аллергены и цены обновляются в реальном времени.",
        points: ["Бесконтактное цифровое меню", "Фото и данные об аллергенах", "Мгновенные обновления"],
      },
      {
        name: "Контроль персонала",
        tag: "Надзор",
        description:
          "Видно, кто и что сделал и когда. Отслеживайте входы, отмены, скидки и эффективность по каждой смене и филиалу.",
        points: ["Журналы действий и аудита", "Учёт отмен и скидок", "Эффективность по сотрудникам"],
      },
    ],
  },
  screenshots: {
    eyebrow: "Обзор продукта",
    titleTop: "Создано, чтобы работать в нём, ",
    titleAccent: "смену за сменой.",
    subtitle:
      "Загляните в интерфейсы, которыми ваша команда будет пользоваться каждый день — понятные, быстрые и созданные для ритма настоящего ресторана.",
    scrollHint: "Прокрутите, чтобы изучить",
    items: [
      { title: "Панель Back Office", blurb: "Вся ваша работа с одного взгляда." },
      { title: "Аналитика продаж", blurb: "Тренды выручки, вживую и на экспорт." },
      { title: "Управление столами", blurb: "Схемы зала по секциям перетаскиванием." },
      { title: "Мобильный заказ", blurb: "Отправляйте заказы из любой точки зала." },
      { title: "Экран кухонных заказов", blurb: "Умная маршрутизация и таймеры готовки." },
      { title: "Модуль склада", blurb: "Учёт запасов вплоть до ингредиента." },
      { title: "Права персонала", blurb: "Доступ по ролям для каждого сотрудника." },
      { title: "Финансовые отчёты", blurb: "P&L и отчётность, готовая для налоговой." },
    ],
  },
  spotlight: {
    eyebrow: "Подробнее",
    titleTop: "Больше чем POS — ",
    titleAccent: "целая операционная система.",
    subtitle:
      "Рассмотрите ближе два модуля, на которые операторы полагаются больше всего.",
    learnMore: "Подробнее",
    blocks: [
      {
        tag: "Режим киоска и бронирования",
        name: "Дайте гостям обслуживать себя",
        description:
          "Превратите любой планшет в киоск самообслуживания для заказов на месте или включите режим бронирования, чтобы гости резервировали столы и заказывали заранее. Каждый заказ с киоска и бронь попадают в тот же кухонный и отчётный конвейер — отдельной системой управлять не нужно.",
        points: [
          "Режим киоска самозаказа",
          "Бронирование столов и лист ожидания",
          "Предзаказы и запланированный самовывоз",
          "Брендированные многоязычные экраны",
        ],
      },
      {
        tag: "Управление складом",
        name: "Знайте остатки до грамма",
        description:
          "Отслеживайте запасы на уровне ингредиентов с расчётом себестоимости рецептов, авто-заказами при достижении точки пополнения, управлением поставщиками и полной инвентаризацией. Замечайте потери и расхождения, пока они не съели вашу маржу.",
        points: [
          "Учёт остатков на уровне рецептов",
          "Авто-заказы и точки пополнения",
          "Управление поставщиками и затратами",
          "Инвентаризации, отчёты о потерях и расхождениях",
        ],
      },
    ],
  },
  features: {
    eyebrow: "Возможности платформы",
    titleTop: "Корпоративная мощь ",
    titleAccent: "без корпоративной волокиты.",
    subtitle:
      "Возможности, которые нужны серьёзным операторам — спроектированы так, чтобы быть незаметными до момента, когда они понадобятся.",
    items: [
      {
        title: "Синхронизация в реальном времени",
        description:
          "Каждый заказ, изменение и платёж синхронизируются между устройствами и филиалами за миллисекунды.",
      },
      {
        title: "Автономный режим",
        description:
          "Интернет пропадает — сервис нет. Продавайте офлайн и синхронизируйтесь автоматически при подключении.",
      },
      {
        title: "Поддержка нескольких филиалов",
        description:
          "Управляйте одной точкой или тысячей из одного аккаунта с настройками по филиалам.",
      },
      {
        title: "Система ролей и прав",
        description:
          "Детальный доступ по ролям, чтобы каждый сотрудник видел именно то, что должен.",
      },
      {
        title: "Облачное резервное копирование",
        description:
          "Зашифрованные автоматические бэкапы — ваши данные всегда в безопасности и мгновенно восстановимы.",
      },
      {
        title: "Высокая производительность",
        description:
          "Создано для часа пик — отклик менее секунды даже при пиковой нагрузке.",
      },
      {
        title: "Интеграция с принтерами",
        description:
          "Plug-and-play с кухонными, чековыми и этикеточными принтерами на каждой станции.",
      },
      {
        title: "Расширенная отчётность",
        description:
          "Глубокая аналитика по продажам, персоналу и складу — от сети до отдельной позиции.",
      },
    ],
  },
  workflow: {
    eyebrow: "Как это работает",
    titleTop: "От первого касания ",
    titleAccent: "до финального отчёта.",
    subtitle:
      "Каждый заказ проходит через единый связанный конвейер — без двойного ввода, потерянных чеков и слепых зон.",
    items: [
      { title: "Заказ гостя", description: "Гость заказывает за столом, на кассе или сканируя QR-код." },
      { title: "POS", description: "Заказ мгновенно фиксируется в Windows или мобильном POS." },
      { title: "Кухонный дисплей", description: "Чеки автоматически направляются на нужную станцию кухни." },
      { title: "Приготовление", description: "Повара отслеживают готовку по таймерам и приоритетам SLA." },
      { title: "Оплата", description: "Расчёт картой, наличными или scan-to-pay — делите как угодно." },
      { title: "Отчётность", description: "Каждая транзакция сразу попадает в живую аналитику." },
    ],
  },
  stats: {
    labels: ["Обработано заказов", "Активных пользователей", "Ресторанов на Senate POS", "Аптайм"],
  },
  testimonials: {
    eyebrow: "Любят операторы",
    titleTop: "Владельцы, менеджеры и кассиры ",
    titleAccent: "все согласны.",
    subtitle:
      "От кафе с одной точкой до сетей из 30 филиалов — команды работают слаженнее на Senate POS.",
    items: [
      {
        quote:
          "Senate POS объединил четыре филиала в одну панель. Мы вдвое сократили время закрытия и наконец доверяем своим цифрам.",
        role: "Владелец",
      },
      {
        quote:
          "Один только кухонный дисплей преобразил наш сервис. Чеки больше не теряются, а время приготовления упало на 22%.",
        role: "Генеральный менеджер",
      },
      {
        quote:
          "Автономный режим выручил нас при сбое в самый загруженный вечер. Команда даже не заметила, что интернет пропал.",
        role: "Операционный менеджер",
      },
      {
        quote:
          "Оплата настолько быстрая, что очередь не собирается. Новые кассиры уверенны уже в первую смену.",
        role: "Старший кассир",
      },
      {
        quote:
          "Учёт склада на уровне рецептов показал, где именно мы теряли маржу. Окупаемость в первый же месяц.",
        role: "Владелец",
      },
      {
        quote:
          "Развернуть Senate POS в 30 точках было безболезненно. Права и отчётность масштабируются вместе с нами.",
        role: "Директор по операциям",
      },
    ],
  },
  pricing: {
    eyebrow: "Цены",
    titleTop: "Тарифы, которые масштабируются ",
    titleAccent: "от одного стола до тысячи.",
    subtitle:
      "Прозрачные цены без скрытых платежей. Начните бесплатно, повышайте тариф, когда будете готовы.",
    mostPopular: "Самый популярный",
    footnote:
      "Все тарифы включают синхронизацию в реальном времени, автономный режим, облачные бэкапы и бесплатные обновления.",
    plans: [
      {
        name: "Старт",
        price: "$49",
        cadence: "/ терминал / мес",
        tagline: "Для отдельных кафе и небольших ресторанов на старте.",
        cta: "Начать бесплатно",
        features: [
          "1 филиал, до 2 терминалов",
          "Windows и мобильный POS",
          "Кухонный дисплей",
          "Базовая отчётность",
          "QR-заказ",
          "Поддержка по почте",
        ],
      },
      {
        name: "Бизнес",
        price: "$129",
        cadence: "/ терминал / мес",
        tagline: "Для растущих ресторанов и небольших сетей, которым нужно больше.",
        cta: "Запросить демо",
        features: [
          "До 10 филиалов",
          "Всё из тарифа Старт",
          "Склад и себестоимость рецептов",
          "Графики и права персонала",
          "Расширенная аналитика",
          "Приоритетная поддержка 24/7",
        ],
      },
      {
        name: "Энтерпрайз",
        price: "Индивидуально",
        cadence: "/ индивидуально",
        tagline: "Для крупных сетей и франшиз, работающих в масштабе.",
        cta: "Связаться с продажами",
        features: [
          "Безлимит филиалов и терминалов",
          "Всё из тарифа Бизнес",
          "Персональный менеджер",
          "Кастомные интеграции и API",
          "SSO и корпоративная безопасность",
          "SLA аптайма 99.99%",
        ],
      },
    ],
  },
  finalCta: {
    titleTop: "Готовы преобразить ",
    titleAccent: "работу вашего ресторана?",
    subtitle:
      "Присоединяйтесь к 14 000+ ресторанам, которые работают умнее и быстрее на Senate POS. Посмотрите платформу в действии.",
    requestDemo: "Запросить демо",
    watchVideo: "Смотреть видео",
    learnMore: "Подробнее",
    note: "14 дней бесплатно · Без карты · Отмена в любое время",
  },
  about: {
    eyebrow: "О Senate Group",
    titleTop: "Команда, стоящая за ",
    titleAccent: "Senate POS.",
    description:
      "Senate POS — флагманская ресторанная платформа Senate Group, технологической компании в сфере гостеприимства. Наша миссия — дать каждому ресторану, кафе и сети инструменты, которые гиганты считают само собой разумеющимися. Мы создаём единую связанную экосистему и обеспечиваем живую локальную поддержку, чтобы операторы могли сосредоточиться на главном — гостеприимстве.",
    pillars: [
      {
        title: "Прежде всего гостеприимство",
        description: "Создано вместе с рестораторами и для них — каждая функция оправдывает себя в реальном зале.",
      },
      {
        title: "Единая связанная экосистема",
        description: "POS, кухня, склад, персонал и гостевые инструменты, которые действительно общаются между собой.",
      },
      {
        title: "Локальная живая поддержка",
        description: "Онбординг, обучение и поддержка от людей, которые отвечают, когда нужно.",
      },
      {
        title: "Постоянное развитие",
        description: "Непрерывные обновления на основе отзывов тысяч ежедневных пользователей.",
      },
    ],
  },
  footer: {
    brandDesc:
      "Полноценная операционная система ресторана. Единая платформа для продаж, кухни, склада, персонала и отчётности.",
    columns: [
      {
        title: "Продукты",
        links: ["Back Office", "Windows POS", "Мобильный POS", "Кухонный дисплей", "Склад", "QR-заказ"],
      },
      {
        title: "Документация",
        links: ["Начало работы", "Руководства", "Справочник API", "Интеграции", "История изменений", "Статус"],
      },
      {
        title: "Поддержка",
        links: ["Центр помощи", "Сообщество", "Обучение", "Онбординг", "Статус системы", "Безопасность"],
      },
      {
        title: "Контакты",
        links: ["Связаться с нами", "Связаться с продажами", "Партнёрство", "Карьера", "Пресс-кит", "О нас"],
      },
    ],
    copyright: "© {year} Senate POS. Все права защищены.",
    legal: ["Политика конфиденциальности", "Условия использования", "Файлы cookie"],
  },
};

export const dictionaries: Record<Lang, Dict> = { en, az, ru };
