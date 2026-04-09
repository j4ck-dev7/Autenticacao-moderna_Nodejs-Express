import 'dotenv/config';
 // Todas as variáveis de ambiente devem ser longas, com no minimo 32 caracteres com letras maiusculas e minisculas, numeros e caracteres especiais
// Além disso, é recomendável usar um gerenciador de segredos, como o HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, etc, para armazenar as variáveis de ambiente de forma segura. Nunca armazene variáveis de ambiente sensíveis em arquivos .env em produção, use o gerenciador de segredos para isso.

import app from './src/app.js' 
import { logger } from './src/config/logger.js';

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