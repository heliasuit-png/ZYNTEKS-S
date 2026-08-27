/**
 * Rebuild admin-types / admin-en / admin-tr from clean JS object trees.
 * Run: node scripts/rebuild-admin-dicts.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EXTRA as P2 } from "./admin-dict-extra-part2.mjs";
import { EXTRA_SEC_MON as P3 } from "./admin-dict-extra-part3.mjs";
import { EXTRA_ANALYTICS_AI as P4 } from "./admin-dict-extra-part4.mjs";
import { EXTRA_AUDIT_SETTINGS as P5 } from "./admin-dict-extra-part5.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictDir = path.join(__dirname, "..", "lib", "i18n", "dictionaries");

const L = (en, tr) => ({ en, tr });

const BASE = {
  nav: {
    dashboard: L("Dashboard", "Kontrol paneli"),
    users: L("Users", "Kullanıcılar"),
    workspaces: L("Workspaces", "Çalışma alanları"),
    projects: L("Projects", "Projeler"),
    monitoring: L("Monitoring", "İzleme"),
    apiKeys: L("API Keys", "API Anahtarları"),
    analytics: L("Analytics", "Analitik"),
    ai: L("AI", "AI"),
    notifications: L("Notifications", "Bildirimler"),
    security: L("Security", "Güvenlik"),
    audit: L("Audit Logs", "Denetim kayıtları"),
    settings: L("Settings", "Ayarlar"),
  },
  shell: {
    adminNav: L("Admin navigation", "Yönetici navigasyonu"),
    adminCenter: L("Admin Center", "Yönetici Merkezi"),
    insufficientPermissions: L("Insufficient permissions", "Yetersiz izinler"),
    availableLater: L("Available in a later phase", "Sonraki bir aşamada kullanılabilir"),
    controlCenter: L("Control Center", "Kontrol Merkezi"),
    home: L("Home", "Ana sayfa"),
    console: L("Console", "Konsol"),
    closeMenu: L("Close menu", "Menüyü kapat"),
    openMenu: L("Open menu", "Menüyü aç"),
    signOut: L("Sign out", "Çıkış yap"),
    admin: L("Admin", "Yönetici"),
    breadcrumb: L("Breadcrumb", "Gezinti yolu"),
    closeNavigation: L("Close navigation", "Navigasyonu kapat"),
  },
  login: {
    title: L("Admin sign in", "Yönetici girişi"),
    subtitle: L(
      "Enterprise Admin Control Center. Authorized administrators only.",
      "Kurumsal Yönetici Kontrol Merkezi. Yalnızca yetkili yöneticiler.",
    ),
    email: L("Email", "E-posta"),
    password: L("Password", "Şifre"),
    signingIn: L("Signing in…", "Giriş yapılıyor…"),
    submit: L("Sign in to Admin", "Yönetici olarak giriş yap"),
    metadataTitle: L("Admin Sign In · ZYNTEKSIS", "Yönetici Girişi · ZYNTEKSIS"),
    emailPlaceholder: L("admin@your-company.com", "admin@sirketiniz.com"),
  },
  roles: {
    super_admin: L("Super Admin", "Süper Yönetici"),
    admin: L("Admin", "Yönetici"),
    support: L("Support", "Destek"),
    read_only: L("Read Only", "Salt Okunur"),
  },
  common: {
    loading: L("Loading", "Yükleniyor"),
    tryAgain: L("Try again", "Tekrar dene"),
    backToDashboard: L("Back to dashboard", "Kontrol paneline dön"),
    somethingWrong: L("Something went wrong", "Bir şeyler ters gitti"),
    permissionDenied: L("Permission denied", "İzin reddedildi"),
    search: L("Search", "Ara"),
    clearFilters: L("Clear filters", "Filtreleri temizle"),
    reset: L("Reset", "Sıfırla"),
    previous: L("Previous", "Önceki"),
    next: L("Next", "Sonraki"),
    showingOf: L("Showing {from}–{to} of {total}", "{from}–{to} / {total} gösteriliyor"),
    save: L("Save", "Kaydet"),
    cancel: L("Cancel", "İptal"),
    delete: L("Delete", "Sil"),
    create: L("Create", "Oluştur"),
    update: L("Update", "Güncelle"),
    export: L("Export", "Dışa aktar"),
    exportCsv: L("Export CSV", "CSV dışa aktar"),
    exportJson: L("Export JSON", "JSON dışa aktar"),
    refresh: L("Refresh", "Yenile"),
    actions: L("Actions", "İşlemler"),
    empty: L("Empty", "Boş"),
    yes: L("Yes", "Evet"),
    no: L("No", "Hayır"),
    close: L("Close", "Kapat"),
    confirm: L("Confirm", "Onayla"),
    updating: L("Updating…", "Güncelleniyor…"),
    access: L("Access", "Erişim"),
    error: L("Error", "Hata"),
    none: L("None", "Yok"),
    pageOf: L("Page {page} / {pages}", "Sayfa {page} / {pages}"),
    open: L("Open", "Aç"),
    mfa: L("MFA", "MFA"),
    on: L("On", "Açık"),
    off: L("Off", "Kapalı"),
    enabledLabel: L("Enabled", "Etkin"),
    disabledLabel: L("Disabled", "Devre dışı"),
    configured: L("Configured", "Yapılandırıldı"),
    notConfigured: L("Not configured", "Yapılandırılmadı"),
    notStored: L("Not stored", "Saklanmıyor"),
    set: L("Set", "Ayarlı"),
    fromDate: L("From date", "Başlangıç tarihi"),
    toDate: L("To date", "Bitiş tarihi"),
    dateRange: L("Date range", "Tarih aralığı"),
    workspace: L("Workspace", "Çalışma alanı"),
    project: L("Project", "Proje"),
    country: L("Country", "Ülke"),
    environment: L("Environment", "Ortam"),
    severity: L("Severity", "Önem"),
    all: L("All", "Tümü"),
    current: L("current", "geçerli"),
    revoked: L("revoked", "iptal"),
    suspicious: L("suspicious", "şüpheli"),
    userFallback: L("User", "Kullanıcı"),
    model: L("Model", "Model"),
    plan: L("Plan", "Plan"),
    status: L("Status", "Durum"),
    storage: L("Storage", "Depolama"),
    archived: L("Archived", "Arşivlendi"),
    free: L("Free", "Ücretsiz"),
    pro: L("Pro", "Pro"),
    enterprise: L("Enterprise", "Kurumsal"),
    active: L("Active", "Aktif"),
    inactive: L("Inactive", "Pasif"),
    suspended: L("Suspended", "Askıda"),
    range1h: L("Last 1h", "Son 1s"),
    range24h: L("Last 24h", "Son 24s"),
    range7d: L("Last 7d", "Son 7g"),
    range30d: L("Last 30d", "Son 30g"),
    range90d: L("Last 90d", "Son 90g"),
    rangeAll: L("All time", "Tüm zamanlar"),
    envProduction: L("Production", "Üretim"),
    envStaging: L("Staging", "Hazırlık"),
    envDevelopment: L("Development", "Geliştirme"),
    severityLow: L("Low", "Düşük"),
    severityMedium: L("Medium", "Orta"),
    severityHigh: L("High", "Yüksek"),
    severityCritical: L("Critical", "Kritik"),
    severityFatal: L("Fatal (errors)", "Ölümcül (hatalar)"),
    severityError: L("Error", "Hata"),
    severityWarning: L("Warning", "Uyarı"),
    severityLevel: L("Severity / level", "Önem / seviye"),
    reqTok: L("{requests} req · {tokens} tok", "{requests} istek · {tokens} tok"),
    ipUnknown: L("IP unknown", "IP bilinmiyor"),
    unknownActor: L("unknown actor", "bilinmeyen aktör"),
  },
  loading: {
    module: L("Loading admin module", "Yönetici modülü yükleniyor"),
    dashboard: L("Loading dashboard", "Kontrol paneli yükleniyor"),
    users: L("Loading users", "Kullanıcılar yükleniyor"),
    workspaces: L("Loading workspaces", "Çalışma alanları yükleniyor"),
    monitoring: L("Loading monitoring", "İzleme yükleniyor"),
    analytics: L("Loading analytics", "Analitik yükleniyor"),
    ai: L("Loading AI operations", "AI işlemleri yükleniyor"),
    security: L("Loading security", "Güvenlik yükleniyor"),
    audit: L("Loading audit", "Denetim yükleniyor"),
    settings: L("Loading settings", "Ayarlar yükleniyor"),
  },
};

function isLeaf(v) {
  return v && typeof v === "object" && typeof v.en === "string" && typeof v.tr === "string";
}

function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (isLeaf(v)) out[k] = v;
    else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = merge(out[k] || {}, v);
    else out[k] = v;
  }
  return out;
}

function pick(tree, lang) {
  if (isLeaf(tree)) return tree[lang];
  const out = {};
  for (const [k, v] of Object.entries(tree)) out[k] = pick(v, lang);
  return out;
}

function toTypes(tree, indent = 2) {
  const pad = " ".repeat(indent);
  const lines = ["{"];
  for (const [k, v] of Object.entries(tree)) {
    const key = /^[a-zA-Z_][\w]*$/.test(k) ? k : JSON.stringify(k);
    if (isLeaf(v)) lines.push(`${pad}  ${key}: string;`);
    else lines.push(`${pad}  ${key}: ${toTypes(v, indent + 2)};`);
  }
  lines.push(`${pad}}`);
  return lines.join("\n");
}

function toLiteral(obj, indent = 2) {
  const pad = " ".repeat(indent);
  const lines = ["{"];
  const entries = Object.entries(obj);
  entries.forEach(([k, v], i) => {
    const key = /^[a-zA-Z_][\w]*$/.test(k) ? k : JSON.stringify(k);
    const comma = i < entries.length - 1 ? "," : "";
    if (typeof v === "string") {
      lines.push(`${pad}  ${key}: ${JSON.stringify(v)}${comma}`);
    } else {
      lines.push(`${pad}  ${key}: ${toLiteral(v, indent + 2)}${comma}`);
    }
  });
  lines.push(`${pad}}`);
  return lines.join("\n");
}

// P2 already includes executive from part1
const FULL = merge(merge(merge(merge(BASE, P2), P3), P4), P5);

const enObj = pick(FULL, "en");
const trObj = pick(FULL, "tr");

fs.writeFileSync(
  path.join(dictDir, "admin-types.ts"),
  `export type AdminDictionary = ${toTypes(FULL, 0)};\n`,
);
fs.writeFileSync(
  path.join(dictDir, "admin-en.ts"),
  `import type { AdminDictionary } from "@/lib/i18n/dictionaries/admin-types";\n\nexport const adminEn = ${toLiteral(enObj, 0)} satisfies AdminDictionary;\n`,
);
fs.writeFileSync(
  path.join(dictDir, "admin-tr.ts"),
  `import type { AdminDictionary } from "@/lib/i18n/dictionaries/admin-types";\n\nexport const adminTr = ${toLiteral(trObj, 0)} satisfies AdminDictionary;\n`,
);

console.log("OK rebuilt. Sections:", Object.keys(FULL).join(", "));
console.log("executive keys sample:", Object.keys(FULL.executive).slice(0, 8).join(", "));
