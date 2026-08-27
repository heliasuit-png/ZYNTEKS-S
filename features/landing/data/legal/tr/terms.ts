import {
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "@/features/landing/data/legal/terms";

export const LEGAL_LAST_UPDATED_TR = "27 Ağustos 2026";

export const termsDocumentTr: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED_TR,
  intro: [
    'Bu Hizmet Şartları ("Şartlar"), aşağıda belirtilen işletmeci tarafından işletilen Zynteksis platformuna ("Zynteksis", "Platform", "Hizmet") erişimi ve kullanımı düzenler:',
    `İşletmeci: ${LEGAL_OPERATOR.name}`,
    `Kimlik / Sicil No.: ${LEGAL_OPERATOR.registrationNo}`,
    `Adres: ${LEGAL_OPERATOR.address}`,
    `E-posta: ${LEGAL_OPERATOR.email}`,
    "Zynteksis’te hesap oluşturarak, Platforma erişerek veya Hizmeti kullanarak bu Şartlara bağlı olmayı kabul edersiniz. Bu Şartları kabul etmiyorsanız Hizmeti kullanmamalısınız.",
  ],
  sections: [
    {
      heading: "1. Hizmetin Tanımı",
      paragraphs: [
        "Zynteksis, geliştiricilerin ve yazılım ekiplerinin yazılım hatalarını ve performans sorunlarını tespit etmesine, anlamasına, izlemesine ve gidermesine yardımcı olmak üzere tasarlanmış, yapay zekâ destekli bir yazılım geliştirme ve izleme platformudur.",
        "Uygulanabilir plana ve yapılandırmaya bağlı olarak Zynteksis şu özellikleri sağlayabilir:",
      ],
      bullets: [
        "Hata tespiti ve takibi;",
        "JavaScript ve React hata izleme;",
        "Ağ ve istek izleme;",
        "Performans ve gecikme izleme;",
        "Heartbeat ve servis sağlık izleme;",
        "Hata tekilleştirme;",
        "Yeniden deneme ve çevrimdışı kuyruklar;",
        "Olay yönetimi;",
        "Bildirimler ve uyarılar;",
        "Durum sayfaları;",
        "Proje panoları;",
        "Yapay zekâ destekli hata analizi;",
        "Yapay zekâ destekli kod analizi;",
        "Kök neden analizi;",
        "Hata ayıklama yardımı; ve",
        "İlgili Zynteksis projesinde mevcut bilgilere dayalı proje özelinde yapay zekâ yardımı.",
      ],
      paragraphsAfterBullets: [
        "Kullanılabilir özellikler ve kullanım limitleri seçilen plana göre değişebilir.",
      ],
    },
    {
      heading: "2. Yapay Zekâ Destekli Özellikler",
      paragraphs: [
        "Zynteksis, Platforma sağlanan veya Platform tarafından toplanan bilgileri analiz etmek için yapay zekâ kullanabilir.",
        "Yapay zekâ tarafından üretilen sonuçlar; açıklamalar, olası nedenler, öneriler, hata ayıklama önerileri ve yazılım sorunlarının çözümüne yönelik yaklaşımlar içerebilir.",
        "Yapay zekâ tarafından üretilen bilgiler bir yardım aracı olarak sunulur; tespit edilen nedenin, tanının, önerinin veya önerilen çözümün doğru olduğuna dair bir garanti değildir.",
        "Zynteksis, yapay zekâ çıktısının eksiksiz, doğru, güvenli, belirli bir amaca uygun veya hatasız olacağını garanti etmez.",
        "Hizmet içinde açıkça aksi belirtilmedikçe, Zynteksis yapay zekâ asistanı kullanıcının kaynak kodunu bağımsız olarak değiştirmez veya çalıştırmaz ve yeterli kanıt olmadan kesinlik iddiasında bulunmaz.",
        "Kullanıcılar, yapay zekâ tarafından üretilen herhangi bir öneriyi incelemek, test etmek, doğrulamak ve uygulayıp uygulamamaya karar vermekten yalnızca kendileri sorumludur.",
      ],
    },
    {
      heading: "3. Hesap Kaydı",
      paragraphs: [
        "Belirli özelliklere erişmek için hesap oluşturmanız gerekebilir.",
        "Doğru ve güncel bilgi sağlamayı ve hesap bilgilerinizi güncel tutmayı kabul edersiniz.",
        "Hesap kimlik bilgilerinizin ve API anahtarlarınızın gizliliğini korumaktan ve hesabınız üzerinden gerçekleştirilen tüm etkinliklerden siz sorumlusunuz.",
        "Hesabınızın veya API anahtarınızın ele geçirildiğini veya yetkisiz kullanıldığını düşünüyorsanız Zynteksis’i derhal bilgilendirmelisiniz.",
      ],
    },
    {
      heading: "4. API Anahtarları ve SDK Entegrasyonu",
      paragraphs: [
        "Zynteksis, projeye özel API anahtarları, SDK’lar, entegrasyon kimlik bilgileri veya benzer teknik kimlik bilgileri sağlayabilir.",
        "Bu kimlik bilgilerini güvenli şekilde kullanmak sizin sorumluluğunuzdadır.",
        "Özel API anahtarlarını veya kimlik bilgilerini yetkisiz kişilere kasıtlı olarak ifşa etmemeli, yayımlamamalı, dağıtmamalı, satmamalı veya başka şekilde açıklamamısınız.",
        "Zynteksis hesabınıza bağlanan uygulamalar, depolar, ortamlar, sistemler ve verilerden siz sorumlusunuz.",
      ],
    },
    {
      heading: "5. Kullanıcı İçeriği ve Veriler",
      paragraphs: [
        'Zynteksis’e gönderdiğiniz veya Zynteksis üzerinden erişilebilir kıldığınız kod, günlükler, hata bilgileri, proje bilgileri ve diğer içeriklerin ("Kullanıcı İçeriği") mülkiyeti, Zynteksis’in Hizmeti sunması için gerekli haklara tabi olmak üzere sizde kalır.',
        "Zynteksis’e, Kullanıcı İçeriğini yalnızca Hizmeti sağlamak, sürdürmek, güvence altına almak, geliştirmek ve desteklemek ile talep edilen analizleri ve işlevleri üretmek amacıyla işlemek üzere sınırlı, münhasır olmayan bir hak verirsiniz.",
        "Hizmeti kullanmanız yalnızca nedeniyle Zynteksis kaynak kodunuzun mülkiyetini edinmez.",
        "Kullanıcı İçeriğini Zynteksis’e göndermek için gerekli haklara ve izinlere sahip olduğunuzdan emin olmak sizin sorumluluğunuzdadır.",
      ],
    },
    {
      heading: "6. Yasaklı Kullanım",
      paragraphs: ["Şunları yapmamalısınız:"],
      bullets: [
        "Zynteksis’i hukuka aykırı amaçlarla kullanmak;",
        "Platforma veya başka bir kullanıcının hesabına yetkisiz erişim sağlamaya çalışmak;",
        "Hizmeti engellemek veya bozmak;",
        "Kullanım limitlerini veya güvenlik mekanizmalarını atlatmak;",
        "Uygulanabilir hukukun izin verdiği durumlar dışında, Hizmetin korunan kaynak kodunu veya gizli bileşenlerini tersine mühendislik yoluyla çıkarmaya veya elde etmeye çalışmak;",
        "API anahtarlarını, SDK’ları veya entegrasyonları kötüye kullanmak;",
        "Platformu tehlikeye atmaya yönelik kötü amaçlı kod, zararlı yazılım veya içerik yüklemek;",
        "Hizmeti başka bir kişinin haklarını ihlal etmek için kullanmak;",
        "Sahip olmadığınız veya test etme izniniz bulunmayan sistemlere karşı yetkisiz güvenlik testleri yapmak üzere Zynteksis’i kullanmak; veya",
        "Hizmeti, Zynteksis’e, altyapısına veya diğer kullanıcılara makul ölçüde önemli zarar verebilecek şekilde kullanmak.",
      ],
    },
    {
      heading: "7. Üçüncü Taraf Hizmetleri",
      paragraphs: [
        "Zynteksis; üçüncü taraf altyapı, API’ler, barındırma sağlayıcıları, analitik sağlayıcıları, kimlik doğrulama hizmetleri, yapay zekâ sağlayıcıları veya diğer teknoloji sağlayıcılarına dayanabilir.",
        "Üçüncü taraf hizmetlerinin kullanılabilirliği ve işleyişi belirli Zynteksis özelliklerini etkileyebilir.",
        "Uygulanabilir olduğu durumlarda, üçüncü taraf hizmetlerini kullanımınız kendi şartlarına ve gizlilik politikalarına da tabi olabilir.",
      ],
    },
    {
      heading: "8. Hizmetin Kullanılabilirliği",
      paragraphs: [
        "Zynteksis, Hizmeti kullanılabilir ve çalışır durumda tutmak için makul çabayı gösterecektir.",
        "Ancak kesintisiz veya hatasız kullanılabilirlik garanti edilmez.",
        "Hizmet; bakım, güncellemeler, teknik arızalar, güvenlik olayları, altyapı sorunları, üçüncü taraf hizmet kesintileri veya makul kontrol dışındaki durumlar nedeniyle geçici olarak kullanılamayabilir.",
      ],
    },
    {
      heading: "9. Fikri Mülkiyet",
      paragraphs: [
        "Zynteksis ile yazılımı, tasarımı, markası, arayüzleri, dokümantasyonu, teknolojisi ve diğer orijinal materyaller İşletmeciye aittir veya lisanslanmıştır ve uygulanabilir fikri mülkiyet kanunlarıyla korunur.",
        "Bu Şartlar kapsamında açıkça verilen sınırlı haklar dışında size herhangi bir mülkiyet hakkı devredilmez.",
      ],
    },
    {
      heading: "10. Ücretler ve Ücretli Planlar",
      paragraphs: [
        "Belirli özellikler ücretli abonelik planları kapsamında sunulabilir.",
        "Ücretli planların mevcut olduğu durumlarda, uygulanabilir fiyat, faturalama dönemi, dahil limitler ve diğer ticari şartlar satın alma öncesinde gösterilir.",
        "Açıkça ücretsiz olarak sunulan özellikler için ödeme gerekmez.",
        "Zynteksis, planlarını, fiyatlandırmasını, limitlerini veya özelliklerini uygulanabilir hukuka uygun olarak değiştirebilir. Mevcut ücretli abonelikleri etkileyen değişiklikler, uygulanabilir hukukun gerektirdiği şekilde duyurulur.",
      ],
    },
    {
      heading: "11. İptal ve Fesih",
      paragraphs: [
        "Zynteksis’i istediğiniz zaman kullanmayı bırakabilirsiniz.",
        "Zynteksis; Platformu korumak, uygulanabilir hukuka uymak, kötüye kullanımı önlemek, güvenlik risklerini ele almak veya kullanıcının bu Şartları esaslı biçimde ihlal etmesi durumunda erişimi askıya alabilir veya sonlandırabilir.",
        "Uygun olduğu durumlarda Zynteksis bildirimde bulunabilir ve ihlalin giderilmesi için fırsat tanıyabilir.",
      ],
    },
    {
      heading: "12. Sorumluluk Reddi",
      paragraphs: [
        "Zynteksis bir yazılım yardım ve izleme platformudur.",
        "Zynteksis şunları garanti etmez:",
      ],
      bullets: [
        "tüm yazılım hatalarının tespit edileceğini;",
        "tüm olayların belirleneceğini;",
        "yapay zekâ tarafından üretilen analizlerin doğru olacağını;",
        "önerilen çözümlerin belirli bir sorunu çözeceğini;",
        "izleme verilerinin her zaman eksiksiz veya kullanılabilir olacağını; veya",
        "Hizmetin kullanımının yazılım arızalarını, güvenlik olaylarını, kesintileri, veri kaybını veya diğer teknik sorunları önleyeceğini.",
      ],
      paragraphsAfterBullets: [
        "Yazılımınız, altyapınız, dağıtımlarınız, yedeklemeleriniz, güvenlik kontrolleriniz ve üretim kararlarınızdan siz sorumlu kalırsınız.",
      ],
    },
    {
      heading: "13. Sorumluluğun Sınırlandırılması",
      paragraphs: [
        "Uygulanabilir hukukun izin verdiği azami ölçüde Zynteksis, Hizmetin kullanımından veya bununla bağlantılı olarak doğan dolaylı, arızi, özel, sonuçsal veya kâr kaybı zararlarından sorumlu tutulamaz.",
        "Bu Şartlarda yer alan hiçbir hüküm, uygulanabilir hukukun yasakladığı durumlarda sorumluluğu hariç tutmaz veya sınırlamaz.",
      ],
    },
    {
      heading: "14. Tazmin",
      paragraphs: [
        "Uygulanabilir hukukun izin verdiği ölçüde, Hizmeti hukuka aykırı kullanımınızdan, bu Şartların ihlalinden, üçüncü taraf haklarının ihlalinden veya Platforma gönderdiğiniz Kullanıcı İçeriğinden kaynaklanan taleplerden sorumlu olmayı kabul edersiniz.",
      ],
    },
    {
      heading: "15. Bu Şartlardaki Değişiklikler",
      paragraphs: [
        "Zynteksis bu Şartları zaman zaman güncelleyebilir.",
        'Güncellenmiş sürüm, güncellenmiş bir "Son Güncelleme" tarihiyle Platformda yayımlanır.',
        "Uygulanabilir hukukun gerektirdiği durumlarda, esaslı değişiklikler kullanıcılara uygun yollarla bildirilir.",
      ],
    },
    {
      heading: "16. Uygulanacak Hukuk",
      paragraphs: [
        "Bu Şartlar, hukuken feragat edilemeyen zorunlu tüketici koruma hakları saklı kalmak üzere, Türkiye Cumhuriyeti kanunlarına tabi olacaktır.",
        "Tüketici işlemleri bakımından Türk hukukunda uygulanabilir zorunlu yetki ve uyuşmazlık çözüm kuralları geçerlidir.",
      ],
    },
    {
      heading: "17. İletişim",
      paragraphs: [
        "Bu Şartlarla ilgili sorularınız için lütfen şu adresten iletişime geçin:",
        LEGAL_OPERATOR.name,
        `E-posta: ${LEGAL_OPERATOR.email}`,
        `Adres: ${LEGAL_OPERATOR.address}`,
      ],
    },
  ],
  closing: [
    "Zynteksis’te hesap oluşturarak veya Zynteksis’i kullanarak bu Şartları okuduğunuzu ve anladığınızı kabul edersiniz.",
  ],
};
