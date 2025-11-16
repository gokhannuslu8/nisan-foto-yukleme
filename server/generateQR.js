const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Render URL'in BURAYA yaz
const RENDER_URL = "https://nisan-foto-yukleme.onrender.com/auth";

async function generateQRCode(url = RENDER_URL, outputPath = 'qr-code.png') {
  try {
    const qrCodePath = path.join(__dirname, '..', outputPath);

    await QRCode.toFile(qrCodePath, url, {
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    console.log(`✅ QR kod oluşturuldu: ${qrCodePath}`);
    console.log(`📱 URL: ${url}`);
    return qrCodePath;
  } catch (error) {
    console.error('QR kod oluşturma hatası:', error);
    throw error;
  }
}

// Eğer doğrudan çalıştırılırsa
if (require.main === module) {
  generateQRCode(RENDER_URL, 'qr-code.png');
}

module.exports = { generateQRCode };
