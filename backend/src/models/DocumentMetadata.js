import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DocumentMetadata = sequelize.define('DocumentMetadata', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    documentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'document_id'
    },
    key: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at'
    }
}, {
    tableName: 'document_metadata',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['document_id', 'key']
        }
    ]
});

export default DocumentMetadata;
