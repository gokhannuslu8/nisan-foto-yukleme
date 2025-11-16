const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Drive API yapılandırması
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const FOLDER_NAME = 'Nişan Foto&Video';

let driveClient = null;

// Google Drive istemcisini başlat
function initializeDrive() {
  try {
    const keyFilePath = path.join(__dirname, 'service-account-key.json');
    
    // Dosyanın varlığını kontrol et
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(
        '❌ service-account-key.json dosyası bulunamadı!\n' +
        '📋 Lütfen GOOGLE_DRIVE_KURULUM.md dosyasındaki adımları takip edin.\n' +
        '📁 Dosya şu konumda olmalı: ' + keyFilePath
      );
    }

    // Service Account kullanarak kimlik doğrulama
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: SCOPES
    });

    driveClient = google.drive({
      version: 'v3',
      auth: auth
    });

    console.log('✅ Google Drive API başarıyla bağlandı');
    return driveClient;
  } catch (error) {
    console.error('❌ Google Drive bağlantı hatası:', error.message);
    throw error;
  }
}

// Klasör ID'sini bul veya oluştur
async function getOrCreateFolder() {
  if (!driveClient) {
    driveClient = initializeDrive();
  }

  try {
    // Klasörü ara
    const response = await driveClient.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (response.data.files.length > 0) {
      console.log(`📁 Klasör bulundu: ${FOLDER_NAME} (ID: ${response.data.files[0].id})`);
      return response.data.files[0].id;
    }

    // Klasör yoksa oluştur
    const folderMetadata = {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await driveClient.files.create({
      resource: folderMetadata,
      fields: 'id, name'
    });

    console.log(`📁 Yeni klasör oluşturuldu: ${FOLDER_NAME} (ID: ${folder.data.id})`);
    return folder.data.id;
  } catch (error) {
    console.error('❌ Klasör işlemi hatası:', error.message);
    
    if (error.message.includes('insufficient authentication scopes')) {
      throw new Error(
        '❌ Google Drive API yetkisi yetersiz!\n' +
        '📋 Lütfen Google Cloud Console\'da Google Drive API\'nin etkinleştirildiğinden emin olun.'
      );
    }
    
    if (error.message.includes('not found') || error.message.includes('permission')) {
      throw new Error(
        '❌ Klasör erişim hatası!\n' +
        '📋 Lütfen Google Drive\'da "Nişan Foto&Video" klasörünü oluşturun ve service account e-posta adresine Editör yetkisiyle paylaşın.\n' +
        '📖 Detaylı bilgi için GOOGLE_DRIVE_KURULUM.md dosyasına bakın.'
      );
    }
    
    throw error;
  }
}

// Dosyayı Google Drive'a yükle
async function uploadToDrive(filePath, fileName, mimeType) {
  if (!driveClient) {
    driveClient = initializeDrive();
  }

  try {
    // Klasör ID'sini al
    const folderId = await getOrCreateFolder();

    // Dosya metadata'sı
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    // Dosya içeriği
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath)
    };

    // Dosyayı yükle
    const file = await driveClient.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink'
    });

    console.log(`✅ Yüklendi: ${fileName} (ID: ${file.data.id})`);
    return file.data;
  } catch (error) {
    console.error('❌ Drive yükleme hatası:', error.message);
    
    // Daha anlaşılır hata mesajları
    if (error.message.includes('insufficient authentication scopes')) {
      throw new Error('Google Drive API yetkisi yetersiz. Lütfen API\'nin etkinleştirildiğinden emin olun.');
    }
    
    if (error.message.includes('not found') || error.message.includes('permission')) {
      throw new Error('Klasör erişim hatası. Lütfen klasörün service account\'a paylaşıldığından emin olun.');
    }
    
    throw new Error(`Dosya yüklenirken hata oluştu: ${error.message}`);
  }
}

module.exports = {
  uploadToDrive,
  initializeDrive
};

