-- Doküman Arşiv Uygulaması Veritabanı Şeması
-- Oluşturulma Tarihi: 2025-12-10

-- Bölümler (Departments) Tablosu
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);

-- Konular (Subjects) Tablosu
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_parent ON subjects(parent_id);

-- Konu Etiketleri (Subject Tags) Tablosu
CREATE TABLE IF NOT EXISTS subject_tags (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subject_tags_subject ON subject_tags(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_tags_tag ON subject_tags(tag);

-- Klasörler (Folders) Tablosu
CREATE TABLE IF NOT EXISTS folders (
  id SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  sequence_number INTEGER DEFAULT 1,
  name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_folder_parent CHECK (
    (department_id IS NOT NULL AND subject_id IS NULL) OR
    (department_id IS NULL AND subject_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_folders_department ON folders(department_id);
CREATE INDEX IF NOT EXISTS idx_folders_subject ON folders(subject_id);
CREATE INDEX IF NOT EXISTS idx_folders_sequence ON folders(sequence_number);

-- Klasör Etiketleri (Folder Tags) Tablosu
CREATE TABLE IF NOT EXISTS folder_tags (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_folder_tags_folder ON folder_tags(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_tags_tag ON folder_tags(tag);

-- Dokümanlar (Documents/PDFs) Tablosu
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  minio_path VARCHAR(500) NOT NULL,
  minio_bucket VARCHAR(100) NOT NULL,
  page_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);

-- Doküman Etiketleri (Document Tags) Tablosu
CREATE TABLE IF NOT EXISTS document_tags (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_tags_document ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag);

-- Full-Text Search İndeksleri
CREATE INDEX IF NOT EXISTS idx_documents_fulltext ON documents 
  USING gin(to_tsvector('turkish', filename || ' ' || original_filename));

CREATE INDEX IF NOT EXISTS idx_all_tags ON document_tags 
  USING gin(to_tsvector('turkish', tag));

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Başarı mesajı
DO $$
BEGIN
    RAISE NOTICE 'Veritabanı şeması başarıyla oluşturuldu!';
END $$;

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#8B1538',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document-Tag junction table
CREATE TABLE IF NOT EXISTS document_tags (
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id, tag_id)
);

-- Indexes for document_tags
CREATE INDEX IF NOT EXISTS idx_document_tags_document ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag_id);
