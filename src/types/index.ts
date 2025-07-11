
export type UserRole = "tenant" | "owner";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface Property {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string; 
  address: string;
  price: number;
  description: string;
  images: string[];
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Interest {
  id:string;
  propertyId: string;
  tenantId: string;
  tenantName: string;
  timestamp: number;
  message?: string;
}

export interface ChatConversationParticipant {
  userId: string;
  name: string;
  profileImageUrl?: string;
}

export interface ChatConversation {
  id: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  ownerId: string;
  ownerName: string;
  participants: ChatConversationParticipant[];
  lastMessage?: ChatMessage;
  messages: ChatMessage[];
}
