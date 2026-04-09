// src/components/PostList.jsx
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/refreshAccesToken.jsx'

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Для редактирования
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Получаем id текущего пользователя из localStorage
  const currentUserId = localStorage.getItem('userId');

  // Загружаем посты при монтировании
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
        setLoading(true);
        // обычный fetch, без токена
        const res = await fetch('/api/posts/getPost');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
        setPosts(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

  // Удаление поста
  const handleDelete = async (postId) => {
    if (!window.confirm('Удалить пост?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetchWithAuth(`/api/posts/post/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка удаления');
      }
      // Удаляем пост из локального списка
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Начать редактирование
  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content || '');
  };

  // Отмена редактирования
  const cancelEdit = () => {
    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
  };

  // Сохранить изменения
  const saveEdit = async (postId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetchWithAuth(`/api/posts/post/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка обновления');
      }
      // Обновляем пост в списке
      setPosts(posts.map(p => (p.id === postId ? data : p)));
      cancelEdit();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Загрузка постов...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="post-list">
      <h2>Все посты</h2>
      {posts.length === 0 ? (
        <p>Пока нет постов. Будь первым!</p>
      ) : (
        posts.map(post => (
          <div key={post.id} className="post-card">
            {editingPostId === post.id ? (
              // Режим редактирования
              <div className="edit-form">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Заголовок"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Содержание"
                  rows="3"
                />
                <div className="edit-actions">
                  <button onClick={() => saveEdit(post.id)}>Сохранить</button>
                  <button onClick={cancelEdit}>Отмена</button>
                </div>
              </div>
            ) : (
              // Обычный просмотр
              <>
                <h3>{post.title}</h3>
                <p className="post-meta">
                  Автор: {post.author?.username} | {new Date(post.createdAt).toLocaleString()}
                </p>
                <p className="post-content">{post.content}</p>
                {/* Кнопки редактирования/удаления видны только автору */}
                {currentUserId && Number(currentUserId) === post.authorId && (
                  <div className="post-actions">
                    <button onClick={() => startEdit(post)}>Редактировать</button>
                    <button onClick={() => handleDelete(post.id)}>Удалить</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default PostList;