import express from 'express';
import upload from '../middleware/upload.js';
import {
    uploadDocuments,
    getDocumentsByFolder,
    getRecentDocuments,
    getDocument,
    downloadDocument,
    deleteDocument,
    updateDocument,
    getDocumentPreview,
    getDocumentsWithoutMetadata,
    updateDocumentMetadata
} from '../controllers/documentController.js';

const router = express.Router();

// Preview route (must be before :id route to avoid conflicts)
router.get('/documents/preview/:bucket/:path(*)', getDocumentPreview);

// Metadata management
router.get('/documents/without-metadata', getDocumentsWithoutMetadata);
router.post('/documents/:id/metadata', updateDocumentMetadata);

// Recent documents
router.get('/documents/recent', getRecentDocuments);

// Klasöre toplu PDF yükleme
router.post('/folders/:folderId/documents/upload', upload.array('files', 1000), uploadDocuments);


// Klasördeki dokümanları listele
router.get('/folders/:folderId/documents', getDocumentsByFolder);

// Doküman detayı
router.get('/documents/:id', getDocument);

// Doküman indir
router.get('/documents/:id/download', downloadDocument);

// Doküman güncelle
router.put('/documents/:id', updateDocument);

// Doküman sil
router.delete('/documents/:id', deleteDocument);

export default router;

