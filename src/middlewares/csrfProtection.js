import csrf from 'csurf';

// Em produção, é recomendado usar um middleware CSRF, para evitar requisições maliciosas.
// Esta const deve ser usada como middleware nas rotas POST, PUT, DELETE, etc, que alteram dados sensíveis.
export const csrfProtection = csrf({ cookie: false }); // Session-based