import React, { useState } from 'react';
import CreatePost from './CreatePost';
import PostList from './PostList';

function Dashboard({ onLogout }) {
  // Ключ для перезагрузки списка постов после создания нового
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey((prev) => prev + 1); // меняем ключ, чтобы PostList перезагрузился
  };

  return (
    <div className="dashboard">
      <h1>Добро пожаловать!</h1>
      <p className="user-info">Вы вошли!</p>
      <button className="logout-btn" onClick={onLogout}>
        Выйти
      </button>

      <CreatePost onPostCreated={handlePostCreated} />

      {/* Ключ заставляет компонент пересоздаться при изменении */}
      <PostList key={refreshKey} />
    </div>
  );
}

export default Dashboard;