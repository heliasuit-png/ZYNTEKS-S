import { APP_NAME } from "@/lib/constants";
import type { Locale } from "@/lib/i18n/config";

/** TODO placeholders — replace before production legal reliance. Not legal advice. */
export const LEGAL_TODO = {
  companyName: "[TODO: Company legal name]",
  address: "[TODO: Registered address]",
  email: "[TODO: privacy@your-domain.com]",
  dataController: "[TODO: Data controller / Veri sorumlusu]",
  taxId: "[TODO: Tax / MERSIS id if applicable]",
} as const;

export function legalDraftNotice(locale: Locale): string {
  return locale === "tr"
    ? "Bu metin ürün şablonudur; hukuki danışmanlık değildir. TODO alanlarını doldurun ve hukuk danışmanınıza inceletin."
    : "This text is a product template, not legal advice. Fill TODO placeholders and have counsel review before production use.";
}

export function privacySections(locale: Locale) {
  if (locale === "tr") {
    return [
      {
        h: "Kapsam",
        p: `${APP_NAME} self-host / operatör modelinde çalışır. Bu politika, örneğin örnek dağıtım için varsayılan veri uygulamalarını açıklar. Operatör: ${LEGAL_TODO.companyName}.`,
      },
      {
        h: "İşlenen veriler",
        p: "Hesap profili, workspace üyeliği, projeler, API anahtarı meta verisi, SDK telemetrisi (hata, heartbeat, performans), olaylar, bildirimler, AI konuşma geçmişi ve denetim kayıtları.",
      },
      {
        h: "Amaçlar",
        p: "Kimlik doğrulama, plan limitleri, izleme ve AI yardım, bildirimler ve güvenlik denetimi.",
      },
      {
        h: "Saklama ve güvenlik",
        p: "Gizler ortam değişkenlerinde tutulur. API anahtarı sırları hash’lenir. Erişim kimlik doğrulama ve RLS ile sınırlanır.",
      },
      {
        h: "Üçüncü taraflar",
        p: "İsteğe bağlı Resend (e-posta), OpenAI (AI) ve ileride bağlayabileceğiniz ödeme sağlayıcıları yalnızca ilgili veriyi işler. Lemon Squeezy varsayılan olarak kapalıdır.",
      },
      {
        h: "İletişim",
        p: `${LEGAL_TODO.email} — ${LEGAL_TODO.address}`,
      },
    ];
  }
  return [
    {
      h: "Scope",
      p: `${APP_NAME} is designed to be self-hosted. This policy describes default product expectations for an operator instance. Operator: ${LEGAL_TODO.companyName}.`,
    },
    {
      h: "Data we process",
      p: "Account profiles, workspace membership, projects, API key metadata, SDK telemetry (errors, heartbeats, performance), incidents, notifications, AI conversation history, and audit logs.",
    },
    {
      h: "Purpose",
      p: "Authenticate users, enforce plan limits, provide monitoring and AI assistance, deliver notifications, and maintain security audit trails.",
    },
    {
      h: "Storage & security",
      p: "Secrets belong in environment variables. API key secrets are hashed at rest. Access is constrained by authentication and database RLS.",
    },
    {
      h: "Third parties",
      p: "Optional Resend (email), OpenAI (assistant), or a payment provider you connect later. Lemon Squeezy remains off by default.",
    },
    {
      h: "Contact",
      p: `${LEGAL_TODO.email} — ${LEGAL_TODO.address}`,
    },
  ];
}

export function termsSections(locale: Locale) {
  if (locale === "tr") {
    return [
      {
        h: "Hizmet",
        p: `${APP_NAME} gözlemlenebilirlik, olay yönetimi ve AI asistan özellikleri sunar. Operatör: ${LEGAL_TODO.companyName}.`,
      },
      {
        h: "Hesaplar",
        p: "Hesap bilgilerinizin doğruluğundan ve kimlik bilgilerinizin güvenliğinden siz sorumlusunuz. Yasaklı hesaplar erişemez.",
      },
      {
        h: "Kabul edilebilir kullanım",
        p: "Hizmeti kötüye kullanmayın, yasa dışı içerik işlemeyin veya güvenlik kontrollerini atlamaya çalışmayın.",
      },
      {
        h: "Sorumluluk sınırları",
        p: "Yazılım “olduğu gibi” sunulur. Kritik üretim kullanımı için kendi yedekleme ve SLA süreçlerinizi uygulayın. Bu madde hukuki danışmanlık değildir.",
      },
      {
        h: "İletişim",
        p: LEGAL_TODO.email,
      },
    ];
  }
  return [
    {
      h: "Service",
      p: `${APP_NAME} provides observability, incident management, and AI assistant features. Operator: ${LEGAL_TODO.companyName}.`,
    },
    {
      h: "Accounts",
      p: "You are responsible for accurate account details and safeguarding credentials. Suspended accounts cannot sign in.",
    },
    {
      h: "Acceptable use",
      p: "Do not abuse the service, process unlawful content, or attempt to bypass security controls.",
    },
    {
      h: "Limitation",
      p: "Software is provided as-is. Apply your own backup and SLA practices for critical production use. This is not legal advice.",
    },
    {
      h: "Contact",
      p: LEGAL_TODO.email,
    },
  ];
}

