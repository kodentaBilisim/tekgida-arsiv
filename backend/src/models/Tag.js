import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Tag = sequelize.define('Tag', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    color: {
        type: DataTypes.STRING(7), // Hex color #RRGGBB
        allowNull: true,
        defaultValue: '#8B1538' // Bordo
    }
}, {
    tableName: 'tags',
    underscored: true,
    timestamps: true
});

export default Tag;
