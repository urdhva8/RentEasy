
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
  return [...defaultValue]; // Return a copy of the default to prevent mutation of const
}

function saveToLocalStorage<T>(key: string, value: T[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// --- Users ---
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
    MOCK_USERS[userIndex].profileImageUrl = imageUrl;
    saveMockUsers();
    return MOCK_USERS[userIndex];
  }
  return null;
}

// --- Properties ---
const DEFAULT_MOCK_PROPERTIES: Property[] = []; // Ensures no default properties are loaded on a fresh start
const MOCK_PROPERTIES_STORAGE_KEY = 'renteasy_mock_properties_list';
export let MOCK_PROPERTIES: Property[] = loadFromLocalStorage<Property>(MOCK_PROPERTIES_STORAGE_KEY, DEFAULT_MOCK_PROPERTIES);
export function saveMockProperties() {
  saveToLocalStorage<Property>(MOCK_PROPERTIES_STORAGE_KEY, MOCK_PROPERTIES);
}

// --- Chat Conversations ---
const DEFAULT_MOCK_CHAT_CONVERSATIONS: ChatConversation[] = []; // No default conversations
const MOCK_CHAT_CONVERSATIONS_STORAGE_KEY = 'renteasy_mock_chat_conversations_list';
export let MOCK_CHAT_CONVERSATIONS: ChatConversation[] = loadFromLocalStorage<ChatConversation>(MOCK_CHAT_CONVERSATIONS_STORAGE_KEY, DEFAULT_MOCK_CHAT_CONVERSATIONS);
export function saveMockChatConversations() {
  saveToLocalStorage<ChatConversation>(MOCK_CHAT_CONVERSATIONS_STORAGE_KEY, MOCK_CHAT_CONVERSATIONS);
}

// --- Interests ---
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
    
    // Check if message already exists by ID
    if (originalConversation.messages.some(m => m.id === message.id)) {
      console.log("Message already exists, not adding:", message.id);
      return originalConversation; // Return original if message already there
    }
    
    // Create new messages array and new conversation object
    const updatedMessages = [...originalConversation.messages, message];
    const updatedConversation: ChatConversation = {
      ...originalConversation,
      messages: updatedMessages,
      lastMessage: message, // Update last message
    };
    
    // Update the MOCK_CHAT_CONVERSATIONS array immutably for the specific item
    const newConversations = MOCK_CHAT_CONVERSATIONS.map((convo, index) => 
      index === conversationIndex ? updatedConversation : convo
    );

    // Sort to bring the updated conversation to the top
     const finalConversations = newConversations.sort((a, b) => {
        if (a.id === updatedConversation.id && b.id !== updatedConversation.id) return -1;
        if (b.id === updatedConversation.id && a.id !== updatedConversation.id) return 1;
        return (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0);
    });
    
    MOCK_CHAT_CONVERSATIONS.length = 0;
    Array.prototype.push.apply(MOCK_CHAT_CONVERSATIONS, finalConversations);

    saveMockChatConversations();
    return updatedConversation; // Return the new object
  }
  console.warn("Conversation not found for chatId:", chatId);
  return undefined;
};


export const addInterest = (interest: Interest) => {
    MOCK_INTERESTS.push(interest);
    saveMockInterests();
};

export const getOrCreateChatConversation = (propertyId: string, tenantId: string, propertyName: string, tenantName: string, ownerId: string, ownerName: string): ChatConversation => {
    const chatId = `${propertyId}-${tenantId}`;
    let conversation = MOCK_CHAT_CONVERSATIONS.find(c => c.id === chatId);
    let createdNew = false;
    if (!conversation) {
        conversation = {
            id: chatId,
            propertyId,
            propertyName,
            tenantId,
            tenantName,
            ownerId,
            ownerName,
            participants: [
                { userId: ownerId, name: ownerName, profileImageUrl: MOCK_USERS.find(u=>u.id === ownerId)?.profileImageUrl },
                { userId: tenantId, name: tenantName, profileImageUrl: MOCK_USERS.find(u=>u.id === tenantId)?.profileImageUrl },
            ],
            messages: [],
            // lastMessage will be updated when a message is added
        };
        MOCK_CHAT_CONVERSATIONS.unshift(conversation); // Add to the beginning for recent chats
        createdNew = true;
    }
    // If an existing conversation is found, move it to the top to signify it's active / recent
    else if (MOCK_CHAT_CONVERSATIONS[0].id !== chatId) {
        const tempConversations = MOCK_CHAT_CONVERSATIONS.filter(c => c.id !== chatId);
        tempConversations.unshift(conversation);
        MOCK_CHAT_CONVERSATIONS.length = 0; // Clear original array
        Array.prototype.push.apply(MOCK_CHAT_CONVERSATIONS, tempConversations); // Repopulate
    }

    if (createdNew || MOCK_CHAT_CONVERSATIONS[0].id !== chatId) { // also save if order changed
      saveMockChatConversations();
    }
    return conversation;
};
