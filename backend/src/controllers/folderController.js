import { Folder, Department, Subject, Document } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Klasör oluştur
 * POST /api/folders
 */
export const createFolder = async (req, res) => {
    try {
        const { departmentId, subjectId, sequenceNumber, name, description, cabinetNumber } = req.body;

        // Validasyon
        if (!departmentId || !subjectId) {
            return res.status(400).json({
                error: 'Hem birim ID hem de konu ID zorunludur'
            });
        }

        // Birim kontrolü
        const department = await Department.findByPk(departmentId);
        if (!department) {
            return res.status(404).json({ error: `Birim bulunamadı: ${departmentId}` });
        }

        // Konu kontrolü
        const subject = await Subject.findByPk(subjectId);
        if (!subject) {
            return res.status(404).json({ error: `Konu bulunamadı: ${subjectId}` });
        }

        // Aynı birim ve konuya sahip klasör sayısını bul (sıra numarası için)
        const folderCount = await Folder.count({
            where: {
                departmentId: department.id,
                subjectId: subject.id
            }
        });

        const nextSequenceNumber = sequenceNumber || (folderCount + 1);

        // Aynı birim, konu ve sıra numarasına sahip klasör var mı kontrol et
        const existingFolder = await Folder.findOne({
            where: {
                departmentId: department.id,
                subjectId: subject.id,
                sequenceNumber: nextSequenceNumber
            }
        });

        if (existingFolder) {
            return res.status(400).json({
                error: `Bu birim, konu ve sıra numarasına sahip klasör zaten mevcut`
            });
        }

        // Klasör oluştur
        const folder = await Folder.create({
            departmentId: department.id,
            subjectId: subject.id,
            sequenceNumber: nextSequenceNumber,
            name: name || null,
            description: description || null,
            cabinetNumber: cabinetNumber || null
        });

        // İlişkili verilerle birlikte döndür
        const folderWithRelations = await Folder.findByPk(folder.id, {
            include: [
                { model: Department, as: 'department' },
                { model: Subject, as: 'subject' }
            ]
        });

        res.status(201).json(folderWithRelations);
    } catch (error) {
        console.error('Klasör oluşturma hatası:', error);
        res.status(500).json({ error: 'Klasör oluşturulamadı' });
    }
};

/**
 * Tüm klasörleri listele
 * GET /api/folders
 */
export const getFolders = async (req, res) => {
    try {
        const { departmentCode, subjectCode, subjectId } = req.query;

        const where = {};

        // subjectId ile direkt filtreleme (öncelikli)
        if (subjectId) {
            where.subjectId = subjectId;
        } else if (departmentCode) {
            const department = await Department.findOne({ where: { code: departmentCode } });
            if (department) where.departmentId = department.id;
        } else if (subjectCode) {
            const subject = await Subject.findOne({ where: { code: subjectCode } });
            if (subject) where.subjectId = subject.id;
        }

        const folders = await Folder.findAll({
            where,
            include: [
                { model: Department, as: 'department' },
                {
                    model: Subject,
                    as: 'subject',
                    include: [{ model: Subject, as: 'parent' }]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Add document count for each folder
        const foldersWithCount = await Promise.all(
            folders.map(async (folder) => {
                const documentCount = await Document.count({
                    where: { folderId: folder.id }
                });

                return {
                    ...folder.toJSON(),
                    documentCount
                };
            })
        );

        res.json(foldersWithCount);
    } catch (error) {
        console.error('Klasörleri getirme hatası:', error);
        res.status(500).json({ error: 'Klasörler getirilemedi' });
    }
};

/**
 * Klasör detayı
 * GET /api/folders/:id
 */
export const getFolder = async (req, res) => {
    try {
        const { id } = req.params;

        const folder = await Folder.findByPk(id, {
            include: [
                { model: Department, as: 'department' },
                {
                    model: Subject,
                    as: 'subject',
                    include: [{ model: Subject, as: 'parent' }]
                },
                { model: Document, as: 'documents' }
            ]
        });

        if (!folder) {
            return res.status(404).json({ error: 'Klasör bulunamadı' });
        }

        res.json(folder);
    } catch (error) {
        console.error('Klasör getirme hatası:', error);
        res.status(500).json({ error: 'Klasör getirilemedi' });
    }
};

/**
 * Klasör güncelle
 * PUT /api/folders/:id
 */
export const updateFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, sequenceNumber, cabinetNumber } = req.body;

        const folder = await Folder.findByPk(id);

        if (!folder) {
            return res.status(404).json({ error: 'Klasör bulunamadı' });
        }

        // Check for sequence number conflict if it's being changed
        if (sequenceNumber !== undefined && sequenceNumber !== folder.sequenceNumber) {
            const existingFolder = await Folder.findOne({
                where: {
                    subjectId: folder.subjectId,
                    sequenceNumber: sequenceNumber,
                    id: { [Op.ne]: id } // Exclude current folder
                }
            });

            if (existingFolder) {
                return res.status(409).json({
                    error: `Bu konuda ${sequenceNumber} numaralı klasör zaten mevcut`
                });
            }
        }

        if (name !== undefined) folder.name = name;
        if (description !== undefined) folder.description = description;
        if (sequenceNumber !== undefined) folder.sequenceNumber = sequenceNumber;
        if (cabinetNumber !== undefined) folder.cabinetNumber = cabinetNumber;

        await folder.save();

        const updatedFolder = await Folder.findByPk(id, {
            include: [
                { model: Department, as: 'department' },
                { model: Subject, as: 'subject' }
            ]
        });

        res.json(updatedFolder);
    } catch (error) {
        console.error('Klasör güncelleme hatası:', error);
        res.status(500).json({ error: 'Klasör güncellenemedi' });
    }
};

/**
 * Klasör sil
 * DELETE /api/folders/:id
 */
export const deleteFolder = async (req, res) => {
    try {
        const { id } = req.params;

        const folder = await Folder.findByPk(id, {
            include: [{ model: Document, as: 'documents' }]
        });

        if (!folder) {
            return res.status(404).json({ error: 'Klasör bulunamadı' });
        }

        // Klasörde doküman var mı kontrol et
        if (folder.documents && folder.documents.length > 0) {
            return res.status(400).json({
                error: 'Klasörde doküman bulunduğu için silinemez. Önce dokümanları silin.'
            });
        }

        await folder.destroy();

        res.json({ message: 'Klasör başarıyla silindi' });
    } catch (error) {
        console.error('Klasör silme hatası:', error);
        res.status(500).json({ error: 'Klasör silinemedi' });
    }
};
