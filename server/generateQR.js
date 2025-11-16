const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateQRCode(url, outputPath = 'qr-code.png') {
  try {
    const qrCodePath = path.join(__dirname, '..', outputPath);
    
    await QRCode.toFile(qrCodePath, url, {
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
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
  const url = process.argv[2] || 'http://localhost:3001';
  generateQRCode(url, 'qr-code.png');
}

module.exports = { generateQRCode };