export function cookieSections(locale: Locale) {
  if (locale === "tr") {
    return [
      {
        h: "Zorunlu çerezler",
        p: "Oturum ve güvenlik için gerekli çerezler (ör. Supabase auth çerezleri). Bunlar olmadan giriş çalışmaz.",
      },
      {
        h: "Kimlik doğrulama / oturum",
        p: "Giriş sonrası erişim ve yenileme oturumu çerezleri; çıkışta geçersiz kılınır.",
      },
      {
        h: "Tercihler",
        p: `Dil tercihi \`${"zynteksis_locale"}\` çerezi ile saklanır.`,
      },
      {
        h: "Analitik",
        p: "Varsayılan ürün paketine zorunlu üçüncü taraf analitik çerezi dahil değildir. Operatör eklerse burada açıklanmalıdır.",
      },
      {
        h: "Üçüncü taraf servisler",
        p: "E-posta (Resend), AI (OpenAI) tarayıcı çerezi set etmez; sunucu tarafı API çağrılarıdır. Ödeme entegrasyonu varsayılan olarak kapalıdır.",
      },
      {
        h: "Tercih kontrolü",
        p: "Tarayıcı ayarlarından çerezleri silebilirsiniz; zorunlu oturum çerezlerini silmek sizi çıkış yaptırır.",
      },
    ];
  }
  return [
    {
      h: "Necessary cookies",
      p: "Required for session and security (e.g. Supabase auth cookies). Sign-in will not work without them.",
    },
    {
      h: "Authentication / session",
      p: "Access and refresh session cookies after login; invalidated on logout.",
    },
    {
      h: "Preferences",
      p: "Language preference is stored in the `zynteksis_locale` cookie.",
    },
    {
      h: "Analytics",
      p: "No third-party analytics cookie is required by default. If an operator adds analytics, disclose it here.",
    },
    {
      h: "Third-party services",
      p: "Email (Resend) and AI (OpenAI) are server-side APIs and do not set browser cookies by default. Payment integrations remain off by default.",
    },
    {
      h: "Preference controls",
      p: "You may clear cookies in your browser; clearing necessary session cookies signs you out.",
    },
  ];
}

export function kvkkSections(locale: Locale) {
  if (locale === "tr") {
    return [
      {
        h: "Veri sorumlusu",
        p: `${LEGAL_TODO.dataController}. Unvan: ${LEGAL_TODO.companyName}. Adres: ${LEGAL_TODO.address}. İletişim: ${LEGAL_TODO.email}. Kimlik: ${LEGAL_TODO.taxId}.`,
      },
      {
        h: "İşlenen kişisel veri kategorileri",
        p: "Kimlik ve iletişim (ad, e-posta), hesap/oturum, workspace üyeliği, proje ve API anahtarı meta verisi, telemetri ve olay kayıtları, AI etkileşimleri, denetim logları, teknik loglar (IP/user-agent mümkün olduğunca).",
      },
      {
        h: "İşleme amaçları",
        p: "Hizmet sunumu, kimlik doğrulama, güvenlik, destek, bildirim, ürün iyileştirme ve yasal yükümlülükler.",
      },
      {
        h: "Hukuki sebepler",
        p: "Sözmenin ifası, meşru menfaat (güvenlik/istismar önleme), açık rıza (gerektiğinde) ve kanuni yükümlülük. Operatör kendi hukuki dayanaklarını teyit etmelidir.",
      },
      {
        h: "Aktarım",
        p: "Veriler operatörün seçtiği altyapıya (ör. Supabase, Vercel, OpenAI, Resend) aktarılabilir. Yurt dışı aktarım varsa uygun güvenceler operatör tarafından sağlanmalıdır.",
      },
      {
        h: "Saklama",
        p: "Hesap aktifken ve silme taleplerine / yasal saklama sürelerine kadar. Operatör saklama politikasını netleştirmelidir (TODO).",
      },
      {
        h: "İlgili kişi hakları",
        p: "KVKK m.11 kapsamında öğrenme, düzeltme, silme, itiraz ve şikayet hakları. Başvurular için aşağıdaki yöntemi kullanın.",
      },
      {
        h: "Başvuru yöntemi",
        p: `${LEGAL_TODO.email} adresine yazılı başvuru. Yanıt süreleri yürürlükteki mevzuata tabidir.`,
      },
      {
        h: "İletişim",
        p: `${LEGAL_TODO.email} · ${LEGAL_TODO.address}`,
      },
    ];
  }
  return [
    {
      h: "Data controller",
      p: `${LEGAL_TODO.dataController}. Legal name: ${LEGAL_TODO.companyName}. Address: ${LEGAL_TODO.address}. Contact: ${LEGAL_TODO.email}. Id: ${LEGAL_TODO.taxId}.`,
    },
    {
      h: "Personal data categories",
      p: "Identity and contact (name, email), account/session, workspace membership, project and API key metadata, telemetry and incident records, AI interactions, audit logs, and technical logs (IP/user-agent where applicable).",
    },
    {
      h: "Purposes",
      p: "Service delivery, authentication, security, support, notifications, product improvement, and legal obligations.",
    },
    {
      h: "Legal bases",
      p: "Contract performance, legitimate interests (security/abuse prevention), consent where required, and legal obligation. Operators must confirm bases with counsel.",
    },
    {
      h: "Transfers",
      p: "Data may be processed on infrastructure chosen by the operator (e.g. Supabase, Vercel, OpenAI, Resend). Cross-border transfers require appropriate safeguards.",
    },
    {
      h: "Retention",
      p: "While accounts are active and subject to deletion requests / statutory retention. Operators must finalize a retention schedule (TODO).",
    },
    {
      h: "Data-subject rights",
      p: "Under KVKK Art. 11: access, correction, deletion, objection, and complaint rights. Use the application method below.",
    },
    {
      h: "How to apply",
      p: `Write to ${LEGAL_TODO.email}. Response timelines follow applicable law.`,
    },
    {
      h: "Contact",
      p: `${LEGAL_TODO.email} · ${LEGAL_TODO.address}`,
    },
  ];
}
