import fs from 'fs';
import { Subject, Folder } from './src/models/index.js';
import sequelize from './src/config/database.js';

async function importAll() {
    try {
        console.log('📥 Konular ve klasörler import ediliyor...\n');

        // Read JSON file
        const data = JSON.parse(fs.readFileSync('subjects-with-folders.json', 'utf-8'));

        console.log(`📊 Toplam konu: ${data.subjects.length}`);
        console.log(`📁 Toplam klasör: ${data.folders.length}\n`);

        // First pass: Create all main subjects (parentCode = null)
        const mainSubjects = data.subjects.filter(s => !s.parentCode);
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
        const subSubjects = data.subjects.filter(s => s.parentCode);
        console.log(`📌 ${subSubjects.length} alt konu ekleniyor...`);

        const createdSubSubjects = [];
        for (const subject of subSubjects) {
            // Find parent by code
            const parent = createdMainSubjects.find(p => p.code === subject.parentCode);

            if (parent) {
                const created = await Subject.create({
                    code: subject.code,
                    title: subject.title,
                    description: subject.description,
                    parentId: parent.id
                });
                createdSubSubjects.push(created);
            } else {
                console.log(`⚠️  Parent bulunamadı: ${subject.parentCode} için ${subject.code}`);
            }
        }

        console.log(`✅ ${createdSubSubjects.length} alt konu eklendi!\n`);

        // Third pass: Create all folders
        console.log(`📁 ${data.folders.length} klasör ekleniyor...`);

        const allSubjects = [...createdMainSubjects, ...createdSubSubjects];
        let addedFolderCount = 0;

        for (const folder of data.folders) {
            // Find subject by code
            const subject = allSubjects.find(s => s.code === folder.subjectCode);

            if (subject) {
                await Folder.create({
                    subjectId: subject.id,
                    sequenceNumber: parseInt(folder.folderNumber),
                    name: folder.name,
                    description: folder.notes || folder.description
                });
                addedFolderCount++;
            } else {
                console.log(`⚠️  Konu bulunamadı: ${folder.subjectCode} için Klasör ${folder.folderNumber}`);
            }
        }

        console.log(`✅ ${addedFolderCount} klasör eklendi!\n`);

        // Verify
        const [subjectCount] = await sequelize.query('SELECT COUNT(*) as count FROM subjects');
        const [folderCount] = await sequelize.query('SELECT COUNT(*) as count FROM folders');

        console.log(`\n📊 Veritabanı Durumu:`);
        console.log(`   Konular: ${subjectCount[0].count}`);
        console.log(`   Klasörler: ${folderCount[0].count}`);

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

        // Show folder example
        const folderExample = await Folder.findOne({
            include: [{
                model: Subject,
                as: 'subject',
                attributes: ['code', 'title']
            }],
            order: [['id', 'ASC']]
        });

        if (folderExample) {
            console.log('\n📁 Örnek klasör:');
            console.log(`   ${folderExample.subject.code} - Klasör ${folderExample.sequenceNumber}`);
            console.log(`   Not: ${folderExample.description?.substring(0, 60)}...`);
        }

        console.log('\n✅ Import tamamlandı!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
}

importAll();
