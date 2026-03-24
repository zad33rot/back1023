// src/pages/LoginPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    onLogin();
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