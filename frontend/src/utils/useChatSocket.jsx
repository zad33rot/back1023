import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { createDhClientHandshake, createSharedKey, encryptText, decryptText } from './chatCrypto';

export function useChatSocket(backendUrl) {
  const socketRef = useRef(null);
  const sharedKeyRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('disconnected');

  const disconnect = useCallback(() => {
    if (socketRef.current) socketRef.current.disconnect();
    socketRef.current = null;
    sharedKeyRef.current = null;
    setStatus('disconnected');
  }, []);

  const connect = useCallback(({ nickname }) => {
    disconnect();
    const socket = io(backendUrl, { transports: ['websocket'] });
    socketRef.current = socket;
    setStatus('connecting');

    const { privateKey, publicKey } = createDhClientHandshake();

    socket.on('connect', () => {
      socket.emit('chat:join', { nickname, clientPublicKey: publicKey }, async (ack) => {
        if (ack && ack.ok) {
          sharedKeyRef.current = await createSharedKey(ack.serverPublicKey, privateKey);
          setStatus('connected');
        } else {
          disconnect();
        }
      });
    });

    socket.on('chat:message', async (m) => {
      if (!sharedKeyRef.current) return;
      const text = m.kind === 'user' ? await decryptText(m.text, sharedKeyRef.current) : m.text;
      setMessages(prev => {
        if (prev.find(x => x.id === m.id)) return prev;
        return [...prev, { ...m, text }];
      });
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    socket.connect();
  }, [backendUrl, disconnect]);

  const fetchHistory = useCallback((room) => {
    if (!socketRef.current || !sharedKeyRef.current) return;
    socketRef.current.emit('chat:get_history', { room }, async (res) => {
      if (res && res.ok) {
        const dec = await Promise.all(res.history.map(async m => ({
          ...m, text: m.kind === 'user' ? await decryptText(m.text, sharedKeyRef.current) : m.text
        })));
        setMessages(prev => {
          const map = new Map();
          prev.forEach(m => map.set(m.id, m));
          dec.forEach(m => map.set(m.id, m));
          return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
        });
      }
    });
  }, []);

  const sendMessage = useCallback(async (text, targetRoom) => {
    if (!socketRef.current || !sharedKeyRef.current) return;
    try {
      const encrypted = await encryptText(text, sharedKeyRef.current);
      socketRef.current.emit('chat:message', { room: targetRoom, encrypted });
    } catch (e) {
      console.error("Ошибка при отправке:", e);
    }
  }, []);

  return { status, messages, connect, sendMessage, fetchHistory, disconnect };
}