# API Endpoints - Klasör ve İstatistikler

## Klasör Yönetimi

### Klasör Oluştur
```bash
POST /api/folders
Content-Type: application/json

{
  "departmentCode": "B-4",
  "subjectCode": "01.01",
  "sequenceNumber": 2,
  "name": "Test Klasörü",
  "description": "Açıklama"
}
```

**Önemli:** Hem `departmentCode` hem de `subjectCode` zorunludur!

**Örnek:**
```bash
curl -X POST http://localhost:3001/api/folders \
  -H "Content-Type: application/json" \
  -d '{
    "departmentCode": "B-4",
    "subjectCode": "01.01",
    "sequenceNumber": 2,
    "name": "Uluslararası İlişkiler - Genel Kurullar"
  }'
```

### Klasörleri Listele
```bash
GET /api/folders
GET /api/folders?departmentCode=B-4
GET /api/folders?subjectCode=01.01
```

### Klasör Detayı
```bash
GET /api/folders/:id
```

### Klasör Güncelle
```bash
PUT /api/folders/:id
```

### Klasör Sil
```bash
DELETE /api/folders/:id
```

---

## İstatistik Endpoint'leri

### 1. Genel İstatistikler
```bash
GET /api/statistics/overview
```

**Yanıt:**
```json
{
  "departments": 7,
  "subjects": 26,
  "folders": {
    "total": 10,
    "empty": 3,
    "withDocuments": 7
  },
  "documents": {
    "total": 45,
    "last30Days": 12,
    "totalSizeBytes": 52428800,
    "totalSizeMB": 50
  }
}
```

### 2. Boş Klasörler
```bash
GET /api/statistics/empty-folders
```

**Yanıt:**
```json
{
  "count": 3,
  "folders": [
    {
      "id": 5,
      "departmentId": 4,
      "subjectId": 3,
      "sequenceNumber": 1,
      "name": "Boş Klasör",
      "department": {
        "code": "B-4",
        "name": "Uluslararası İlişkiler"
      },
      "subject": {
        "code": "01.01",
        "title": "GENEL KURULLAR"
      }
    }
  ]
}
```

### 3. Tarih Aralığında Yüklenen Dosyalar
```bash
GET /api/statistics/uploads-by-date?startDate=2025-01-01&endDate=2025-12-31
```

**Parametreler:**
- `startDate`: Başlangıç tarihi (YYYY-MM-DD)
- `endDate`: Bitiş tarihi (YYYY-MM-DD)

**Yanıt:**
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "totalCount": 45,
  "dailyBreakdown": [
    {
      "date": "2025-12-10",
      "count": 12
    },
    {
      "date": "2025-12-09",
      "count": 8
    }
  ]
}
```

**Örnek:**
```bash
# Bu ay yüklenen dosyalar
curl "http://localhost:3001/api/statistics/uploads-by-date?startDate=2025-12-01&endDate=2025-12-31"

# Son 7 gün
curl "http://localhost:3001/api/statistics/uploads-by-date?startDate=2025-12-04&endDate=2025-12-10"
```

### 4. Konu Başlığına Göre Dosya Sayıları
```bash
GET /api/statistics/documents-by-subject
GET /api/statistics/documents-by-subject?includeSubSubjects=true
```

**Parametreler:**
- `includeSubSubjects`: Alt konuları da dahil et (true/false)

**Yanıt (includeSubSubjects=false):**
```json
{
  "totalDocuments": 45,
  "subjects": [
    {
      "code": "01.00",
      "title": "TEKGIDA-İŞ'İN KURULUŞ ÖNCESİ YAPILANMASI",
      "documentCount": 12,
      "subSubjects": []
    },
    {
      "code": "02.00",
      "title": "GENEL MERKEZ GENEL KURULLARI",
      "documentCount": 8,
      "subSubjects": []
    }
  ]
}
```

**Yanıt (includeSubSubjects=true):**
```json
{
  "totalDocuments": 45,
  "subjects": [
    {
      "code": "01.00",
      "title": "TEKGIDA-İŞ'İN KURULUŞ ÖNCESİ YAPILANMASI",
      "documentCount": 5,
      "totalWithSubs": 12,
      "subSubjects": [
        {
          "code": "01.01",
          "title": "TTMGYF GENEL KURULLARI",
          "documentCount": 4
        },
        {
          "code": "01.02",
          "title": "GENEL KURUL KARAR DEFTERİ",
          "documentCount": 3
        }
      ]
    }
  ]
}
```

**Örnek:**
```bash
# Sadece ana konular
curl http://localhost:3001/api/statistics/documents-by-subject

# Alt konularla birlikte
curl "http://localhost:3001/api/statistics/documents-by-subject?includeSubSubjects=true"
```

---

## Test Senaryosu

### 1. Klasör Oluştur
```bash
curl -X POST http://localhost:3001/api/folders \
  -H "Content-Type: application/json" \
  -d '{
    "departmentCode": "B-4",
    "subjectCode": "01.01",
    "sequenceNumber": 2,
    "name": "Test Klasörü"
  }'
```

### 2. PDF Yükle
```bash
curl -X POST http://localhost:3001/api/folders/1/documents/upload \
  -F "files=@test.pdf"
```

### 3. İstatistikleri Kontrol Et
```bash
# Genel bakış
curl http://localhost:3001/api/statistics/overview

# Boş klasörler
curl http://localhost:3001/api/statistics/empty-folders

# Bugün yüklenenler
curl "http://localhost:3001/api/statistics/uploads-by-date?startDate=2025-12-10&endDate=2025-12-10"

# Konu bazlı sayılar
curl "http://localhost:3001/api/statistics/documents-by-subject?includeSubSubjects=true"
```
