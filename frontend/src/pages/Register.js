import React, { useState } from 'react';
import api from '../services/api';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/user/signUp', { name, email, password });
      if (res.status === 201) {
        setMessage('Para concluir o registro, verifique seu email');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erro ao registrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Cadastre-se</h2>
        <form onSubmit={handleSubmit}>
          <FormInput label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <FormInput label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormInput label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading}>Cadastrar</Button>
        </form>
        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}
