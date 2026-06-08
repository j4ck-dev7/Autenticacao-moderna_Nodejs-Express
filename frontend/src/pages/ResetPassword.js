import React, { useState } from 'react';
import api from '../services/api';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.patch('/user/reset-password', { email, token, code, newPassword, confirmPassword });
      setMessage('Senha resetada com sucesso. Faça login.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erro ao resetar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Reset de senha</h2>
        <form onSubmit={handleSubmit}>
          <FormInput label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormInput label="Token (do email)" value={token} onChange={(e) => setToken(e.target.value)} />
          <FormInput label="Código (6 dígitos)" value={code} onChange={(e) => setCode(e.target.value)} />
          <FormInput label="Nova senha" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <FormInput label="Confirmar nova senha" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Button type="submit" disabled={loading}>Alterar senha</Button>
        </form>
        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}
