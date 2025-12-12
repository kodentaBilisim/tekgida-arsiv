-- Örnek Birim Verileri
INSERT INTO departments (code, name, description) VALUES
('A', 'Genel Müdürlük', 'Genel Müdürlük Birimi'),
('B', 'Genel Sekreterlik', 'Genel Sekreterlik Birimi'),
('B-1', 'İnsan Kaynakları', 'İnsan Kaynakları Departmanı'),
('B-2', 'Mali İşler', 'Mali İşler Departmanı'),
('B-3', 'Hukuk', 'Hukuk Departmanı'),
('B-4', 'Uluslararası İlişkiler', 'Uluslararası İlişkiler Departmanı'),
('C', 'Eğitim ve Araştırma', 'Eğitim ve Araştırma Birimi')
ON CONFLICT (code) DO NOTHING;

-- Ana Konular (TEKGIDA-İŞ Arşivinden - İlk 20 Ana Konu)
INSERT INTO subjects (code, title, description, parent_id) VALUES
('01.00', 'TEKGIDA-İŞ''İN KURULUŞ ÖNCESİ YAPILANMASI', 'Sendikanın kuruluş öncesi dönemine ait belgeler', NULL),
('02.00', 'GENEL MERKEZ GENEL KURULLARI', 'Genel merkez genel kurul belgeleri', NULL),
('03.00', 'BÖLGE VE BAĞLI ŞUBE GENEL KURULLARI', 'Bölge ve şube genel kurul belgeleri', NULL),
('04.00', 'YÖNETİM KURULU– DENETİM KURULU- DİSİPLİN KURULU- BAŞKANLAR KURULU TOPLANTILARI', 'Kurul toplantı belgeleri', NULL),
('05.00', 'MEVZUAT', 'Mevzuat belgeleri', NULL),
('06.00', 'TOPLU İŞ SÖZLEŞMELERİ', 'Toplu iş sözleşmesi belgeleri', NULL),
('07.00', 'SENDİKAL GÜÇ BİRLİĞİ PLATFORMU', 'Sendikal güç birliği platform belgeleri', NULL),
('08.00', 'BASIN VE HALKLA İLİŞKİLER', 'Basın ve halkla ilişkiler belgeleri', NULL),
('09.00', 'ARAŞTIRMA RAPORLARI ve HUKUKİ GÖRÜŞLER', 'Araştırma raporları ve hukuki görüşler', NULL),
('10.00', 'HUKUK', 'Hukuk belgeleri', NULL),
('11.00', 'KADIN ÇALIŞMALARI', 'Kadın çalışmaları belgeleri', NULL),
('12.00', 'EĞİTİM', 'Eğitim belgeleri', NULL),
('13.00', 'ÇEŞİTLİ KURUMLARLA İLİŞKİLER', 'Kurum ilişkileri belgeleri', NULL),
('14.00', 'BÖLGE İLİŞKİLERİ', 'Bölge ilişkileri belgeleri', NULL),
('15.00', 'TÜRK-İŞ', 'Türk-İş ile ilgili belgeler', NULL),
('16.00', 'TEKEL', 'Tekel ile ilgili belgeler', NULL),
('17.00', 'ÇALIŞMA VE SOSYAL GÜVENLİK BAKANLIĞI', 'Bakanlık ile ilgili belgeler', NULL),
('18.00', 'ULUSLARARASI İLİŞKİLER', 'Uluslararası ilişkiler belgeleri', NULL),
('19.00', 'GAYRİMENKULLER', 'Gayrimenkul belgeleri', NULL),
('20.00', 'İŞTİRAKLAR', 'İştirak belgeleri', NULL)
ON CONFLICT (code) DO NOTHING;

-- Alt Konular (Örnek)
INSERT INTO subjects (code, title, description, parent_id) VALUES
('01.01', 'TÜRKİYE TÜTÜN MÜSKİRAT GIDA VE YARDIMCI İŞÇİ SENDİKALARI FEDERASYONU GENEL KURULLARI', '1956-1969 arası genel kurullar', (SELECT id FROM subjects WHERE code = '01.00')),
('01.02', 'TTMGYF GENEL KURUL KARAR DEFTERİ', '1964-1969 arası karar defterleri', (SELECT id FROM subjects WHERE code = '01.00')),
('01.03', 'TTMGYF YÖNETİM KURULU KARAR DEFTERLERİ', '1952-1969 arası yönetim kurulu kararları', (SELECT id FROM subjects WHERE code = '01.00')),
('02.01', '1.OLAĞAN GENEL KURUL', '19 Ocak 1963', (SELECT id FROM subjects WHERE code = '02.00')),
('02.02', '2. OLAĞAN GENEL KURUL', '03-05 Mart 1972', (SELECT id FROM subjects WHERE code = '02.00')),
('02.03', '3. OLAĞAN GENEL KURUL', '19-21 Mart 1975', (SELECT id FROM subjects WHERE code = '02.00'))
ON CONFLICT (code) DO NOTHING;

-- Konu Etiketleri (Örnek)
INSERT INTO subject_tags (subject_id, tag) VALUES
((SELECT id FROM subjects WHERE code = '01.00'), 'kuruluş'),
((SELECT id FROM subjects WHERE code = '01.00'), 'tarihçe'),
((SELECT id FROM subjects WHERE code = '01.00'), 'federasyon'),
((SELECT id FROM subjects WHERE code = '06.00'), 'toplu sözleşme'),
((SELECT id FROM subjects WHERE code = '06.00'), 'işçi hakları'),
((SELECT id FROM subjects WHERE code = '08.00'), 'basın'),
((SELECT id FROM subjects WHERE code = '08.00'), 'halkla ilişkiler'),
((SELECT id FROM subjects WHERE code = '11.00'), 'kadın'),
((SELECT id FROM subjects WHERE code = '11.00'), 'eşitlik'),
((SELECT id FROM subjects WHERE code = '12.00'), 'eğitim'),
((SELECT id FROM subjects WHERE code = '12.00'), 'seminer')
ON CONFLICT DO NOTHING;

-- Başarı mesajı
DO $$
BEGIN
    RAISE NOTICE 'Örnek veriler başarıyla eklendi!';
    RAISE NOTICE 'Toplam % birim eklendi', (SELECT COUNT(*) FROM departments);
    RAISE NOTICE 'Toplam % konu eklendi', (SELECT COUNT(*) FROM subjects);
    RAISE NOTICE 'Toplam % etiket eklendi', (SELECT COUNT(*) FROM subject_tags);
END $$;
