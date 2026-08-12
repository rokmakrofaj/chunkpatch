<div align="center">
  <img src="/128x128.png" alt="ChunkPatch Logo" width="128" />
  <h1>ChunkPatch</h1>
  <p><strong>Modern, Güvenilir ve Açık Kaynaklı Türkçe Yama Yöneticisi</strong></p>
</div>

---

## 🚀 Nedir?
ChunkPatch, Steam ve Epic Games kütüphanenizdeki oyunları otomatik olarak tarayan ve bu oyunlar için topluluk tarafından hazırlanan Türkçe yamaları **tek tıkla** indirip kurmanızı sağlayan modern bir masaüstü uygulamasıdır. Rust tabanlı [Tauri](https://tauri.app/) altyapısı sayesinde inanılmaz derecede hızlı ve hafiftir.

## ✨ Öne Çıkan Özellikler
- **🔍 Dinamik Kütüphane Taraması:** Steam ve Epic Games hesaplarınızı otomatik algılar ve yüklü oyunlarınızı bulur.
- **🛡️ Sürüm Sağlığı Denetleyicisi (Version Health):** Oyununuzun mevcut sürümü (Build ID) ile yamayı karşılaştırır. Oyun güncellenmiş ve yama bozulmuşsa sizi uyarır.
- **⚡ Tek Tıkla Kurulum:** Zip dosyalarıyla, klasör aramakla uğraşmanıza gerek yok. İndir ve Kur butonuna basmanız yeterlidir.
- **🗑️ Yedek Yöneticisi:** Yamalar kurulurken oyununuzun orijinal dosyaları otomatik yedeklenir. İstediğiniz an tek tıkla yamayı silebilir ve orijinal oyuna dönebilirsiniz.
- **🌐 Topluluk Yamaları:** Kendi yaptığınız yamaları GitHub üzerinden `database.json` dosyasına ekleyerek tüm ChunkPatch kullanıcılarıyla anında paylaşabilirsiniz.
- **🔄 Otomatik Güncelleme:** Uygulama kendini arka planda sessizce günceller.

## 🛠️ Kurulum
Uygulamanın hazır derlenmiş (Setup) halini indirmek için **[Releases](https://github.com/rokmakrofaj/chunkpatch/releases)** sekmesine gidin ve en son `.exe` dosyasını indirin.

## 💻 Geliştiriciler İçin (Projeyi Derleme)
Projeyi kendi bilgisayarınızda geliştirmek veya derlemek istiyorsanız:

### Gereksinimler
- [Node.js](https://nodejs.org/) (v16 veya üstü)
- [Rust](https://www.rust-lang.org/tools/install)
- Windows üzerinde geliştirme yapıyorsanız [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Adımlar
1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/rokmakrofaj/chunkpatch.git
   cd chunkpatch
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Geliştirme modunu (Development) başlatın:
   ```bash
   npm run tauri dev
   ```
4. Yeni bir exe (Setup) derlemek için:
   ```bash
   npm run tauri build
   ```

## 🤝 Katkıda Bulunma
Projeye veya yama veritabanına katkıda bulunmak çok kolay!
- **Yama Eklemek İçin:** `github-chunkpatch` reposundaki `database.json` dosyasına Pull Request (PR) gönderebilirsiniz.
- **Kod Geliştirmek İçin:** `Issues` sekmesinde bulunan açık görevleri alabilir veya yeni özellikler önerebilirsiniz.

## 📄 Lisans
Bu proje açık kaynaklıdır ve MIT lisansı ile dağıtılmaktadır. Daha fazla bilgi için `LICENSE` dosyasına bakabilirsiniz.
