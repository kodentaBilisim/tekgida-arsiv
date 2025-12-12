## ✅ Kurulum Tamamlandı!

### 🎉 Başarıyla Çalışan Servisler

#### 1. PostgreSQL Veritabanı
- **Port**: 5433
- **Durum**: ✅ Çalışıyor ve hazır
- **Veritabanı**: `archive_db`
- **Kullanıcı**: `archive_user`
- **Şifre**: `archive_pass_2024`

**Oluşturulan Tablolar:**
- ✅ departments (7 birim)
- ✅ subjects (26 konu - 20 ana, 6 alt)
- ✅ subject_tags (11 etiket)
- ✅ folders
- ✅ folder_tags
- ✅ documents
- ✅ document_tags

**Örnek Veriler:**
- 7 birim (A, B, B-1, B-2, B-3, B-4, C)
- 20 ana konu (01.00 - 20.00)
- 6 alt konu (01.01, 01.02, 01.03, 02.01, 02.02, 02.03)
- 11 etiket

#### 2. pgAdmin (Web Arayüzü)
- **URL**: http://localhost:5050
- **Email**: `admin@example.com`
- **Şifre**: `admin123`
- **Durum**: ✅ Başlatılıyor

**pgAdmin'de Bağlantı Kurma:**
1. http://localhost:5050 adresine git
2. Email: `admin@example.com`, Şifre: `admin123` ile giriş yap
3. Sağ tıkla "Servers" → "Register" → "Server"
4. **General** sekmesi: Name: `Arsiv DB`
5. **Connection** sekmesi:
   - Host: `postgres`
   - Port: `5432`
   - Database: `archive_db`
   - Username: `archive_user`
   - Password: `archive_pass_2024`

#### 3. MinIO (Dosya Depolama)
- **Console URL**: http://localhost:9001
- **API URL**: http://localhost:9000
- **Username**: `minioadmin`
- **Password**: `minioadmin123`
- **Durum**: ✅ Çalışıyor

### 📊 Veritabanı Kontrol Komutları

```bash
# Tabloları listele
docker exec arsiv_postgres psql -U archive_user -d archive_db -c "\dt"

# Birimleri görüntüle
docker exec arsiv_postgres psql -U archive_user -d archive_db -c "SELECT code, name FROM departments ORDER BY code;"

# Ana konuları görüntüle
docker exec arsiv_postgres psql -U archive_user -d archive_db -c "SELECT code, title FROM subjects WHERE parent_id IS NULL ORDER BY code;"

# Alt konuları görüntüle
docker exec arsiv_postgres psql -U archive_user -d archive_db -c "SELECT s1.code as ana_kod, s2.code as alt_kod, s2.title FROM subjects s1 JOIN subjects s2 ON s1.id = s2.parent_id ORDER BY s1.code, s2.code;"

# Etiketleri görüntüle
docker exec arsiv_postgres psql -U archive_user -d archive_db -c "SELECT s.code, s.title, st.tag FROM subjects s JOIN subject_tags st ON s.id = st.subject_id ORDER BY s.code;"
```

### 🚀 Sonraki Adımlar

1. ✅ Docker servisleri çalışıyor
2. ✅ Veritabanı şeması oluşturuldu
3. ✅ Örnek veriler yüklendi
4. ⏳ Backend API geliştirme (Node.js + Express)
5. ⏳ Frontend geliştirme (Next.js)

### 🛠️ Yönetim Komutları

```bash
# Servisleri durdur
docker-compose stop

# Servisleri başlat
docker-compose start

# Servisleri yeniden başlat
docker-compose restart

# Logları görüntüle
docker-compose logs -f

# Servisleri kaldır (veriler korunur)
docker-compose down

# Servisleri ve verileri tamamen sil
docker-compose down -v
```

---

**Not**: pgAdmin'in tam olarak başlaması 10-15 saniye sürebilir. Eğer http://localhost:5050 açılmıyorsa, `docker-compose logs pgadmin` komutuyla durumu kontrol edebilirsiniz.
