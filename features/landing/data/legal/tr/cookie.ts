import {
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "@/features/landing/data/legal/terms";
import { LEGAL_LAST_UPDATED_TR } from "@/features/landing/data/legal/tr/terms";

export const cookieDocumentTr: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED_TR,
  intro: [
    "Bu Çerez Politikası, Zynteksis’in web sitesinde ve platformunda çerezleri ve benzer teknolojileri nasıl kullandığını açıklar.",
  ],
  sections: [
    {
      heading: "1. ÇEREZ NEDİR?",
      paragraphs: [
        "Çerezler, bir web sitesini ziyaret ederken veya çevrimiçi bir hizmeti kullanırken kullanıcının cihazında saklanan küçük veri dosyalarıdır.",
        "Tercihleri hatırlamak, oturumları sürdürmek, güvenlik sağlamak ve bir hizmetin nasıl kullanıldığını anlamak için kullanılabilirler.",
      ],
    },
    {
      heading: "2. ÇEREZ TÜRLERİ",
      paragraphs: [
        "Zynteksis aşağıdaki çerez kategorilerini kullanabilir:",
        "Zorunlu Çerezler",
        "Bu çerezler şu gibi temel işlevler için gereklidir:",
      ],
      bullets: [
        "Kimlik doğrulama;",
        "Hesap oturumları;",
        "Güvenlik;",
        "Yük dengeleme;",
        "Hizmet için gerekli kullanıcı tercihleri; ve",
        "Diğer temel teknik işlevler.",
      ],
      paragraphsAfterBullets: [
        "Bu çerezler, talep edilen hizmeti sağlamak için gerekli olduklarından, uygulanabilir hukukun izin verdiği durumlarda rıza olmaksızın kullanılabilir.",
        "Analitik Çerezler",
        "Etkinleştirildiğinde, analitik çerezler Zynteksis’in kullanıcıların web sitesiyle nasıl etkileşime girdiğini anlamasına ve performans ile kullanılabilirliği iyileştirmesine yardımcı olabilir.",
        "Uygulanabilir hukukun gerektirdiği durumlarda, zorunlu olmayan analitik çerezler yalnızca gerekli rıza alındıktan sonra etkinleştirilir.",
        "Tercih Çerezleri",
        "Bu çerezler dil veya arayüz ayarları gibi kullanıcı tercihlerini hatırlayabilir.",
        "Pazarlama Çerezleri",
        "Zynteksis, rızanın gerekli olduğu durumlar dâhil olmak üzere uygulanabilir yasal gereklilikler karşılanmadıkça zorunlu olmayan pazarlama veya reklam çerezlerini etkinleştirmeyecektir.",
      ],
    },
    {
      heading: "3. ÇEREZ RIZASI",
      paragraphs: [
        "Rızanın hukuken gerekli olduğu durumlarda kullanıcılara uygun bir çerez rıza mekanizması sunulur.",
        "Kullanıcılar, mevcut çerez yönetimi kontrolleri aracılığıyla çerez tercihlerini değiştirebilir veya geri çekebilir.",
      ],
    },
    {
      heading: "4. ÜÇÜNCÜ TARAF TEKNOLOJİLERİ",
      paragraphs: [
        "Belirli üçüncü taraf sağlayıcılar, hizmetleri Zynteksis’e entegre edildiğinde çerezler veya benzer teknolojiler kullanabilir.",
        "Uygulanabilir üçüncü taraf gizlilik ve çerez politikaları da geçerli olabilir.",
      ],
    },
    {
      heading: "5. TARAYICI KONTROLLERİ",
      paragraphs: [
        "Kullanıcılar tarayıcılarını çerezleri engelleyecek veya silecek şekilde yapılandırabilir.",
        "Gerekli çerezlerin engellenmesi, belirli Zynteksis özelliklerinin işlevselliğini veya kullanılabilirliğini etkileyebilir.",
      ],
    },
    {
      heading: "6. KİŞİSEL VERİ",
      paragraphs: [
        "Çerezlerin veya benzer teknolojilerin uygulanabilir hukuk kapsamında kişisel veri niteliğindeki bilgileri işlediği durumlarda, bu işleme uygulanabilir gizlilik ve veri koruma gerekliliklerine tabidir.",
      ],
    },
    {
      heading: "7. İLETİŞİM",
      paragraphs: [
        "Çerezler veya gizlilikle ilgili sorularınız için:",
        LEGAL_OPERATOR.name,
        `E-posta: ${LEGAL_OPERATOR.email}`,
        `Adres: ${LEGAL_OPERATOR.address}`,
      ],
    },
  ],
};
