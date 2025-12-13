-- Add document_metadata table
CREATE TABLE IF NOT EXISTS document_metadata (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_metadata_document ON document_metadata(document_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_key ON document_metadata(key);

-- Add trigger for updated_at
CREATE TRIGGER update_document_metadata_updated_at BEFORE UPDATE ON document_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
