import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', { 
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');

      localStorage.setItem('accessToken', data.accessToken);
      
      const decoded = jwtDecode(data.accessToken);
      
      const userData = decoded.data || decoded;
      
      localStorage.setItem('userId', userData.id);

      const realUsername = userData.username || email.split('@')[0];
      
      localStorage.setItem('username', realUsername);
      onLogin(realUsername); 

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-container">
      {error && <p className="error-message" style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Войти</button>
      </form>
    </div>
  );
}

export default Login;