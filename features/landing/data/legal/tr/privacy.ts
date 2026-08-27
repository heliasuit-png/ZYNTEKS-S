import {
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "@/features/landing/data/legal/terms";
import { LEGAL_LAST_UPDATED_TR } from "@/features/landing/data/legal/tr/terms";

export const privacyDocumentTr: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED_TR,
  intro: [
    "Bu Gizlilik Politikası, Zynteksis’in Zynteksis web sitesi, platformu, uygulamaları, SDK’ları, API’leri ve ilgili hizmetlerle bağlantılı olarak kişisel bilgileri nasıl işlediğini açıklar.",
  ],
  sections: [
    {
      heading: "1. VERİ SORUMLUSU",
      paragraphs: [
        `Veri Sorumlusu: ${LEGAL_OPERATOR.name}`,
        `Kimlik / Sicil No.: ${LEGAL_OPERATOR.registrationNo}`,
        `Adres: ${LEGAL_OPERATOR.address}`,
        `E-posta: ${LEGAL_OPERATOR.email}`,
      ],
    },
    {
      heading: "2. İŞLEYEBİLECEĞİMİZ BİLGİLER",
      paragraphs: [
        "Zynteksis’i nasıl kullandığınıza bağlı olarak şunları işleyebiliriz:",
      ],
      bullets: [
        "Ad ve soyad;",
        "E-posta adresi;",
        "Hesap kimlik bilgileri ve kimlik doğrulama bilgileri;",
        "Proje ve çalışma alanı bilgileri;",
        "Ücretli hizmetlerin etkin olduğu durumlarda abonelik ve işlem bilgileri;",
        "Teknik günlükler;",
        "IP adresi ve cihaz bilgileri;",
        "Tarayıcı ve işletim sistemi bilgileri;",
        "Hata raporları;",
        "Uygulama performans bilgileri;",
        "Ağ/istek bilgileri;",
        "Olay bilgileri;",
        "Heartbeat ve servis sağlık bilgileri;",
        "Destek iletişimleri yoluyla gönderilen bilgiler; ve",
        "Talep edilen Hizmeti sağlamak için gerekli diğer bilgiler.",
      ],
    },
    {
      heading: "3. KAYNAK KODU VE TEKNİK VERİLER",
      paragraphs: [
        "Kullanıcılar uygulamalarını Zynteksis ile entegre ettiğinde; hatalar, yığın izleri, günlükler, istek bilgileri, performans verileri, çerçeve bilgileri, sürüm bilgileri ve ilgili proje bağlamı gibi teknik bilgiler işlenebilir.",
        "Kullanıcılar; parolaları, kimlik doğrulama sırlarını, özel anahtarları, ödeme kartı bilgilerini veya diğer gereksiz hassas bilgileri hata günlükleri veya uygulama yükleri yoluyla göndermemelidir.",
      ],
    },
    {
      heading: "4. İŞLEME AMAÇLARI",
      paragraphs: ["Kişisel veriler şu amaçlarla işlenebilir:"],
      bullets: [
        "Kullanıcı hesaplarının oluşturulması ve yönetilmesi;",
        "Zynteksis’in sağlanması ve işletilmesi;",
        "Uygulama hatalarının ve performansının izlenmesi;",
        "Talep edilen yapay zekâ destekli analizin sağlanması;",
        "Müşteri desteğinin sağlanması;",
        "Güvenliğin sürdürülmesi;",
        "Kötüye kullanımın ve yetkisiz faaliyetin tespiti;",
        "Dolandırıcılığın önlenmesi;",
        "Uygulanabilir olduğunda aboneliklerin yönetilmesi;",
        "Yasal olarak zorunlu kayıtların işlenmesi;",
        "Hizmetin güvenilirliğinin ve işlevselliğinin iyileştirilmesi; ve",
        "Yasal yükümlülüklere uyulması.",
      ],
    },
    {
      heading: "5. HUKUKİ DAYANAKLAR",
      paragraphs: [
        "Kişisel veriler, uygulanabilir hukuk kapsamında gerekli olduğu durumlarda işlenebilir; bunlar şunları içerir:",
      ],
      bullets: [
        "İşlemenin bir sözleşmenin ifası veya kurulması için gerekli olması;",
        "İşlemenin bir yasal yükümlülüğe uyum için gerekli olması;",
        "İşlemenin bir hukuki hakkın kurulması, kullanılması veya korunması için gerekli olması;",
        "İşlemenin, izin verildiği ve bireyin haklarıyla dengelendiği ölçüde veri sorumlusunun meşru menfaatleri için gerekli olması; veya",
        "Açık rızanın hukuken gerekli olması ve alınmış olması.",
      ],
    },
    {
      heading: "6. YAPAY ZEKÂ İŞLEME",
      paragraphs: [
        "Zynteksis, Hizmet yoluyla sağlanan teknik bilgileri analiz etmek için yapay zekâ teknolojileri kullanabilir.",
        "Yapay zekâ işleme; açıklamalar üretmek, olası nedenleri belirlemek, hata ayıklama yaklaşımları önermek ve kullanıcıların teknik sorunları anlamasına yardımcı olmak için kullanılabilir.",
        "Yapay zekâ çıktısının doğru veya eksiksiz olduğu garanti edilmez.",
        "Talep edilen bir özelliği sağlamak için üçüncü taraf yapay zekâ sağlayıcıları kullanıldığında, ilgili bilgiler özelliğin sunulması için gerekli olduğu ölçüde ve uygulanabilir sözleşmesel ile hukuki güvencelere tabi olarak bu sağlayıcılar tarafından işlenebilir.",
      ],
    },
    {
      heading: "7. VERİ PAYLAŞIMI",
      paragraphs: [
        "Kişisel veriler, Zynteksis’i işletmek için gerekli olduğu durumlarda hizmet sağlayıcıları ve teknoloji sağlayıcılarıyla paylaşılabilir; bunlar şu sağlayıcıları içerir:",
      ],
      bullets: [
        "Barındırma ve bulut altyapısı;",
        "Kimlik doğrulama;",
        "Veritabanı hizmetleri;",
        "Yapay zekâ işleme;",
        "Güvenlik;",
        "Analitik;",
        "Müşteri desteği;",
        "Uygulanabilir olduğunda ödeme işleme; ve",
        "Hizmeti sağlamak için gereken diğer altyapı.",
      ],
      paragraphsAfterBullets: [
        "Veriler ayrıca hukukun gerektirdiği durumlarda veya hukuki hakların ve güvenliğin korunması için açıklanabilir.",
      ],
    },
    {
      heading: "8. ULUSLARARASI AKTARIMLAR",
      paragraphs: [
        "Kişisel verilerin Türkiye dışına aktarıldığı durumlarda Zynteksis, uygulanabilir veri koruma hukuku kapsamında gerekli aktarım mekanizmalarını ve güvenceleri uygular.",
      ],
    },
    {
      heading: "9. VERİ GÜVENLİĞİ",
      paragraphs: [
        "Zynteksis, kişisel bilgileri yetkisiz erişim, kayıp, kötüye kullanım, değiştirme veya ifşaya karşı korumayı amaçlayan makul teknik ve idari önlemler uygular.",
        "Ancak hiçbir internet tabanlı hizmet mutlak güvenliği garanti edemez.",
      ],
    },
    {
      heading: "10. VERİ SAKLAMA",
      paragraphs: [
        "Kişisel veriler, yalnızca bu Politikada açıklanan amaçlar, sözleşmesel gereklilikler, yasal yükümlülükler, uyuşmazlık çözümü, güvenlik ve meşru iş ihtiyaçları için makul ölçüde gerekli olduğu süre boyunca saklanır.",
        "Saklama süreleri, verinin türüne ve amacına göre değişebilir.",
      ],
    },
    {
      heading: "11. KULLANICI HAKLARI",
      paragraphs: [
        "Uygulanabilir hukuka tabi olarak bireyler şu haklara sahip olabilir:",
      ],
      bullets: [
        "Kişisel verilerin işlenip işlenmediğini öğrenme;",
        "İşleme hakkında bilgi talep etme;",
        "İşleme amaçlarını ve alıcıları öğrenme;",
        "Yanlış veya eksik verilerin düzeltilmesini talep etme;",
        "Hukuken uygulanabilir olduğunda silme veya yok etme talep etme;",
        "Gerektiğinde düzeltme veya silmelerin ilgili alıcılara bildirilmesini talep etme;",
        "Belirli işlemlere itiraz etme;",
        "Uygulanabilir olduğunda kısıtlama veya sınırlama talep etme; ve",
        "Uygulanabilir veri koruma hukukunun sağladığı diğer hakları kullanma.",
      ],
      paragraphsAfterBullets: [
        "Talepler şu adrese gönderilebilir:",
        LEGAL_OPERATOR.email,
      ],
    },
    {
      heading: "12. DEĞİŞİKLİKLER",
      paragraphs: [
        "Bu Gizlilik Politikası zaman zaman güncellenebilir. En son sürüm Zynteksis web sitesinde yayımlanır.",
      ],
    },
    {
      heading: "13. İLETİŞİM",
      paragraphs: [
        LEGAL_OPERATOR.name,
        LEGAL_OPERATOR.registrationNo,
        LEGAL_OPERATOR.address,
        LEGAL_OPERATOR.email,
      ],
    },
  ],
};
