import request from 'supertest';
import app from '../src/app.js';

describe('API Tests', () => {
    // Health check
    describe('GET /health', () => {
        it('should return OK status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('OK');
        });
    });

    // Departments
    describe('GET /api/departments', () => {
        it('should return list of departments', async () => {
            const res = await request(app).get('/api/departments');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // Subjects
    describe('GET /api/subjects', () => {
        it('should return list of subjects', async () => {
            const res = await request(app).get('/api/subjects');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // Folders
    describe('GET /api/folders', () => {
        it('should return list of folders', async () => {
            const res = await request(app).get('/api/folders');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // Statistics
    describe('GET /api/statistics/overview', () => {
        it('should return statistics overview', async () => {
            const res = await request(app).get('/api/statistics/overview');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('departments');
            expect(res.body).toHaveProperty('subjects');
            expect(res.body).toHaveProperty('folders');
            expect(res.body).toHaveProperty('documents');
        });
    });

    describe('GET /api/statistics/empty-folders', () => {
        it('should return empty folders', async () => {
            const res = await request(app).get('/api/statistics/empty-folders');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('count');
            expect(res.body).toHaveProperty('folders');
        });
    });

    describe('GET /api/statistics/documents-by-subject', () => {
        it('should return documents grouped by subject', async () => {
            const res = await request(app).get('/api/statistics/documents-by-subject');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalDocuments');
            expect(res.body).toHaveProperty('subjects');
        });
    });
});
