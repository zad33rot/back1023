import type { Server, Socket } from 'socket.io';
import { DEFAULT_ROOM } from './chatTypes';
import type { ChatJoinAck, ChatJoinPayload, ChatSendAck, ChatSendPayload, SocketChatData } from './chatTypes';
import { addSystemMessage, addUserMessage, getRoomHistory } from './chatService';

export function registerChatHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const socketData = socket.data as SocketChatData;
    if (!socketData.room) socketData.room = DEFAULT_ROOM;

    socket.on('chat:join', async (payload: ChatJoinPayload, callback: (ack: ChatJoinAck) => void) => {
      try {
        const room = payload?.room?.toString?.() ?? '';
        const nickname = payload?.nickname?.toString?.() ?? '';

        if (!room.trim() || !nickname.trim()) return callback({ ok: false, error: 'Заполни все поля' });

        if (socketData.room && socketData.room !== room) socket.leave(socketData.room);

        socketData.room = room;
        socketData.nickname = nickname;
        socket.join(room);

        const history = await getRoomHistory(room);
        socket.emit('chat:history', history);

        const systemMessage = await addSystemMessage({ room, text: `${nickname} присоединился(лась)` });
        io.to(room).emit('chat:message', systemMessage);

        callback({ ok: true });
      } catch (e) {
        callback({ ok: false, error: 'Ошибка входа' });
      }
    });

    socket.on('chat:message', async (payload: ChatSendPayload, callback: (ack: ChatSendAck) => void) => {
      try {
        const room = payload?.room?.toString?.() ?? '';
        const text = payload?.text?.toString?.() ?? '';

        if (!socketData.nickname) return callback({ ok: false, error: 'Сначала выполните join' });

        const message = await addUserMessage({ room, nickname: socketData.nickname, text });
        io.to(room).emit('chat:message', message);
        
        callback({ ok: true });
      } catch (e) {
        callback({ ok: false, error: e instanceof Error ? e.message : 'Ошибка' });
      }
    });

    socket.on('disconnect', async () => {
      if (socketData.room && socketData.nickname) {
        const systemMessage = await addSystemMessage({ room: socketData.room, text: `${socketData.nickname} вышел(ла)` });
        io.to(socketData.room).emit('chat:message', systemMessage);
      }
    });
  });
}