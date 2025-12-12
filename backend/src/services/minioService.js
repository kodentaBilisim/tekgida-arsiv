import { v4 as uuidv4 } from 'uuid';
import { minioClient, BUCKET_NAME } from '../config/minio.js';
import { Subject, Folder } from '../models/index.js';
import path from 'path';

/**
 * MinIO'da hiyerarşik klasör yolu oluşturur
 * Örnek: 01.00/01.01/2/uuid.pdf
 * 
 * @param {number} folderId - Klasör ID
 * @returns {Promise<string>} MinIO path
 */
export const generateMinioPath = async (folderId) => {
    const folder = await Folder.findByPk(folderId, {
        include: [
            {
                model: Subject,
                as: 'subject',
                include: [
                    {
                        model: Subject,
                        as: 'parent'
                    }
                ]
            }
        ]
    });

    if (!folder) {
        throw new Error('Klasör bulunamadı');
    }

    if (!folder.subject) {
        throw new Error('Klasör bir konuya bağlı olmalıdır');
    }

    const pathParts = [];

    // Ana konu kodu (örn: 01.00)
    if (folder.subject.parent) {
        pathParts.push(folder.subject.parent.code);
    }

    // Alt konu kodu (örn: 01.01) - eğer alt konu ise
    pathParts.push(folder.subject.code);

    // Sıra numarası (örn: 2)
    pathParts.push(folder.sequenceNumber.toString());

    return pathParts.join('/');
};

/**
 * PDF dosyasını MinIO'ya yükler
 * 
 * @param {Buffer} fileBuffer - Dosya buffer
 * @param {string} originalFilename - Orijinal dosya adı
 * @param {number} folderId - Klasör ID
 * @returns {Promise<Object>} Upload bilgileri
 */
export const uploadPdfToMinio = async (fileBuffer, originalFilename, folderId) => {
    try {
        // UUID ile benzersiz dosya adı oluştur
        const fileExtension = path.extname(originalFilename);
        const uuid = uuidv4();
        const filename = `${uuid}${fileExtension}`;

        // Hiyerarşik path oluştur
        const folderPath = await generateMinioPath(folderId);
        const minioPath = `${folderPath}/${filename}`;

        // MinIO'ya yükle
        await minioClient.putObject(
            BUCKET_NAME,
            minioPath,
            fileBuffer,
            fileBuffer.length,
            {
                'Content-Type': 'application/pdf',
                'X-Original-Filename': originalFilename
            }
        );

        return {
            filename,
            minioPath,
            minioBucket: BUCKET_NAME,
            fileSize: fileBuffer.length
        };
    } catch (error) {
        console.error('MinIO yükleme hatası:', error);
        throw error;
    }
};

/**
 * MinIO'dan dosya indir
 * 
 * @param {string} minioPath - MinIO'daki dosya yolu
 * @returns {Promise<Stream>} Dosya stream
 */
export const downloadPdfFromMinio = async (minioPath) => {
    try {
        const stream = await minioClient.getObject(BUCKET_NAME, minioPath);
        return stream;
    } catch (error) {
        console.error('MinIO indirme hatası:', error);
        throw error;
    }
};

/**
 * MinIO'dan dosya sil
 * 
 * @param {string} minioPath - MinIO'daki dosya yolu
 */
export const deletePdfFromMinio = async (minioPath) => {
    try {
        await minioClient.removeObject(BUCKET_NAME, minioPath);
    } catch (error) {
        console.error('MinIO silme hatası:', error);
        throw error;
    }
};

/**
 * Klasördeki tüm dosyaları listele
 * 
 * @param {number} folderId - Klasör ID
 * @returns {Promise<Array>} Dosya listesi
 */
export const listFolderFiles = async (folderId) => {
    try {
        const folderPath = await generateMinioPath(folderId);
        const objectsStream = minioClient.listObjects(BUCKET_NAME, folderPath, true);

        const files = [];
        return new Promise((resolve, reject) => {
            objectsStream.on('data', (obj) => files.push(obj));
            objectsStream.on('error', reject);
            objectsStream.on('end', () => resolve(files));
        });
    } catch (error) {
        console.error('MinIO listeleme hatası:', error);
        throw error;
    }
};
