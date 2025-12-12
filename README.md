# 📁 Arşiv Yönetim Sistemi

TEKGIDA-İŞ Sendikası için geliştirilmiş modern doküman arşiv yönetim sistemi.

## 🎯 Özellikler

- ✅ **Hiyerarşik Konu Yapısı**: 583 konu, 1469 klasör
- ✅ **PDF Önizleme**: Sayfa sayfa görüntüleme, zoom, tam ekran
- ✅ **Metadata Yönetimi**: Her doküman için detaylı bilgiler
- ✅ **Birim ve Konu Yönetimi**: CRUD işlemleri
- ✅ **Dashboard**: İstatistikler ve son dokümanlar
- ✅ **MinIO Entegrasyonu**: Güvenli dosya depolama

## 🛠️ Teknolojiler

**Backend:**
- Node.js + Express
- PostgreSQL (Sequelize ORM)
- MinIO (S3-compatible storage)

**Frontend:**
- Vanilla JavaScript
- Tailwind CSS
- PDF.js

## 📦 Kurulum

### Local Development

1. **Gereksinimleri Kur:**
```bash
# PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# MinIO
brew install minio/stable/minio
minio server ~/minio-data
```

2. **Veritabanı Oluştur:**
```bash
createdb arsiv_db
psql arsiv_db < init-db/01-create-schema.sql
```

3. **Backend:**
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenle
npm start
```

4. **Frontend:**
```bash
cd frontend
python3 -m http.server 5173
```

5. **Veri Import:**
```bash
node import-all.js
```

### 🚀 Production Deployment

CapRover ile deployment için: **[DEPLOYMENT.md](./DEPLOYMENT.md)** dosyasına bakın.

## 📚 Dokümantasyon

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - CapRover deployment rehberi
- **[backend/README.md](./backend/README.md)** - Backend API dokümantasyonu

## 🗂️ Proje Yapısı

```
arsivstartApp/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # Express routes
│   │   ├── config/          # Database & MinIO config
│   │   └── app.js           # Main app
│   ├── Dockerfile
│   ├── captain-definition
│   └── package.json
├── frontend/
│   ├── pages/               # HTML pages
│   ├── js/                  # JavaScript modules
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── captain-definition
│   └── index.html
├── init-db/
│   └── 01-create-schema.sql
├── subjects-with-folders.json  # Import data
├── import-all.js               # Data import script
└── DEPLOYMENT.md
```

## 🔧 Geliştirme Scriptleri

```bash
# Veritabanını sıfırla
node reset-db.js

# Konuları parse et
node parse-subjects-folders.js

# Veriyi import et
node import-all.js

# Constraint'i kaldır
node fix-constraint.js
```

## 📊 Veritabanı Şeması

- **departments** - Birimler
- **subjects** - Konular (hiyerarşik)
- **folders** - Klasörler
- **documents** - Dokümanlar
- **document_metadata** - Doküman metadata
- **document_tags** - Etiketler

## 🌐 API Endpoints

### Subjects
- `GET /api/subjects` - Tüm konular
- `GET /api/subjects/:id` - Tek konu
- `POST /api/subjects` - Yeni konu
- `PUT /api/subjects/:id` - Konu güncelle
- `DELETE /api/subjects/:id` - Konu sil

### Departments
- `GET /api/departments` - Tüm birimler
- `POST /api/departments` - Yeni birim
- `PUT /api/departments/:id` - Birim güncelle
- `DELETE /api/departments/:id` - Birim sil

### Documents
- `POST /api/documents/upload` - Doküman yükle
- `GET /api/documents/preview/:filename` - PDF önizleme
- `GET /api/documents/recent` - Son dokümanlar

### Statistics
- `GET /api/statistics` - Dashboard istatistikleri

## 🎨 Ekran Görüntüleri

- **Dashboard**: İstatistikler ve son dokümanlar
- **Birimler**: Birim yönetimi
- **Konular**: Hiyerarşik konu yapısı
- **Yükleme**: 4 adımlı yükleme süreci
- **PDF Önizleme**: Sayfa sayfa görüntüleme

## 📝 Lisans

Bu proje TEKGIDA-İŞ Sendikası için özel olarak geliştirilmiştir.

## 👥 Geliştirici

Geliştirme: 2025

---

**Başarılar!** 🚀
