// src/components/CreatePost.jsx
import React, { useState } from 'react';
import { fetchWithAuth } from '../utils/refreshAccesToken.jsx'

function CreatePost({ onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetchWithAuth('/api/posts/post', { // путь из твоего бэка
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось создать пост');
      }

      setSuccess('Пост создан!');
      setTitle('');
      setContent('');
      if (onPostCreated) onPostCreated(); // сообщаем родителю, чтобы обновить список
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form">
      <h3>Создать новый пост</h3>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Заголовок:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Содержание:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Создание...' : 'Создать пост'}
        </button>
      </form>
    </div>
  );
}

export default CreatePost;