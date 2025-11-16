# 📸 Nişan Fotoğraf & Video Yükleme Sistemi

Nişan töreninizde çekilen fotoğraf ve videoları QR kod ile erişilebilen bir sayfadan yükleyip otomatik olarak Google Drive klasörünüze kaydeden sistem.

## 🚀 Özellikler

- ✅ QR kod ile erişilebilen modern web arayüzü
- ✅ Drag & Drop dosya yükleme
- ✅ Çoklu dosya yükleme desteği
- ✅ Otomatik Google Drive entegrasyonu
- ✅ Gerçek zamanlı yükleme ilerlemesi
- ✅ Mobil uyumlu tasarım

## 📋 Gereksinimler

- Node.js (v14 veya üzeri)
- Google Cloud Platform hesabı
- Google Drive API erişimi

## 🔧 Kurulum

### 1. Projeyi İndirin ve Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Google Drive API Kurulumu

1. [Google Cloud Console](https://console.cloud.google.com/)'a gidin
2. Yeni bir proje oluşturun veya mevcut projeyi seçin
3. **API'ler ve Hizmetler > Kütüphane** bölümüne gidin
4. **Google Drive API**'yi arayın ve etkinleştirin
5. **API'ler ve Hizmetler > Kimlik Bilgileri** bölümüne gidin
6. **Kimlik Bilgileri Oluştur > Hizmet Hesabı** seçin
7. Hizmet hesabı oluşturun ve **JSON** anahtarı indirin
8. İndirdiğiniz JSON dosyasını `server/service-account-key.json` olarak kaydedin

### 3. Google Drive Klasör Paylaşımı

1. Google Drive'ınızda **"Nişan Foto&Video"** adında bir klasör oluşturun
2. Bu klasörü, service account'unuzun e-posta adresine **Editör** yetkisiyle paylaşın
   - Service account e-posta adresini `service-account-key.json` dosyasındaki `client_email` alanından bulabilirsiniz

### 4. Ortam Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değerleri düzenleyin:

```bash
cp .env.example .env
```

### 5. QR Kod Oluşturma

Sunucuyu başlattıktan sonra QR kod oluşturmak için:

```bash
node server/generateQR.js http://your-domain.com
```

## 🎯 Kullanım

### Geliştirme Modu

Frontend ve backend'i birlikte çalıştırmak için:

```bash
npm run dev
```

### Sadece Backend

```bash
npm run server
```

### Sadece Frontend

```bash
npm run client
```

### Production

```bash
npm run build
npm start
```

## 📱 QR Kod Kullanımı

1. Sunucunuzu başlatın
2. QR kod oluşturun: `node server/generateQR.js http://your-domain.com`
3. Oluşturulan `qr-code.png` dosyasını yazdırın
4. Nişan töreninde QR kodu gösterin
5. Misafirler QR kodu okutarak yükleme sayfasına erişsin

## 📁 Dosya Yapısı

```
nisan-foto-yukleme/
├── server/
│   ├── index.js              # Express sunucu
│   ├── driveService.js       # Google Drive entegrasyonu
│   ├── generateQR.js         # QR kod oluşturucu
│   └── uploads/              # Geçici dosya depolama
├── client/
│   ├── index.html            # Ana sayfa
│   ├── style.css             # Stil dosyası
│   └── script.js             # Frontend JavaScript
├── package.json
├── .env                      # Ortam değişkenleri
└── README.md
```

## ⚙️ Yapılandırma

### Dosya Boyutu Limiti

`server/index.js` dosyasında `multer` yapılandırmasında dosya boyutu limitini değiştirebilirsiniz:

```javascript
limits: {
  fileSize: 100 * 1024 * 1024 // 100MB
}
```

### Klasör Adı

Google Drive'daki klasör adını değiştirmek için `server/driveService.js` dosyasındaki `FOLDER_NAME` değişkenini düzenleyin.

## 🔒 Güvenlik

- Service account key dosyasını asla Git'e commit etmeyin
- `.env` dosyasını Git'e eklemeyin
- Production'da HTTPS kullanın
- Dosya yükleme limitlerini ayarlayın

## 🐛 Sorun Giderme

### Google Drive Bağlantı Hatası

- `service-account-key.json` dosyasının doğru konumda olduğundan emin olun
- Service account'un klasöre erişim yetkisi olduğunu kontrol edin
- Google Drive API'nin etkinleştirildiğini doğrulayın

### Dosya Yükleme Hatası

- Dosya boyutunun limit içinde olduğundan emin olun
- Dosya türünün desteklendiğini kontrol edin
- Sunucu loglarını kontrol edin

## 📝 Lisans

Bu proje kişisel kullanım için oluşturulmuştur.

## 🎉 İyi Nişanlar!

Umarım bu sistem nişan töreninizde size yardımcı olur. Tüm fotoğraf ve videolarınız güvenle Google Drive'ınıza kaydedilecek!

