import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

// A partir dessa const root, o ReactDOM irá renderizar a aplicação dentro do elemento com um id
// root.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Em produção, é necessário usar npm run build junto com uma propriedade chamada homepage 
// no package com o valor 'url-da-página-pricipal' ou url de partida.