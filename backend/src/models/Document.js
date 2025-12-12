import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Document = sequelize.define('Document', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    folderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'folder_id',
        references: {
            model: 'folders',
            key: 'id'
        }
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'UUID-based filename'
    },
    originalFilename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'original_filename',
        comment: 'Original uploaded filename'
    },
    fileSize: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'file_size'
    },
    mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'mime_type'
    },
    minioPath: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'minio_path',
        comment: 'Full path in MinIO: subject_code/sub_subject_code/sequence_number/uuid.pdf'
    },
    minioBucket: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'minio_bucket'
    },
    pageCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'page_count'
    }
}, {
    tableName: 'documents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
});

export default Document;
