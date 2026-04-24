import { useEffect, useRef, useState } from 'react';
import { useChatSocket } from '../utils/useChatSocket.jsx';
import './Chat.css';

export default function ChatPage() {
  const backendUrl = 'http://localhost:3000';
  const [myNickname] = useState(localStorage.getItem('username') || '');
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState('');
  
  const { status, messages, connect, sendMessage, fetchHistory, disconnect } = useChatSocket(backendUrl);
  const endRef = useRef(null);

  // Подключаемся 1 раз при входе
  useEffect(() => {
    if (myNickname) connect({ nickname: myNickname });
    return () => disconnect();
  }, [myNickname, connect, disconnect]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/users');
        if (res.ok) setUsers((await res.json()).map(u => u.username)); 
      } catch (e) { console.error(e); }
    };
    fetchUsers();
  }, []);

  const openChatWith = (friendNickname) => {
    setActiveUser(friendNickname); 
    const privateRoomName = [myNickname, friendNickname].sort().join('_');
    fetchHistory(privateRoomName);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUser) return;
    const privateRoomName = [myNickname, activeUser].sort().join('_');
    sendMessage(text.trim(), privateRoomName);
    setText('');
  };

  const currentRoom = activeUser ? [myNickname, activeUser].sort().join('_') : null;
  const currentMessages = messages.filter(m => m.room === currentRoom || m.room === 'global');

  const lastSystemMsg = [...currentMessages].reverse().find(m => m.kind === 'system' && m.text.includes(activeUser));
  const isFriendOnline = lastSystemMsg && lastSystemMsg.text.includes('вошел');

  // ========================================================
  // МАГИЯ UI: Делаем контакты "Умными" и реагирующими на сообщения
  // ========================================================
  const otherUsers = users.filter(u => u !== myNickname);
  
  const smartContacts = otherUsers.map(user => {
    const roomName = [myNickname, user].sort().join('_');
    // Ищем сообщения с этим пользователем в нашем глобальном пуле
    const userMsgs = messages.filter(m => m.room === roomName && m.kind === 'user');
    const lastMsg = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1] : null;
    
    return {
      name: user,
      lastMsgTime: lastMsg ? lastMsg.createdAt : 0, // Время последнего сообщения
      // Считаем сообщение непрочитанным, если оно пришло от друга, а мы сейчас в другом чате
      hasUnread: lastMsg && lastMsg.author === user && activeUser !== user
    };
  }).sort((a, b) => b.lastMsgTime - a.lastMsgTime); // Сортируем: свежие диалоги прыгают наверх!
  // ========================================================

  return (
    <div className="messenger-container">
      <div className="messenger-sidebar">
        <div className="sidebar-header">Контакты</div>
        <ul className="user-list">
          {smartContacts.map((contact) => (
            <li 
              key={contact.name} 
              className={`user-item ${activeUser === contact.name ? 'active' : ''}`} 
              onClick={() => openChatWith(contact.name)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span>{contact.name}</span>
                
                {/* Индикатор нового сообщения */}
                {contact.hasUnread && (
                  <span style={{
                    background: '#e74c3c', color: 'white', fontSize: '10px', 
                    padding: '3px 7px', borderRadius: '10px', fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)'
                  }}>
                    Новое
                  </span>
                )}
              </div>
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
              {status !== 'connected' ? <span className="status-offline">Отключено</span> : 
              <span className={isFriendOnline ? "status-online" : "status-last-seen"}>{isFriendOnline ? 'В сети' : 'Офлайн'}</span>}
            </div>

            <div className="chat-messages">
              {currentMessages.map((m) => (
                <div key={m.id} className="msg-wrapper">
                  {m.kind === 'system' ? <div className="msg-system">{m.text}</div> : (
                    <div style={{ textAlign: m.author === myNickname ? 'right' : 'left' }}>
                      <div className={`msg-bubble ${m.author === myNickname ? 'msg-mine' : 'msg-other'}`}>
                        <div className="msg-author">{m.author}</div>
                        <div>{m.text}</div>
                        <div className="msg-time">{new Date(m.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form className="chat-composer" onSubmit={handleSend}>
              <input className="chat-input" value={text} onChange={e => setText(e.target.value)} placeholder="Написать..." disabled={status !== 'connected'} />
              <button type="submit" className="btn-send" disabled={status !== 'connected' || !text.trim()}>Отправить</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}