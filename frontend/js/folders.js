/**
 * Subjects Management
 * Handles CRUD operations for subjects with hierarchical display
 */

let subjects = [];
let currentSubject = null;
let isEditMode = false;
let expandedSubjects = new Set();

// DOM Elements
const subjectModal = document.getElementById('subjectModal');
const subjectsContainer = document.querySelector('.space-y-4');
const addSubjectBtn = document.querySelector('button[class*="bg-primary"]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSubjects();
    setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Add subject button
    addSubjectBtn.addEventListener('click', () => openModal());

    // Modal close on background click
    subjectModal.addEventListener('click', (e) => {
        if (e.target === subjectModal) {
            closeModal();
        }
    });
}

/**
 * Load all subjects
 */
async function loadSubjects() {
    try {
        const response = await fetch(`${API_BASE}/subjects`);
        if (!response.ok) throw new Error('Failed to fetch subjects');

        subjects = await response.json();
        renderSubjects();
    } catch (error) {
        console.error('Error loading subjects:', error);
        showNotification('Konular yüklenemedi', 'error');
    }
}

/**
 * Render subjects hierarchically
 */
async function renderSubjects() {
    if (!subjectsContainer) return;

    // Get main subjects (no parent)
    const mainSubjects = subjects.filter(s => !s.parentId);

    const cardsHTML = await Promise.all(
        mainSubjects.map(subject => renderSubjectCard(subject))
    );

    subjectsContainer.innerHTML = cardsHTML.join('');
}

/**
 * Render a single subject card with children
 */
async function renderSubjectCard(subject) {
    const isExpanded = expandedSubjects.has(subject.id);
    const children = subjects.filter(s => s.parentId === subject.id);
    const hasChildren = children.length > 0;

    const colorClasses = getColorClass(subject.code);

    let childrenHTML = '';
    if (hasChildren && isExpanded) {
        const childCards = await Promise.all(
            children.map(child => renderChildSubject(child))
        );
        childrenHTML = `
            <div class="border-t border-gray-100 bg-gray-50/50">
                ${childCards.join('')}
            </div>
        `;
    }

    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        ${hasChildren ? `
                            <button onclick="toggleSubject(${subject.id})" class="text-2xl text-gray-400 hover:text-primary transition">
                                ${isExpanded ? '▼' : '▶'}
                            </button>
                        ` : '<div class="w-8"></div>'}
                        <div>
                            <div class="flex items-center gap-3">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClasses}">
                                    ${subject.code}
                                </span>
                                <h3 class="text-lg font-bold text-gray-900">${subject.title}</h3>
                            </div>
                            ${subject.description ? `<p class="text-sm text-gray-600 mt-1">${subject.description}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600">${children.length} alt konu</span>
                        <button onclick="editSubject(${subject.id})" class="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition">
                            Düzenle
                        </button>
                        <button onclick="deleteSubject(${subject.id})" class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                            Sil
                        </button>
                    </div>
                </div>
            </div>
            ${childrenHTML}
        </div>
    `;
}

/**
 * Render child subject with folders placeholder
 */
