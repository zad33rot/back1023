// src/pages/LoginPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // <--- Вот эта строка решает ошибку!
import Login from '../components/auth/Login';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const handleLoginSuccess = (name) => {
    onLogin(name); 
    navigate('/');
  };

  return (
    <div>
      <h2>Вход</h2>
      <Login onLogin={handleLoginSuccess} />
    </div>
  );
}

export default LoginPage;