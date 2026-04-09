export type ChatMessageKind = 'user' | 'system';
export type ChatRoomName = string;
export type ChatNickname = string;

export interface ChatMessage {
  kind: ChatMessageKind;
  id: string;
  room: ChatRoomName;
  author: ChatNickname;
  text: string;
  createdAt: number;
}

export interface ChatJoinPayload { room: ChatRoomName; nickname: ChatNickname; }
export type ChatJoinAck = { ok: true } | { ok: false; error: string };

export interface ChatSendPayload { room: ChatRoomName; text: string; }
export type ChatSendAck = { ok: true } | { ok: false; error: string };

export interface SocketChatData {
  room?: ChatRoomName;
  nickname?: ChatNickname;
}

export const DEFAULT_ROOM = 'public';