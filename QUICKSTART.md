# 🚀 CapRover Deployment - Hızlı Başlangıç

## ✅ Tamamlanan Adımlar

- [x] PostgreSQL kuruldu
  - Host: `srv-captain--arsiv:5432`
  - User: `postgres`
  - Password: `ca33a9480a667d19`
  - Database: `postgres`

- [x] MinIO kuruldu
  - Dashboard: https://arsiv-s3.apps.bredimedia.com
  - API: https://arsiv-s3-api.apps.bredimedia.com
  - Access Key: `db6fe15f98ccd699e69ee1fe`
  - Secret Key: `d9d8a2cdc7f0fda35f02bf8ed7955660543e88`

## 📋 Sıradaki Adımlar

### 1. MinIO Ayarları (ÖNEMLİ!)

CapRover Dashboard'dan:

1. **arsiv-s3** app'ine git:
   - ✅ Enable HTTPS
   - ✅ Enable Websocket Support
   - Save & Update

2. **arsiv-s3-api** app'ine git:
   - ✅ Enable HTTPS
   - ✅ Enable Websocket Support
   - Save & Update

### 2. Veritabanı Hazırlık

Adminer'ı kur ve schema'yı import et:

```bash
# Adminer kurulumu (CapRover One-Click Apps)
# App Name: arsiv-adminer
# Enable HTTPS: ON
# Domain: adminer.apps.bredimedia.com
```

Adminer'a bağlan:
- Server: `srv-captain--arsiv`
- Username: `postgres`
- Password: `ca33a9480a667d19`
- Database: `postgres`

SQL Command'dan çalıştır:
```sql
-- init-db/01-create-schema.sql içeriğini yapıştır
```

### 3. Backend Deployment

#### A. App Oluştur

CapRover Dashboard:
1. Apps → Create New App
2. App Name: `arsiv-backend`
3. Has Persistent Data: NO

#### B. Environment Variables Ekle

App Configs → Environment Variables → Bulk Edit:

```
NODE_ENV=production
PORT=3001
DB_HOST=srv-captain--arsiv
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=ca33a9480a667d19
MINIO_ENDPOINT=arsiv-s3-api.apps.bredimedia.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=db6fe15f98ccd699e69ee1fe
MINIO_SECRET_KEY=d9d8a2cdc7f0fda35f02bf8ed7955660543e88
MINIO_BUCKET=archive-documents
```

#### C. Deploy

```bash
cd backend
tar -czf ../backend.tar.gz .
```

CapRover Dashboard'dan:
- Deployment → Upload tar file → `backend.tar.gz`
- Deploy!

#### D. Domain Ayarla

HTTP Settings:
- Enable HTTPS: ON
- Container HTTP Port: `3001`
- Add Domain: `arsiv-api.apps.bredimedia.com`
- Save & Update

### 4. MinIO Bucket Oluştur

MinIO Dashboard'a git: https://arsiv-s3.apps.bredimedia.com

Login:
- Access Key: `db6fe15f98ccd699e69ee1fe`
- Secret Key: `d9d8a2cdc7f0fda35f02bf8ed7955660543e88`

Buckets → Create Bucket:
- Bucket Name: `archive-documents`
- Create

### 5. Veri Import

Backend container'a bağlan:

```bash
# subjects-with-folders.json dosyasını backend'e kopyala
docker cp subjects-with-folders.json $(docker ps | grep arsiv-backend | awk '{print $1}'):/app/

# Import script'i çalıştır
docker exec -it $(docker ps | grep arsiv-backend | awk '{print $1}') node import-all.js
```

### 6. Frontend Deployment

#### A. App Oluştur

CapRover Dashboard:
1. Apps → Create New App
2. App Name: `arsiv-frontend`
3. Has Persistent Data: NO

#### B. Deploy

```bash
cd frontend
tar -czf ../frontend.tar.gz .
```

CapRover Dashboard'dan:
- Deployment → Upload tar file → `frontend.tar.gz`
- Deploy!

#### C. Domain Ayarla

HTTP Settings:
- Enable HTTPS: ON
- Container HTTP Port: `80`
- Add Domain: `arsiv.apps.bredimedia.com`
- Save & Update

### 7. Test

1. Frontend: https://arsiv.apps.bredimedia.com
2. Backend Health: https://arsiv-api.apps.bredimedia.com/health
3. API Test: https://arsiv-api.apps.bredimedia.com/api/subjects

## 🔍 Troubleshooting

### Backend Logs

```bash
docker logs $(docker ps | grep arsiv-backend | awk '{print $1}') --tail 100
```

### Database Bağlantı Testi

```bash
docker exec -it $(docker ps | grep arsiv-backend | awk '{print $1}') sh
node -e "const {Client} = require('pg'); const c = new Client({host:'srv-captain--arsiv',port:5432,user:'postgres',password:'ca33a9480a667d19',database:'postgres'}); c.connect().then(()=>console.log('✅ DB OK')).catch(e=>console.log('❌',e))"
```

### MinIO Bağlantı Testi

```bash
docker exec -it $(docker ps | grep arsiv-backend | awk '{print $1}') sh
node -e "const Minio = require('minio'); const c = new Minio.Client({endPoint:'arsiv-s3-api.apps.bredimedia.com',port:443,useSSL:true,accessKey:'db6fe15f98ccd699e69ee1fe',secretKey:'d9d8a2cdc7f0fda35f02bf8ed7955660543e88'}); c.listBuckets().then(b=>console.log('✅ MinIO OK',b)).catch(e=>console.log('❌',e))"
```

## ✅ Deployment Checklist

- [ ] MinIO HTTPS ve Websocket aktif
- [ ] Adminer kuruldu
- [ ] Database schema import edildi
- [ ] Backend deploy edildi
- [ ] Backend environment variables eklendi
- [ ] Backend domain ayarlandı
- [ ] MinIO bucket oluşturuldu
- [ ] Veri import edildi
- [ ] Frontend deploy edildi
- [ ] Frontend domain ayarlandı
- [ ] Tüm servisler çalışıyor

---

**Başarılar!** 🎉
