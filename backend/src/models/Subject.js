import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Subject = sequelize.define('Subject', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    },
    title: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'parent_id',
        references: {
            model: 'subjects',
            key: 'id'
        }
    }
}, {
    tableName: 'subjects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
});

// Self-referencing association
Subject.hasMany(Subject, {
    as: 'children',
    foreignKey: 'parentId'
});
Subject.belongsTo(Subject, {
    as: 'parent',
    foreignKey: 'parentId'
});

export default Subject;
