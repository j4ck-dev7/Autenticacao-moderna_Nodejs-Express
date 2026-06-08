import React, { useState } from 'react';
import api from '../services/api';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/user/request-reset-password', { email });
      setMessage('Email de reset de senha enviado com sucesso');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erro ao solicitar reset de senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Esqueci minha senha</h2>
        <form onSubmit={handleSubmit}>
          <FormInput label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={loading}>Enviar email</Button>
        </form>
        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}
