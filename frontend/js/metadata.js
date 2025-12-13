let documents = [];
let currentIndex = 0;
let processedCount = 0;
let freeNotes = [];

// Load documents on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadDocuments();
});

async function loadDocuments() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/documents/without-metadata`);
        documents = await response.json();

        document.getElementById('totalCount').textContent = documents.length;

        if (documents.length > 0) {
            showDocument(0);
        } else {
            showEmptyState('Tüm dokümanların metadata\'sı eklenmiş! 🎉');
        }
    } catch (error) {
        console.error('Dokümanlar yüklenemedi:', error);
        showEmptyState('Dokümanlar yüklenemedi');
    }
}

function showDocument(index) {
    if (index < 0 || index >= documents.length) {
        showEmptyState('Tüm dokümanlar işlendi! 🎉');
        return;
    }

    currentIndex = index;
    const doc = documents[index];

    // Show editor
    document.getElementById('documentEditor').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');

    // Update title
    document.getElementById('docTitle').textContent = doc.originalFilename || doc.filename;

    // Update document info
    if (doc.folder) {
        document.getElementById('docSubject').textContent = doc.folder.subject?.title || '-';
        document.getElementById('docDepartment').textContent = doc.folder.department?.name || '-';
        document.getElementById('docFolder').textContent = `${doc.folder.sequenceNumber} - ${doc.folder.name}` || '-';
    }

    // Load PDF preview
    const previewContainer = document.getElementById('pdfPreview');
    if (doc.minioPath && doc.minioBucket) {
        const previewUrl = `${window.API_BASE_URL}/documents/preview/${doc.minioBucket}/${doc.minioPath}`;
        previewContainer.innerHTML = `
            <iframe src="${previewUrl}"
                    class="w-full h-full border-0 rounded-lg"
                    style="height: 600px;">
            </iframe>
        `;
    } else {
        previewContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📄</div>
                <p class="font-medium">${doc.originalFilename}</p>
                <p class="text-sm text-gray-500 mt-2">Önizleme mevcut değil</p>
            </div>
        `;
    }

    // Clear form and free notes
    document.getElementById('metadataForm').reset();
    freeNotes = [];
    const container = document.getElementById('freeNotesContainer');
    container.innerHTML = '';
    addFreeNoteInput(); // Add first input
}

function addFreeNoteInput() {
    const container = document.getElementById('freeNotesContainer');
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

                // Make this input readonly and show the saved value
                input.value = value;
                input.readOnly = true;
                input.classList.add('bg-gray-50');

                // Add new input
                addFreeNoteInput();
            }
        }
    });

    container.appendChild(input);
    input.focus();
}

function showEmptyState(message) {
    document.getElementById('documentEditor').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('emptyState').innerHTML = `
        <div class="text-6xl mb-4">✅</div>
        <p class="text-xl font-semibold text-gray-900">${message}</p>
    `;
}

function skipDocument() {
    showDocument(currentIndex + 1);
}

// Handle form submission
document.getElementById('metadataForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const doc = documents[currentIndex];
    const formData = new FormData(e.target);

    // Collect free notes from inputs
    const inputs = document.getElementById('freeNotesContainer').querySelectorAll('input');
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value && !freeNotes.includes(value)) {
            freeNotes.push(value);
        }
    });

    // Build metadata array
    const metadata = [];

    // Add notes if present
    const notes = formData.get('notes');
    if (notes) {
        metadata.push({ key: 'notes', value: notes });
    }

    // Add free notes
    freeNotes.forEach((note, index) => {
        metadata.push({ key: `metadata_${index + 1}`, value: note });
    });

    try {
        await fetch(`${window.API_BASE_URL}/documents/${doc.id}/metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metadata })
        });

        processedCount++;
        document.getElementById('processedCount').textContent = processedCount;

        // Show next document
        showDocument(currentIndex + 1);
    } catch (error) {
        console.error('Metadata kaydedilemedi:', error);
        alert('Metadata kaydedilemedi');
    }
});
