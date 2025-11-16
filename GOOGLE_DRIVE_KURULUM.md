# 🔧 Google Drive API Kurulum Rehberi (OAuth 2.0)

Bu rehber, fotoğrafların Google Drive hesabınıza yüklenmesi için gerekli adımları içerir.

**ÖNEMLİ:** Service Account yerine OAuth 2.0 kullanıyoruz çünkü Service Account'ların kendi depolama kotası yoktur.

## 📋 Adım 1: Google Cloud Console'da Proje Oluşturma

1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Google hesabınızla giriş yapın
3. Üst kısımdaki proje seçiciye tıklayın
4. **"YENİ PROJE"** butonuna tıklayın
5. Proje adını girin (örn: "Nisan Foto Yukleme")
6. **"Oluştur"** butonuna tıklayın
7. Oluşturulan projeyi seçin

## 📋 Adım 2: Google Drive API'yi Etkinleştirme

1. Sol menüden **"API'ler ve Hizmetler"** > **"Kütüphane"** seçin
2. Arama kutusuna **"Google Drive API"** yazın
3. **"Google Drive API"** seçeneğine tıklayın
4. **"ETKİNLEŞTİR"** butonuna tıklayın
5. API'nin etkinleştirilmesini bekleyin (birkaç saniye sürebilir)

## 📋 Adım 3: OAuth 2.0 Client ID Oluşturma

1. Sol menüden **"API'ler ve Hizmetler"** > **"Kimlik Bilgileri"** seçin
2. Üst kısımdaki **"+ KİMLİK BİLGİLERİ OLUŞTUR"** butonuna tıklayın
3. **"OAuth istemci kimliği"** seçeneğini seçin

### 3.1. OAuth Onay Ekranını Yapılandırma (İlk kez ise)

Eğer ilk kez OAuth kullanıyorsanız, önce onay ekranını yapılandırmanız gerekir:

1. **"OAuth onay ekranını yapılandır"** linkine tıklayın
2. **Kullanıcı türü** olarak **"Harici"** seçin (veya "İç" eğer Google Workspace kullanıyorsanız)
3. **"OLUŞTUR"** butonuna tıklayın
4. **Uygulama bilgileri** bölümünü doldurun:
   - **Uygulama adı**: `Nişan Foto Yükleme` (veya istediğiniz bir isim)
   - **Kullanıcı destek e-postası**: Kendi e-posta adresinizi seçin
   - **Geliştirici iletişim bilgileri**: E-posta adresinizi girin
5. **"KAYDET VE DEVAM ET"** butonuna tıklayın
6. **Kapsamlar** bölümünde **"KAYDET VE DEVAM ET"** butonuna tıklayın (varsayılan kapsamlar yeterli)
7. **Test kullanıcıları** bölümünde kendi e-posta adresinizi ekleyin (harici kullanıcı türü seçtiyseniz)
8. **"KAYDET VE DEVAM ET"** butonuna tıklayın
9. **Özet** bölümünde **"DASHBOARD'A DÖN"** butonuna tıklayın

### 3.2. OAuth Client ID Oluşturma

1. **"API'ler ve Hizmetler"** > **"Kimlik Bilgileri"** bölümüne geri dönün
2. **"+ KİMLİK BİLGİLERİ OLUŞTUR"** > **"OAuth istemci kimliği"** seçin
3. **Uygulama türü** olarak **"Masaüstü uygulaması"** seçin
4. **Ad** kısmına `Nisan Foto Yukleme Client` yazın
5. **"OLUŞTUR"** butonuna tıklayın
6. Açılan pencerede **"JSON İNDİR"** butonuna tıklayın
7. JSON dosyası otomatik olarak indirilecek

## 📋 Adım 4: JSON Dosyasını Projeye Ekleme

1. İndirdiğiniz JSON dosyasını bulun (genellikle `İndirilenler` klasöründe)
2. Dosya adı şuna benzer olacak: `client_secret_xxxxx-xxxxx.apps.googleusercontent.com.json`
3. Bu dosyayı kopyalayın
4. Proje klasörünüzdeki `server` klasörüne yapıştırın
5. Dosya adını **`credentials.json`** olarak değiştirin

   **ÖNEMLİ:** Dosya tam olarak `server/credentials.json` konumunda olmalı!

## 📋 Adım 5: Yetkilendirme (İlk Kullanım)

1. Sunucunuzu başlatın: `npm run dev`
2. Tarayıcıda şu adrese gidin: `http://localhost:3001/auth`
3. Google hesabınızla giriş yapın
4. İzinleri onaylayın (Google Drive'a erişim izni)
5. Yetkilendirme başarılı mesajını göreceksiniz
6. Artık fotoğraf yükleyebilirsiniz!

## ✅ Kurulum Tamamlandı!

Artık sisteminiz hazır! Dosyalar doğrudan Google Drive hesabınıza yüklenecek.

### Test Etmek İçin:

1. Sunucuyu başlatın: `npm run dev`
2. Tarayıcıda `http://localhost:3001` adresine gidin
3. Eğer henüz yetkilendirme yapmadıysanız, `/auth` adresine gidin
4. Bir fotoğraf yükleyin
5. Google Drive'ınızdaki **"Nişan Foto&Video"** klasörünü kontrol edin

## 🔄 Token Yenileme

Token'ınız süresi dolduğunda (genellikle 1 saat sonra), otomatik olarak yenilenecektir. Eğer yenilenemezse, tekrar `/auth` adresine gidip yetkilendirme yapmanız gerekebilir.

## 🐛 Sorun Giderme

### "credentials.json bulunamadı" hatası
- Dosyanın `server` klasöründe olduğundan emin olun
- Dosya adının tam olarak `credentials.json` olduğunu kontrol edin

### "OAuth onay ekranı yapılandırılmamış" hatası
- Adım 3.1'deki onay ekranı yapılandırmasını tamamladığınızdan emin olun
- Test kullanıcıları listesine kendi e-posta adresinizi eklediğinizden emin olun

### "Yetkilendirme gerekli" hatası
- `/auth` adresine gidip Google hesabınızla yetkilendirme yapın
- İzinleri onayladığınızdan emin olun

### Dosyalar yükleniyor ama Drive'da görünmüyor
- Google Drive API'nin etkinleştirildiğini kontrol edin
- Sunucu konsolundaki hata mesajlarını kontrol edin
- Token'ın süresi dolmuş olabilir, `/auth` adresine tekrar gidin

### "redirect_uri_mismatch" hatası
- Google Cloud Console'da OAuth Client ID ayarlarını kontrol edin
- **Yetkili yönlendirme URI'leri** bölümüne `http://localhost:3001/oauth2callback` ekleyin

## 📞 Yardım

Sorun yaşarsanız, sunucu konsolundaki hata mesajlarını kontrol edin. Hata mesajları size sorunun kaynağını gösterecektir.

## 🔒 Güvenlik Notları

- `credentials.json` dosyasını asla Git'e commit etmeyin (`.gitignore`'a eklendi)
- `token.json` dosyası otomatik oluşturulur ve hassas bilgiler içerir
- Production'da HTTPS kullanın
- OAuth Client ID'yi güvende tutun
