import {
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "@/features/landing/data/legal/terms";
import { LEGAL_LAST_UPDATED_TR } from "@/features/landing/data/legal/tr/terms";

export const distanceSalesDocumentTr: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED_TR,
  intro: [
    'Bu Mesafeli Satış Sözleşmesi ("Sözleşme"), hizmet sağlayıcı ile ücretli bir Zynteksis hizmeti satın alan tüketici/kullanıcı arasında elektronik ortamda akdedilir.',
  ],
  sections: [
    {
      heading: "1. HİZMET SAĞLAYICI",
      paragraphs: [
        `İşletmeci / Hizmet Sağlayıcı: ${LEGAL_OPERATOR.name}`,
        `Kimlik / Sicil No.: ${LEGAL_OPERATOR.registrationNo}`,
        `Adres: ${LEGAL_OPERATOR.address}`,
        `E-posta: ${LEGAL_OPERATOR.email}`,
      ],
    },
    {
      heading: "2. TÜKETİCİ",
      paragraphs: [
        "Tüketicinin adı, soyadı, fatura bilgileri, iletişim bilgileri, seçilen plan, sipariş tarihi, fiyat ve diğer siparişe özgü bilgiler sipariş süreci sırasında gösterilir ve/veya kaydedilir.",
      ],
    },
    {
      heading: "3. SÖZLEŞMENİN KONUSU",
      paragraphs: [
        "Bu Sözleşmenin konusu, Zynteksis yazılım platformuna erişimin ve tüketicinin seçtiği dijital yazılım hizmetlerinin sağlanmasıdır.",
        "Zynteksis; seçilen plana bağlı olarak yazılım izleme, hata takibi, performans izleme, olay yönetimi, uyarılar, yapay zekâ destekli kod analizi, yapay zekâ destekli hata analizi, kök neden analizi ve hata ayıklama yardımı sağlayabilir.",
      ],
    },
    {
      heading: "4. SÖZLEŞMENİN KURULMASI",
      paragraphs: [
        "Sözleşme, tüketici ilgili sipariş sürecini tamamladığında ve uygulanabilir olduğu durumlarda ödeme sürecini tamamladığında elektronik ortamda kurulur.",
        "Tüketiciye, bir ödeme yükümlülüğü altına girmeden önce uygulanabilir hizmet ayrıntıları, fiyat, faturalama dönemi, iptal/iade koşulları ve diğer zorunlu bilgiler sunulur.",
      ],
    },
    {
      heading: "5. FİYAT VE ÖDEME",
      paragraphs: [
        "Uygulanabilir fiyat, satın alma hemen öncesinde tüketiciye gösterilen fiyattır.",
        "Açıkça aksi belirtilmedikçe, uygulanabilir vergiler ve zorunlu ücretler ödeme sırasında sunulan fiyat bilgisine yansıtılır.",
        "Zynteksis ücretli ödeme (checkout) işlevini etkinleştirmemişse, yalnızca hesap oluşturmak veya ücretsiz bir özelliği kullanmak nedeniyle bir ödeme yükümlülüğü doğmaz.",
      ],
    },
    {
      heading: "6. TESLİMAT / İFA",
      paragraphs: [
        "Zynteksis bir dijital yazılım hizmeti olduğundan ifa elektronik ortamda sağlanır.",
        "Anında dijital hizmet erişiminin seçildiği ve teknik olarak mümkün olduğu durumlarda, erişim başarılı sipariş tamamlanması ve ödemeden hemen sonra başlayabilir.",
      ],
    },
    {
      heading: "7. CAYMA HAKKI",
      paragraphs: [
        "Tüketicinin yasal olarak cayma hakkına sahip olduğu durumlarda, bu hak uygulanabilir Türk tüketici mevzuatına uygun olarak kullanılır.",
        "Dijital hizmetlerde, tüketicinin cayma süresi dolmadan ifanın başlamasını açıkça talep ettiği ve istisnanın yasal koşullarının sağlandığı durumlarda cayma hakkına ilişkin istisnalar uygulanabilir.",
      ],
    },
    {
      heading: "8. İADELER",
      paragraphs: [
        "İadeler, uygulanabilir hukuka ve Zynteksis İade ve İptal Politikasına uygun olarak ele alınır.",
        "Yasal olarak bir iade gerektiğinde, ilgili ödeme yöntemi veya başka bir hukuka uygun yöntem kullanılarak işleme alınır.",
      ],
    },
    {
      heading: "9. KULLANICI SORUMLULUKLARI",
      paragraphs: ["Tüketici şunlardan sorumludur:"],
      bullets: [
        "Doğru hesap bilgisi sağlamak;",
        "Hesap kimlik bilgilerini ve API anahtarlarını korumak;",
        "Gönderilen kod ve verilerin hukuka uygun şekilde işlenebilmesini sağlamak;",
        "Yapay zekâ tarafından üretilen önerileri incelemek;",
        "Önerilen çözümleri dağıtımdan önce test etmek; ve",
        "Uygun yedeklemeleri ve üretim güvencelerini sürdürmek.",
      ],
    },
    {
      heading: "10. YAPAY ZEKÂ DESTEKLİ HİZMET",
      paragraphs: [
        "Tüketici, yapay zekâ tarafından üretilen sonuçların hata veya eksik bilgi içerebileceğini kabul eder.",
        "Yapay zekâ analizi teknik yardım olarak sunulur ve belirli bir yazılım sonucunun garantisi değildir.",
      ],
    },
    {
      heading: "11. FESİH",
      paragraphs: [
        "Sözleşme, uygulanabilir hukuka ve uygulanabilir iptal şartlarına uygun olarak sona erdirilebilir.",
        "Fesih, fesih öncesinde doğmuş hak ve yükümlülükleri etkilemez.",
      ],
    },
    {
      heading: "12. UYUŞMAZLIK ÇÖZÜMÜ",
      paragraphs: [
        "Türk hukukunda uygulanabilir zorunlu tüketici koruması, arabuluculuk, tüketici hakem heyeti, tüketici mahkemesi ve yetki kuralları ilgili olduğu durumlarda geçerli kalır.",
      ],
    },
    {
      heading: "13. YÜRÜRLÜK TARİHİ",
      paragraphs: [
        "Bu Sözleşme, ücretli hizmet siparişinin başarıyla tamamlanmasıyla yürürlüğe girer.",
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
