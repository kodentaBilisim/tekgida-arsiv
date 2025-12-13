import { Document, Folder, Subject, Department, DocumentMetadata } from '../models/index.js';
import { uploadPdfToMinio, downloadPdfFromMinio, deletePdfFromMinio } from '../services/minioService.js';

/**
 * Son yüklenen dokümanları getir
 * GET /api/documents/recent?limit=10
 */
export const getRecentDocuments = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const documents = await Document.findAll({
            include: [
                {
                    model: Folder,
                    as: 'folder',
                    include: [
                        { model: Department, as: 'department' },
                        { model: Subject, as: 'subject' }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit
        });

        res.json(documents);
    } catch (error) {
        console.error('Son dokümanlar getirme hatası:', error);
        res.status(500).json({ error: 'Son dokümanlar getirilemedi' });
    }
};

/**
 * Toplu PDF yükleme
 * POST /api/folders/:folderId/documents/upload
 */
export const uploadDocuments = async (req, res) => {
    try {
        const { folderId } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'Dosya seçilmedi' });
        }

        // Klasörün varlığını kontrol et
        const folder = await Folder.findByPk(folderId, {
            include: [{ model: Subject, as: 'subject' }]
        });

        if (!folder) {
            return res.status(404).json({ error: 'Klasör bulunamadı' });
        }

        if (!folder.subject) {
            return res.status(400).json({ error: 'Klasör bir konuya bağlı olmalıdır' });
        }

        const uploadedDocuments = [];
        const errors = [];

        // Her dosyayı yükle
        for (const file of files) {
            try {
                // MinIO'ya yükle
                const minioData = await uploadPdfToMinio(
                    file.buffer,
                    file.originalname,
                    folderId
                );

                // Veritabanına kaydet
                const document = await Document.create({
                    folderId: folderId,
                    filename: minioData.filename,
                    originalFilename: file.originalname,
                    fileSize: minioData.fileSize,
                    mimeType: file.mimetype,
                    minioPath: minioData.minioPath,
                    minioBucket: minioData.minioBucket
                });

                uploadedDocuments.push(document);
            } catch (error) {
                errors.push({
                    filename: file.originalname,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            message: `${uploadedDocuments.length} dosya başarıyla yüklendi`,
            uploaded: uploadedDocuments,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        res.status(500).json({ error: 'Dosya yükleme sırasında hata oluştu' });
    }
};

/**
 * Klasördeki dokümanları listele
 * GET /api/folders/:folderId/documents
 */
export const getDocumentsByFolder = async (req, res) => {
    try {
        const { folderId } = req.params;

        const documents = await Document.findAll({
            where: { folderId },
            include: [
                {
                    model: Folder,
                    as: 'folder',
                    include: [{ model: Subject, as: 'subject' }]
                },
                {
                    model: DocumentMetadata,
                    as: 'metadata',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json(documents);
    } catch (error) {
        console.error('Doküman listeleme hatası:', error);
        res.status(500).json({ error: 'Dokümanlar listelenemedi' });
    }
};

/**
 * Doküman detayı
 * GET /api/documents/:id
 */
export const getDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findByPk(id, {
            include: [
                {
                    model: Folder,
                    as: 'folder',
                    include: [
                        {
                            model: Subject,
                            as: 'subject',
                            include: [{ model: Subject, as: 'parent' }]
                        }
                    ]
                }
            ]
        });

        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        res.json(document);
    } catch (error) {
        console.error('Doküman getirme hatası:', error);
        res.status(500).json({ error: 'Doküman getirilemedi' });
    }
};

/**
 * Doküman indir
 * GET /api/documents/:id/download
 */
export const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findByPk(id);

        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        const stream = await downloadPdfFromMinio(document.minioPath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename = "${document.originalFilename}"`);

        stream.pipe(res);
    } catch (error) {
        console.error('Doküman indirme hatası:', error);
        res.status(500).json({ error: 'Doküman indirilemedi' });
    }
};

/**
 * Doküman sil
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findByPk(id);

        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        // MinIO'dan sil
        await deletePdfFromMinio(document.minioPath);

        // Veritabanından sil
        await document.destroy();

        res.json({ message: 'Doküman başarıyla silindi' });
    } catch (error) {
        console.error('Doküman silme hatası:', error);
        res.status(500).json({ error: 'Doküman silinemedi' });
    }
};

/**
 * Doküman bilgilerini güncelle
 * PUT /api/documents/:id
 */
export const updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { originalFilename } = req.body;

        const document = await Document.findByPk(id);

        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        if (originalFilename) {
            document.originalFilename = originalFilename;
        }

        await document.save();

        res.json(document);
    } catch (error) {
        console.error('Doküman güncelleme hatası:', error);
        res.status(500).json({ error: 'Doküman güncellenemedi' });
    }
};
/**
 * Get document preview (serve PDF from MinIO)
 * GET /api/documents/preview/:bucket/:path
 */
export const getDocumentPreview = async (req, res) => {
    try {
        const { bucket, path } = req.params;
        const minioPath = decodeURIComponent(path);

        console.log('PDF preview isteği:', { bucket, minioPath });

        // Get file from MinIO (bucket is already set in minioService)
        const fileStream = await downloadPdfFromMinio(minioPath);

        // Set headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow iframe from any origin
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://fe.apps.bredimedia.com"); // Allow frontend domain

        // Pipe file stream to response
        fileStream.pipe(res);

    } catch (error) {
        console.error('PDF preview hatası:', error);
        res.status(500).json({ error: 'PDF önizleme alınamadı' });
    }
};

/**
 * Metadata eksik dokümanları getir
 * GET /api/documents/without-metadata
 */
export const getDocumentsWithoutMetadata = async (req, res) => {
    try {
        const documents = await Document.findAll({
            include: [
                {
                    model: Folder,
                    as: 'folder',
                    include: [
                        { model: Department, as: 'department' },
                        { model: Subject, as: 'subject' }
                    ]
                },
                {
                    model: DocumentMetadata,
                    as: 'metadata',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Filter documents without metadata
        const documentsWithoutMetadata = documents.filter(doc =>
            !doc.metadata || doc.metadata.length === 0
        );

        res.json(documentsWithoutMetadata);
    } catch (error) {
        console.error('Metadata eksik dokümanlar getirme hatası:', error);
        res.status(500).json({ error: 'Metadata eksik dokümanlar getirilemedi' });
    }
};

/**
 * Doküman metadata'sını güncelle
 * POST /api/documents/:id/metadata
 */
export const updateDocumentMetadata = async (req, res) => {
    try {
        const { id } = req.params;
        const { metadata } = req.body; // Array of {key, value}

        const document = await Document.findByPk(id);
        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        // Delete existing metadata
        await DocumentMetadata.destroy({ where: { documentId: id } });

        // Insert new metadata
        if (metadata && Array.isArray(metadata)) {
            const metadataRecords = metadata.map(m => ({
                documentId: id,
                key: m.key,
                value: m.value
            }));
            await DocumentMetadata.bulkCreate(metadataRecords);
        }

        // Return updated document with metadata
        const updatedDocument = await Document.findByPk(id, {
            include: [
                {
                    model: Folder,
                    as: 'folder',
                    include: [
                        { model: Department, as: 'department' },
                        { model: Subject, as: 'subject' }
                    ]
                },
                {
                    model: DocumentMetadata,
                    as: 'metadata'
                }
            ]
        });

        res.json(updatedDocument);
    } catch (error) {
        console.error('Metadata güncelleme hatası:', error);
        res.status(500).json({ error: 'Metadata güncellenemedi' });
    }
};

