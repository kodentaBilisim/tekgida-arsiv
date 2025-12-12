import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'archive_db',
  process.env.DB_USER || 'archive_user',
  process.env.DB_PASSWORD || 'archive_pass_2024',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;
