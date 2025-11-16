const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { uploadToDrive, getAuthUrl, handleCallback, isAuthorized, initializeOAuth } = require('./oauthService');

const app = express();
const PORT = process.env.PORT || 3001;

// OAuth'u başlat
try {
  initializeOAuth();
} catch (error) {
  console.warn('⚠️ OAuth başlatılamadı (henüz credentials.json yok):', error.message);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Geçici dosya depolama için klasör oluştur
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer yapılandırması - dosyaları geçici olarak kaydet
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Sadece resim ve video dosyalarına izin ver
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece resim ve video dosyaları yüklenebilir!'));
    }
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// OAuth yetkilendirme endpoint'i
app.get('/auth', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({ 
      error: 'Yetkilendirme hatası',
      message: error.message,
      instructions: 'Lütfen credentials.json dosyasını oluşturun. Detaylar için GOOGLE_DRIVE_KURULUM.md dosyasına bakın.'
    });
  }
});

// OAuth callback endpoint'i
app.get('/oauth2callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Yetkilendirme kodu bulunamadı');
    }

    await handleCallback(code);
    res.send(`
      <html>
        <head><title>Yetkilendirme Başarılı</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: green;">✅ Yetkilendirme Başarılı!</h1>
          <p>Google Drive hesabınıza başarıyla bağlandınız.</p>
          <p><a href="/" style="color: #667eea; text-decoration: none; font-weight: bold;">Ana Sayfaya Dön</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`
      <html>
        <head><title>Yetkilendirme Hatası</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: red;">❌ Yetkilendirme Hatası</h1>
          <p>${error.message}</p>
          <p><a href="/" style="color: #667eea; text-decoration: none; font-weight: bold;">Ana Sayfaya Dön</a></p>
        </body>
      </html>
    `);
  }
});

// Yetkilendirme durumu kontrolü
app.get('/api/auth-status', (req, res) => {
  res.json({ authorized: isAuthorized() });
});

// Dosya yükleme endpoint'i
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    // Yetkilendirme kontrolü
    if (!isAuthorized()) {
      return res.status(401).json({ 
        error: 'Google Drive yetkilendirmesi gerekli',
        authUrl: '/auth',
        message: 'Lütfen önce Google Drive hesabınıza bağlanın.'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Lütfen en az bir dosya seçin!' });
    }

    const uploadedFiles = [];
    const errors = [];

    // Her dosyayı Google Drive'a yükle
    for (const file of req.files) {
      try {
        const filePath = file.path;
        const fileName = file.originalname;
        const mimeType = file.mimetype;

        console.log(`Yükleniyor: ${fileName}`);

        const driveFile = await uploadToDrive(filePath, fileName, mimeType);

        uploadedFiles.push({
          name: fileName,
          id: driveFile.id,
          webViewLink: driveFile.webViewLink
        });

        // Geçici dosyayı sil
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Dosya yükleme hatası (${file.originalname}):`, error);
        errors.push({
          name: file.originalname,
          error: error.message
        });
        // Hata durumunda da geçici dosyayı sil
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      uploaded: uploadedFiles,
      errors: errors,
      message: `${uploadedFiles.length} dosya başarıyla yüklendi!`
    });
  } catch (error) {
    console.error('Yükleme hatası:', error);
    res.status(500).json({ error: 'Dosya yükleme sırasında bir hata oluştu!' });
  }
});

// QR kod için URL endpoint'i
app.get('/api/qr-url', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
  res.json({ url: frontendUrl });
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
  console.log(`📸 Yükleme sayfası: http://localhost:${PORT}`);
});

