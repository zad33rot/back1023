import { randomUUID } from 'crypto';
import { prisma } from '../db';
import { encryptForDb, decryptFromDb } from './chatCrypto';

export async function getRoomHistory(room: string) {
  const messages = await prisma.chatMessage.findMany({
    where: { room },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });
  
  return messages.map(msg => ({
    ...msg,
    text: decryptFromDb(msg.text),
    kind: msg.kind as 'user' | 'system',
    createdAt: msg.createdAt.getTime()
  }));
}

export async function addUserMessage(params: { room: string; nickname: string; text: string }) {
  const encrypted = encryptForDb(params.text);
  const msg = await prisma.chatMessage.create({
    data: { 
      id: randomUUID(), 
      kind: 'user', 
      room: params.room, 
      author: params.nickname, 
      text: encrypted 
    },
  });
  return { 
    ...msg, 
    text: params.text, 
    kind: 'user' as const, 
    createdAt: msg.createdAt.getTime() 
  };
}

export async function addSystemMessage(params: { room: string; text: string }) {
  const msg = await prisma.chatMessage.create({
    data: { 
      id: randomUUID(), 
      kind: 'system', 
      room: params.room, 
      author: 'system', 
      text: params.text 
    },
  });
  return { 
    ...msg, 
    kind: 'system' as const, 
    createdAt: msg.createdAt.getTime() 
  };
}