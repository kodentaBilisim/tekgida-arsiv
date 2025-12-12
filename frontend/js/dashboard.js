// Dashboard functionality
console.log('Dashboard.js yüklendi');

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

        // Render documents
        container.innerHTML = recentDocs.map(doc => `
            <div class="p-6 hover:bg-gray-50 transition">
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
