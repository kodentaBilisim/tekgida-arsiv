import express from 'express';
import {
    getDocumentMetadata,
    setDocumentMetadata,
    setBulkMetadata,
    deleteDocumentMetadata
} from '../controllers/metadataController.js';

const router = express.Router();

// Document metadata routes
router.get('/documents/:id/metadata', getDocumentMetadata);
router.post('/documents/:id/metadata', setDocumentMetadata);
router.post('/documents/:id/metadata/bulk', setBulkMetadata);
router.delete('/documents/:id/metadata/:key', deleteDocumentMetadata);

export default router;
