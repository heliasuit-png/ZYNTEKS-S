import {
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "@/features/landing/data/legal/terms";
import { LEGAL_LAST_UPDATED_TR } from "@/features/landing/data/legal/tr/terms";

export const preliminaryInformationDocumentTr: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED_TR,
  intro: [
    "Bu Ön Bilgilendirme Formu, ücretli Zynteksis hizmetlerine ilişkin mesafeli sözleşmenin kurulmasından önce tüketicilere sunulur.",
  ],
  sections: [
    {
      heading: "1. HİZMET SAĞLAYICI BİLGİLERİ",
      paragraphs: [
        `İşletmeci / Hizmet Sağlayıcı: ${LEGAL_OPERATOR.name}`,
        `Kimlik / Sicil No.: ${LEGAL_OPERATOR.registrationNo}`,
        `Adres: ${LEGAL_OPERATOR.address}`,
        `E-posta: ${LEGAL_OPERATOR.email}`,
      ],
    },
    {
      heading: "2. HİZMET",
      paragraphs: [
        "Zynteksis, geliştirme izleme ve yapay zekâ destekli yazılım sorun giderme yetenekleri sunan bir yazılım platformudur.",
        "Seçilen plana bağlı olarak hizmet şunları içerebilir:",
      ],
      bullets: [
        "Hata izleme;",
        "JavaScript ve React hata takibi;",
        "Ağ izleme;",
        "Performans ve gecikme izleme;",
        "Heartbeat izleme;",
        "Olay yönetimi;",
        "Uyarılar ve bildirimler;",
        "Durum sayfaları;",
        "Panolar;",
        "Yapay zekâ destekli kod analizi;",
        "Yapay zekâ destekli hata analizi;",
        "Kök neden analizi; ve",
        "Hata ayıklama yardımı.",
      ],
      paragraphsAfterBullets: [
        "Tam özellikler ve limitler, tüketicinin seçtiği plan tarafından belirlenir.",
      ],
    },
    {
      heading: "3. FİYAT",
      paragraphs: [
        "Uygulanabilir abonelik fiyatı, faturalama dönemi, vergiler ve varsa ek ücretler, tüketici satın almayı tamamlamadan önce açıkça gösterilir.",
        "Açıkça ücretsiz olarak sunulan bir hizmet için tüketiciden ücret alınmaz.",
      ],
    },
    {
      heading: "4. ÖDEME",
      paragraphs: [
        "Ücretli abonelikler etkinleştirildiğinde, kullanılabilir ödeme yöntemleri ödeme (checkout) sürecinde gösterilir.",
        "İlgili Zynteksis özelliğinin ücretsiz sağlandığı durumlarda ödeme bilgisi talep edilmez.",
      ],
    },
    {
      heading: "5. HİZMETİN İFASI",
      paragraphs: [
        "Zynteksis bir dijital hizmettir. Erişim, başarılı hesap ve uygulanabilir olduğu durumlarda abonelik aktivasyonunu takiben elektronik ortamda sağlanır.",
      ],
    },
    {
      heading: "6. CAYMA HAKKI",
      paragraphs: [
        "Tüketiciler, uygulanabilir Türk tüketici mevzuatı kapsamında mevcut olan yasal cayma haklarını kullanabilir.",
        "Dijital hizmetlerde, ifanın tüketicinin açık talebiyle cayma süresi dolmadan başlaması dâhil olmak üzere, bu istisnanın yasal koşullarının sağlandığı durumlarda cayma hakkına ilişkin yasal istisnalar uygulanabilir.",
      ],
    },
    {
      heading: "7. İPTAL VE İADE",
      paragraphs: [
        "İptal ve iade koşulları Zynteksis İade ve İptal Politikasında açıklanır ve uygulanabilir hukuk kapsamındaki zorunlu tüketici haklarına tabidir.",
      ],
    },
    {
      heading: "8. HİZMET SINIRLAMALARI",
      paragraphs: [
        "Zynteksis bir yardım ve izleme aracıdır. Her yazılım hatasının veya olayının tespitini garanti etmez ve yapay zekâ tarafından üretilen önerilerin belirli bir teknik sorunu çözeceğini garanti etmez.",
      ],
    },
    {
      heading: "9. TÜKETİCİ SORUMLULUKLARI",
      paragraphs: [
        "Tüketici; yapay zekâ tarafından üretilen bilgileri incelemek, önerileri test etmek, yedeklemeleri sürdürmek, API anahtarlarını korumak ve nihai teknik ile üretim kararlarını almaktan sorumludur.",
      ],
    },
    {
      heading: "10. ŞİKÂYETLER VE İLETİŞİM",
      paragraphs: [
        "Tüketiciler Hizmet Sağlayıcıya şu kanallardan ulaşabilir:",
        `E-posta: ${LEGAL_OPERATOR.email}`,
        `Adres: ${LEGAL_OPERATOR.address}`,
        "Türk hukuku kapsamındaki zorunlu tüketici uyuşmazlık çözüm mekanizmaları geçerli kalır.",
      ],
    },
  ],
};
