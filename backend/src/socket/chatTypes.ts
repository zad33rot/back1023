export type ChatMessageKind = 'user' | 'system';

export interface ChatMessage {
  kind: ChatMessageKind;
  id: string;
  room: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface ChatEncryptedText {
  iv: string;
  ciphertext: string;
}

export interface SocketChatData {
  room?: string;
  nickname?: string;
  sharedKey?: Buffer;
}

export const DEFAULT_ROOM = 'public';