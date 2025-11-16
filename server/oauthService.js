const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Drive API yapılandırması
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const FOLDER_NAME = 'Nişan Foto&Video';
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

let oauth2Client = null;
let driveClient = null;

// OAuth 2.0 istemcisini başlat
function initializeOAuth() {
  try {
    // credentials.json dosyasını kontrol et
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(
        '❌ credentials.json dosyası bulunamadı!\n' +
        '📋 Lütfen Google Cloud Console\'dan OAuth 2.0 Client ID oluşturun ve credentials.json olarak kaydedin.\n' +
        '📁 Dosya şu konumda olmalı: ' + CREDENTIALS_PATH + '\n' +
        '📖 Detaylı bilgi için GOOGLE_DRIVE_KURULUM.md dosyasına bakın.'
      );
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    // Redirect URI'yi dinamik olarak oluştur
    const PORT = process.env.PORT || 3001;
    const redirectUri = redirect_uris && redirect_uris[0] 
      ? redirect_uris[0] 
      : `http://localhost:${PORT}/oauth2callback`;
    
    oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirectUri
    );

    // Kaydedilmiş token'ı yükle
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      oauth2Client.setCredentials(token);
      console.log('✅ OAuth token yüklendi');
    }

    return oauth2Client;
  } catch (error) {
    console.error('❌ OAuth başlatma hatası:', error.message);
    throw error;
  }
}

// Yetkilendirme URL'sini al
function getAuthUrl() {
  if (!oauth2Client) {
    oauth2Client = initializeOAuth();
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Token'ı yenilemek için gerekli
  });
}

// OAuth callback'ini işle
async function handleCallback(code) {
  try {
    if (!oauth2Client) {
      oauth2Client = initializeOAuth();
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Token'ı kaydet
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('✅ Token kaydedildi');

    return tokens;
  } catch (error) {
    console.error('❌ Token alma hatası:', error);
    throw error;
  }
}

// Drive istemcisini al
function getDriveClient() {
  if (!oauth2Client) {
    oauth2Client = initializeOAuth();
  }

  // Token kontrolü
  if (!oauth2Client.credentials.access_token) {
    throw new Error('OAuth yetkilendirmesi gerekli. Lütfen /auth adresine gidin.');
  }

  if (!driveClient) {
    driveClient = google.drive({
      version: 'v3',
      auth: oauth2Client
    });
  }

  return driveClient;
}

// Token'ın geçerli olup olmadığını kontrol et
function isAuthorized() {
  try {
    if (!oauth2Client) {
      oauth2Client = initializeOAuth();
    }
    return !!oauth2Client.credentials.access_token;
  } catch {
    return false;
  }
}

// Klasör ID'sini bul veya oluştur
async function getOrCreateFolder() {
  const drive = getDriveClient();

  try {
    // Klasörü ara
    const response = await drive.files.list({
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

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id, name'
    });

    console.log(`📁 Yeni klasör oluşturuldu: ${FOLDER_NAME} (ID: ${folder.data.id})`);
    return folder.data.id;
  } catch (error) {
    console.error('❌ Klasör işlemi hatası:', error.message);
    throw error;
  }
}

// Dosyayı Google Drive'a yükle
async function uploadToDrive(filePath, fileName, mimeType) {
  const drive = getDriveClient();

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
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink'
    });

    console.log(`✅ Yüklendi: ${fileName} (ID: ${file.data.id})`);
    return file.data;
  } catch (error) {
    console.error('❌ Drive yükleme hatası:', error.message);
    
    if (error.message.includes('invalid_grant') || error.message.includes('invalid_token')) {
      // Token süresi dolmuş, yeniden yetkilendirme gerekli
      if (fs.existsSync(TOKEN_PATH)) {
        fs.unlinkSync(TOKEN_PATH);
      }
      throw new Error('Yetkilendirme süresi dolmuş. Lütfen /auth adresine gidip yeniden yetkilendirin.');
    }
    
    throw new Error(`Dosya yüklenirken hata oluştu: ${error.message}`);
  }
}

module.exports = {
  initializeOAuth,
  getAuthUrl,
  handleCallback,
  getDriveClient,
  isAuthorized,
  uploadToDrive
};

