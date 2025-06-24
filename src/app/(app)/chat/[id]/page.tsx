
"use client";

import { use, useEffect, useState } from 'react'; // Added use
import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatListItem } from "@/components/chat/chat-list-item";
import { useAuth } from "@/contexts/auth-context";
import { MOCK_CHAT_CONVERSATIONS } from "@/lib/mock-data";
import type { ChatConversation } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareOff } from "lucide-react";

export const dynamic = 'force-dynamic';

// Interface for the resolved params object from the route
interface ResolvedRouteParams {
  id: string;
}

// Props for the ChatPage component.
// The 'params' object itself (which contains the route parameters like 'id') is a Promise.
interface ChatPageProps {
  params: Promise<ResolvedRouteParams>;
}

export default function ChatPage({ params: paramsPromise }: ChatPageProps) {
  const { user } = useAuth();
  
  // React.use() unwraps the promise passed by Next.js for route parameters.
  const routeParams = use(paramsPromise);
  const conversationId = routeParams.id;

  const [conversationsForSidebar, setConversationsForSidebar] = useState<ChatConversation[]>([]);

  useEffect(() => {
    if (user) {
        const filteredConversations = MOCK_CHAT_CONVERSATIONS.filter(convo =>
            convo.participants.some(p => p.userId === user.id)
        ).sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
        setConversationsForSidebar(filteredConversations);
    } else {
        setConversationsForSidebar([]); // Clear if user logs out or is not available
    }
  }, [user]);


  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="font-body">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar for chat list - hidden on smaller screens when a chat is open */}
      <Card className="hidden md:block md:w-1/3 lg:w-1/4 border-r shadow-lg flex flex-col">
        <CardHeader className="sticky top-0 bg-card z-10 border-b">
          <CardTitle className="font-headline text-2xl text-primary">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
          {conversationsForSidebar.length > 0 ? (
              conversationsForSidebar.map((convo) => (
                <ChatListItem 
                  key={convo.id} 
                  conversation={convo} 
                  currentUserId={user.id}
                  isActive={convo.id === conversationId}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageSquareOff className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-body">No conversations yet.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main chat interface */}
      <div className="flex-1">
        <ChatInterface conversationId={conversationId} currentUser={user} />
      </div>
    </div>
  );
}
