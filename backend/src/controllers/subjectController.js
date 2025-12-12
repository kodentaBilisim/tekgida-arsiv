import { Subject } from '../models/index.js';

/**
 * Tüm konuları getir
 * GET /api/subjects
 */
export const getAllSubjects = async (req, res) => {
    try {
        const { parentId } = req.query;

        const where = {};
        if (parentId !== undefined) {
            where.parentId = parentId === 'null' ? null : parentId;
        }

        const subjects = await Subject.findAll({
            where,
            include: [
                { model: Subject, as: 'parent' },
                { model: Subject, as: 'children' }
            ],
            order: [['code', 'ASC']]
        });

        res.json(subjects);
    } catch (error) {
        console.error('Konu listeleme hatası:', error);
        res.status(500).json({ error: 'Konular getirilemedi' });
    }
};

/**
 * ID'ye göre konu getir
 * GET /api/subjects/:id
 */
export const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findByPk(id, {
            include: [
                { model: Subject, as: 'parent' },
                { model: Subject, as: 'children' }
            ]
        });

        if (!subject) {
            return res.status(404).json({ error: 'Konu bulunamadı' });
        }

        res.json(subject);
    } catch (error) {
        console.error('Konu getirme hatası:', error);
        res.status(500).json({ error: 'Konu getirilemedi' });
    }
};

/**
 * Yeni konu oluştur
 * POST /api/subjects
 */
export const createSubject = async (req, res) => {
    try {
        const { code, title, description, parentId } = req.body;

        if (!code || !title) {
            return res.status(400).json({ error: 'Kod ve başlık zorunludur' });
        }

        // Kod kontrolü
        const existing = await Subject.findOne({ where: { code } });
        if (existing) {
            return res.status(400).json({ error: 'Bu kod zaten kullanılıyor' });
        }

        const subject = await Subject.create({
            code,
            title,
            description: description || null,
            parentId: parentId || null
        });

        res.status(201).json(subject);
    } catch (error) {
        console.error('Konu oluşturma hatası:', error);
        res.status(500).json({ error: 'Konu oluşturulamadı' });
    }
};

/**
 * Konu güncelle
 * PUT /api/subjects/:id
 */
export const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, title, description, parentId } = req.body;

        const subject = await Subject.findByPk(id);
        if (!subject) {
            return res.status(404).json({ error: 'Konu bulunamadı' });
        }

        // Kod değişiyorsa kontrol et
        if (code && code !== subject.code) {
            const existing = await Subject.findOne({ where: { code } });
            if (existing) {
                return res.status(400).json({ error: 'Bu kod zaten kullanılıyor' });
            }
        }

        await subject.update({
            code: code || subject.code,
            title: title || subject.title,
            description: description !== undefined ? description : subject.description,
            parentId: parentId !== undefined ? parentId : subject.parentId
        });

        const updated = await Subject.findByPk(id, {
            include: [
                { model: Subject, as: 'parent' },
                { model: Subject, as: 'children' }
            ]
        });

        res.json(updated);
    } catch (error) {
        console.error('Konu güncelleme hatası:', error);
        res.status(500).json({ error: 'Konu güncellenemedi' });
    }
};

/**
 * Konu sil
 * DELETE /api/subjects/:id
 */
export const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const subject = await Subject.findByPk(id, {
            include: [{ model: Subject, as: 'children' }]
        });

        if (!subject) {
            return res.status(404).json({ error: 'Konu bulunamadı' });
        }

        // Alt konuları kontrol et
        if (subject.children && subject.children.length > 0) {
            return res.status(400).json({
                error: 'Bu konuya bağlı alt konular var. Önce onları silin.'
            });
        }

        await subject.destroy();
        res.json({ message: 'Konu silindi' });
    } catch (error) {
        console.error('Konu silme hatası:', error);
        res.status(500).json({ error: 'Konu silinemedi' });
    }
};
