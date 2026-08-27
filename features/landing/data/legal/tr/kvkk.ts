import {
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "@/features/landing/data/legal/terms";
import { LEGAL_LAST_UPDATED_TR } from "@/features/landing/data/legal/tr/terms";

export const kvkkDocumentTr: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED_TR,
  intro: [
    'Bu KVKK Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili ikincil mevzuata uygun olarak hazırlanmıştır.',
  ],
  sections: [
    {
      heading: "1. VERİ SORUMLUSU",
      paragraphs: [
        "KVKK kapsamında veri sorumlusu:",
        LEGAL_OPERATOR.name,
        `Kimlik / Sicil No.: ${LEGAL_OPERATOR.registrationNo}`,
        `Adres: ${LEGAL_OPERATOR.address}`,
        `E-posta: ${LEGAL_OPERATOR.email}`,
      ],
    },
    {
      heading: "2. İŞLENEN KİŞİSEL VERİLER",
      paragraphs: [
        "Zynteksis ile olan ilişkiye ve kullanılan hizmetlere bağlı olarak aşağıdaki kişisel veri kategorileri işlenebilir:",
      ],
      bullets: [
        "Kimlik bilgileri;",
        "İletişim bilgileri;",
        "Hesap ve kimlik doğrulama bilgileri;",
        "Uygulanabilir olduğunda işlem ve abonelik bilgileri;",
        "Müşteri destek iletişimleri;",
        "IP adresi ve teknik tanımlayıcılar;",
        "Cihaz ve tarayıcı bilgileri;",
        "Güvenlik ve erişim günlükleri;",
        "Proje ile ilgili bilgiler;",
        "Uygulama hata ve performans bilgileri; ve",
        "Hizmetin sunumu ve güvenliği için gerekli diğer kişisel veriler.",
      ],
    },
    {
      heading: "3. İŞLEME AMAÇLARI",
      paragraphs: [
        "Kişisel veriler aşağıdaki amaçlarla işlenebilir:",
      ],
      bullets: [
        "Kullanıcı hesaplarının oluşturulması ve yönetilmesi;",
        "Zynteksis hizmetlerinin sağlanması;",
        "Yazılım hatalarının ve performansının izlenmesi ve analiz edilmesi;",
        "Yapay zekâ destekli teknik analizin sağlanması;",
        "Müşteri desteğinin sağlanması;",
        "Bilgi ve sistem güvenliğinin sağlanması;",
        "Yetkisiz erişimin ve kötüye kullanımın önlenmesi;",
        "Uygulanabilir olduğunda abonelik ve işlemlerin yönetilmesi;",
        "Yasal yükümlülüklerin yerine getirilmesi;",
        "Hukuki hakların kurulması, kullanılması veya korunması; ve",
        "Zynteksis’in güvenliğinin, güvenilirliğinin ve işlevselliğinin iyileştirilmesi.",
      ],
    },
    {
      heading: "4. TOPLAMA YÖNTEMLERİ",
      paragraphs: [
        "Kişisel veriler elektronik ortamda şu yollarla toplanabilir:",
      ],
      bullets: [
        "Zynteksis hesap kaydı;",
        "Web sitesi formları;",
        "Kimlik doğrulama sistemleri;",
        "SDK’lar ve API’ler;",
        "Uygulama ve sistem günlükleri;",
        "Müşteri destek iletişimleri;",
        "Uygulanabilir olduğunda abonelik ve ödeme süreçleri;",
        "Çerezler ve benzer teknolojiler; ve",
        "Zynteksis ile diğer elektronik etkileşimler.",
      ],
    },
    {
      heading: "5. HUKUKİ SEBEPLER",
      paragraphs: [
        "Kişisel veriler, KVKK’nın 5. ve 6. maddelerinde izin verilen hukuki sebeplerle, uygulanabilir olduğu durumlarda şu hallerde işlenebilir:",
      ],
      bullets: [
        "Açıkça öngörülen yasal koşulların işlemeye izin vermesi;",
        "İşlemenin bir sözleşmenin kurulması veya ifası için gerekli olması;",
        "İşlemenin bir yasal yükümlülüğe uyum için gerekli olması;",
        "İşlemenin bir hakkın kurulması, kullanılması veya korunması için gerekli olması;",
        "İşlemenin, hukukun izin verdiği ve ilgili kişinin temel haklarının orantısız şekilde etkilenmediği durumlarda meşru menfaatler için gerekli olması; ve",
        "Hukukun gerektirdiği durumlarda açık rızanın alınması.",
      ],
    },
    {
      heading: "6. KİŞİSEL VERİLERİN AKTARILMASI",
      paragraphs: [
        "Kişisel veriler, gerekli ve hukuken izin verildiği ölçüde şu taraflara aktarılabilir:",
      ],
      bullets: [
        "Barındırma ve bulut hizmet sağlayıcıları;",
        "Altyapı ve teknoloji sağlayıcıları;",
        "Kimlik doğrulama ve güvenlik sağlayıcıları;",
        "Yapay zekâ hizmet sağlayıcıları;",
        "Analitik sağlayıcıları;",
        "Müşteri destek sağlayıcıları;",
        "Uygulanabilir olduğunda ödeme hizmet sağlayıcıları;",
        "Hukuken gerekli olduğunda yetkili kamu kurum ve kuruluşları; ve",
        "Hukuki hakların korunması için gerekli olduğunda profesyonel danışmanlar veya hizmet sağlayıcıları.",
      ],
      paragraphsAfterBullets: [
        "Uluslararası aktarımların gerçekleştiği durumlarda uygulanabilir yasal gereklilikler ve güvenceler uygulanır.",
      ],
    },
    {
      heading: "7. VERİ SAKLAMA",
      paragraphs: [
        "Kişisel veriler, uygulanabilir hukukun gerektirdiği veya izin verdiği süreler boyunca ve toplandıkları amaçlar için gerekli olduğu sürece saklanır.",
        "Saklama süreleri, veri kategorisine ve işleme amacına göre farklılık gösterebilir.",
      ],
    },
    {
      heading: "8. İLGİLİ KİŞİNİN HAKLARI",
      paragraphs: [
        "KVKK’nın 11. maddesi uyarınca ilgili kişiler şu haklara sahip olabilir:",
      ],
      bullets: [
        "Kişisel verilerinin işlenip işlenmediğini öğrenme;",
        "Kişisel verileri işlenmişse bu konuda bilgi talep etme;",
        "İşleme amacını ve verilerin amaca uygun kullanılıp kullanılmadığını öğrenme;",
        "Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme;",
        "Eksik veya yanlış işlenmiş kişisel verilerin düzeltilmesini isteme;",
        "Kanunda öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme;",
        "Düzeltme, silme veya yok etmenin, uygulanabilir olduğunda üçüncü kişilere bildirilmesini isteme;",
        "İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin aleyhine bir sonucun ortaya çıkmasına itiraz etme;",
        "Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme.",
      ],
    },
    {
      heading: "9. HAKLARINIZIN KULLANILMASI",
      paragraphs: [
        "KVKK kapsamındaki haklarınıza ilişkin talepler şu adrese gönderilebilir:",
        LEGAL_OPERATOR.name,
        `E-posta: ${LEGAL_OPERATOR.email}`,
        `Adres: ${LEGAL_OPERATOR.address}`,
        "Başvurular, uygulanabilir KVKK mevzuatında öngörülen usul ve süreler çerçevesinde ele alınır.",
      ],
    },
    {
      heading: "10. ÖNEMLİ UYARI",
      paragraphs: [
        "Bu Aydınlatma Metni, ilgili kişileri kişisel verilerin işlenmesi hakkında bilgilendirmeyi amaçlar.",
        "Ayrı bir açık rızanın hukuken gerekli olduğu durumlarda, bu Aydınlatma Metninden ayrı olarak rıza talep edilir.",
      ],
    },
  ],
};
