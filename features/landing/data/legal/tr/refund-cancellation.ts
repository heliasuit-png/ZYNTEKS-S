import {
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "@/features/landing/data/legal/terms";
import { LEGAL_LAST_UPDATED_TR } from "@/features/landing/data/legal/tr/terms";

export const refundCancellationDocumentTr: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED_TR,
  intro: [
    "Bu İade ve İptal Politikası, Zynteksis hizmetlerine uygulanabilir iptal ve iade kurallarını açıklar.",
  ],
  sections: [
    {
      heading: "1. ÜCRETSİZ HİZMETLER",
      paragraphs: [
        "Ücretsiz Zynteksis özellikleri, uygulanabilir Hizmet Şartlarına uygun olarak her zaman sonlandırılabilir veya sınırlandırılabilir.",
        "Ödeme yapılmamış hizmetler için iade uygulanmaz.",
      ],
    },
    {
      heading: "2. ÜCRETLİ ABONELİKLER",
      paragraphs: [
        "Ücretli aboneliklerin mevcut olduğu durumlarda, uygulanabilir faturalama dönemi ve fiyat satın alma öncesinde gösterilir.",
        "Kullanıcılar, Zynteksis tarafından sağlanan iptal seçeneklerine uygun olarak bir aboneliği iptal edebilir.",
        "Uygulanabilir hukukun aksi gerekmedikçe, bir aboneliğin iptali bir sonraki yenilemeyi engeller ancak başlamış bir dönem için otomatik olarak iade oluşturmaz.",
      ],
    },
    {
      heading: "3. YASAL TÜKETİCİ HAKLARI",
      paragraphs: [
        "Bu Politikadaki hiçbir hüküm, uygulanabilir Türk hukuku kapsamında sağlanan zorunlu tüketici haklarını sınırlamaz.",
        "Tüketicinin bir işlemden cayma veya işlemi iptal etme konusunda yasal hakkı bulunduğu durumlarda Zynteksis talebi uygulanabilir hukuka uygun olarak işleme alır.",
      ],
    },
    {
      heading: "4. DİJİTAL HİZMETLER",
      paragraphs: [
        "Zynteksis bir dijital yazılım hizmetidir.",
        "Hukuken izin verildiği durumlarda, tüketici anında ifayı açıkça talep ettikten ve cayma istisnasının uygulanabilir yasal koşulları sağlandıktan sonra dijital hizmetlere ilişkin yasal cayma hakkı uygulanmayabilir.",
      ],
    },
    {
      heading: "5. İADE UYGUNLUĞU",
      paragraphs: ["Bir iade şu durumlarda mümkün olabilir:"],
      bullets: [
        "Uygulanabilir hukukun gerektirdiği durumlarda;",
        "Bir ödemenin hatalı işleme alındığı durumlarda;",
        "Zynteksis’in açıkça iadeyi kabul ettiği durumlarda;",
        "Uygulanabilir hukuk kapsamında iadeye yol açan koşullarda bir hizmetin esaslı biçimde kullanılamaz olduğu durumlarda; veya",
        "Başka bir hukuken tanınan iade hakkının uygulanması durumunda.",
      ],
    },
    {
      heading: "6. İADE EDİLMEYEBİLECEK DURUMLAR",
      paragraphs: [
        "Zorunlu yasal haklar saklı kalmak üzere, yalnızca şu nedenlerle iade yapılmayabilir:",
      ],
      bullets: [
        "Kullanıcının Hizmeti kullanmamış olması;",
        "Kullanıcının Hizmeti doğru yapılandırmamış olması;",
        "Kullanıcının yapay zekâ tarafından üretilen önerileri incelememiş olması;",
        "Hukuken geçerli bir dijital hizmet cayma istisnası uygulanır hale geldikten sonra kullanıcının fikrini değiştirmesi; veya",
        "Kullanıcının yapay zekâ sisteminin belirli bir yazılım sonucunu garanti etmesini beklemesi.",
      ],
    },
    {
      heading: "7. İADE YÖNTEMİ",
      paragraphs: [
        "Onaylanan iadeler, teknik ve hukuki olarak mümkün olduğu ölçüde normalde orijinal ödeme yöntemi üzerinden iade edilir.",
        "İşlem süresi ödeme sağlayıcısına veya finans kuruluşuna bağlı olarak değişebilir.",
      ],
    },
    {
      heading: "8. İLETİŞİM",
      paragraphs: [
        "İade ve iptal talepleri şu adrese gönderilebilir:",
        LEGAL_OPERATOR.email,
        "Lütfen hesap e-posta adresini ve ilgili abonelik veya işlem bilgilerini ekleyin.",
      ],
    },
  ],
  closing: [
    "Hizmet Sağlayıcı:",
    LEGAL_OPERATOR.name,
    LEGAL_OPERATOR.registrationNo,
    LEGAL_OPERATOR.address,
    LEGAL_OPERATOR.email,
  ],
};
