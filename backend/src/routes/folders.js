import express from 'express';
import {
    createFolder,
    getFolders,
    getFolder,
    updateFolder,
    deleteFolder
} from '../controllers/folderController.js';

const router = express.Router();

// Klasör oluştur
router.post('/folders', createFolder);

// Tüm klasörleri listele
router.get('/folders', getFolders);

// Klasör detayı
router.get('/folders/:id', getFolder);

// Klasör güncelle
router.put('/folders/:id', updateFolder);

// Klasör sil
router.delete('/folders/:id', deleteFolder);

// Klasördeki dokümanları listele
router.get('/folders/:folderId/documents', async (req, res) => {
    const { getDocumentsByFolder } = await import('../controllers/documentController.js');
    return getDocumentsByFolder(req, res);
});

export default router;
