
import type { User, Property, ChatConversation, ChatMessage, Interest } from "@/types";

// --- Generic LocalStorage Helper ---
function loadFromLocalStorage<T>(key: string, defaultValue: T[]): T[] {
  if (typeof window !== 'undefined') {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue);
        // Basic check to ensure it's an array, could be more robust
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        // Fallback to default if parsing fails
      }
    }
  }
  return [...defaultValue]; 
}

function saveToLocalStorage<T>(key: string, value: T[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}


const DEFAULT_MOCK_USERS: User[] = [
  { id: "owner1", name: "Urdhva Sugganaboyina", email: "urdhva.suggana@gmail.com", role: "owner", phoneNumber: "7675801718", profileImageUrl: undefined },
  { id: "tenant1", name: "Rohan Verma", email: "rohan.tenant@example.com", role: "tenant", profileImageUrl: undefined },
  { id: "owner2", name: "Sunita Reddy", email: "sunita.owner@example.com", role: "owner", profileImageUrl: undefined },
  { id: "tenant2", name: "Amit Patel", email: "amit.tenant@example.com", role: "tenant", profileImageUrl: undefined },
];
const MOCK_USERS_STORAGE_KEY = 'renteasy_mock_users_list';
export let MOCK_USERS: User[] = loadFromLocalStorage<User>(MOCK_USERS_STORAGE_KEY, DEFAULT_MOCK_USERS);
export function saveMockUsers() {
  saveToLocalStorage<User>(MOCK_USERS_STORAGE_KEY, MOCK_USERS);
}

export function updateUserProfileImage(userId: string, imageUrl: string): User | null {
  const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    
    const updatedUser = { ...MOCK_USERS[userIndex], profileImageUrl: imageUrl };
    MOCK_USERS[userIndex] = updatedUser;
    saveMockUsers();
    return updatedUser;
  }
  return null;
}


const DEFAULT_MOCK_PROPERTIES: Property[] = []; 
const MOCK_PROPERTIES_STORAGE_KEY = 'renteasy_mock_properties_list';
export let MOCK_PROPERTIES: Property[] = loadFromLocalStorage<Property>(MOCK_PROPERTIES_STORAGE_KEY, DEFAULT_MOCK_PROPERTIES);
export function saveMockProperties() {
  saveToLocalStorage<Property>(MOCK_PROPERTIES_STORAGE_KEY, MOCK_PROPERTIES);
}


const DEFAULT_MOCK_CHAT_CONVERSATIONS: ChatConversation[] = []; 
const MOCK_CHAT_CONVERSATIONS_STORAGE_KEY = 'renteasy_mock_chat_conversations_list';
export let MOCK_CHAT_CONVERSATIONS: ChatConversation[] = loadFromLocalStorage<ChatConversation>(MOCK_CHAT_CONVERSATIONS_STORAGE_KEY, DEFAULT_MOCK_CHAT_CONVERSATIONS);
export function saveMockChatConversations() {
  saveToLocalStorage<ChatConversation>(MOCK_CHAT_CONVERSATIONS_STORAGE_KEY, MOCK_CHAT_CONVERSATIONS);
}


const DEFAULT_MOCK_INTERESTS: Interest[] = []; // No default interests
const MOCK_INTERESTS_STORAGE_KEY = 'renteasy_mock_interests_list';
export let MOCK_INTERESTS: Interest[] = loadFromLocalStorage<Interest>(MOCK_INTERESTS_STORAGE_KEY, DEFAULT_MOCK_INTERESTS);
export function saveMockInterests() {
  saveToLocalStorage<Interest>(MOCK_INTERESTS_STORAGE_KEY, MOCK_INTERESTS);
}


// Functions to modify mock data (simulating backend)
export const addProperty = (property: Property) => {
  MOCK_PROPERTIES.push(property);
  saveMockProperties();
};

export const addChatMessage = (chatId: string, message: ChatMessage): ChatConversation | undefined => {
  const conversationIndex = MOCK_CHAT_CONVERSATIONS.findIndex(c => c.id === chatId);
  if (conversationIndex > -1) {
    const originalConversation = MOCK_CHAT_CONVERSATIONS[conversationIndex];
    
    if (originalConversation.messages.some(m => m.id === message.id)) {
      console.log("Message already exists, not adding:", message.id);
      return originalConversation; 
    }
    
    const updatedMessages = [...originalConversation.messages, message];
    const updatedConversation: ChatConversation = {
      ...originalConversation,
      messages: updatedMessages,
      lastMessage: message, 
    };
    
    const newConversations = MOCK_CHAT_CONVERSATIONS.map((convo, index) => 
      index === conversationIndex ? updatedConversation : convo
    );

     const finalConversations = newConversations.sort((a, b) => {
        if (a.id === updatedConversation.id && b.id !== updatedConversation.id) return -1;
        if (b.id === updatedConversation.id && a.id !== updatedConversation.id) return 1;
        return (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0);
    });
    
    MOCK_CHAT_CONVERSATIONS.length = 0;
    Array.prototype.push.apply(MOCK_CHAT_CONVERSATIONS, finalConversations);

    saveMockChatConversations();
    return updatedConversation;
  }
  console.warn("Conversation not found for chatId:", chatId);
  return undefined;
};


export const addInterest = (interest: Interest) => {
    MOCK_INTERESTS.push(interest);
    saveMockInterests();
};

export const getOrCreateChatConversation = (
  propertyId: string,
  tenantId: string,
  propertyName: string,
  tenantName: string,
  ownerId: string,
  ownerName: string
): ChatConversation => {
  const chatId = `${propertyId}-${tenantId}`;
  const existingConversationIndex = MOCK_CHAT_CONVERSATIONS.findIndex(c => c.id === chatId);
  let conversationToReturn: ChatConversation;

  if (existingConversationIndex !== -1) {
    // Conversation exists
    conversationToReturn = MOCK_CHAT_CONVERSATIONS[existingConversationIndex];

    // If it's not already at the top, move it
    if (existingConversationIndex > 0) {
      MOCK_CHAT_CONVERSATIONS.splice(existingConversationIndex, 1); // Remove from current position
      MOCK_CHAT_CONVERSATIONS.unshift(conversationToReturn); // Add to the beginning
      saveMockChatConversations(); // Save because order changed
    }
    // If it was already at index 0, no change in order, no save needed here for order.
  } else {
    // Conversation does not exist, create a new one
    conversationToReturn = {
      id: chatId,
      propertyId,
      propertyName,
      tenantId,
      tenantName,
      ownerId,
      ownerName,
      participants: [
        { userId: ownerId, name: ownerName, profileImageUrl: MOCK_USERS.find(u => u.id === ownerId)?.profileImageUrl },
        { userId: tenantId, name: tenantName, profileImageUrl: MOCK_USERS.find(u => u.id === tenantId)?.profileImageUrl },
      ],
      messages: [],
      // lastMessage will be updated when a message is added
    };
    MOCK_CHAT_CONVERSATIONS.unshift(conversationToReturn); // Add to the beginning
    saveMockChatConversations(); // Save because new conversation added
  }
  return conversationToReturn;
};
