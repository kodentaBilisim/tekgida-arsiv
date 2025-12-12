import multer from 'multer';
import path from 'path';

// Memory storage - dosyaları buffer olarak sakla
const storage = multer.memoryStorage();

// Dosya filtresi - sadece PDF
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== '.pdf') {
        return cb(new Error('Sadece PDF dosyaları yüklenebilir'), false);
    }

    // MIME type kontrolü
    if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Geçersiz dosya tipi'), false);
    }

    cb(null, true);
};

// Multer yapılandırması
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
        files: 10 // Tek seferde max 10 dosya
    }
});

export default upload;
