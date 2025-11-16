const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const message = document.getElementById('message');

let selectedFiles = [];

// API URL'ini al
const API_URL = window.location.origin;

// Upload area'ya tıklama
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// Dosya seçimi
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

// Dosyaları işle
function handleFiles(files) {
    const newFiles = Array.from(files);
    
    // Dosya türlerini kontrol et
    const validFiles = newFiles.filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
                           'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
        return validTypes.includes(file.type);
    });

    if (validFiles.length !== newFiles.length) {
        showMessage('Bazı dosyalar desteklenmiyor. Sadece resim ve video dosyaları yüklenebilir.', 'error');
    }

    selectedFiles = [...selectedFiles, ...validFiles];
    updateFileList();
    updateUploadButton();
}

// Dosya listesini güncelle
function updateFileList() {
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileIcon = file.type.startsWith('image/') ? '🖼️' : '🎥';
        const fileSize = formatFileSize(file.size);
        
        fileItem.innerHTML = `
            <div class="file-info">
                <span class="file-icon">${fileIcon}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${fileSize})</span>
            </div>
            <button class="remove-btn" onclick="removeFile(${index})">Kaldır</button>
        `;
        
        fileList.appendChild(fileItem);
    });
}

// Dosya boyutunu formatla
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Dosyayı listeden kaldır
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateUploadButton();
}

// Upload butonunu güncelle
function updateUploadButton() {
    uploadBtn.disabled = selectedFiles.length === 0;
}

// Yetkilendirme durumunu kontrol et (arka planda, kullanıcıya göstermeden)
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_URL}/api/auth-status`);
        const data = await response.json();
        return data.authorized;
    } catch (error) {
        console.error('Yetkilendirme kontrolü hatası:', error);
        return false;
    }
}

// Dosyaları yükle
uploadBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    // UI'ı güncelle
    uploadBtn.disabled = true;
    progressContainer.style.display = 'block';
    message.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = 'Yükleniyor...';

    try {
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        // XMLHttpRequest kullanarak progress takibi
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressFill.style.width = percentComplete + '%';
                progressText.textContent = `Yükleniyor... %${Math.round(percentComplete)}`;
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                progressFill.style.width = '100%';
                progressText.textContent = 'Tamamlandı!';
                
                if (response.success) {
                    showMessage(
                        `✅ ${response.message}${response.errors.length > 0 ? ` (${response.errors.length} hata)` : ''}`,
                        'success'
                    );
                    selectedFiles = [];
                    updateFileList();
                    updateUploadButton();
                    
                    // 2 saniye sonra progress'i gizle
                    setTimeout(() => {
                        progressContainer.style.display = 'none';
                    }, 2000);
                } else {
                    throw new Error(response.error || 'Yükleme başarısız');
                }
            } else if (xhr.status === 401) {
                // Yetkilendirme hatası - sadece teknik mesaj göster
                showMessage(
                    '❌ Sistem yöneticisi tarafından Google Drive bağlantısı yapılmamış. Lütfen daha sonra tekrar deneyin.',
                    'error'
                );
                progressContainer.style.display = 'none';
                uploadBtn.disabled = false;
            } else {
                throw new Error('Sunucu hatası');
            }
        });

        xhr.addEventListener('error', () => {
            throw new Error('Bağlantı hatası');
        });

        xhr.open('POST', `${API_URL}/api/upload`);
        xhr.send(formData);

    } catch (error) {
        console.error('Yükleme hatası:', error);
        showMessage(`❌ Hata: ${error.message}`, 'error');
        progressContainer.style.display = 'none';
        uploadBtn.disabled = false;
    }
});

// Mesaj göster
function showMessage(text, type) {
    message.innerHTML = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    // 5 saniye sonra mesajı gizle (sadece success mesajları için)
    if (type === 'success') {
        setTimeout(() => {
            message.style.display = 'none';
        }, 5000);
    }
}

// Global removeFile fonksiyonu
window.removeFile = removeFile;

