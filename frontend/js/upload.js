// Upload page functionality
console.log('Upload.js yüklendi');

// Utility functions
const utils = {
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
    },

    showToast(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        if (type === 'error') {
            alert('Hata: ' + message);
        }
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
};

let currentStep = 1;
let uploadData = {
    mainSubjectId: null,
    subSubjectId: null,
    folderId: null,
    files: []
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Upload page DOM yüklendi');
    await initializeUploadPage();
});

async function initializeUploadPage() {
    try {
        // Load main subjects (parent subjects only)
        await loadMainSubjects();

        // Setup event listeners
        setupEventListeners();

        // Setup PDF upload
        setupPdfUpload();

        // Setup fullscreen and notes
        setupFullscreenAndNotes();
    } catch (error) {
        console.error('Upload page başlatma hatası:', error);
        utils.showToast('Sayfa yüklenemedi: ' + error.message, 'error');
    }
}

function setupEventListeners() {
    // Main subject change
    const mainSubjectSelect = document.getElementById('mainSubject');
    if (mainSubjectSelect) {
        mainSubjectSelect.addEventListener('change', handleMainSubjectChange);
    }

    // Sub subject change
    const subSubjectSelect = document.getElementById('subSubject');
    if (subSubjectSelect) {
        subSubjectSelect.addEventListener('change', handleSubSubjectChange);
    }

    // Folder selection toggle
    const existingFolderBtn = document.getElementById('existingFolderBtn');
    const newFolderBtn = document.getElementById('newFolderBtn');

    if (existingFolderBtn) {
        existingFolderBtn.addEventListener('click', () => toggleFolderMode('existing'));
    }

    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', () => toggleFolderMode('new'));
    }

    // Create folder button
    const createFolderBtn = document.getElementById('createFolderBtn');
    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', handleCreateFolder);
    }

    // Step navigation
    document.querySelectorAll('[data-next-step]').forEach(btn => {
        btn.addEventListener('click', () => {
            const nextStep = parseInt(btn.dataset.nextStep);
            goToStep(nextStep);
        });
    });

    document.querySelectorAll('[data-prev-step]').forEach(btn => {
        btn.addEventListener('click', () => {
            const prevStep = parseInt(btn.dataset.prevStep);
            goToStep(prevStep);
        });
    });
}

async function loadMainSubjects() {
    console.log('Ana konular yükleniyor...');
    const select = document.getElementById('mainSubject');
    if (!select) {
        console.error('Main subject select bulunamadı');
        return;
    }

    try {
        // Get all subjects
        const allSubjects = await api.subjects.getAll();
        console.log('Tüm konular:', allSubjects);

        // Filter main subjects (those without parentId)
        const mainSubjects = allSubjects.filter(s => !s.parentId);
        console.log('Ana konular:', mainSubjects);

        // Populate select
        select.innerHTML = '<option value="">Ana Konu Seçin</option>';
        mainSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = `${subject.code} - ${subject.title}`;
            select.appendChild(option);
        });

        console.log('Ana konular yüklendi');
    } catch (error) {
        console.error('Ana konular yüklenemedi:', error);
        utils.showToast('Ana konular yüklenemedi', 'error');
    }
}

async function handleMainSubjectChange(event) {
    const mainSubjectId = event.target.value;
    console.log('Ana konu seçildi:', mainSubjectId);

    uploadData.mainSubjectId = mainSubjectId ? parseInt(mainSubjectId) : null;
    uploadData.subSubjectId = null;

    const subSubjectSelect = document.getElementById('subSubject');
    if (!subSubjectSelect) return;

    if (!mainSubjectId) {
        // Clear sub subjects
        subSubjectSelect.innerHTML = '<option value="">Önce ana konu seçin</option>';
        subSubjectSelect.disabled = true;
        return;
    }

    try {
        // Load sub subjects for selected main subject
        const allSubjects = await api.subjects.getAll();
        const subSubjects = allSubjects.filter(s => s.parentId === parseInt(mainSubjectId));
        console.log('Alt konular:', subSubjects);

        if (subSubjects.length === 0) {
            subSubjectSelect.innerHTML = '<option value="">Alt konu yok</option>';
            subSubjectSelect.disabled = true;
            return;
        }

        // Populate sub subjects
        subSubjectSelect.innerHTML = '<option value="">Alt Konu Seçin</option>';
        subSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = `${subject.code} - ${subject.title}`;
            subSubjectSelect.appendChild(option);
        });

        subSubjectSelect.disabled = false;
        console.log('Alt konular yüklendi');
    } catch (error) {
        console.error('Alt konular yüklenemedi:', error);
        utils.showToast('Alt konular yüklenemedi', 'error');
    }
}

