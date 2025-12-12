import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import { ensureBucket } from './config/minio.js';
import documentRoutes from './routes/documents.js';
import folderRoutes from './routes/folders.js';
import statisticsRoutes from './routes/statistics.js';
import departmentRoutes from './routes/departments.js';
import subjectRoutes from './routes/subjects.js';
import metadataRoutes from './routes/metadata.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Frontend'den gelen isteklere izin ver
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// Routes
app.use('/api', documentRoutes);
app.use('/api', folderRoutes);
app.use('/api', statisticsRoutes);
app.use('/api', departmentRoutes);
app.use('/api', subjectRoutes);
app.use('/api', metadataRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Dosya boyutu çok büyük (max 50MB)' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Çok fazla dosya (max 10)' });
        }
    }

    res.status(500).json({
        error: err.message || 'Sunucu hatası',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Initialize and start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ PostgreSQL bağlantısı başarılı');

        // Ensure MinIO bucket exists
        await ensureBucket();

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`📁 API Base: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Server başlatma hatası:', error);
        process.exit(1);
    }
};

startServer();

export default app;
