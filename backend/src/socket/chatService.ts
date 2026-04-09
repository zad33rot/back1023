import { randomUUID } from 'crypto';
import { prisma } from '../db';
import type { ChatMessage, ChatRoomName, ChatNickname } from './chatTypes';

const MAX_TEXT_LENGTH = 500;

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

// Получить историю комнаты из БД
export async function getRoomHistory(room: ChatRoomName): Promise<ChatMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { room },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });
  
  // Prisma возвращает дату как объект Date, а нам нужно число (миллисекунды) как у учителя
  return messages.map(msg => ({
    ...msg,
    kind: msg.kind as 'user' | 'system',
    createdAt: msg.createdAt.getTime()
  }));
}

export async function addUserMessage(params: { room: ChatRoomName; nickname: ChatNickname; text: string }): Promise<ChatMessage> {
  const text = normalizeText(params.text);
  if (!text) throw new Error('Сообщение не может быть пустым');
  if (text.length > MAX_TEXT_LENGTH) throw new Error('Сообщение слишком длинное');

  const msg = await prisma.chatMessage.create({
    data: { id: randomUUID(), kind: 'user', room: params.room, author: params.nickname, text },
  });
  return { ...msg, kind: msg.kind as 'user', createdAt: msg.createdAt.getTime() };
}

export async function addSystemMessage(params: { room: ChatRoomName; text: string }): Promise<ChatMessage> {
  const text = normalizeText(params.text);
  const msg = await prisma.chatMessage.create({
    data: { id: randomUUID(), kind: 'system', room: params.room, author: 'system', text },
  });
  return { ...msg, kind: msg.kind as 'system', createdAt: msg.createdAt.getTime() };
}