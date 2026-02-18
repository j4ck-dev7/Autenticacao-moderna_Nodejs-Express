import jwt from 'jsonwebtoken'

export const Auth = (req, res, next) => {
    const cookie = req.cookies.authenticationToken;
    if(!cookie) return res.status(401).json({ message: 'Access Denied' })
    
    try {
        const userVeriefied = jwt.verify(cookie, process.env.JWT_SECRET);
        req.user = userVeriefied;
        next();
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Erro Interno' });    
    }
}