import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Folder = sequelize.define('Folder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'department_id',
        references: {
            model: 'departments',
            key: 'id'
        }
    },
    subjectId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'subject_id',
        references: {
            model: 'subjects',
            key: 'id'
        }
    },
    sequenceNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'sequence_number'
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'folders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
});

export default Folder;
