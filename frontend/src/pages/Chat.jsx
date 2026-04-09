import { useEffect, useRef, useState } from 'react';
import { useChatSocket } from '../utils/useChatSocket';
import './Chat.css';

export default function ChatPage() {
  const backendUrl = 'http://localhost:3000';
  
  const [myNickname] = useState(localStorage.getItem('username') || '');
  
  const [users, setUsers] = useState([]);
  
  const [activeUser, setActiveUser] = useState(null);
  
  const [text, setText] = useState('');

  const { status, messages, connect, sendMessage } = useChatSocket(backendUrl);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://127.0.0.1:3000/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.map(u => u.username)); 
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      }
    };
    fetchUsers();
  }, []);

  const openChatWith = (friendNickname) => {
    setActiveUser(friendNickname); 
    
    const privateRoomName = [myNickname, friendNickname].sort().join('_');
    
    connect({ room: privateRoomName, nickname: myNickname });
  };

  // Отправка сообщения
  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  const otherUsers = users.filter(u => u !== myNickname);

  const lastSystemMsg = [...messages]
    .reverse() 
    .find(m => m.kind === 'system' && m.text.includes(activeUser));

  const isFriendOnline = lastSystemMsg && lastSystemMsg.text.includes('присоединился');

  return (
    <div className="messenger-container">
      
      <div className="messenger-sidebar">
        <div className="sidebar-header">
          Контакты
        </div>
        <ul className="user-list">
          {otherUsers.map((user) => (
            <li 
              key={user} 
              // Если этот пользователь выбран, вешаем на него CSS-класс 'active', чтобы подсветить
              className={`user-item ${activeUser === user ? 'active' : ''}`}
              // По клику открываем чат с ним
              onClick={() => openChatWith(user)}
            >
              {user}
            </li>
          ))}
        </ul>
      </div>

      <div className="messenger-chat-area">
        
        {!activeUser ? (
          <div className="empty-chat">
            Выберите пользователя слева, чтобы начать общение
          </div>
        ) : (
          <>
            <div className="chat-header">
              <span><b>{activeUser}</b></span>
              
              {status !== 'connected' ? (
                <span style={{ fontSize: '12px', color: 'red' }}>Твоя сеть отключена</span>
              ) : (
                <span style={{ fontSize: '12px', color: isFriendOnline ? 'green' : '#999' }}>
                  {isFriendOnline ? 'В сети' : 'Был(а) недавно'}
                </span>
              )}
            </div>

            <div className="chat-messages">
              {messages.map((m) => (
                <div key={m.id} style={{ marginBottom: '12px' }}>
                  {m.kind === 'system' ? (
                    <div className="msg-system" style={{ textAlign: 'center', color: '#999', fontSize: '12px' }}>{m.text}</div>
                  ) : (
                    <div style={{ textAlign: m.author === myNickname ? 'right' : 'left' }}>
                      <div style={{ 
                        display: 'inline-block', 
                        padding: '10px 15px', 
                        borderRadius: '12px',
                        background: m.author === myNickname ? '#e6f7ff' : '#f1f5f9',
                        border: m.author === myNickname ? '1px solid #bae0ff' : '1px solid #e2e8f0',
                        maxWidth: '70%',
                        textAlign: 'left'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', color: '#555' }}>
                          {m.author}
                        </div>
                        <div>{m.text}</div>
                        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '5px', textAlign: 'right' }}>
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form className="chat-composer" onSubmit={handleSend}>
              <input 
                className="chat-input" 
                value={text} 
                onChange={e => setText(e.target.value)} 
                placeholder={`Написать сообщение...`} 
                disabled={status !== 'connected'} 
              />
              <button type="submit" className="btn-send" disabled={status !== 'connected' || !text.trim()}>
                Отправить
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}