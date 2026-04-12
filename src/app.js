import express from 'express';
// import cookieParser from 'cookie-parser';
import userRouter from './routes/userRouter.js';
import { logger } from './config/logger.js';
import session from 'express-session';
// Em produção, é recomendado usar helmet, sem ele a aplicação fica vulnerável a XSS, Clickjacking,
// MIME-sniffing, entre outros ataques.
import helmet from 'helmet';
import { loggerMiddleware } from './middlewares/loggerMiddleware.js';
import cors from 'cors';
import csurf from '@dr.pogodin/csurf';

const app = express();

// Em produção, é recomendado usar CORS, para evitar que a API seja consumida por domínios não autorizados.
app.use(cors({
    origin: 'http://localhost:5000', // Substitua pelo domínio do frontend em produção
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(helmet());
app.use(helmet.frameguard({ action: 'deny' })); // Evita clickjacking
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
// E também é recomendado usar o contentSecurityPolicy para evitar ataques de XSS
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"]
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 600000 }
}));
// Em produção, é recomendado usar um middleware CSRF, para evitar requisições maliciosas.
// Esta const deve ser usada como middleware nas rotas POST, PUT, DELETE, etc, que alteram dados sensíveis.
const csrfProtection = csurf({ cookie: false, sessionKey: process.env.SESSION_SECRET }); // Session-based
app.use(loggerMiddleware);

app.use((err, req, res, next) => {
    logger.error('Erro na aplicação', err, {
        metodo: req.method,
        rota: req.path,
        usuarioId: req.session && req.session.user ? req.session.user : 'Desconecido'
    });

    res.status(500).json({ error: 'Erro interno do servidor' });
});

app.use('/api/user', userRouter);

export default app;