
export type UserRole = "tenant" | "owner";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  profileImageUrl?: string; // Added for profile image
}

export interface Property {
  id: string;
  ownerId: string;
  ownerName: string; // Added for display
  name: string; 
  address: string;
  price: number;
  description: string;
  images: string[]; // URLs of images or base64 strings for new uploads
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number; // Use number for Date.now()
}

export interface Interest {
  id:string;
  propertyId: string;
  tenantId: string;
  tenantName: string;
  timestamp: number;
  message?: string;
}

export interface ChatConversation {
  id: string; // propertyId-tenantId
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  ownerId: string;
  ownerName: string;
  participants: { userId: string, name: string }[];
  lastMessage?: ChatMessage;
  messages: ChatMessage[];
}