function handleSubSubjectChange(event) {
    const subSubjectId = event.target.value;
    console.log('Alt konu seçildi:', subSubjectId);
    uploadData.subSubjectId = subSubjectId ? parseInt(subSubjectId) : null;
}

function goToStep(step) {
    // Validate current step before moving
    if (step > currentStep && !validateStep(currentStep)) {
        return;
    }

    // Update current step
    currentStep = step;

    // Show/hide steps
    document.querySelectorAll('[data-step]').forEach(stepEl => {
        const stepNum = parseInt(stepEl.dataset.step);
        if (stepNum === step) {
            stepEl.classList.remove('hidden');
        } else if (stepNum > step) {
            stepEl.classList.add('hidden');
        }
    });

    // Show summary for completed steps
    if (step > 1) {
        showStepSummary(1);
    }

    // Load data for current step
    if (step === 2 && uploadData.subSubjectId) {
        // Load folders for selected subject
        toggleFolderMode('existing');
    }

    console.log('Moved to step:', step);
}

function showStepSummary(step) {
    if (step === 1 && uploadData.subSubjectId) {
        // Show selected subject summary
        const mainSubjectSelect = document.getElementById('mainSubject');
        const subSubjectSelect = document.getElementById('subSubject');

        const mainSubjectText = mainSubjectSelect.options[mainSubjectSelect.selectedIndex]?.text || '';
        const subSubjectText = subSubjectSelect.options[subSubjectSelect.selectedIndex]?.text || '';

        // Create or update summary
        let summaryDiv = document.getElementById('step1Summary');
        if (!summaryDiv) {
            summaryDiv = document.createElement('div');
            summaryDiv.id = 'step1Summary';
            summaryDiv.className = 'mt-4 p-4 bg-green-50 border border-green-200 rounded-lg';

            const step1Card = document.querySelector('[data-step="1"]');
            if (step1Card) {
                step1Card.querySelector('.bg-white').appendChild(summaryDiv);
            }
        }

        summaryDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-green-800">✓ Konu Seçildi</p>
                    <p class="text-sm text-green-700 mt-1">
                        <strong>Ana Konu:</strong> ${mainSubjectText}<br>
                        <strong>Alt Konu:</strong> ${subSubjectText}
                    </p>
                </div>
                <button onclick="editStep(1)" class="text-sm text-primary hover:text-primary-dark font-medium">
                    Düzenle
                </button>
            </div>
        `;

        // Disable form inputs
        mainSubjectSelect.disabled = true;
        subSubjectSelect.disabled = true;

        // Hide next button
        const nextBtn = document.querySelector('[data-next-step="2"]');
        if (nextBtn) nextBtn.classList.add('hidden');
    }
}

function editStep(step) {
    if (step === 1) {
        const mainSubjectSelect = document.getElementById('mainSubject');
        const subSubjectSelect = document.getElementById('subSubject');

        mainSubjectSelect.disabled = false;
        subSubjectSelect.disabled = false;

        const summaryDiv = document.getElementById('step1Summary');
        if (summaryDiv) summaryDiv.remove();

        const nextBtn = document.querySelector('[data-next-step="2"]');
        if (nextBtn) nextBtn.classList.remove('hidden');

        currentStep = 1;
    }
}

function validateStep(step) {
    switch (step) {
        case 1:
            if (!uploadData.subSubjectId) {
                utils.showToast('Lütfen ana konu ve alt konu seçin', 'error');
                return false;
            }
            return true;
        case 2:
            if (!uploadData.folderId) {
                utils.showToast('Lütfen klasör seçin veya oluşturun', 'error');
                return false;
            }
            return true;
        case 3:
            if (uploadData.files.length === 0) {
                utils.showToast('Lütfen en az bir dosya yükleyin', 'error');
                return false;
            }
            return true;
        default:
            return true;
    }
}

function updateProgressIndicator(step) {
    // Update step indicators if they exist
    document.querySelectorAll('[data-step-indicator]').forEach((indicator, index) => {
        const stepNum = index + 1;
        if (stepNum < step) {
            indicator.classList.add('completed');
            indicator.classList.remove('active');
        } else if (stepNum === step) {
            indicator.classList.add('active');
            indicator.classList.remove('completed');
        } else {
            indicator.classList.remove('active', 'completed');
        }
    });
}
// Folder selection functions (add to upload.js)

function toggleFolderMode(mode) {
    const existingBtn = document.getElementById('existingFolderBtn');
    const newBtn = document.getElementById('newFolderBtn');
    const existingContainer = document.getElementById('existingFoldersContainer');
    const newContainer = document.getElementById('newFolderFormContainer');

    if (mode === 'existing') {
        existingBtn.classList.add('border-primary', 'bg-primary', 'text-white');
        existingBtn.classList.remove('border-gray-300', 'text-gray-700');
        newBtn.classList.remove('border-primary', 'bg-primary', 'text-white');
        newBtn.classList.add('border-gray-300', 'text-gray-700');

        existingContainer.classList.remove('hidden');
        newContainer.classList.add('hidden');

        // Load folders for selected subject
        if (uploadData.subSubjectId) {
            loadFoldersForSubject(uploadData.subSubjectId);
        }
    } else {
        newBtn.classList.add('border-primary', 'bg-primary', 'text-white');
        newBtn.classList.remove('border-gray-300', 'text-gray-700');
        existingBtn.classList.remove('border-primary', 'bg-primary', 'text-white');
        existingBtn.classList.add('border-gray-300', 'text-gray-700');

        existingContainer.classList.add('hidden');
        newContainer.classList.remove('hidden');

        // Load departments for new folder
        loadDepartments();
    }
}

async function loadFoldersForSubject(subjectId) {
    console.log('Klasörler yükleniyor, subject:', subjectId);
    const container = document.getElementById('foldersList');
    if (!container) return;

    try {
        utils.showLoading(container);

        // Get all folders
        const allFolders = await api.folders.getAll();
        console.log('Tüm klasörler:', allFolders);

        // Filter by subject
        const folders = allFolders.filter(f => f.subjectId === subjectId);
        console.log('Filtrelenmiş klasörler:', folders);

        if (folders.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Bu konu için henüz klasör yok. Yeni klasör oluşturun.</p>';
            return;
        }

        // Render folders
        container.innerHTML = folders.map(folder => `
            <div class="folder-item p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition" data-folder-id="${folder.id}">
                <div class="flex items-center justify-between">
                    <div class="flex-1" onclick="selectFolder(${folder.id})">
                        <p class="font-medium text-gray-900">${folder.name || `Klasör #${folder.sequenceNumber}`}</p>
                        <p class="text-sm text-gray-600">
                            ${folder.department?.code || 'N/A'} - ${folder.subject?.code || 'N/A'} ${folder.subject?.title || ''}
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-sm text-gray-500">${folder.documentCount || 0} doküman</span>
                        <button onclick="editFolder(${folder.id}); event.stopPropagation();" class="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:border-primary hover:text-primary">
                            Düzenle
                        </button>
                        ${folder.documentCount > 0 ? `
                            <button onclick="viewFolderDocuments(${folder.id}, event)" class="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark">
                                Görüntüle
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                const folderId = parseInt(item.dataset.folderId);
                selectFolder(folderId);
            });
        });

    } catch (error) {
        console.error('Klasörler yüklenemedi:', error);
        utils.showError(container, 'Klasörler yüklenemedi');
    }
}

function selectFolder(folderId) {
    console.log('Klasör seçildi:', folderId);
    uploadData.folderId = folderId;

    // Highlight selected folder
    document.querySelectorAll('.folder-item').forEach(item => {
        if (parseInt(item.dataset.folderId) === folderId) {
            item.classList.add('border-primary', 'bg-primary/10');
        } else {
            item.classList.remove('border-primary', 'bg-primary/10');
        }
    });

    utils.showToast('Klasör seçildi', 'success');
}

async function loadDepartments() {
    console.log('Birimler yükleniyor...');
    const select = document.getElementById('departmentSelect');
    if (!select) return;

    try {
        const departments = await api.departments.getAll();
        console.log('Birimler:', departments);

        select.innerHTML = '<option value="">Seçiniz...</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = `${dept.code} - ${dept.name}`;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Birimler yüklenemedi:', error);
        utils.showToast('Birimler yüklenemedi', 'error');
    }
}

async function handleCreateFolder() {
    const departmentId = document.getElementById('departmentSelect').value;
    const folderName = document.getElementById('folderName').value;

    if (!departmentId) {
        utils.showToast('Lütfen birim seçin', 'error');
        return;
    }

    if (!uploadData.subSubjectId) {
        utils.showToast('Lütfen önce konu seçin', 'error');
        return;
    }

    try {
        console.log('Klasör oluşturuluyor...', {
            departmentId: parseInt(departmentId),
            subjectId: uploadData.subSubjectId,
            name: folderName || null
        });

        const newFolder = await api.folders.create({
            departmentId: parseInt(departmentId),
            subjectId: uploadData.subSubjectId,
            name: folderName || null
        });

        console.log('Klasör oluşturuldu:', newFolder);
        uploadData.folderId = newFolder.id;

        utils.showToast('Klasör oluşturuldu', 'success');

        // Switch back to existing folders view
        toggleFolderMode('existing');

    } catch (error) {
        console.error('Klasör oluşturulamadı:', error);
        utils.showToast('Klasör oluşturulamadı: ' + error.message, 'error');
    }
}
// PDF Upload functionality
let selectedFiles = [];
let uploadedDocuments = [];
let currentDocIndex = 0;

// File selection
function setupPdfUpload() {
    const pdfInput = document.getElementById('pdfInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const dropZone = document.getElementById('dropZone');
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');

    if (selectFilesBtn) {
        selectFilesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            pdfInput.click();
        });
    }

    if (dropZone) {
        dropZone.addEventListener('click', (e) => {
            if (e.target.id !== 'selectFilesBtn') {
                pdfInput.click();
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-primary', 'bg-primary/10');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-primary', 'bg-primary/10');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-primary', 'bg-primary/10');

            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            handleFileSelection(files);
        });
    }

    if (pdfInput) {
        pdfInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleFileSelection(files);
        });
    }

    if (uploadFilesBtn) {
        uploadFilesBtn.addEventListener('click', handleFileUpload);
    }

    // Metadata navigation
    const prevDocBtn = document.getElementById('prevDocBtn');
    const nextDocBtn = document.getElementById('nextDocBtn');
    const skipMetadataBtn = document.getElementById('skipMetadataBtn');
    const saveMetadataBtn = document.getElementById('saveMetadataBtn');

    if (prevDocBtn) prevDocBtn.addEventListener('click', () => navigateDocument(-1));
    if (nextDocBtn) nextDocBtn.addEventListener('click', () => navigateDocument(1));
    if (skipMetadataBtn) skipMetadataBtn.addEventListener('click', skipCurrentDocument);
    if (saveMetadataBtn) saveMetadataBtn.addEventListener('click', saveCurrentMetadataWithNotes);
}

function handleFileSelection(files) {
    console.log('Dosyalar seçildi:', files.length);
    selectedFiles = files;
    uploadData.files = files; // Update uploadData

    const filesList = document.getElementById('selectedFilesList');
    const filesContainer = document.getElementById('filesContainer');
    const uploadBtn = document.getElementById('uploadFilesBtn');

    if (files.length === 0) {
        filesList.classList.add('hidden');
        uploadBtn.disabled = true;
        return;
    }

    filesList.classList.remove('hidden');
    uploadBtn.disabled = false;

    filesContainer.innerHTML = files.map((file, index) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
                <span class="text-2xl">📄</span>
                <div>
                    <p class="font-medium text-gray-900">${file.name}</p>
                    <p class="text-sm text-gray-600">${utils.formatFileSize(file.size)}</p>
                </div>
            </div>
            <button onclick="removeFile(${index})" class="text-red-600 hover:text-red-700">✕</button>
        </div>
    `).join('');
}

function removeFile(index) {
    const filesArray = Array.from(selectedFiles);
    filesArray.splice(index, 1);
    selectedFiles = filesArray;
    uploadData.files = filesArray; // Update uploadData
    handleFileSelection(selectedFiles);
}

async function handleFileUpload() {
    if (!uploadData.folderId) {
        utils.showToast('Lütfen önce klasör seçin', 'error');
        return;
    }

    if (selectedFiles.length === 0) {
        utils.showToast('Lütfen dosya seçin', 'error');
        return;
    }

    const uploadBtn = document.getElementById('uploadFilesBtn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Yükleniyor...';

    try {
        console.log('Dosyalar yükleniyor...', {
            folderId: uploadData.folderId,
            fileCount: selectedFiles.length
        });

        // Upload files
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        const response = await fetch(`${API_BASE}/folders/${uploadData.folderId}/documents/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Yükleme hatası');
        }

        const result = await response.json();
        console.log('Yükleme başarılı:', result);

        // Attach File objects to uploaded documents for preview
        uploadedDocuments = (result.uploaded || []).map((doc, index) => {
            return {
                ...doc,
                file: uploadData.files[index] // Attach original File object
            };
        });

        currentDocIndex = 0;

        if (uploadedDocuments.length === 0) {
            throw new Error('Hiçbir dosya yüklenemedi');
        }

        utils.showToast(`${uploadedDocuments.length} dosya yüklendi`, 'success');

        // Move to metadata step
        goToStep(4);
        showDocumentPreview(0);

    } catch (error) {
        console.error('Yükleme hatası:', error);
        utils.showToast('Yükleme hatası: ' + error.message, 'error');
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Yükle';
    }
}

async function showDocumentPreview(index) {
    if (index < 0 || index >= uploadedDocuments.length) return;

    currentDocIndex = index;
    const doc = uploadedDocuments[index];

    console.log('Doküman gösteriliyor:', doc);

    // Update info
    const infoEl = document.getElementById('currentDocInfo');
    if (infoEl) {
        infoEl.textContent = `${index + 1} / ${uploadedDocuments.length}: ${doc.originalFilename}`;
    }

    // Update navigation buttons
    const prevBtn = document.getElementById('prevDocBtn');
    const nextBtn = document.getElementById('nextDocBtn');

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === uploadedDocuments.length - 1;

    // Render PDF preview using iframe
    const previewContainer = document.getElementById('pdfPreviewContainer');
    if (previewContainer && doc.minioPath && doc.minioBucket) {
        const previewUrl = `${API_BASE}/documents/preview/${doc.minioBucket}/${doc.minioPath}`;
        previewContainer.innerHTML = `
            <iframe src="${previewUrl}" 
                    class="w-full h-full border-0" 
                    style="min-height: 700px;">
            </iframe>
        `;
    } else if (previewContainer) {
        previewContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📄</div>
                <p class="font-medium text-gray-900">${doc.originalFilename}</p>
                <p class="text-sm text-gray-600 mt-2">${utils.formatFileSize(doc.fileSize || 0)}</p>
                <p class="text-xs text-gray-500 mt-4">Önizleme mevcut değil</p>
            </div>
        `;
    }

    // Clear metadata form
    const form = document.getElementById('metadataForm');
    if (form) form.reset();

    // Clear free notes
    freeNotes = [];
    const freeNotesContainer = document.getElementById('freeNotesContainer');
    if (freeNotesContainer) freeNotesContainer.innerHTML = '';
}

function navigateDocument(direction) {
    const newIndex = currentDocIndex + direction;
    if (newIndex >= 0 && newIndex < uploadedDocuments.length) {
        showDocumentPreview(newIndex);
    }
}

function skipCurrentDocument() {
    if (currentDocIndex < uploadedDocuments.length - 1) {
        navigateDocument(1);
    } else {
        finishUpload();
    }
}

async function saveCurrentMetadata() {
    const doc = uploadedDocuments[currentDocIndex];
    const form = document.getElementById('metadataForm');
    const formData = new FormData(form);

    const metadata = {};
    formData.forEach((value, key) => {
        if (value) metadata[key] = value;
    });

    if (Object.keys(metadata).length > 0) {
        try {
            console.log('Metadata kaydediliyor:', { documentId: doc.id, metadata });

            await api.metadata.setBulk(doc.id, metadata);
            utils.showToast('Metadata kaydedildi', 'success');

        } catch (error) {
            console.error('Metadata kaydetme hatası:', error);
            utils.showToast('Metadata kaydedilemedi', 'error');
        }
    }

    // Move to next document or finish
    if (currentDocIndex < uploadedDocuments.length - 1) {
        navigateDocument(1);
    } else {
        finishUpload();
    }
}

function finishUpload() {
    utils.showToast('Yükleme tamamlandı!', 'success');

    // Reset and go back to dashboard
    setTimeout(() => {
        location.reload();
    }, 1500);
}
// Fullscreen and free notes functionality

let freeNotes = [];

function setupFullscreenAndNotes() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const closeFullscreenBtn = document.getElementById('closeFullscreenBtn');
    const addFreeNoteBtn = document.getElementById('addFreeNoteBtn');

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', async () => {
            const doc = uploadedDocuments[currentDocIndex];
            if (doc && doc.file) {
                await window.openFullscreenPDF(doc.file);
            }
        });
    }

    if (closeFullscreenBtn) {
        closeFullscreenBtn.addEventListener('click', closeFullscreen);
    }

    // Add first free note input automatically
    const freeNotesContainer = document.getElementById('freeNotesContainer');
    console.log('Free notes container:', freeNotesContainer);
    console.log('Container children count:', freeNotesContainer?.children.length);
    if (freeNotesContainer && freeNotesContainer.children.length === 0) {
        console.log('Adding first free note input...');
        addFreeNote();
    }
}

