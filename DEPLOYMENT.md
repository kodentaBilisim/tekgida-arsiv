# 🚀 CapRover Deployment Rehberi

## 📋 İçindekiler
1. [Gereksinimler](#gereksinimler)
2. [PostgreSQL Kurulumu](#postgresql-kurulumu)
3. [MinIO Kurulumu](#minio-kurulumu)
4. [Adminer Kurulumu](#adminer-kurulumu)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Veritabanı Import](#veritabanı-import)

---

## 🔧 Gereksinimler

- CapRover kurulu bir sunucu
- Domain adı (örn: `arsiv.example.com`)
- En az 2GB RAM

---

## 🐘 PostgreSQL Kurulumu

### 1. CapRover Dashboard'dan PostgreSQL Ekle

1. **Apps** → **One-Click Apps/Databases** → **PostgreSQL**
2. Aşağıdaki ayarları yap:

```yaml
App Name: arsiv-postgres
PostgreSQL Version: 15
PostgreSQL Password: [güçlü bir şifre]
```

3. **Deploy** butonuna tıkla
4. Deployment tamamlandıktan sonra **Environment Variables** sekmesinden şu bilgileri not al:
   - `POSTGRES_PASSWORD`
   - Internal hostname: `srv-captain--arsiv-postgres`

### 2. Veritabanı Oluştur

CapRover terminal üzerinden:

```bash
# PostgreSQL container'ına bağlan
docker exec -it $(docker ps | grep arsiv-postgres | awk '{print $1}') psql -U postgres

# Veritabanı oluştur
CREATE DATABASE arsiv_db;
\q
```

---

## 📦 MinIO Kurulumu

### 1. MinIO App Oluştur

1. **Apps** → **One-Click Apps/Databases** → **MinIO**
2. Ayarlar:

```yaml
App Name: arsiv-minio
MINIO_ROOT_USER: minioadmin
MINIO_ROOT_PASSWORD: [güçlü bir şifre - min 8 karakter]
```

3. **Deploy** butonuna tıkla

### 2. MinIO'ya Erişim Ayarla

1. App ayarlarından **Enable HTTPS** aktif et
2. **HTTP Settings** → **Container HTTP Port**: `9000`
3. **HTTP Settings** → **Container HTTPS Port**: `9000`
4. Domain ekle: `minio.arsiv.example.com`
5. **Save & Update**

### 3. MinIO Console Ayarla (Opsiyonel)

MinIO Console için ayrı bir app:

1. **Apps** → **Enter Captain Definition**
2. Aşağıdaki JSON'u yapıştır:

```json
{
  "schemaVersion": 2,
  "dockerfileLines": [
    "FROM minio/minio:latest",
    "CMD [\"minio\", \"server\", \"/data\", \"--console-address\", \":9001\"]"
  ]
}
```

3. Domain: `minio-console.arsiv.example.com`
4. Port: `9001`

---

## 🔍 Adminer Kurulumu

### 1. Adminer App Oluştur

1. **Apps** → **One-Click Apps/Databases** → **Adminer**
2. Ayarlar:

```yaml
App Name: arsiv-adminer
```

3. **Deploy** butonuna tıkla

### 2. Adminer'a Erişim

1. **Enable HTTPS** aktif et
2. Domain ekle: `adminer.arsiv.example.com`
3. **Save & Update**

### 3. Adminer'a Bağlan

Tarayıcıdan `https://adminer.arsiv.example.com` adresine git:

- **System**: PostgreSQL
- **Server**: `srv-captain--arsiv-postgres`
- **Username**: `postgres`
- **Password**: [PostgreSQL şifresi]
- **Database**: `arsiv_db`

---

## 🖥️ Backend Deployment

### 1. captain-definition Dosyası Oluştur

`backend/captain-definition` dosyası oluştur:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

### 2. Dockerfile Oluştur

`backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# App files
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
CMD ["node", "src/app.js"]
```

### 3. .dockerignore Oluştur

`backend/.dockerignore`:

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
```

### 4. Backend App Oluştur

1. **Apps** → **Create New App**
2. App Name: `arsiv-backend`
3. **Has Persistent Data**: NO

### 5. Environment Variables Ekle

**App Configs** → **Environment Variables**:

```bash
NODE_ENV=production
PORT=3001

# Database
DB_HOST=srv-captain--arsiv-postgres
DB_PORT=5432
DB_NAME=arsiv_db
DB_USER=postgres
DB_PASSWORD=[PostgreSQL şifresi]

# MinIO
MINIO_ENDPOINT=srv-captain--arsiv-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=[MinIO şifresi]
MINIO_BUCKET=archive-documents
```

### 6. Deploy Backend

```bash
cd backend
tar -czf ../backend.tar.gz .
```

CapRover CLI ile deploy:

```bash
caprover deploy -a arsiv-backend -t ./backend.tar.gz
```

Veya CapRover dashboard'dan **Deployment** sekmesinden tar.gz dosyasını upload et.

### 7. Domain Ayarla

1. **HTTP Settings** → **Enable HTTPS**: ON
2. **Container HTTP Port**: `3001`
3. **Add Domain**: `api.arsiv.example.com`
4. **Save & Update**

---

## 🌐 Frontend Deployment

### 1. Frontend Hazırlık

`frontend/captain-definition`:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

### 2. Dockerfile Oluştur

`frontend/Dockerfile`:

```dockerfile
FROM nginx:alpine

# Copy frontend files
COPY . /usr/share/nginx/html

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. nginx.conf Oluştur

`frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://srv-captain--arsiv-backend:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. API URL Güncelle

Frontend JS dosyalarındaki API URL'leri güncelle:

```javascript
// Önceki:
const API_BASE = 'http://localhost:3001/api';

// Yeni:
const API_BASE = '/api'; // Nginx proxy kullanacağız
```

Tüm JS dosyalarında değiştir:

```bash
cd frontend
find . -name "*.js" -type f -exec sed -i '' 's|http://localhost:3001/api|/api|g' {} +
```

### 5. Frontend Deploy

```bash
cd frontend
tar -czf ../frontend.tar.gz .
```

1. **Apps** → **Create New App**
2. App Name: `arsiv-frontend`
3. Upload `frontend.tar.gz`
4. **Enable HTTPS**: ON
5. **Container HTTP Port**: `80`
6. **Add Domain**: `arsiv.example.com`
7. **Save & Update**

---

## 📊 Veritabanı Import

### 1. Schema Import

Adminer üzerinden:

1. `https://adminer.arsiv.example.com` aç
2. **SQL command** sekmesine git
3. `init-db/01-create-schema.sql` içeriğini yapıştır
4. **Execute** butonuna tıkla

### 2. Data Import Script Hazırla

Backend container'ında çalıştırmak için:

```bash
# Backend container'a bağlan
docker exec -it $(docker ps | grep arsiv-backend | awk '{print $1}') sh

# Import script'i çalıştır
node /app/import-all.js
```

Veya local'den:

```bash
# subjects-with-folders.json dosyasını backend container'a kopyala
docker cp subjects-with-folders.json $(docker ps | grep arsiv-backend | awk '{print $1}'):/app/

# Import script'i çalıştır
docker exec -it $(docker ps | grep arsiv-backend | awk '{print $1}') node import-all.js
```

---

## ✅ Deployment Checklist

- [ ] PostgreSQL kuruldu ve çalışıyor
- [ ] MinIO kuruldu ve çalışıyor
- [ ] Adminer kuruldu ve PostgreSQL'e bağlanabiliyor
- [ ] Backend deploy edildi ve health check başarılı
- [ ] Frontend deploy edildi
- [ ] Tüm domainler HTTPS ile çalışıyor
- [ ] Veritabanı schema'sı import edildi
- [ ] Konular ve klasörler import edildi
- [ ] Frontend'den backend'e API çağrıları çalışıyor

---

## 🔍 Troubleshooting

### Backend Çalışmıyor

```bash
# Logs kontrol et
docker logs $(docker ps | grep arsiv-backend | awk '{print $1}') --tail 100

# Container'a bağlan
docker exec -it $(docker ps | grep arsiv-backend | awk '{print $1}') sh

# Environment variables kontrol et
env | grep DB_
env | grep MINIO_
```

### PostgreSQL Bağlantı Hatası

```bash
# PostgreSQL container'ından backend'e ping at
docker exec -it $(docker ps | grep arsiv-postgres | awk '{print $1}') ping srv-captain--arsiv-backend

# Port kontrolü
docker exec -it $(docker ps | grep arsiv-postgres | awk '{print $1}') netstat -tulpn | grep 5432
```

### MinIO Bağlantı Hatası

```bash
# MinIO logs
docker logs $(docker ps | grep arsiv-minio | awk '{print $1}') --tail 100

# Bucket kontrolü
docker exec -it $(docker ps | grep arsiv-minio | awk '{print $1}') mc ls local/
```

---

## 🎯 Production Optimizasyonları

### 1. Database Backup

Adminer'dan **Export** ile düzenli yedek al veya:

```bash
# Otomatik backup script
docker exec $(docker ps | grep arsiv-postgres | awk '{print $1}') \
  pg_dump -U postgres arsiv_db > backup_$(date +%Y%m%d).sql
```

### 2. MinIO Backup

```bash
# MinIO data backup
docker exec $(docker ps | grep arsiv-minio | awk '{print $1}') \
  mc mirror local/archive-documents /backup/minio/
```

### 3. Monitoring

CapRover'ın built-in monitoring'ini kullan:
- **App Metrics** sekmesinden CPU/Memory kullanımını izle
- **Logs** sekmesinden hataları takip et

---

## 📞 Destek

Sorun yaşarsan:
1. CapRover logs kontrol et
2. Container logs kontrol et
3. Environment variables doğru mu kontrol et
4. Network connectivity test et

**Başarılar!** 🚀
