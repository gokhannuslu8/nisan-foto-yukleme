const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { uploadToDrive } = require('./driveService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Geçici dosya depolama klasörü
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer yapılandırması
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
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
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

// Dosya yükleme endpoint'i — artık OAuth yok
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Lütfen en az bir dosya seçin!' });
    }

    const uploadedFiles = [];
    const errors = [];

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

        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Dosya yükleme hatası (${file.originalname}):`, error);
        errors.push({
          name: file.originalname,
          error: error.message
        });

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

// QR için URL endpoint'i
app.get('/api/qr-url', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
  res.json({ url: frontendUrl });
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
  console.log(`📸 Yükleme sayfası: http://localhost:${PORT}`);
});
