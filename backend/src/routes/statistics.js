import express from 'express';
import {
    getEmptyFolders,
    getUploadsByDateRange,
    getDocumentsBySubject,
    getOverviewStatistics
} from '../controllers/statisticsController.js';

const router = express.Router();

// Genel istatistikler
router.get('/statistics/overview', getOverviewStatistics);

// Boş klasörler
router.get('/statistics/empty-folders', getEmptyFolders);

// Tarih aralığında yüklenen dosyalar
router.get('/statistics/uploads-by-date', getUploadsByDateRange);

// Konu başlığına göre dosya sayıları
router.get('/statistics/documents-by-subject', getDocumentsBySubject);

export default router;
