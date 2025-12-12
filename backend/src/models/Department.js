import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Department = sequelize.define('Department', {
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
    name: {
        type: DataTypes.STRING(255),
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
            model: 'departments',
            key: 'id'
        }
    }
}, {
    tableName: 'departments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
});

// Self-referencing association
Department.hasMany(Department, {
    as: 'children',
    foreignKey: 'parentId'
});
Department.belongsTo(Department, {
    as: 'parent',
    foreignKey: 'parentId'
});

export default Department;
