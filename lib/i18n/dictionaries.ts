import type { Locale } from "@/lib/i18n/config";

export type Dictionary = {
  meta: {
    description: string;
  };
  common: {
    signIn: string;
    startFree: string;
    language: string;
    english: string;
    turkish: string;
  };
  nav: {
    features: string;
    howItWorks: string;
    sdk: string;
    pricing: string;
    faq: string;
  };
  footer: {
    product: string;
    company: string;
    legal: string;
    documentation: string;
    contact: string;
    privacy: string;
    terms: string;
    cookie: string;
    kvkk: string;
    rights: string;
  };
  auth: {
    createAccount: string;
    createAccountDesc: string;
    registrationClosed: string;
    registrationClosedDesc: string;
    alreadyHaveAccount: string;
    signInLink: string;
    legalNotice: string;
    terms: string;
    privacy: string;
    kvkk: string;
    forgotTitle: string;
    resetTitle: string;
    loginTitle: string;
  };
  legal: {
    privacyTitle: string;
    termsTitle: string;
    cookieTitle: string;
    kvkkTitle: string;
    draftNotice: string;
  };
  dashboardNav: {
    dashboard: string;
    projects: string;
    apiKeys: string;
    errors: string;
    incidents: string;
    health: string;
    insights: string;
    ai: string;
    notifications: string;
    statusPages: string;
    members: string;
    audit: string;
    security: string;
    organization: string;
    billing: string;
    settings: string;
    profile: string;
  };
};

export const en: Dictionary = {
  meta: {
    description:
      "Production-ready SaaS platform powered by ZYNTEKSIS.",
  },
  common: {
    signIn: "Sign in",
    startFree: "Start free",
    language: "Language",
    english: "English",
    turkish: "Türkçe",
  },
  nav: {
    features: "Features",
    howItWorks: "How it works",
    sdk: "SDK",
    pricing: "Pricing",
    faq: "FAQ",
  },
  footer: {
    product: "Product",
    company: "Company",
    legal: "Legal",
    documentation: "Documentation",
    contact: "Contact",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    cookie: "Cookie Policy",
    kvkk: "KVKK / Privacy Notice",
    rights: "All rights reserved.",
  },
  auth: {
    createAccount: "Create your account",
    createAccountDesc:
      "Join ZYNTEKSIS with SSO or email — one identity, no duplicates",
    registrationClosed: "Registration closed",
    registrationClosedDesc: "New accounts are not being accepted right now.",
    alreadyHaveAccount: "Already have an account?",
    signInLink: "Sign in",
    legalNotice: "By continuing you acknowledge our",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    kvkk: "KVKK notice",
    forgotTitle: "Forgot password",
    resetTitle: "Reset password",
    loginTitle: "Sign in",
  },
  legal: {
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Use",
    cookieTitle: "Cookie Policy",
    kvkkTitle: "KVKK Clarification Text",
    draftNotice:
      "This text is a product template for operators of ZYNTEKSIS. It is not legal advice. Have counsel review and replace TODO placeholders before relying on it in production.",
  },
  dashboardNav: {
    dashboard: "Dashboard",
    projects: "Projects",
    apiKeys: "API Keys",
    errors: "Error Monitoring",
    incidents: "Incidents",
    health: "Health Monitor",
    insights: "Intelligence",
    ai: "AI Assistant",
    notifications: "Notifications",
    statusPages: "Status Pages",
    members: "Members",
    audit: "Audit Log",
    security: "Security Center",
    organization: "Organization",
    billing: "Billing",
    settings: "Settings",
    profile: "Profile",
  },
};

export const tr: Dictionary = {
  meta: {
    description: "ZYNTEKSIS ile production-ready gözlemlenebilirlik SaaS platformu.",
  },
  common: {
    signIn: "Giriş yap",
    startFree: "Ücretsiz başla",
    language: "Dil",
    english: "English",
    turkish: "Türkçe",
  },
  nav: {
    features: "Özellikler",
    howItWorks: "Nasıl çalışır",
    sdk: "SDK",
    pricing: "Fiyatlandırma",
    faq: "SSS",
  },
  footer: {
    product: "Ürün",
    company: "Şirket",
    legal: "Yasal",
    documentation: "Dokümantasyon",
    contact: "İletişim",
    privacy: "Gizlilik Politikası",
    terms: "Kullanım Koşulları",
    cookie: "Çerez Politikası",
    kvkk: "KVKK / Aydınlatma",
    rights: "Tüm hakları saklıdır.",
  },
  auth: {
    createAccount: "Hesap oluştur",
    createAccountDesc:
      "ZYNTEKSIS’e SSO veya e-posta ile katılın — tek kimlik, mükerrer yok",
    registrationClosed: "Kayıt kapalı",
    registrationClosedDesc: "Şu anda yeni hesap kabul edilmiyor.",
    alreadyHaveAccount: "Zaten hesabınız var mı?",
    signInLink: "Giriş yap",
    legalNotice: "Devam ederek şunları kabul etmiş sayılırsınız:",
    terms: "Kullanım Koşulları",
    privacy: "Gizlilik Politikası",
    kvkk: "KVKK aydınlatma metni",
    forgotTitle: "Şifremi unuttum",
    resetTitle: "Şifreyi sıfırla",
    loginTitle: "Giriş yap",
  },
  legal: {
    privacyTitle: "Gizlilik Politikası",
    termsTitle: "Kullanım Koşulları",
    cookieTitle: "Çerez Politikası",
    kvkkTitle: "KVKK Aydınlatma Metni",
    draftNotice:
      "Bu metin ZYNTEKSIS operatörleri için ürün şablonudur; hukuki danışmanlık değildir. Üretime almadan önce TODO alanlarını doldurun ve hukuk danışmanınıza inceletin.",
  },
  dashboardNav: {
    dashboard: "Panel",
    projects: "Projeler",
    apiKeys: "API Anahtarları",
    errors: "Hata İzleme",
    incidents: "Olaylar",
    health: "Sağlık İzleme",
    insights: "İstihbarat",
    ai: "AI Asistan",
    notifications: "Bildirimler",
    statusPages: "Durum Sayfaları",
    members: "Üyeler",
    audit: "Denetim Kaydı",
    security: "Güvenlik Merkezi",
    organization: "Organizasyon",
    billing: "Faturalama",
    settings: "Ayarlar",
    profile: "Profil",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, tr };
