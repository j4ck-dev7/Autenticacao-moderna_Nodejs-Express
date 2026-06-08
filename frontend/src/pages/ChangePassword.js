import React, { useState } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/user/change-password', { password, newPassword, confirmNewPassword });
      if (res.status === 201) {
        setMessage('Senha alterada com sucesso. Você será desconectado.');
        setTimeout(() => logout(), 1200);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Alterar senha</h2>
        <form onSubmit={handleSubmit}>
          <FormInput label="Senha atual" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormInput label="Nova senha" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <FormInput label="Confirmar nova senha" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
          <Button type="submit" disabled={loading}>Alterar senha</Button>
        </form>
        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}
