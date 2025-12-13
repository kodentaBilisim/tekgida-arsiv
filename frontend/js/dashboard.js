// Dashboard functionality
console.log('Dashboard.js yüklendi');

// Utility functions
const utils = {
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    showToast(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Simple alert for now, can be replaced with better toast UI
        if (type === 'error') {
            alert('Hata: ' + message);
        }
    },

    showLoading(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = '<p class="text-center text-gray-500 py-8">Yükleniyor...</p>';
        }
    },

    hideLoading(elementId) {
        // No-op for now
    },

    showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `<p class="text-center text-red-500 py-8">${message}</p>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM yüklendi, dashboard başlatılıyor...');
    await loadDashboard();
});

async function loadDashboard() {
    console.log('loadDashboard çağrıldı');
    try {
        // Load statistics
        console.log('İstatistikler getiriliyor...');
        const stats = await api.statistics.getOverview();
        console.log('İstatistikler:', stats);

        // Update stat cards with correct API structure
        updateStatCard('totalFolders', stats.folders?.total || 0);
        updateStatCard('totalDocuments', stats.documents?.total || 0);
        updateStatCard('totalSize', utils.formatFileSize(stats.documents?.totalSizeBytes || 0));
        updateStatCard('recentUploads', stats.documents?.last30Days || 0);

        // Load recent documents
        console.log('Son dokümanlar getiriliyor...');
        await loadRecentDocuments();
    } catch (error) {
        console.error('Dashboard yükleme hatası:', error);
        utils.showToast('Dashboard yüklenemedi: ' + error.message, 'error');
    }
}

function updateStatCard(id, value) {
    console.log(`Stat card güncelleniyor: ${id} = ${value}`);
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    } else {
        console.error(`Element bulunamadı: ${id}`);
    }
}

async function loadRecentDocuments() {
    console.log('loadRecentDocuments çağrıldı');
    // Use ID for more reliable selection
    const container = document.getElementById('recentDocumentsContainer');
    if (!container) {
        console.error('Recent activity container bulunamadı');
        return;
    }

    try {
        utils.showLoading(container);

        // Get recent documents directly
        console.log('API çağrısı yapılıyor: /documents/recent?limit=5');
        const recentDocs = await api.request('/documents/recent?limit=5');
        console.log('Son dokümanlar:', recentDocs);

        if (recentDocs.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Henüz doküman yüklenmemiş</p>';
            return;
        }

        // Render documents with click handlers
        container.innerHTML = recentDocs.map(doc => `
            <div class="p-6 hover:bg-gray-50 transition cursor-pointer" onclick="openDocumentPreview(${doc.id})">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-${getRandomColor()}-100 rounded-lg flex items-center justify-center">
                            <span class="text-xl">📄</span>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-900">${doc.originalFilename || doc.filename}</h3>
                            <p class="text-sm text-gray-600">
                                ${doc.folder?.subject?.code || 'N/A'} - ${doc.folder?.subject?.title || 'Bilinmiyor'} / 
                                ${doc.folder?.department?.code || 'N/A'} Birimi
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium text-gray-900">${utils.formatFileSize(doc.fileSize || 0)}</p>
                        <p class="text-xs text-gray-500">${getTimeAgo(doc.created_at)}</p>
                    </div>
                </div>
            </div>
        `).join('');

        console.log('Son dokümanlar render edildi');
    } catch (error) {
        console.error('Son dokümanlar yüklenemedi:', error);
        utils.showError(container, 'Son dokümanlar yüklenemedi: ' + error.message);
    }
}

async function openDocumentPreview(documentId) {
    try {
        // Get document details with metadata
        const doc = await api.request(`/documents/${documentId}`);

        // Show modal
        showDocumentModal(doc);
    } catch (error) {
        console.error('Doküman yüklenemedi:', error);
        utils.showToast('Doküman yüklenemedi', 'error');
    }
}

function showDocumentModal(doc) {
    const modal = document.getElementById('documentPreviewModal');
    if (!modal) {
        // Create modal if it doesn't exist
        createDocumentModal();
        return showDocumentModal(doc);
    }

    // Populate modal
    document.getElementById('modalDocTitle').textContent = doc.originalFilename || doc.filename;
    document.getElementById('modalDocSubject').textContent = `${doc.folder?.subject?.code || 'N/A'} - ${doc.folder?.subject?.title || 'Bilinmiyor'}`;
    document.getElementById('modalDocDepartment').textContent = doc.folder?.department?.name || 'Bilinmiyor';
    document.getElementById('modalDocSize').textContent = utils.formatFileSize(doc.fileSize || 0);
    document.getElementById('modalDocDate').textContent = new Date(doc.created_at).toLocaleDateString('tr-TR');

    // Load PDF preview
    const previewContainer = document.getElementById('modalDocPreview');
    if (doc.minioPath && doc.minioBucket) {
        const previewUrl = `${API_BASE}/documents/preview/${doc.minioBucket}/${doc.minioPath}`;
        previewContainer.innerHTML = `
            <iframe src="${previewUrl}" 
                    class="w-full h-full border-0" 
                    style="height: 500px;">
            </iframe>
        `;
    } else {
        previewContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Önizleme mevcut değil</p>';
    }

    // Render metadata
    const metadataContainer = document.getElementById('modalDocMetadata');
    if (doc.metadata && doc.metadata.length > 0) {
        metadataContainer.innerHTML = doc.metadata.map(m => `
            <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-xs text-gray-500">${m.key}</p>
                <p class="text-sm text-gray-900 mt-1">${m.value}</p>
            </div>
        `).join('');
    } else {
        metadataContainer.innerHTML = '<p class="text-sm text-gray-500">Metadata yok</p>';
    }

    // Show modal
    modal.classList.remove('hidden');
}

function getRandomColor() {
    const colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 30) return `${diffDays} gün önce`;
    return utils.formatDate(dateString);
}
