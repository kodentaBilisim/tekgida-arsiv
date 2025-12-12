/**
 * PDF Preview Helper Functions with Navigation and Zoom
 * Uses PDF.js to render PDF previews
 */

// Global state for current PDF
let currentPDF = null;
let currentPage = 1;
let currentScale = 1.0;
let totalPages = 0;

/**
 * Render PDF preview from file or URL
 * @param {File|string} source - PDF file object or URL to PDF
 * @param {HTMLElement} container - Container element for preview
 * @param {Object} options - Rendering options (page, scale)
 */
async function renderPDFPreview(source, container, options = {}) {
    try {
        const { page = 1, scale = 1.0 } = options;

        container.innerHTML = '<div class="flex items-center justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>';

        let pdfData;

        // Handle File object
        if (source instanceof File) {
            const arrayBuffer = await source.arrayBuffer();
            pdfData = new Uint8Array(arrayBuffer);
        }
        // Handle URL string
        else if (typeof source === 'string') {
            pdfData = source;
        }
        else {
            throw new Error('Invalid source type');
        }

        // Load PDF document
        const pdf = await pdfjsLib.getDocument(pdfData).promise;
        currentPDF = pdf;
        currentPage = page;
        currentScale = scale;
        totalPages = pdf.numPages;

        // Get page
        const pdfPage = await pdf.getPage(currentPage);

        // Calculate scale to fit container
        const viewport = pdfPage.getViewport({ scale: 1 });
        const containerWidth = container.clientWidth || 600;
        const defaultScale = containerWidth / viewport.width;
        const finalScale = scale === 1.0 ? defaultScale : scale;
        const scaledViewport = pdfPage.getViewport({ scale: finalScale });

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        canvas.className = 'mx-auto shadow-lg rounded';

        // Render page
        await pdfPage.render({
            canvasContext: context,
            viewport: scaledViewport
        }).promise;

        // Update container
        container.innerHTML = '';
        container.appendChild(canvas);

        // Add PDF controls below canvas
        addPDFControls(container, source);

        return { pdf, numPages: pdf.numPages, currentPage, currentScale: finalScale };

    } catch (error) {
        console.error('PDF render hatası:', error);
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📄</div>
                <p class="text-red-600">PDF önizleme yüklenemedi</p>
                <p class="text-sm text-gray-500 mt-2">${error.message}</p>
            </div>
        `;
        throw error;
    }
}

/**
 * Add navigation and zoom controls
 */
function addPDFControls(container, source) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'flex items-center justify-between mt-4 px-4 py-2 bg-gray-100 rounded';

    controlsDiv.innerHTML = `
        <div class="flex items-center gap-2">
            <button id="pdf-prev-page" class="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}>
                ◀ Önceki
            </button>
            <span class="text-sm font-medium px-2">
                Sayfa ${currentPage} / ${totalPages}
            </span>
            <button id="pdf-next-page" class="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}>
                Sonraki ▶
            </button>
        </div>
        <div class="flex items-center gap-2">
            <button id="pdf-zoom-out" class="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                🔍➖
            </button>
            <span class="text-sm font-medium px-2">${Math.round(currentScale * 100)}%</span>
            <button id="pdf-zoom-in" class="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                🔍➕
            </button>
            <button id="pdf-fit-width" class="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm">
                Sığdır
            </button>
        </div>
    `;

    container.appendChild(controlsDiv);

    // Event listeners
    const prevBtn = controlsDiv.querySelector('#pdf-prev-page');
    const nextBtn = controlsDiv.querySelector('#pdf-next-page');
    const zoomInBtn = controlsDiv.querySelector('#pdf-zoom-in');
    const zoomOutBtn = controlsDiv.querySelector('#pdf-zoom-out');
    const fitWidthBtn = controlsDiv.querySelector('#pdf-fit-width');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                renderPDFPreview(source, container, { page: currentPage - 1, scale: currentScale });
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                renderPDFPreview(source, container, { page: currentPage + 1, scale: currentScale });
            }
        });
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            renderPDFPreview(source, container, { page: currentPage, scale: currentScale * 1.2 });
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            renderPDFPreview(source, container, { page: currentPage, scale: currentScale / 1.2 });
        });
    }

    if (fitWidthBtn) {
        fitWidthBtn.addEventListener('click', () => {
            renderPDFPreview(source, container, { page: currentPage, scale: 1.0 });
        });
    }
}

/**
 * Render PDF preview from MinIO URL
 * @param {string} minioPath - Path to PDF in MinIO
 * @param {string} minioBucket - MinIO bucket name
 * @param {HTMLElement} container - Container element
 */
async function renderPDFFromMinIO(minioPath, minioBucket, container) {
    const pdfUrl = `/api/documents/preview/${encodeURIComponent(minioBucket)}/${encodeURIComponent(minioPath)}`;
    return renderPDFPreview(pdfUrl, container);
}

/**
 * Create fullscreen PDF viewer
 * @param {File|string} source - PDF source
 */
async function openFullscreenPDF(source) {
    const modal = document.getElementById('fullscreenModal');
    if (!modal) {
        console.error('Fullscreen modal not found');
        return;
    }

    const container = document.getElementById('fullscreenPreview');
    if (!container) {
        console.error('Fullscreen preview container not found');
        return;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Reset state for fullscreen
    currentPage = 1;
    currentScale = 1.0;

    await renderPDFPreview(source, container);
}

// Export functions to global scope
window.renderPDFPreview = renderPDFPreview;
window.renderPDFFromMinIO = renderPDFFromMinIO;
window.openFullscreenPDF = openFullscreenPDF;
