import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useChatSocket(backendUrl) {
  const socketRef = useRef(null);
  const activeRoomRef = useRef(null);

  const [status, setStatus] = useState('disconnected'); 
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    activeRoomRef.current = null;
    setStatus('disconnected');
  }, []);

  const connect = useCallback((payload) => {
    setError(null);
    disconnect();

    const socket = io(backendUrl, { 
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;
    activeRoomRef.current = payload.room;
    setStatus('connecting');

    socket.on('connect', () => {
      socket.emit('chat:join', payload, (ack) => {
        if (ack && ack.ok) {
          setStatus('connected');
        } else {
          setStatus('error');
          setError(ack?.error || 'Неизвестная ошибка сервера');
        }
      });
    });

    socket.on('connect_error', (e) => {
      setStatus('error'); 
      setError(`Ошибка сети: ${e.message}`);
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('chat:history', (history) => setMessages(history));
    socket.on('chat:message', (message) => setMessages((prev) => [...prev, message]));

    socket.connect();
  }, [backendUrl, disconnect]);

  const sendMessage = useCallback((text) => {
    const socket = socketRef.current;
    const room = activeRoomRef.current;
    if (!socket || !room) return;

    socket.emit('chat:message', { room, text }, (ack) => {
      if (!ack?.ok) setError(ack?.error || 'Ошибка при отправке');
    });
  }, []);

  useEffect(() => { return () => disconnect(); }, [disconnect]);

  return { status, error, messages, connect, disconnect, sendMessage };
}