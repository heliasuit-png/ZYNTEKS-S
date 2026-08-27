import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { actionMessagesTr } from "@/lib/i18n/dictionaries/action-messages-tr";
import { adminTr } from "@/lib/i18n/dictionaries/admin-tr";
import { dashTr } from "@/lib/i18n/dictionaries/dash-tr";

export const tr: Dictionary = {
  meta: {
    description:
      "ZYNTEKSIS ile production-ready gözlemlenebilirlik SaaS platformu.",
  },
  common: {
    signIn: "Giriş yap",
    startFree: "Ücretsiz başla",
    language: "Dil",
    english: "English",
    turkish: "Türkçe",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    primaryNav: "Birincil",
    mobileNav: "Mobil",
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
    paymentMethods: "Ödeme yöntemleri",
    paymentVisa: "Visa",
    paymentMastercard: "Mastercard",
    paymentAmex: "American Express",
    paymentDiscover: "Discover",
    paymentDiners: "Diners Club",
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
    forgotDesc: "E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim",
    resetTitle: "Şifreyi sıfırla",
    resetDesc: "Hesabınız için güçlü bir şifre seçin",
    loginTitle: "Giriş yap",
    welcomeBack: "Tekrar hoş geldiniz",
    welcomeBackDesc: "ZYNTEKSIS çalışma alanınıza kurumsal erişim",
    noAccount: "Hesabınız yok mu?",
    createOne: "Hesap oluşturun",
    signedOut: "Çıkış yaptınız. Devam etmek için tekrar giriş yapın.",
    passwordUpdated:
      "Şifreniz güncellendi. Yeni şifrenizle giriş yapın.",
    authError: "Kimlik doğrulama tamamlanamadı. Lütfen tekrar deneyin.",
    rememberedIt: "Hatırladınız mı?",
    backToSignIn: "Girişe dön",
    orDivider: "veya",
    passwordTab: "Şifre",
    emailPasswordTab: "E-posta ve şifre",
    magicLinkTab: "Sihirli bağlantı",
    methodAria: "E-posta kimlik doğrulama yöntemi",
  },
  authForms: {
    email: "E-posta",
    password: "Şifre",
    fullName: "Ad soyad",
    confirmPassword: "Şifreyi onayla",
    newPassword: "Yeni şifre",
    confirmNewPassword: "Yeni şifreyi onayla",
    workEmail: "İş e-postası",
    emailPlaceholder: "siz@ornek.com",
    emailCompanyPlaceholder: "siz@sirket.com",
    fullNamePlaceholder: "Ada Lovelace",
    forgotPassword: "Şifremi unuttum?",
    signIn: "Giriş yap",
    createAccount: "Hesap oluştur",
    sendReset: "Sıfırlama bağlantısı gönder",
    updatePassword: "Şifreyi güncelle",
    magicLink: "Sihirli bağlantı",
    continueWithEmail: "E-posta ile devam et",
    continueWithGoogle: "Google ile devam et",
    continueWithGitHub: "GitHub ile devam et",
    oauthGroupAria: "Bir sağlayıcı ile giriş yapın",
    oauthStartFailed: "OAuth girişi başlatılamadı.",
    magicLinkHint:
      "Tek kullanımlık bir sihirli bağlantı e-postası göndereceğiz. Şifre gerekmez.",
    backToLogin: "Girişe dön",
    checkEmail: "E-postanızı kontrol edin",
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
  landing: {
    hero: {
      brand: "ZYNTEKSIS",
      headline: "Gözlemleyin. Analiz edin. Güvenle yayınlayın.",
      subheadline:
        "Üretim izleme, AI analizi ve durum sayfaları tek platformda — her gün yazılım yayınlayan ekipler için.",
      primaryCta: "Ücretsiz başla",
      secondaryCta: "Nasıl çalışır",
    },
    features: {
      eyebrow: "Özellikler",
      title: "Üretim yığınınızın ihtiyaç duyduğu her şey",
      desc: "İzleme, AI analizi, projeler, anahtarlar, sağlık, bildirimler ve durum sayfaları — tutarlı bir operasyon yüzeyi.",
      items: {
        monitoring: {
          title: "İzleme",
          description:
            "Her proje ortamında hataları, performans sinyallerini ve sürüm sağlığını yakalayın.",
        },
        ai: {
          title: "AI Analizi",
          description:
            "Olaylar, yığın izleri ve eğilimler hakkında asistanınıza çalışma alanından ayrılmadan sorun.",
        },
        projects: {
          title: "Projeler",
          description:
            "Servisleri proje, ortam ve sahiplik ile düzenleyin; çalışma alanı düzeyinde kontrol edin.",
        },
        "api-keys": {
          title: "API Anahtarları",
          description:
            "Kapsamlı SDK anahtarları oluşturun, sırları döndürün ve erişimi anında iptal edin.",
        },
        health: {
          title: "Sağlık İzleme",
          description:
            "Her servis için uptime, gecikme ve uç nokta kontrollerini net zaman çizelgeleriyle takip edin.",
        },
        notifications: {
          title: "Bildirimler",
          description:
            "Uyarıları e-posta, panel, Slack ve Discord’a kategori tercihlerine göre yönlendirin.",
        },
        status: {
          title: "Durum Sayfaları",
          description:
            "Müşterilerin ne olduğunu her zaman bilmesi için markalı genel durum sayfaları yayınlayın.",
        },
      },
    },
    howItWorks: {
      eyebrow: "Nasıl çalışır",
      title: "Üç adımda canlıya alın",
      desc: "Boş çalışma alanından akan telemetriye, karmaşık bir onboarding labirenti olmadan.",
      steps: [
        {
          title: "Proje oluşturun",
          description:
            "Her servis için bir proje açın, ortamı ayarlayın ve ekibinizi davet edin.",
        },
        {
          title: "API anahtarı üretin",
          description:
            "Production veya staging için kapsamlı bir anahtar oluşturun — bir kez kopyalayın, istediğiniz zaman döndürün.",
        },
        {
          title: "SDK’yı kurun",
          description:
            "SDK’yı uygulamanıza ekleyin; hataları, heartbeat’leri ve performans verisini akıtmaya başlayın.",
        },
      ],
    },
    ai: {
      eyebrow: "AI Asistan",
      title: "Yığınınıza neyin bozulduğunu sorun",
      desc: "Projeleri, olayları ve izleme bağlamını anlayan ürün içi bir asistan — kenara eklenmiş genel bir sohbet botu değil.",
      points: [
        {
          title: "Konuşma geçmişi",
          text: "Sabitlenmiş ve projeye bağlı sohbetlerle operasyonel bağlamı koruyun.",
        },
        {
          title: "Plana duyarlı kullanım",
          text: "Aylık limitler aboneliğinizi takip eder; AI üretimde öngörülebilir kalır.",
        },
        {
          title: "Akan yanıtlar",
          text: "AI ayarlarından akan veya tamponlu yanıtları tercih edin — seçim sizin.",
        },
      ],
      cta: "Giriş sonrası AI Asistanı açın →",
      mockHeader: "AI · Proje bağlamı",
      mockUser: "1.8.2 sürümünden sonra checkout gecikmesi neden arttı?",
      mockAssistant:
        "TimeoutError hata grubu payments servisinde 4× yükseldi. Sağlık kontrolleri /api/charge üzerinde yüksek p95 gösteriyor. İlgili olay hâlâ inceleniyor.",
    },
    monitoring: {
      eyebrow: "İzleme",
      title: "Hataları kullanıcılarınızdan önce görün",
      desc: "Hatalar, sağlık ve olaylar tek bir anlatıyı paylaşır — hata ayıklama gürültüyle değil sinyalle başlar.",
      items: [
        {
          title: "Hata izleme",
          text: "Yığın izlerini ortam ve sürüm bağlamıyla gruplayın, parmak izi çıkarın ve keşfedin.",
        },
        {
          title: "Sağlık ve uptime",
          text: "Uç nokta kontrolleri, gecikme pencereleri ve kritik yollar için net zaman çizelgeleri.",
        },
        {
          title: "Olay yönetimi",
          text: "Önem, durum ve güncellemeleri takip edin; nöbet müşterilerle hizalı kalsın.",
        },
      ],
    },
    sdk: {
      eyebrow: "SDK",
      title: "SDK’yı bağlayın",
      desc: "Yerel @zynteksis/sdk paketini path-install edin (önce sdk/ derleyin), proje anahtarı üretin, ardından tarayıcıda init edin.",
      copy: "Kopyala",
      copyInstallAria: "Kurulum komutunu kopyala",
      copySnippetAria: "Kod parçasını kopyala",
      anyBrowserApp: "Herhangi bir tarayıcı uygulaması",
    },
    status: {
      eyebrow: "Durum Sayfaları",
      title: "İkinci bir ürün olmadan müşterileri bilgilendirin",
      desc: "Bileşen sağlığı, olay geçmişi ve uptime pencereleriyle markalı genel sayfalar yayınlayın.",
      items: [
        {
          title: "Bileşen sağlığı",
          text: "API, panel ve üçüncü taraf sistemleri tek bakışta gösterin.",
        },
        {
          title: "Olay güncellemeleri",
          text: "İnceleniyor → çözüldü güncellemelerini iç zaman çizelgenizle eşleştirin.",
        },
        {
          title: "Uptime pencereleri",
          text: "24s, 7g, 30g ve 90g erişilebilirliği tablolar dışa aktarmadan paylaşın.",
        },
      ],
      demoHost: "status.urununuz.com",
      allOperational: "Tüm sistemler çalışıyor",
      operational: "Çalışıyor",
      degraded: "Kısmi sorun",
      components: {
        api: "API",
        dashboard: "Panel",
        notifications: "Bildirimler",
        statusPage: "Durum sayfası",
      },
    },
    pricing: {
      eyebrow: "Fiyatlandırma",
      title: "Net planlar. Yerel limitler. Takılabilir faturalama.",
      desc: "Plan limitlerini ve özellikleri karşılaştırın. Checkout henüz paketlenmedi — keşfetmek için ücretsiz başlayın veya tam fiyat sayfasına bakın.",
      startFree: "Ücretsiz başla",
      viewAllPlans: "Tüm planları gör",
      contactSales: "Satışla iletişime geç",
      pageTitle: "Ürününüzle birlikte büyüyen planlar",
      pageDesc:
        "Projeler, API anahtarları ve AI için şeffaf limitler. Checkout değiştirilebilir bir PaymentProvider üzerinden bağlanır — ödeme sağlayıcısı paketlenmez.",
      metaDescription:
        "ZYNTEKSIS planlarını, proje limitlerini, API anahtarlarını ve AI mesaj kotlarını karşılaştırın. Checkout takılabilir ve paketlenmemiştir.",
    },
    seo: {
      starterPlanAvailable: "Başlangıç planı mevcut",
    },
    faq: {
      eyebrow: "SSS",
      title: "Satışa sormadan önce yanıtlar",
      desc: "Platform, faturalama mimarisi, SDK ve self-host hakkında net yanıtlar.",
      items: [
        {
          q: "ZYNTEKSIS nedir?",
          a: "ZYNTEKSIS; hata izleme, sağlık kontrolleri, AI destekli analiz, bildirimler ve genel durum sayfaları için production-ready bir SaaS platformudur — eksiksiz kaynak koduyla teslim edilir.",
        },
        {
          q: "Faturalama arayüzünü kullanmak için ödeme sağlayıcısı gerekir mi?",
          a: "Hayır. Plan limitleri ve faturalama arayüzü hazır gelir. Checkout, portal ve faturalar bir PaymentProvider uygulaması bağladığınızda etkinleşir — hiçbir satıcı paketlenmez.",
        },
        {
          q: "SDK hangi çerçeveleri destekler?",
          a: "Yerel @zynteksis/sdk paketini path-install edin (önce sdk/ derleyin). Tarayıcı SDK’sı modern JavaScript/TypeScript uygulamalarında, React ve Next.js istemci bileşenleri dahil çalışır. Sunucu tarafı aynı HTTP ingest uç noktalarını kullanır.",
        },
        {
          q: "Self-host edebilir miyim?",
          a: "Evet. Depo Supabase ve kendi ortam değişkenlerinizle çalışacak şekilde tasarlanmıştır; barındırma, veri ve entegrasyonlar sizin kontrolünüzdedir.",
        },
        {
          q: "AI asistan var mı?",
          a: "Evet. Çalışma alanı üyeleri, olaylar, hatalar ve operasyonel sorular için proje bağlamını kullanan bir AI asistanla sohbet edebilir; kullanım plan limitlerine bağlıdır.",
        },
        {
          q: "Durum sayfaları nasıl çalışır?",
          a: "Genel bir durum sayfası oluşturun, bileşen ve olayları bağlayın, müşterilerle markalı bir URL paylaşın. Uptime pencereleri ve olay geçmişi dahildir.",
        },
      ],
    },
    testimonials: {
      eyebrow: "Çıktılar",
      title: "Ekipler ZYNTEKSIS ile ne kazanır",
      desc: "Platformun tasarlandığı somut çıktılar — uydurma müşteri alıntıları değil.",
      items: [
        {
          quote:
            "Hatalar, sağlık, olaylar ve genel durum için tek çalışma alanı — beş aracı birbirine yapıştırmadan.",
          name: "Operasyon",
          role: "Nöbet ekipleri için",
          company: "ZYNTEKSIS",
        },
        {
          quote:
            "Kapsamlı API anahtarları, SDK ingest ve aynı proje bağlamında AI analizi, hata ayıklamayı gerçek telemetriye bağlar.",
          name: "Mühendislik",
          role: "Ürün ekipleri için",
          company: "ZYNTEKSIS",
        },
        {
          quote:
            "Eksiksiz kaynağı teslim alın, hazır olduğunuzda kendi ödeme sağlayıcınızı bağlayın; veri ve altyapı sahipliği sizde kalsın.",
          name: "Platform sahipleri",
          role: "Kaynak alıcıları için",
          company: "ZYNTEKSIS",
        },
      ],
    },
    heroIllustration: {
      consoleLabel: "ZYNTEKSIS · Operasyon konsolu",
      navDashboard: "Panel",
      navErrors: "Hatalar",
      navHealth: "Sağlık",
      navAi: "AI",
      navStatus: "Durum",
      uptime: "Uptime",
      errors: "Hatalar",
      latency: "Gecikme",
      incidentTimeline: "Olay zaman çizelgesi",
      stable: "Stabil",
      chartAria: "Dekoratif izleme grafiği",
    },
  },
  docs: {
    title: "Dokümantasyon",
    intro:
      "Yeni bir çalışma alanından canlı telemetriye geçin. Tam mühendis referansı: depo dosyaları docs/SDK.md ve sdk/README.md.",
    createAccountTitle: "1. Hesap oluşturun",
    createAccountOr: "veya",
    createAccountBody:
      "Varsayılan bir çalışma alanı sizin için oluşturulur. AI asistanla başlayın — sohbet için proje gerekmez.",
    createProjectTitle: "2. Proje oluşturun",
    createProjectBody:
      "Projeler sayfasını açın ve izlediğiniz her servis için bir proje oluşturun. Her API anahtarı tam olarak bir projeye aittir (proje izolasyonu).",
    generateKeyTitle: "3. API anahtarı üretin",
    generateKeyBody:
      "API Anahtarları sayfasında production veya staging için bir anahtar oluşturun. Sırrı bir kez kopyalayın — sonrasında yalnızca önek görüntüleme için saklanır. Anahtarlar ZYN-KEY-… proje ingest anahtarlarıdır; Supabase service_role sırları değildir.",
    installSdkTitle: "4. SDK’yı kurun",
    installSdkBody:
      "Yerel paketi derleyin, ardından path-install edin (ticari teslimatta genel npm’e yayınlanmaz):",
    installSdkInit:
      "Tarayıcı init: new Zynteksis({ apiKey, endpoint }).init(). API Anahtarları sayfasındaki bağlantı rehberine ve landing",
    serverIngestTitle: "5. Sunucu / HTTP ingest",
    serverIngestBody:
      "init() yalnızca tarayıcı içindir. Sunuculardan /api/sdk/heartbeat, /api/sdk/error, /api/sdk/performance ve /api/sdk/events uç noktalarına X-Zynteksis-Key (veya Bearer) başlığıyla POST edin.",
    operateTitle: "6. İşletin",
    operateErrors: "İzleme için Hatalar, Sağlık ve Olaylar",
    operateAi: "Telemetri destekli analiz için AI Asistan (plan mesaj kotaları)",
    operateStatus: "Genel iletişim için Durum Sayfaları",
    operateBilling:
      "plan limitleri için (checkout sağlayıcısı takılabilir ve paketlenmez)",
    troubleshootingTitle: "Sorun giderme",
    trouble401Title: "Ingest’te 401",
    trouble401Body:
      "anahtar eksik, yanlış veya iptal edilmiş; API Anahtarları’ndan yeniden üretin.",
    troubleNoDataTitle: "Panelde veri yok",
    troubleNoDataBody:
      "anahtarın projesini ve endpoint’in ZYNTEKSIS origin’inize işaret ettiğini doğrulayın.",
    troubleRateTitle: "Hız sınırları",
    troubleRateBody:
      "ingest sınırlıdır (varsayılan 240 istek / dakika / anahtar). Geri çekilin ve yeniden deneyin.",
    registerLink: "Kayıt ol",
    signInLink: "giriş yapın",
    projectsLink: "Projeler",
    apiKeysLink: "API Anahtarları",
    billingLink: "Faturalama",
    sdkSectionLink: "SDK bölümü",
  },
  contact: {
    title: "İletişim",
    intro:
      "Platform, lisanslama veya dağıtım hakkında sorularınız mı var? Aşağıdaki ekibe ulaşın.",
    general: "Genel:",
    billing: "Faturalama mimarisi:",
    productAccess: "Ürün erişimi:",
    createAccount: "Hesap oluştur",
  },
  dashboard: {
    pageTitles: {
      dashboard: {
        title: "Panel",
        description: "Çalışma alanı özeti, canlı aktivite ve hızlı işlemler.",
      },
      projects: {
        title: "Projeler",
        description: "Servisleri proje, ortam ve sahiplik ile düzenleyin.",
      },
      apiKeys: {
        title: "API Anahtarları",
        description: "Kapsamlı SDK ingest anahtarları oluşturun, döndürün ve iptal edin.",
      },
      errors: {
        title: "Hata İzleme",
        description: "Üretim hatalarını gruplayın, keşfedin ve çözün.",
      },
      incidents: {
        title: "Olaylar",
        description: "Önem, durum ve müşteriye dönük güncellemeleri takip edin.",
      },
      health: {
        title: "Sağlık İzleme",
        description: "Her servis için uptime, gecikme ve uç nokta kontrolleri.",
      },
      insights: {
        title: "İstihbarat",
        description: "Hatalar, sağlık ve sürümler arasındaki eğilimler ve sinyaller.",
      },
      ai: {
        title: "AI Asistan",
        description: "Olaylar, yığın izleri ve operasyonel bağlam hakkında sorun.",
      },
      settings: {
        title: "Ayarlar",
        description: "Çalışma alanı tercihleri, AI seçenekleri ve görünüm.",
      },
      members: {
        title: "Üyeler",
        description: "Ekip arkadaşlarını davet edin ve rollerini yönetin.",
      },
      billing: {
        title: "Faturalama",
        description: "Plan limitleri, kullanım ve abonelik yönetimi.",
      },
      notifications: {
        title: "Bildirimler",
        description: "Uyarı yönlendirme ve kategori bazlı teslim tercihleri.",
      },
      statusPages: {
        title: "Durum Sayfaları",
        description: "Bileşen sağlığı ve olaylar için markalı genel sayfalar.",
      },
      audit: {
        title: "Denetim Kaydı",
        description: "Çalışma alanındaki güvenlikle ilgili eylemleri inceleyin.",
      },
      security: {
        title: "Güvenlik Merkezi",
        description: "Oturumlar, erişim kontrolleri ve güvenlik duruşu.",
      },
      organization: {
        title: "Organizasyon",
        description: "Çalışma alanı profili, marka ve org düzeyinde ayarlar.",
      },
      profile: {
        title: "Profil",
        description: "Hesap bilgileriniz ve kişisel tercihleriniz.",
      },
    },
    settingsSections: {
      profile: {
        title: "Profil",
        description:
          "Avatar, görünen ad, e-posta, şifre, dil ve saat dilimi.",
      },
      workspace: {
        title: "Çalışma alanı",
        description: "Ad, logo, marka rengi, saat dilimi, URL ve sahiplik.",
      },
      team: {
        title: "Ekip",
        description: "Üyeler, roller, davetler ve izinler.",
      },
      security: {
        title: "Güvenlik",
        description: "Oturumlar, cihazlar, son girişler ve 2FA politikası.",
      },
      notifications: {
        title: "Bildirimler",
        description:
          "E-posta, panel, Slack, Discord ve kategori bazlı tercihler.",
      },
      appearance: {
        title: "Görünüm",
        description:
          "Karanlık/aydınlık/sistem teması, vurgu, hareket, kenar çubuğu ve yoğunluk.",
      },
      ai: {
        title: "AI ayarları",
        description: "Kullanım, geçmiş, varsayılan model ve streaming.",
      },
      api: {
        title: "API ayarları",
        description: "API anahtarları, SDK anahtarları, webhook'lar ve hız limitleri.",
      },
      billing: {
        title: "Faturalama",
        description: "Mevcut plan, kullanım ve abonelik yönetimi.",
      },
    },
  },
  dashboardCommon: {
    save: "Kaydet",
    cancel: "İptal",
    create: "Oluştur",
    delete: "Sil",
    edit: "Düzenle",
    update: "Güncelle",
    close: "Kapat",
    confirm: "Onayla",
    back: "Geri",
    next: "İleri",
    previous: "Önceki",
    view: "Görüntüle",
    actions: "İşlemler",
    loading: "Yükleniyor…",
    empty: "Henüz bir şey yok",
    noRecords: "Gösterilecek kayıt yok.",
    error: "Bir şeyler ters gitti",
    retry: "Yeniden dene",
    search: "Ara",
    filter: "Filtrele",
    members: "Üyeler",
    status: "Durum",
    all: "Tümü",
    none: "Yok",
    yes: "Evet",
    no: "Hayır",
    saving: "Kaydediliyor…",
    searching: "Aranıyor…",
    previousPage: "Önceki sayfa",
    nextPage: "Sonraki sayfa",
    dismiss: "Kapat",
    copy: "Kopyala",
    copied: "Kopyalandı",
    regenerate: "Yenile",
    revoke: "İptal et",
    invite: "Davet et",
    accept: "Kabul et",
    decline: "Reddet",
    clearFilters: "Filtreleri temizle",
    exportCsv: "CSV Dışa Aktar",
    copyJson: "JSON Kopyala",
    downloadJson: "JSON İndir",
    copyLink: "Bağlantıyı kopyala",
    allProjects: "Tüm projeler",
    allStatuses: "Tüm durumlar",
    allSeverities: "Tüm önem düzeyleri",
    allEnvironments: "Tüm ortamlar",
    from: "Başlangıç",
    to: "Bitiş",
    project: "Proje",
    environment: "Ortam",
    severity: "Önem",
    matchingFilters: " filtreyle eşleşen",
    goToProjects: "Projelere Git",
    never: "Hiç",
    newestFirst: "En yeni önce",
    oldestFirst: "En eski önce",
    timeline: "Zaman Çizelgesi",
    details: "Detaylar",
    comment: "Yorum",
    environments: {
      production: "Production",
      staging: "Staging",
      development: "Development",
    },
    loadingStates: {
      generic: "Yükleniyor…",
      errors: "Hatalar yükleniyor…",
      errorDetails: "Hata detayları yükleniyor…",
      profile: "Profil yükleniyor…",
      notifications: "Bildirimler yükleniyor…",
      health: "Sağlık izleme yükleniyor…",
      billing: "Faturalama yükleniyor…",
      settings: "Ayarlar yükleniyor…",
      apiSettings: "API ayarları yükleniyor…",
      aiSettings: "AI ayarları yükleniyor…",
      appearance: "Görünüm ayarları yükleniyor…",
      incidents: "Olaylar yükleniyor…",
      incident: "Olay yükleniyor…",
      statusPages: "Durum sayfaları yükleniyor…",
      dashboard: "Panel yükleniyor…",
      status: "Durum yükleniyor…",
      initializing: "{app} başlatılıyor",
      adminModule: "Yönetim modülü yükleniyor",
      adminAi: "AI işlemleri yükleniyor",
      adminAnalytics: "Analitik yükleniyor",
      adminAudit: "Denetim yükleniyor",
      adminDashboard: "Panel yükleniyor",
      adminMonitoring: "İzleme yükleniyor",
      adminSecurity: "Güvenlik yükleniyor",
      adminSettings: "Ayarlar yükleniyor",
      adminUsers: "Kullanıcılar yükleniyor",
      adminWorkspaces: "Çalışma alanları yükleniyor",
    },
  },
  system: {
    somethingWrong: "Bir şeyler ters gitti",
    unexpectedError: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
    tryAgain: "Tekrar dene",
    sectionLoadFailed: "Bu bölüm yüklenemedi. Lütfen tekrar deneyin.",
    notFoundTitle: "Ağda kayboldunuz",
    notFoundDesc: "Aradığınız sayfa kayboldu veya taşındı.",
    backHome: "Ana sayfaya dön",
    maintenanceTitle: "Bakım",
    maintenanceInactive: "Platform çevrimiçi",
    maintenanceActive: "Bakım modu aktif değil.",
    continueDashboard: "Panele devam et",
    scheduledMaintenance: "Planlı bakım",
    maintenanceDesc:
      "Platform bakımı yapılırken ürün paneli geçici olarak kullanılamıyor.",
    operatorsContinue: "Platform operatörleri şuradan devam edebilir:",
    adminControlCenter: "Yönetim Kontrol Merkezi",
    copyCode: "Kodu kopyala",
    copy: "Kopyala",
    copied: "Kopyalandı",
    errorDetails: "Hata Detayları",
    incident: "Olay",
    status: "Durum",
    applicationError: "Uygulama hatası",
    criticalError: "Kritik bir hata oluştu. Lütfen sayfayı yenileyin.",
    reload: "Yenile",
  },
  emails: {
    invite: {
      subjectTemplate: "{app} üzerinde {workspace} çalışma alanına davet edildiniz",
      teammateFallback: "Bir ekip arkadaşı",
      heading: "Çalışma alanı daveti",
      invitedYou: "sizi şu çalışma alanına davet etti:",
      asRole: "rolüyle",
      instructions:
        "Bu e-posta adresiyle oturum açın veya hesap oluşturun, ardından kabul etmek için Davetler sayfasını açın.",
      cta: "Daveti görüntüle",
      orPaste: "Veya bu bağlantıyı yapıştırın:",
      textOpen: "Aç",
      textSignIn:
        "Davet edilen e-posta ile oturum açın, ardından Davetler'den kabul edin.",
    },
    notification: {
      footerNotice:
        "Bu e-postayı {app} hesabınızda bildirimler açık olduğu için alıyorsunuz. Tercihlerinizi panelden yönetebilirsiniz.",
      copyrightTemplate: "© {year} {app}",
      openLabel: "Aç",
    },
  },
  actionMessages: actionMessagesTr,
  dash: dashTr,
  admin: adminTr,
};
