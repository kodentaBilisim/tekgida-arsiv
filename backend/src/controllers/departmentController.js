import { Department } from '../models/index.js';

/**
 * Tüm birimleri getir
 * GET /api/departments
 */
export const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.findAll({
            include: [
                { model: Department, as: 'parent' },
                { model: Department, as: 'children' }
            ],
            order: [['code', 'ASC']]
        });
        res.json(departments);
    } catch (error) {
        console.error('Birim listeleme hatası:', error);
        res.status(500).json({ error: 'Birimler getirilemedi' });
    }
};

/**
 * ID'ye göre birim getir
 * GET /api/departments/:id
 */
export const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findByPk(id, {
            include: [
                { model: Department, as: 'parent' },
                { model: Department, as: 'children' }
            ]
        });

        if (!department) {
            return res.status(404).json({ error: 'Birim bulunamadı' });
        }

        res.json(department);
    } catch (error) {
        console.error('Birim getirme hatası:', error);
        res.status(500).json({ error: 'Birim getirilemedi' });
    }
};

/**
 * Yeni birim oluştur
 * POST /api/departments
 */
export const createDepartment = async (req, res) => {
    try {
        const { code, name, parentId } = req.body;

        if (!code || !name) {
            return res.status(400).json({ error: 'Kod ve isim zorunludur' });
        }

        // Kod kontrolü
        const existing = await Department.findOne({ where: { code } });
        if (existing) {
            return res.status(400).json({ error: 'Bu kod zaten kullanılıyor' });
        }

        const department = await Department.create({
            code,
            name,
            parentId: parentId || null
        });

        res.status(201).json(department);
    } catch (error) {
        console.error('Birim oluşturma hatası:', error);
        res.status(500).json({ error: 'Birim oluşturulamadı' });
    }
};

/**
 * Birim güncelle
 * PUT /api/departments/:id
 */
export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, parentId } = req.body;

        const department = await Department.findByPk(id);
        if (!department) {
            return res.status(404).json({ error: 'Birim bulunamadı' });
        }

        // Kod değişiyorsa kontrol et
        if (code && code !== department.code) {
            const existing = await Department.findOne({ where: { code } });
            if (existing) {
                return res.status(400).json({ error: 'Bu kod zaten kullanılıyor' });
            }
        }

        await department.update({
            code: code || department.code,
            name: name || department.name,
            parentId: parentId !== undefined ? parentId : department.parentId
        });

        const updated = await Department.findByPk(id, {
            include: [
                { model: Department, as: 'parent' },
                { model: Department, as: 'children' }
            ]
        });

        res.json(updated);
    } catch (error) {
        console.error('Birim güncelleme hatası:', error);
        res.status(500).json({ error: 'Birim güncellenemedi' });
    }
};

/**
 * Birim sil
 * DELETE /api/departments/:id
 */
export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findByPk(id, {
            include: [{ model: Department, as: 'children' }]
        });

        if (!department) {
            return res.status(404).json({ error: 'Birim bulunamadı' });
        }

        // Alt birimleri kontrol et
        if (department.children && department.children.length > 0) {
            return res.status(400).json({
                error: 'Bu birime bağlı alt birimler var. Önce onları silin.'
            });
        }

        await department.destroy();
        res.json({ message: 'Birim silindi' });
    } catch (error) {
        console.error('Birim silme hatası:', error);
        res.status(500).json({ error: 'Birim silinemedi' });
    }
};
