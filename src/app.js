import express from 'express';
import cookieParser from 'cookie-parser';
import userRouter from './routes/userRouter.js';
import { logger } from './config/logger.js';
import { loggerMiddleware } from './middlewares/loggerMiddleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loggerMiddleware);

app.use((err, req, res, next) => {
    logger.error('Erro na aplicação', err, {
        metodo: req.method,
        rota: req.path,
        usuarioId: req.user._id || 'Desconecido'
    });

    res.status(500).json({ error: 'Erro interno do servidor' });
});

app.use('/api/user', userRouter);

export default app;