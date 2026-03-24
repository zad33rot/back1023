// src/pages/RegisterPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Register from '../components/Register';

function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Регистрация</h2>
      <Register onSwitchToLogin={() => navigate('/login')} />
    </div>
  );
}

export default RegisterPage;