import dotenv from 'dotenv'
import app from './src/app.js' 
import { logger } from './src/config/logger.js';

dotenv.config();

import { connect } from './src/config/db.js'

const PORT = process.env.PORT;

const server = app.listen(PORT, () => { 
    connect(); 
    console.log(`Server is running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM recebido, encerrando servidor');
    server.close(() => {
        logger.info('Servidor encerrado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT recebido, encerrando servidor');
    server.close(() => {
        logger.info('Servidor encerrado');
        process.exit(0);
    });
});