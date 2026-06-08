import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Login() {
  // HOOK: useState - see https://reactjs.org/docs/hooks-reference.html#usestate
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState(false);
  const [lockoutEmail, setLockoutEmail] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [countdown, setCountdown] = useState(0); 
  const timerRef = useRef(null);

  // Cleanup countdown interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      await api.post('/user/signIn', { email, password });
      const res = await api.get('/user/main');
      if (res.status === 200) {
        setIsAuthenticated(true);
        setMessage('Usuário logado com sucesso. Carregando a página principal...');
        setTimeout(() => navigate('/main'), 800);
      } else {
        setMessage('Erro ao verificar sessão');
      }
    } catch (err) {
      const res = err.response;
      const isRateLimit = err.isRateLimit || (res && res.status === 429);
      const isLockout = err.isLockout || (res && res.headers && res.headers['content-type'] && res.headers['content-type'].includes('text/html'));
      if (isRateLimit) {
        const seconds = err.rateLimitResetSeconds || (res && parseInt(res.headers['ratelimit-reset'] || res.headers['retry-after'] || 60, 10)) || 60;
        setRateLimited(true);
        setCountdown(seconds);
        setMessage(`Você excedeu o limite. Aguarde ${seconds} segundos.`);
        // start countdown
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              setRateLimited(false);
              setMessage(null);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else if (isLockout) {
        setLockout(true);
        setMessage('Muitas tentativas. Deseja resetar sua senha?');
        if (err.lockoutEmail) setLockoutEmail(err.lockoutEmail);
      } else if (res && res.data && typeof res.data.attemptsRemaining !== 'undefined') {
        setMessage((res.data.error || 'Erro') + '. Tentativas restantes: ' + res.data.attemptsRemaining);
      } else if (res && res.data && res.data.error) {
        setMessage(res.data.error);
      } else if (!res) {
        setMessage('Erro de rede');
      } else {
        setMessage('Erro ao efetuar login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async () => {
    try {
      const targetEmail = lockoutEmail || email;
      await api.post('/user/request-reset-password', { email: targetEmail });
      setMessage('Email de reset enviado com sucesso. Verifique seu email.');
      setLockout(false);
    } catch (err) {
      setMessage('Erro ao solicitar reset de senha');
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Faça login na sua conta</h2>
        <form onSubmit={handleSubmit}>
          <FormInput label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormInput label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="row">
            <label>
              <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} /> Lembre de mim
            </label>
            <a className="link" href="/forgot">Esqueceu a senha</a>
          </div>
          <Button type="submit" disabled={loading || rateLimited}>Entrar</Button>
        </form>
        {loading && <LoadingSpinner />}
        {message && <div className="message">{message}{rateLimited && countdown > 0 ? ` (${countdown}s)` : ''}</div>}
        {lockout && (
          <div className="lockout">
            <button className="button small" onClick={handleResetRequest}>Sim, resetar minha senha</button>
          </div>
        )}
        <div className="oauth">
          <p>Ou faça login com Google</p>
        </div>
        <div className="footer-link">
          <p>Não tem uma conta? <a href="/register">Cadastre-se</a></p>
        </div>
      </div>
    </div>
  );
}
