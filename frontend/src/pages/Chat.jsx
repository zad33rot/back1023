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
        const res = await fetch('http://localhost:3000/api/users');
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
        <div className="sidebar-header">Контакты</div>
        <ul className="user-list">
          {otherUsers.map((user) => (
            <li 
              key={user} 
              className={`user-item ${activeUser === user ? 'active' : ''}`}
              onClick={() => openChatWith(user)}
            >
              {user}
            </li>
          ))}
        </ul>
      </div>

      <div className="messenger-chat-area">
        {!activeUser ? (
          <div className="empty-chat">Выберите пользователя, чтобы начать общение</div>
        ) : (
          <>
            <div className="chat-header">
              <span><b>{activeUser}</b></span>
              {status !== 'connected' ? (
                <span className="status-offline">Твоя сеть отключена</span>
              ) : (
                <span className={isFriendOnline ? "status-online" : "status-last-seen"}>
                  {isFriendOnline ? 'В сети' : 'Был(а) недавно'}
                </span>
              )}
            </div>

            <div className="chat-messages">
              {messages.map((m) => (
                <div key={m.id} className="msg-wrapper">
                  {m.kind === 'system' ? (
                    <div className="msg-system">{m.text}</div>
                  ) : (
                    <div style={{ textAlign: m.author === myNickname ? 'right' : 'left' }}>
                      <div className={`msg-bubble ${m.author === myNickname ? 'msg-mine' : 'msg-other'}`}>
                        <div className="msg-author">{m.author}</div>
                        <div>{m.text}</div>
                        <div className="msg-time">
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
                placeholder="Написать сообщение..." 
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