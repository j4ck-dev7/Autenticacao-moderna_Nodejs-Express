import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Main() {
  const { logout } = useAuth();

  return (
    <div className="page">
      <div className="card">
        <h2>Usuário logado com sucesso</h2>
        <p>Bem-vindo(a)! Esta é a página principal simples.</p>
        <div style={{ marginTop: 12 }}>
          <Link to="/change-password">Trocar senha</Link>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="button" onClick={() => logout()}>Logout</button>
        </div>
      </div>
    </div>
  );
}
