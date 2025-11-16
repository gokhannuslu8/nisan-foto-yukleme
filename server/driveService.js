const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Drive API yapılandırması
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const FOLDER_NAME = 'Nişan Foto&Video';

// Service Account JSON dosyası (Render için doğru yol)
const KEYFILE_PATH =
  process.env.NODE_ENV === 'production'
    ? '/etc/secrets/service-account-key.json'
    : path.join(__dirname, 'service-account-key.json');

let driveClient = null;

// Google Drive istemcisini başlat
function initializeDrive() {
  try {
    if (!fs.existsSync(KEYFILE_PATH)) {
      throw new Error(
        '❌ service-account-key.json bulunamadı!\n' +
        '📁 Dosya şu konumda olmalı: ' + KEYFILE_PATH
      );
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE_PATH,
      scopes: SCOPES
    });

    driveClient = google.drive({
      version: 'v3',
      auth
    });

    console.log('✅ Google Drive (Service Account) bağlandı');
    return driveClient;

  } catch (error) {
    console.error('❌ Google Drive bağlantı hatası:', error.message);
    throw error;
  }
}

// Klasör ID'sini bul veya oluştur
async function getOrCreateFolder() {
  if (!driveClient) initializeDrive();

  try {
    const response = await driveClient.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (response.data.files.length > 0) {
      console.log(`📁 Klasör bulundu: ${response.data.files[0].id}`);
      return response.data.files[0].id;
    }

    const folder = await driveClient.files.create({
      resource: {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });

    console.log(`📁 Yeni klasör oluşturuldu: ${folder.data.id}`);
    return folder.data.id;

  } catch (error) {
    console.error('❌ Klasör hatası:', error);
    throw error;
  }
}

// Dosya yükleme
async function uploadToDrive(filePath, fileName, mimeType) {
  if (!driveClient) initializeDrive();

  try {
    const folderId = await getOrCreateFolder();

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType,
      body: fs.createReadStream(filePath)
    };

    const res = await driveClient.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink'
    });

    console.log(`✅ Yüklendi: ${fileName} (${res.data.id})`);
    return res.data;

  } catch (error) {
    console.error('❌ Yükleme hatası:', error);
    throw error;
  }
}

module.exports = {
  initializeDrive,
  uploadToDrive
};
