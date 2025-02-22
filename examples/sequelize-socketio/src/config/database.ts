import { Sequelize } from 'sequelize';
import path from 'path';

// Initialize SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false // Set to console.log to see SQL queries
});

export default sequelize;
