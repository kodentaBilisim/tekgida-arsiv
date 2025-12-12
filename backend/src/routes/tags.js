import express from 'express';
import {
    getAllTags,
    createTag,
    getDocumentTags,
    addTagToDocument,
    removeTagFromDocument
} from '../controllers/tagController.js';

const router = express.Router();

// Tag routes
router.get('/tags', getAllTags);
router.post('/tags', createTag);

// Document tag routes
router.get('/documents/:id/tags', getDocumentTags);
router.post('/documents/:id/tags', addTagToDocument);
router.delete('/documents/:id/tags/:tagId', removeTagFromDocument);

export default router;