function closeFullscreen() {
    const modal = document.getElementById('fullscreenModal');

    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function addFreeNote() {
    const container = document.getElementById('freeNotesContainer');
    if (!container) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Serbest not ekleyin...';
    input.className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent';

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = input.value.trim();
            if (value) {
                // Save the note
                freeNotes.push(value);

                // Create a container for saved note with remove button
                const noteDiv = document.createElement('div');
                noteDiv.className = 'flex gap-2';

                const savedInput = document.createElement('input');
                savedInput.type = 'text';
                savedInput.value = value;
                savedInput.readOnly = true;
                savedInput.className = 'flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50';

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.textContent = '✕';
                removeBtn.className = 'px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition';
                removeBtn.onclick = () => {
                    const index = freeNotes.indexOf(value);
                    if (index > -1) {
                        freeNotes.splice(index, 1);
                    }
                    noteDiv.remove();
                };

                noteDiv.appendChild(savedInput);
                noteDiv.appendChild(removeBtn);

                // Insert before the current input
                container.insertBefore(noteDiv, input);

                // Clear current input
                input.value = '';
                input.focus();
            }
        }
    });

    container.appendChild(input);
    input.focus();
}

// Update saveCurrentMetadata to include free notes
function saveCurrentMetadataWithNotes() {
    const doc = uploadedDocuments[currentDocIndex];
    const form = document.getElementById('metadataForm');
    const formData = new FormData(form);

    const metadata = {};
    formData.forEach((value, key) => {
        if (value) metadata[key] = value;
    });

    // Add free notes
    const validFreeNotes = freeNotes.filter(note => note.trim() !== '');
    if (validFreeNotes.length > 0) {
        validFreeNotes.forEach((note, index) => {
            metadata[`freeNote_${index + 1}`] = note;
        });
    }

    if (Object.keys(metadata).length > 0) {
        try {
            console.log('Metadata kaydediliyor:', { documentId: doc.id, metadata });

            // Convert object to array format for backend
            const metadataArray = Object.entries(metadata).map(([key, value]) => ({
                metaKey: key,
                metaValue: value
            }));

            api.request(`/documents/${doc.id}/metadata/bulk`, {
                method: 'POST',
                body: JSON.stringify({ metadata: metadataArray })
            }).then(() => {
                utils.showToast('Metadata kaydedildi', 'success');

                // Clear free notes for next document
                freeNotes = [];
                document.getElementById('freeNotesContainer').innerHTML = '';

                // Move to next document or finish
                if (currentDocIndex < uploadedDocuments.length - 1) {
                    navigateDocument(1);
                } else {
                    finishUpload();
                }
            }).catch(error => {
                console.error('Metadata kaydetme hatası:', error);
                utils.showToast('Metadata kaydedilemedi', 'error');
            });

        } catch (error) {
            console.error('Metadata kaydetme hatası:', error);
            utils.showToast('Metadata kaydedilemedi', 'error');
        }
    } else {
        // No metadata, just move to next
        if (currentDocIndex < uploadedDocuments.length - 1) {
            navigateDocument(1);
        } else {
            finishUpload();
        }
    }
}
// Document viewer modal functionality

