# 🚀 Monorepo Deployment Rehberi

Bu proje tek bir repository'de hem backend hem frontend içerir. CapRover'da deploy ederken `APP_TYPE` environment variable ile hangi uygulamanın deploy edileceğini belirlersin.

## 📦 Deployment Yapısı

```
arsivstartApp/
├── captain-definition    # Ana deployment tanımı
├── Dockerfile           # Multi-stage Dockerfile
├── backend/            # Backend kodu
├── frontend/           # Frontend kodu
└── ...
```

## 🎯 Backend Deployment

### 1. CapRover'da Backend App Oluştur

1. **Apps** → **Create New App**
2. App Name: `arsiv-backend`
3. Has Persistent Data: NO

### 2. Environment Variables Ekle

**App Configs** → **Environment Variables** → **Bulk Edit**:

```bash
# Deployment type
APP_TYPE=backend

# Node.js
NODE_ENV=production
PORT=3001

# Database
DB_HOST=srv-captain--arsiv
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=ca33a9480a667d19

# MinIO
MINIO_ENDPOINT=arsiv-s3-api.apps.bredimedia.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=db6fe15f98ccd699e69ee1fe
MINIO_SECRET_KEY=d9d8a2cdc7f0fda35f02bf8ed7955660543e88
MINIO_BUCKET=archive-documents
```

### 3. Deploy

**Method 1: GitHub Integration (Önerilen)**

1. **App Configs** → **Deployment**
2. **Method**: GitHub
3. Repository: `kodentaBilisim/tekgida-arsiv`
4. Branch: `main`
5. **Save & Update**

**Method 2: Manual Deploy**

```bash
# Projeyi GitHub'dan çek
git clone https://github.com/kodentaBilisim/tekgida-arsiv.git
cd tekgida-arsiv

# Deploy
caprover deploy -a arsiv-backend
```

### 4. HTTP Settings

1. **Enable HTTPS**: ON
2. **Container HTTP Port**: `3001`
3. **Add Domain**: `arsiv-api.apps.bredimedia.com`
4. **Save & Update**

---

## 🌐 Frontend Deployment

### 1. CapRover'da Frontend App Oluştur

1. **Apps** → **Create New App**
2. App Name: `arsiv-frontend`
3. Has Persistent Data: NO

### 2. Environment Variables Ekle

**App Configs** → **Environment Variables** → **Bulk Edit**:

```bash
# Deployment type
APP_TYPE=frontend
```

### 3. Deploy

**Method 1: GitHub Integration (Önerilen)**

1. **App Configs** → **Deployment**
2. **Method**: GitHub
3. Repository: `kodentaBilisim/tekgida-arsiv`
4. Branch: `main`
5. **Save & Update**

**Method 2: Manual Deploy**

```bash
# Projeyi GitHub'dan çek
git clone https://github.com/kodentaBilisim/tekgida-arsiv.git
cd tekgida-arsiv

# Deploy
caprover deploy -a arsiv-frontend
```

### 4. HTTP Settings

1. **Enable HTTPS**: ON
2. **Container HTTP Port**: `80`
3. **Add Domain**: `arsiv.apps.bredimedia.com`
4. **Save & Update**

---

## 🔄 Güncelleme (Update)

### GitHub Integration Kullanıyorsan

1. Kodu GitHub'a push et:
```bash
git add .
git commit -m "fix: güncelleme mesajı"
git push
```

2. CapRover otomatik deploy eder (webhook varsa)
   
   VEYA
   
   CapRover Dashboard → App → **Deployment** → **Force Rebuild**

### Manuel Deploy Kullanıyorsan

```bash
# Backend güncelle
caprover deploy -a arsiv-backend

# Frontend güncelle
caprover deploy -a arsiv-frontend
```

---

## 🧪 Local Test

Dockerfile'ı local'de test etmek için:

### Backend Test

```bash
# Build
docker build --build-arg APP_TYPE=backend -t arsiv-backend .

# Run
docker run -p 3001:3001 \
  -e DB_HOST=localhost \
  -e DB_PASSWORD=yourpass \
  arsiv-backend
```

### Frontend Test

```bash
# Build
docker build --build-arg APP_TYPE=frontend -t arsiv-frontend .

# Run
docker run -p 8080:80 arsiv-frontend
```

---

## 📋 Deployment Checklist

### Backend
- [ ] App oluşturuldu (`arsiv-backend`)
- [ ] Environment variables eklendi (APP_TYPE=backend)
- [ ] Database credentials eklendi
- [ ] MinIO credentials eklendi
- [ ] GitHub integration yapıldı VEYA manuel deploy edildi
- [ ] HTTPS aktif
- [ ] Domain eklendi (`arsiv-api.apps.bredimedia.com`)
- [ ] Health check çalışıyor (`/health`)

### Frontend
- [ ] App oluşturuldu (`arsiv-frontend`)
- [ ] Environment variable eklendi (APP_TYPE=frontend)
- [ ] GitHub integration yapıldı VEYA manuel deploy edildi
- [ ] HTTPS aktif
- [ ] Domain eklendi (`arsiv.apps.bredimedia.com`)
- [ ] API proxy çalışıyor (`/api/*`)

---

## 🔍 Troubleshooting

### "Wrong APP_TYPE" Hatası

Environment variables'da `APP_TYPE` değişkenini kontrol et:
- Backend için: `APP_TYPE=backend`
- Frontend için: `APP_TYPE=frontend`

### Build Hatası

```bash
# Logs kontrol et
docker logs $(docker ps | grep arsiv-backend | awk '{print $1}')

# Container'a bağlan
docker exec -it $(docker ps | grep arsiv-backend | awk '{print $1}') sh
```

### GitHub Integration Çalışmıyor

1. CapRover → App → Deployment → GitHub
2. Repository doğru mu kontrol et
3. Branch doğru mu kontrol et
4. Webhook ayarlarını kontrol et

---

## 💡 İpuçları

1. **GitHub Integration kullan**: Her push'ta otomatik deploy
2. **Environment variables'ı dikkatli ayarla**: APP_TYPE çok önemli!
3. **Logs'u takip et**: Deployment sırasında hata olursa logs'tan görebilirsin
4. **Health check kullan**: Backend için `/health` endpoint'i var

---

**Başarılar!** 🎉
