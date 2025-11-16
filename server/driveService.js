const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Service Account dosyasının Render'daki yolu:
const KEYFILE_PATH = '/etc/secrets/service-account-key.json';

// Drive klasör adı
const FOLDER_NAME = 'Nişan Foto&Video';

let driveClient = null;

// Google Drive client başlat
function initializeDrive() {
  try {
    // Dosya var mı?
    if (!fs.existsSync(KEYFILE_PATH)) {
      throw new Error(
        `❌ Service Account anahtarı bulunamadı: ${KEYFILE_PATH}\n` +
        `📌 Render Secret Files kısmına service-account-key.json dosyasını eklediğinizden emin olun.`
      );
    }

    // GoogleAuth oluştur
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE_PATH,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    driveClient = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive bağlantısı başarılı');

    return driveClient;
  } catch (err) {
    console.error('❌ Google Drive başlatma hatası:', err);
    throw err;
  }
}

// Klasör ID’sini bul veya oluştur
async function getOrCreateFolder() {
  if (!driveClient) initializeDrive();

  try {
    // Var mı kontrol et
    const response = await driveClient.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Yoksa oluştur
    const folder = await driveClient.files.create({
      resource: {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });

    return folder.data.id;
  } catch (err) {
    console.error('❌ Klasör oluşturma hatası:', err);
    throw err;
  }
}

// Dosya yükleme
async function uploadToDrive(filePath, fileName, mimeType) {
  if (!driveClient) initializeDrive();

  try {
    const folderId = await getOrCreateFolder();

    const file = await driveClient.files.create({
      resource: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType,
        body: fs.createReadStream(filePath)
      },
      fields: 'id, webViewLink'
    });

    console.log(`📤 Yüklendi: ${fileName}`);
    return file.data;
  } catch (err) {
    console.error('❌ Upload hatası:', err);
    throw err;
  }
}

module.exports = { uploadToDrive };
