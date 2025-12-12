# Backend API Documentation

## Başlatma

```bash
cd backend
npm install
npm start
```

Server: http://localhost:3001

## API Endpoints

### Health Check
```bash
GET /health
```

### Doküman Yükleme

**Toplu PDF Yükleme**
```bash
POST /api/folders/:folderId/documents/upload
Content-Type: multipart/form-data

Form Data:
- files: PDF dosyaları (max 10 dosya, her biri max 50MB)
```

**Örnek cURL:**
```bash
curl -X POST http://localhost:3001/api/folders/1/documents/upload \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf" \
  -F "files=@document3.pdf"
```

**Yanıt:**
```json
{
  "message": "3 dosya başarıyla yüklendi",
  "uploaded": [
    {
      "id": 1,
      "folderId": 1,
      "filename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
      "originalFilename": "document1.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "minioPath": "01.00/01.01/2/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
      "minioBucket": "archive-documents",
      "createdAt": "2025-12-10T19:00:00.000Z"
    }
  ]
}
```

### Doküman Listeleme

**Klasördeki Dokümanları Listele**
```bash
GET /api/folders/:folderId/documents
```

**Örnek:**
```bash
curl http://localhost:3001/api/folders/1/documents
```

### Doküman Detayı

```bash
GET /api/documents/:id
```

**Örnek:**
```bash
curl http://localhost:3001/api/documents/1
```

### Doküman İndirme

```bash
GET /api/documents/:id/download
```

**Örnek:**
```bash
curl -O -J http://localhost:3001/api/documents/1/download
```

### Doküman Güncelleme

```bash
PUT /api/documents/:id
Content-Type: application/json

{
  "originalFilename": "yeni-dosya-adi.pdf"
}
```

### Doküman Silme

```bash
DELETE /api/documents/:id
```

## MinIO Klasör Yapısı

Dosyalar MinIO'da şu hiyerarşide saklanır:

```
archive-documents/
├── 01.00/              # Ana konu
│   ├── 01.01/          # Alt konu
│   │   ├── 1/          # Sıra no
│   │   │   ├── uuid1.pdf
│   │   │   └── uuid2.pdf
│   │   ├── 2/
│   │   │   └── uuid3.pdf
│   │   └── 5/
│   │       └── uuid4.pdf
│   └── 01.02/
│       └── 1/
│           └── uuid5.pdf
└── 02.00/
    └── 02.01/
        └── 1/
            └── uuid6.pdf
```

**Örnek Path:**
- Ana Konu: `01.00`
- Alt Konu: `01.01`
- Sıra No: `2`
- Dosya: `a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf`
- **Tam Path**: `01.00/01.01/2/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf`

## Test Senaryosu

### 1. Önce bir klasör oluştur (SQL)

```sql
-- Alt konu için klasör oluştur
INSERT INTO folders (subject_id, sequence_number, name, description)
VALUES (
  (SELECT id FROM subjects WHERE code = '01.01'),
  2,
  'Test Klasörü',
  'Test için oluşturuldu'
);
```

### 2. PDF Yükle

```bash
# Klasör ID'sini öğren
curl http://localhost:3001/api/folders/1/documents

# PDF yükle
curl -X POST http://localhost:3001/api/folders/1/documents/upload \
  -F "files=@test.pdf"
```

### 3. MinIO'da Kontrol Et

http://localhost:9001 adresine git ve `archive-documents` bucket'ını kontrol et.

Dosya şu path'de olmalı: `01.00/01.01/2/[uuid].pdf`

## Hata Kodları

- `400` - Geçersiz istek (dosya yok, geçersiz format, vb.)
- `404` - Kaynak bulunamadı
- `500` - Sunucu hatası

## Özellikler

✅ UUID ile benzersiz dosya adlandırma
✅ Hiyerarşik MinIO klasör yapısı (konu/alt-konu/sıra-no/)
✅ Toplu PDF yükleme (max 10 dosya)
✅ Dosya boyutu limiti (max 50MB/dosya)
✅ PDF format validasyonu
✅ Otomatik MinIO bucket oluşturma
✅ PostgreSQL ile metadata saklama
✅ Dosya indirme ve silme

## Geliştirme Notları

- Dosyalar memory storage kullanılarak yüklenir (buffer)
- MinIO path otomatik olarak klasörün konusuna göre oluşturulur
- Klasör mutlaka bir konuya (subject) bağlı olmalıdır
- Sıra numarası 1'den başlamak zorunda değildir