async function renderChildSubject(subject) {
    const colorClasses = getColorClass(subject.code);

    return `
        <div class="p-6 pl-20 border-b border-gray-100 last:border-b-0 hover:bg-white transition" data-subject-id="${subject.id}">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <button onclick="toggleFolders(${subject.id})" class="text-xl text-gray-400 hover:text-primary transition">
                        ▶
                    </button>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClasses}">
                        ${subject.code}
                    </span>
                    <div>
                        <h4 class="font-medium text-gray-900">${subject.title}</h4>
                        ${subject.description ? `<p class="text-sm text-gray-600">${subject.description}</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="editSubject(${subject.id})" class="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition">
                        Düzenle
                    </button>
                    <button onclick="deleteSubject(${subject.id})" class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                        Sil
                    </button>
                </div>
            </div>
            <div id="folders-${subject.id}" class="hidden"></div>
        </div>
    `;
}

/**
 * Get color class based on code
 */
function getColorClass(code) {
    const colors = [
        'bg-primary/10 text-primary',
        'bg-blue-100 text-blue-700',
        'bg-green-100 text-green-700',
        'bg-purple-100 text-purple-700',
        'bg-orange-100 text-orange-700',
        'bg-pink-100 text-pink-700'
    ];

    const index = parseInt(code.split('.')[0] || '0') % colors.length;
    return colors[index];
}

/**
 * Toggle subject expansion
 */
function toggleSubject(id) {
    if (expandedSubjects.has(id)) {
        expandedSubjects.delete(id);
    } else {
        expandedSubjects.add(id);
    }
    renderSubjects();
}

/**
 * Toggle folders for a subject (lazy load)
 */
async function toggleFolders(subjectId) {
    const container = document.getElementById(`folders-${subjectId}`);
    const button = document.querySelector(`[data-subject-id="${subjectId}"] button[onclick*="toggleFolders"]`);

    if (!container) return;

    // Toggle visibility
    if (container.classList.contains('hidden')) {
        // Show and load folders if not loaded yet
        container.classList.remove('hidden');
        if (button) button.textContent = '▼';

        // Load folders if container is empty
        if (!container.innerHTML) {
            container.innerHTML = '<p class="text-center text-gray-500 py-4 ml-12">Yükleniyor...</p>';

            try {
                const folders = await api.folders.getAll({ subjectId });

                if (folders.length > 0) {
                    const foldersHTML = `
                        <div class="mt-4 ml-12 space-y-2">
                            ${folders.map(folder => `
                                <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary/30 transition">
                                    <span class="text-2xl">📁</span>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2">
                                            <span class="font-medium text-gray-900">Klasör ${folder.sequenceNumber}</span>
                                            ${folder.name ? `<span class="text-sm text-gray-600">- ${folder.name}</span>` : ''}
                                        </div>
                                        ${folder.description ? `<p class="text-sm text-gray-600 mt-1">${folder.description.substring(0, 100)}${folder.description.length > 100 ? '...' : ''}</p>` : ''}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm text-gray-500">${folder.documentCount || 0} doküman</span>
                                        <button onclick="editFolder(${folder.id})" class="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition">
                                            Düzenle
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    container.innerHTML = foldersHTML;
                } else {
                    container.innerHTML = '<p class="text-center text-gray-500 py-4 ml-12">Bu konuda klasör bulunmuyor</p>';
                }
            } catch (error) {
                console.error('Error loading folders:', error);
                container.innerHTML = '<p class="text-center text-red-500 py-4 ml-12">Klasörler yüklenemedi</p>';
            }
        }
    } else {
        // Hide
        container.classList.add('hidden');
        if (button) button.textContent = '▶';
    }
}

/**
 * Open modal for add/edit
 */
function openModal(subject = null) {
    isEditMode = !!subject;
    currentSubject = subject;

    const modalTitle = subjectModal.querySelector('h2');
    modalTitle.textContent = isEditMode ? 'Konu Düzenle' : 'Yeni Konu Ekle';

    // Populate form
    const codeInput = subjectModal.querySelector('input[placeholder*="01.00"]');
    const titleInput = subjectModal.querySelector('input[placeholder*="Konu başlığını"]');
    const descInput = subjectModal.querySelector('textarea');
    const parentSelect = subjectModal.querySelector('select');

    if (subject) {
        codeInput.value = subject.code;
        titleInput.value = subject.title;
        if (descInput) descInput.value = subject.description || '';
        if (parentSelect) parentSelect.value = subject.parentId || '';
    } else {
        codeInput.value = '';
        titleInput.value = '';
        if (descInput) descInput.value = '';
        if (parentSelect) parentSelect.value = '';
    }

    // Update parent options
    updateParentOptions(subject?.id);

    subjectModal.classList.remove('hidden');
}

/**
 * Close modal
 */
function closeModal() {
    subjectModal.classList.add('hidden');
    currentSubject = null;
    isEditMode = false;
}

/**
 * Update parent subject options
 */
function updateParentOptions(excludeId = null) {
    const parentSelect = subjectModal.querySelector('select');
    if (!parentSelect) return;

    const mainSubjects = subjects.filter(s => !s.parentId && s.id !== excludeId);
    const options = mainSubjects
        .map(s => `<option value="${s.id}">${s.code} - ${s.title}</option>`)
        .join('');

    parentSelect.innerHTML = `<option value="">Yok (Ana Konu)</option>${options}`;
}

/**
 * Save subject (create or update)
 */
async function saveSubject() {
    const codeInput = subjectModal.querySelector('input[placeholder*="01.00"]');
    const titleInput = subjectModal.querySelector('input[placeholder*="Konu başlığını"]');
    const descInput = subjectModal.querySelector('textarea');
    const parentSelect = subjectModal.querySelector('select');

    const data = {
        code: codeInput.value.trim(),
        title: titleInput.value.trim(),
        description: descInput?.value.trim() || null,
        parentId: parentSelect?.value || null
    };

    if (!data.code || !data.title) {
        showNotification('Kod ve başlık zorunludur', 'error');
        return;
    }

    try {
        const url = isEditMode
            ? `${API_BASE}/subjects/${currentSubject.id}`
            : `${API_BASE}/subjects`;

        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'İşlem başarısız');
        }

        showNotification(isEditMode ? 'Konu güncellendi' : 'Konu oluşturuldu', 'success');
        closeModal();
        loadSubjects();
    } catch (error) {
        console.error('Save error:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Edit subject
 */
async function editSubject(id) {
    const subject = subjects.find(s => s.id === id);
    if (subject) {
        openModal(subject);
    }
}

/**
 * Delete subject
 */
async function deleteSubject(id) {
    if (!confirm('Bu konuyu silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`${API_BASE}/subjects/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Silme başarısız');
        }

        showNotification('Konu silindi', 'success');
        loadSubjects();
    } catch (error) {
        console.error('Delete error:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    alert(message);
}

/**
 * Folder management
 */
let currentFolder = null;

async function editFolder(folderId) {
    try {
        const folder = await api.folders.getById(folderId);
        currentFolder = folder;

        // Populate modal
        document.getElementById('folderDepartmentCode').value = folder.department?.code || 'N/A';
        document.getElementById('folderSequenceNumber').value = folder.sequenceNumber;
        document.getElementById('folderCabinetNumber').value = folder.cabinetNumber || '';
        document.getElementById('folderName').value = folder.name || '';
        document.getElementById('folderDescription').value = folder.description || '';

        // Show modal
        document.getElementById('folderModal').classList.remove('hidden');
    } catch (error) {
        console.error('Klasör yüklenemedi:', error);
        showNotification('Klasör yüklenemedi', 'error');
    }
}

async function saveFolder() {
    console.log('saveFolder called, currentFolder:', currentFolder);

    if (!currentFolder) {
        showNotification('Klasör bilgisi bulunamadı. Lütfen tekrar deneyin.', 'error');
        closeFolderModal();
        return;
    }

    const cabinetNumber = document.getElementById('folderCabinetNumber').value.trim();
    const name = document.getElementById('folderName').value.trim();
    const description = document.getElementById('folderDescription').value.trim();

    try {
        await api.folders.update(currentFolder.id, {
            cabinetNumber: cabinetNumber || null,
            name: name || null,
            description: description || null
        });

        showNotification('Klasör güncellendi', 'success');

        // Store subjectId before closing modal
        const subjectId = currentFolder.subjectId;
        closeFolderModal();

        // Reload folders for this subject
        const container = document.getElementById(`folders-${subjectId}`);
        if (container) {
            container.innerHTML = '';
            toggleFolders(subjectId);
            toggleFolders(subjectId);
        }
    } catch (error) {
        console.error('Klasör güncellenemedi:', error);
        showNotification('Klasör güncellenemedi: ' + error.message, 'error');
    }
}

function closeFolderModal() {
    document.getElementById('folderModal').classList.add('hidden');
    currentFolder = null;
}

// Setup folder modal background click
document.addEventListener('DOMContentLoaded', () => {
    const folderModal = document.getElementById('folderModal');
    if (folderModal) {
        folderModal.addEventListener('click', (e) => {
            if (e.target === folderModal) {
                closeFolderModal();
            }
        });
    }
});

// Expose functions globally
window.toggleSubject = toggleSubject;
window.toggleFolders = toggleFolders;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
window.saveSubject = saveSubject;
window.closeModal = closeModal;
window.editFolder = editFolder;
window.saveFolder = saveFolder;
window.closeFolderModal = closeFolderModal;
