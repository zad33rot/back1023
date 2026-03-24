// src/pages/HomePage.jsx
import React, { useState } from 'react';
import PostList from '../components/PostList';
import CreatePost from '../components/CreatePost';

function HomePage({ isLoggedIn }) {
  // Состояние для обновления списка после создания поста
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1); // меняем ключ, чтобы PostList перезагрузился
  };

  return (
    <div>
      <h1>Главная страница</h1>
      {isLoggedIn && <CreatePost onPostCreated={handlePostCreated} />}
      {/* Ключ заставляет PostList перерисоваться */}
      <PostList key={refreshKey} />
    </div>
  );
}

export default HomePage;