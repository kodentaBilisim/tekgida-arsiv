import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config();

const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'archive-documents';

// Bucket'ın var olduğundan emin ol
const ensureBucket = async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`✅ MinIO bucket '${BUCKET_NAME}' oluşturuldu`);
        } else {
            console.log(`✅ MinIO bucket '${BUCKET_NAME}' mevcut`);
        }
    } catch (error) {
        console.error('❌ MinIO bucket hatası:', error);
        throw error;
    }
};

export { minioClient, BUCKET_NAME, ensureBucket };
