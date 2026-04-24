import type { Server, Socket } from 'socket.io';
import { createDhServerHandshake, encryptText, decryptText } from './chatCrypto';
import { addSystemMessage, addUserMessage, getRoomHistory } from './chatService';
import type { SocketChatData } from './chatTypes';

export function registerChatHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const socketData = socket.data as SocketChatData;

    socket.on('chat:join', async (payload: any, callback: any) => {
      try {
        const { nickname, clientPublicKey } = payload || {};
        if (!nickname || !clientPublicKey) return callback({ ok: false, error: 'Заполни данные' });

        const handshake = createDhServerHandshake(clientPublicKey);
        socketData.nickname = nickname;
        socketData.sharedKey = handshake.sharedKey;
        
        socket.join(nickname);

        callback({ ok: true, serverPublicKey: handshake.serverPublicKey });

        const sysMsg = await addSystemMessage({ room: 'global', text: `${nickname} вошел(ла) в сеть` });
        io.emit('chat:message', sysMsg); 
      } catch (e) {
        callback({ ok: false, error: 'Ошибка установки защищенного канала' });
      }
    });

    socket.on('chat:get_history', async (payload: any, callback: any) => {
      if (!socketData.sharedKey || !socketData.nickname) return;
      try {
        const history = await getRoomHistory(payload.room);
        const encryptedHistory = history.map(m => ({
          ...m,
          text: m.kind === 'user' ? encryptText(m.text, socketData.sharedKey!) : m.text
        }));
        callback({ ok: true, history: encryptedHistory });
      } catch (e) {
        callback({ ok: false, error: 'Ошибка загрузки истории' });
      }
    });

    socket.on('chat:message', async (payload: any, callback: any) => {
      if (!socketData.sharedKey || !socketData.nickname) return callback?.({ ok: false });
      
      try {
        const { room, encrypted } = payload; 
        const decryptedText = decryptText(encrypted, socketData.sharedKey);
        
        const message = await addUserMessage({ 
          room: String(room),
          nickname: socketData.nickname, 
          text: decryptedText 
        });

        const participants: string[] = String(room).split('_'); 
        
        participants.forEach((p: string) => {
          const socketIds = io.sockets.adapter.rooms.get(p); 
          if (socketIds) {
            socketIds.forEach((id: string) => {
              const s = io.sockets.sockets.get(id);
              const key = (s?.data as SocketChatData)?.sharedKey;
              if (key) {
                s?.emit('chat:message', { ...message, text: encryptText(decryptedText, key) });
              }
            });
          }
        });
        callback?.({ ok: true });
      } catch (e) {
        callback?.({ ok: false, error: 'Ошибка отправки сообщения' });
      }
    });

    socket.on('disconnect', async () => {
      if (socketData.nickname) {
        const sysMsg = await addSystemMessage({ room: 'global', text: `${socketData.nickname} вышел(ла)` });
        io.emit('chat:message', sysMsg);
      }
    });
  });
}