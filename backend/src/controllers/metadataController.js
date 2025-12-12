import { Document, DocumentMetadata } from '../models/index.js';

/**
 * Dokümanın metadata'larını getir
 * GET /api/documents/:id/metadata
 */
export const getDocumentMetadata = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findByPk(id, {
            include: [{ model: DocumentMetadata, as: 'metadata' }]
        });

        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        res.json(document.metadata);
    } catch (error) {
        console.error('Metadata getirme hatası:', error);
        res.status(500).json({ error: 'Metadata getirilemedi' });
    }
};

/**
 * Dokümana metadata ekle veya güncelle
 * POST /api/documents/:id/metadata
 * Body: { key: "tarih", value: "2024-01-15" }
 */
export const setDocumentMetadata = async (req, res) => {
    try {
        const { id } = req.params;
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'key alanı zorunludur' });
        }

        const document = await Document.findByPk(id);
        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        // Metadata'yı ekle veya güncelle
        const [metadata, created] = await DocumentMetadata.findOrCreate({
            where: { documentId: id, key },
            defaults: { documentId: id, key, value }
        });

        if (!created) {
            metadata.value = value;
            await metadata.save();
        }

        // Tüm metadata'ları getir
        const allMetadata = await DocumentMetadata.findAll({
            where: { documentId: id }
        });

        res.json(allMetadata);
    } catch (error) {
        console.error('Metadata ekleme hatası:', error);
        res.status(500).json({ error: 'Metadata eklenemedi' });
    }
};

/**
 * Toplu metadata ekle/güncelle
 * POST /api/documents/:id/metadata/bulk
 * Body: { metadata: [{ key: "tarih", value: "2024-01-15" }, { key: "açıklama", value: "..." }] }
 */
export const setBulkMetadata = async (req, res) => {
    try {
        const { id } = req.params;
        const { metadata } = req.body;

        if (!Array.isArray(metadata)) {
            return res.status(400).json({ error: 'metadata array olmalıdır' });
        }

        const document = await Document.findByPk(id);
        if (!document) {
            return res.status(404).json({ error: 'Doküman bulunamadı' });
        }

        // Her metadata için ekle/güncelle
        for (const item of metadata) {
            const key = item.metaKey || item.key;
            const value = item.metaValue || item.value;

            if (!key) continue;

            const [meta, created] = await DocumentMetadata.findOrCreate({
                where: { documentId: id, key: key },
                defaults: { documentId: id, key: key, value: value }
            });

            if (!created) {
                meta.value = value;
                await meta.save();
            }
        }

        // Tüm metadata'ları getir
        const allMetadata = await DocumentMetadata.findAll({
            where: { documentId: id }
        });

        res.json(allMetadata);
    } catch (error) {
        console.error('Toplu metadata ekleme hatası:', error);
        res.status(500).json({ error: 'Metadata eklenemedi' });
    }
};

/**
 * Metadata sil
 * DELETE /api/documents/:id/metadata/:key
 */
export const deleteDocumentMetadata = async (req, res) => {
    try {
        const { id, key } = req.params;

        const metadata = await DocumentMetadata.findOne({
            where: { documentId: id, key }
        });

        if (!metadata) {
            return res.status(404).json({ error: 'Metadata bulunamadı' });
        }

        await metadata.destroy();

        // Kalan metadata'ları getir
        const allMetadata = await DocumentMetadata.findAll({
            where: { documentId: id }
        });

        res.json(allMetadata);
    } catch (error) {
        console.error('Metadata silme hatası:', error);
        res.status(500).json({ error: 'Metadata silinemedi' });
    }
};
