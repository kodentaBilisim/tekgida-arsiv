import { Folder, Department, Subject, Document } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Boş klasörleri listele
 * GET /api/statistics/empty-folders
 */
export const getEmptyFolders = async (req, res) => {
    try {
        const emptyFolders = await Folder.findAll({
            include: [
                { model: Department, as: 'department' },
                {
                    model: Subject,
                    as: 'subject',
                    include: [{ model: Subject, as: 'parent' }]
                },
                {
                    model: Document,
                    as: 'documents',
                    required: false // LEFT JOIN
                }
            ],
            where: {
                '$documents.id$': null // Dokümanı olmayan klasörler
            }
        });

        res.json({
            count: emptyFolders.length,
            folders: emptyFolders
        });
    } catch (error) {
        console.error('Boş klasörler hatası:', error);
        res.status(500).json({ error: 'Boş klasörler getirilemedi' });
    }
};

/**
 * Tarih aralığında yüklenen dosya sayısı
 * GET /api/statistics/uploads-by-date?startDate=2025-01-01&endDate=2025-12-31
 */
export const getUploadsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'startDate ve endDate parametreleri zorunludur (YYYY-MM-DD formatında)'
            });
        }

        const where = {
            created_at: {
                [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
            }
        };

        const documents = await Document.findAll({
            where,
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
            raw: true
        });

        const totalCount = await Document.count({ where });

        res.json({
            startDate,
            endDate,
            totalCount,
            dailyBreakdown: documents
        });
    } catch (error) {
        console.error('Tarih aralığı istatistik hatası:', error);
        res.status(500).json({ error: 'İstatistikler getirilemedi' });
    }
};

/**
 * Konu başlığına göre dosya sayıları
 * GET /api/statistics/documents-by-subject
 */
export const getDocumentsBySubject = async (req, res) => {
    try {
        const { includeSubSubjects } = req.query;

        // Ana konular ve alt konular için ayrı sorgular
        const subjectStats = await Subject.findAll({
            attributes: [
                'id',
                'code',
                'title',
                'parentId',
                [
                    sequelize.literal(`(
            SELECT COUNT(*)
            FROM documents d
            INNER JOIN folders f ON d.folder_id = f.id
            WHERE f.subject_id = "Subject"."id"
          )`),
                    'documentCount'
                ]
            ],
            order: [['code', 'ASC']]
        });

        // Hiyerarşik yapı oluştur
        const mainSubjects = subjectStats.filter(s => !s.parentId);
        const subSubjects = subjectStats.filter(s => s.parentId);

        const result = mainSubjects.map(main => {
            const mainData = {
                code: main.code,
                title: main.title,
                documentCount: parseInt(main.dataValues.documentCount) || 0,
                subSubjects: []
            };

            if (includeSubSubjects === 'true') {
                mainData.subSubjects = subSubjects
                    .filter(sub => sub.parentId === main.id)
                    .map(sub => ({
                        code: sub.code,
                        title: sub.title,
                        documentCount: parseInt(sub.dataValues.documentCount) || 0
                    }));

                // Ana konunun toplam sayısına alt konuları da ekle
                mainData.totalWithSubs = mainData.documentCount +
                    mainData.subSubjects.reduce((sum, sub) => sum + sub.documentCount, 0);
            }

            return mainData;
        });

        // Genel toplam
        const grandTotal = result.reduce((sum, subject) =>
            sum + (subject.totalWithSubs || subject.documentCount), 0
        );

        res.json({
            totalDocuments: grandTotal,
            subjects: result
        });
    } catch (error) {
        console.error('Konu bazlı istatistik hatası:', error);
        res.status(500).json({ error: 'İstatistikler getirilemedi' });
    }
};

/**
 * Genel istatistikler
 * GET /api/statistics/overview
 */
export const getOverviewStatistics = async (req, res) => {
    try {
        const [
            totalDepartments,
            totalSubjects,
            totalFolders,
            totalDocuments,
            emptyFoldersCount,
            totalFileSize
        ] = await Promise.all([
            Department.count(),
            Subject.count(),
            Folder.count(),
            Document.count(),
            Folder.count({
                include: [{
                    model: Document,
                    as: 'documents',
                    required: false
                }],
                where: {
                    '$documents.id$': null
                }
            }),
            Document.sum('file_size')
        ]);

        // Son 30 gün içinde yüklenen dosyalar
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUploads = await Document.count({
            where: {
                created_at: {
                    [Op.gte]: thirtyDaysAgo
                }
            }
        });

        res.json({
            departments: totalDepartments,
            subjects: totalSubjects,
            folders: {
                total: totalFolders,
                empty: emptyFoldersCount,
                withDocuments: totalFolders - emptyFoldersCount
            },
            documents: {
                total: totalDocuments,
                last30Days: recentUploads,
                totalSizeBytes: totalFileSize || 0,
                totalSizeMB: Math.round((totalFileSize || 0) / 1024 / 1024 * 100) / 100
            }
        });
    } catch (error) {
        console.error('Genel istatistik hatası:', error);
        res.status(500).json({ error: 'İstatistikler getirilemedi' });
    }
};
