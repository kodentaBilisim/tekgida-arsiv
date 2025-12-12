import { Tag, Document } from '../models/index.js';

/**
 * Tüm etiketleri listele
 * GET /api/tags
 */
export const getAllTags = async (req, res) => {
    try {
        const tags = await Tag.findAll({
            order: [['name', 'ASC']]
        });

        res.json(tags);
    } catch (error) {
        console.error('Etiket listeleme hatası:', error);
        res.status(500).json({ error: 'Etiketler listelenemedi' });
    }
};

/**
 * Yeni etiket oluştur
 * POST /api/tags
 */
export const createTag = async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Etiket adı zorunludur' });
        }

        const tag = await Tag.create({
            name,
            color: color || '#8B1538'
        });

        res.status(201).json(tag);
    } catch (error) {
        console.error('Etiket oluşturma hatası:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Bu etiket zaten mevcut' });
        }
        res.status(500).json({ error: 'Etiket oluşturulamadı' });
    }
};

/**
 * Dokümanın etiketlerini getir
 * GET /api/documents/:id/tags
 */
export const getDocumentTags = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findByPk(id, {
            include: [{ model: Tag, as: 'tags' }]
        });

        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        res.json(document.tags);
    } catch (error) {
        console.error('Doküman etiketleri getirme hatası:', error);
        res.status(500).json({ error: 'Etiketler getirilemedi' });
    }
};

/**
 * Dokümana etiket ekle
 * POST /api/documents/:id/tags
 */
export const addTagToDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { tagId, tagName } = req.body;

        const document = await Document.findByPk(id);
        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        let tag;

        // Eğer tagId verilmişse mevcut etiketi kullan
        if (tagId) {
            tag = await Tag.findByPk(tagId);
            if (!tag) {
                return res.status(404).json({ error: 'Etiket bulunamadı' });
            }
        }
        // Eğer tagName verilmişse yeni etiket oluştur veya mevcut olanı bul
        else if (tagName) {
            [tag] = await Tag.findOrCreate({
                where: { name: tagName },
                defaults: { name: tagName, color: '#8B1538' }
            });
        } else {
            return res.status(400).json({ error: 'tagId veya tagName gereklidir' });
        }

        // Etiketi dokümana ekle
        await document.addTag(tag);

        // Güncel etiketleri getir
        const updatedDocument = await Document.findByPk(id, {
            include: [{ model: Tag, as: 'tags' }]
        });

        res.json(updatedDocument.tags);
    } catch (error) {
        console.error('Etiket ekleme hatası:', error);
        res.status(500).json({ error: 'Etiket eklenemedi' });
    }
};

/**
 * Doküman etiketini sil
 * DELETE /api/documents/:id/tags/:tagId
 */
export const removeTagFromDocument = async (req, res) => {
    try {
        const { id, tagId } = req.params;

        const document = await Document.findByPk(id);
        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        const tag = await Tag.findByPk(tagId);
        if (!tag) {
            return res.status(404).json({ error: 'Etiket bulunamadı' });
        }

        await document.removeTag(tag);

        // Güncel etiketleri getir
        const updatedDocument = await Document.findByPk(id, {
            include: [{ model: Tag, as: 'tags' }]
        });

        res.json(updatedDocument.tags);
    } catch (error) {
        console.error('Etiket silme hatası:', error);
        res.status(500).json({ error: 'Etiket silinemedi' });
    }
};