function viewFolderDocuments(folderId, event) {
    if (event) {
        event.stopPropagation();
    }

    console.log('Klasör dokümanları görüntüleniyor:', folderId);
    openDocumentViewerModal(folderId);
}

async function openDocumentViewerModal(folderId) {
    const modal = document.getElementById('documentViewerModal');
    if (!modal) {
        createDocumentViewerModal();
    }

    try {
        // Fetch folder documents
        const documents = await api.request(`/folders/${folderId}/documents`);

        console.log('Klasör dokümanları:', documents);

        if (!documents || documents.length === 0) {
            utils.showToast('Bu klasörde doküman yok', 'info');
            return;
        }

        // Show modal
        const modalEl = document.getElementById('documentViewerModal');
        modalEl.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Render documents list
        renderDocumentsList(documents);

        // Show first document
        showDocumentInViewer(documents[0]);

    } catch (error) {
        console.error('Dokümanlar yüklenemedi:', error);
        utils.showToast('Dokümanlar yüklenemedi', 'error');
    }
}

function createDocumentViewerModal() {
    const modal = document.createElement('div');
    modal.id = 'documentViewerModal';
    modal.className = 'hidden fixed inset-0 bg-black bg-opacity-90 z-50';
    modal.innerHTML = `
        <div class="h-full flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 bg-gray-900">
                <h2 class="text-xl font-bold text-white">Doküman Görüntüleyici</h2>
                <button onclick="closeDocumentViewer()" class="text-white text-2xl hover:text-gray-300">✕</button>
            </div>
            
            <!-- Content -->
            <div class="flex-1 flex overflow-hidden">
                <!-- Documents List (Sidebar) -->
                <div class="w-80 bg-gray-800 overflow-y-auto">
                    <div id="documentsListContainer" class="p-4 space-y-2">
                        <!-- Documents will be listed here -->
                    </div>
                </div>
                
                <!-- Document Viewer (Main) -->
                <div class="flex-1 flex flex-col bg-gray-900">
                    <!-- Document Info -->
                    <div class="p-4 bg-gray-800 border-b border-gray-700">
                        <h3 id="viewerDocTitle" class="text-lg font-medium text-white"></h3>
                        <p id="viewerDocInfo" class="text-sm text-gray-400 mt-1"></p>
                    </div>
                    
                    <!-- Preview -->
                    <div class="flex-1 overflow-auto p-8">
                        <div id="viewerPreviewContainer" class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                            <!-- PDF preview will be shown here -->
                        </div>
                    </div>
                    
                    <!-- Metadata -->
                    <div class="p-4 bg-gray-800 border-t border-gray-700 max-h-64 overflow-y-auto">
                        <h4 class="text-sm font-medium text-white mb-3">Metadata</h4>
                        <div id="viewerMetadataContainer" class="grid grid-cols-2 gap-3">
                            <!-- Metadata will be shown here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function renderDocumentsList(documents) {
    const container = document.getElementById('documentsListContainer');
    if (!container) return;

    // Store documents globally for access
    window.currentViewerDocuments = documents;

    container.innerHTML = documents.map((doc, index) => `
        <div onclick="showDocumentInViewerByIndex(${index})" 
             class="document-list-item p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition"
             data-doc-id="${doc.id}"
             data-doc-index="${index}">
            <div class="flex items-start gap-3">
                <span class="text-2xl">📄</span>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-white text-sm truncate">${doc.originalFilename}</p>
                    <p class="text-xs text-gray-400 mt-1">${utils.formatFileSize(doc.fileSize)}</p>
                    <p class="text-xs text-gray-500 mt-1">${new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function showDocumentInViewerByIndex(index) {
    if (!window.currentViewerDocuments || !window.currentViewerDocuments[index]) {
        console.error('Doküman bulunamadı:', index);
        return;
    }

    showDocumentInViewer(window.currentViewerDocuments[index]);
}

async function showDocumentInViewer(doc) {
    // Highlight selected document
    document.querySelectorAll('.document-list-item').forEach(item => {
        if (parseInt(item.dataset.docId) === doc.id) {
            item.classList.add('bg-primary');
            item.classList.remove('bg-gray-700');
        } else {
            item.classList.remove('bg-primary');
            item.classList.add('bg-gray-700');
        }
    });

    // Update title and info
    const titleEl = document.getElementById('viewerDocTitle');
    const infoEl = document.getElementById('viewerDocInfo');

    if (titleEl) titleEl.textContent = doc.originalFilename;
    if (infoEl) {
        infoEl.textContent = `${utils.formatFileSize(doc.fileSize)} • Yükleme: ${new Date(doc.uploadedAt || doc.created_at).toLocaleDateString('tr-TR')}`;
    }

    // Show preview
    const previewContainer = document.getElementById('viewerPreviewContainer');
    if (previewContainer && doc.file) {
        try {
            // Assuming doc.file contains the Blob or URL for the PDF
            await window.renderPDFPreview(doc.file, previewContainer);
        } catch (error) {
            console.error('PDF preview error:', error);
            previewContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">📄</div>
                    <p class="text-lg font-medium text-gray-900">${doc.originalFilename}</p>
                    <p class="text-sm text-gray-600 mt-2">${utils.formatFileSize(doc.fileSize)}</p>
                    <p class="text-xs text-gray-500 mt-4">PDF önizleme yüklenemedi</p>
                </div>
            `;
        }
    } else if (previewContainer) {
        previewContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📄</div>
                <p class="text-lg font-medium text-gray-900">${doc.originalFilename}</p>
                <p class="text-sm text-gray-600 mt-2">${utils.formatFileSize(doc.fileSize)}</p>
                <p class="text-xs text-gray-500 mt-4">PDF önizleme mevcut değil</p>
            </div>
        `;
    }

    // Show metadata (already loaded with document)
    renderDocumentMetadata(doc.metadata || []);
}

function renderDocumentMetadata(metadata) {
    const container = document.getElementById('viewerMetadataContainer');
    if (!container) return;

    if (!metadata || metadata.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400 col-span-2">Metadata yok</p>';
        return;
    }

    container.innerHTML = metadata.map(item => `
        <div class="bg-gray-700 rounded p-2">
            <p class="text-xs text-gray-400">${item.metaKey || item.key}</p>
            <p class="text-sm text-white mt-1">${item.metaValue || item.value}</p>
        </div>
    `).join('');
}

function closeDocumentViewer() {
    const modal = document.getElementById('documentViewerModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Folder edit modal functions
let currentFolder = null;

async function editFolder(folderId) {
    console.log('editFolder called with ID:', folderId);
    try {
        const folder = await api.folders.getById(folderId);
        console.log('Folder loaded:', folder);
        currentFolder = folder;

        // Load departments
        console.log('Loading departments...');
        const departments = await api.departments.getAll();
        console.log('Departments loaded:', departments);

        const departmentSelect = document.getElementById('folderDepartmentCode');
        console.log('Department select element:', departmentSelect);

        departmentSelect.innerHTML = departments.map(dept =>
            `<option value="${dept.id}" ${folder.departmentId === dept.id ? 'selected' : ''}>${dept.code} - ${dept.name}</option>`
        ).join('');

        // Populate other fields
        document.getElementById('folderSequenceNumber').value = folder.sequenceNumber;
        document.getElementById('folderCabinetNumber').value = folder.cabinetNumber || '';
        document.getElementById('folderName').value = folder.name || '';
        document.getElementById('folderDescription').value = folder.description || '';

        // Show modal
        document.getElementById('folderModal').classList.remove('hidden');
    } catch (error) {
        console.error('Klasör yüklenemedi:', error);
        utils.showError('Klasör yüklenemedi');
    }
}

async function saveFolder() {
    if (!currentFolder) {
        utils.showError('Klasör bilgisi bulunamadı');
        closeFolderModal();
        return;
    }

    const departmentId = parseInt(document.getElementById('folderDepartmentCode').value);
    const sequenceNumber = parseInt(document.getElementById('folderSequenceNumber').value);
    const cabinetNumber = document.getElementById('folderCabinetNumber').value.trim();
    const name = document.getElementById('folderName').value.trim();
    const description = document.getElementById('folderDescription').value.trim();

    try {
        await api.folders.update(currentFolder.id, {
            departmentId: departmentId,
            sequenceNumber: sequenceNumber,
            cabinetNumber: cabinetNumber || null,
            name: name || null,
            description: description || null
        });

        utils.showToast('Klasör güncellendi');

        // Store subjectId before closing modal
        const subjectId = currentFolder.subjectId;
        closeFolderModal();

        // Reload folders list
        await loadFoldersForSubject(subjectId);
    } catch (error) {
        console.error('Klasör güncellenemedi:', error);
        const errorMessage = error.message || 'Klasör güncellenemedi';
        utils.showError(errorMessage);
    }
}

function closeFolderModal() {
    document.getElementById('folderModal').classList.add('hidden');
    currentFolder = null;
}

// Make functions global
window.editFolder = editFolder;
window.saveFolder = saveFolder;
window.closeFolderModal = closeFolderModal;
