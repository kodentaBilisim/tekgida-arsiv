import fs from 'fs';
import { Subject } from './backend/src/models/index.js';
import sequelize from './backend/src/config/database.js';

async function importSubjects() {
    try {
        console.log('📥 Konular import ediliyor...\n');

        // Read JSON file
        const data = JSON.parse(fs.readFileSync('subjects-data.json', 'utf-8'));

        // First pass: Create all main subjects (parentCode = null)
        const mainSubjects = data.filter(s => !s.parentCode);
        console.log(`📌 ${mainSubjects.length} ana konu ekleniyor...`);

        const createdMainSubjects = [];
        for (const subject of mainSubjects) {
            const created = await Subject.create({
                code: subject.code,
                title: subject.title,
                description: subject.description,
                parentId: null
            });
            createdMainSubjects.push(created);
        }

        console.log(`✅ ${createdMainSubjects.length} ana konu eklendi!\n`);

        // Second pass: Create all sub subjects
        const subSubjects = data.filter(s => s.parentCode);
        console.log(`📌 ${subSubjects.length} alt konu ekleniyor...`);

        let addedCount = 0;
        for (const subject of subSubjects) {
            // Find parent by code
            const parent = createdMainSubjects.find(p => p.code === subject.parentCode);

            if (parent) {
                await Subject.create({
                    code: subject.code,
                    title: subject.title,
                    description: subject.description,
                    parentId: parent.id
                });
                addedCount++;
            } else {
                console.log(`⚠️  Parent bulunamadı: ${subject.parentCode} için ${subject.code}`);
            }
        }

        console.log(`✅ ${addedCount} alt konu eklendi!\n`);

        // Verify
        const [result] = await sequelize.query('SELECT COUNT(*) as count FROM subjects');
        console.log(`\n📊 Toplam veritabanındaki konu sayısı: ${result[0].count}`);

        // Show some examples
        const examples = await Subject.findAll({
            limit: 5,
            include: [
                { model: Subject, as: 'parent' },
                { model: Subject, as: 'children' }
            ],
            order: [['code', 'ASC']]
        });

        console.log('\n📋 Örnek konular:');
        examples.forEach(s => {
            console.log(`   ${s.code} - ${s.title.substring(0, 50)}...`);
            if (s.children && s.children.length > 0) {
                console.log(`      └─ ${s.children.length} alt konu`);
            }
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
}

importSubjects();
