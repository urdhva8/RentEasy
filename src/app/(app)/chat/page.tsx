
"use client";

import { useAuth } from "@/contexts/auth-context";
import { MOCK_CHAT_CONVERSATIONS } from "@/lib/mock-data";
import type { ChatConversation } from "@/types";
import { ChatListItem } from "@/components/chat/chat-list-item";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareOff } from "lucide-react";

export default function ChatListPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Filter conversations where the current user is a participant
      const userConversations = MOCK_CHAT_CONVERSATIONS.filter(convo => 
        convo.participants.some(p => p.userId === user.id)
      ).sort((a,b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)); // Sort by most recent
      setConversations(userConversations);
    }
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) return null; // Should be handled by AppLayout

  return (
    <div className="flex h-full">
      <Card className="w-full md:w-1/3 lg:w-1/4 border-r shadow-lg flex flex-col">
        <CardHeader className="sticky top-0 bg-card z-10 border-b">
          <CardTitle className="font-headline text-2xl text-primary">Your Conversations</CardTitle>
          <CardDescription className="font-body">Select a chat to view messages.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {conversations.length > 0 ? (
              conversations.map((convo) => (
                <ChatListItem 
                  key={convo.id} 
                  conversation={convo} 
                  currentUserId={user.id}
                  isActive={false} // No active chat concept on this page currently
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageSquareOff className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-body">No conversations yet.</p>
                <p className="text-sm text-muted-foreground font-body">Start a new chat by contacting an owner about a property.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-muted/30 p-8 text-center rounded-r-lg">
        <MessageSquareOff className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-headline text-foreground">Select a conversation</h2>
        <p className="text-muted-foreground font-body">Choose a chat from the list on the left to see messages here.</p>
      </div>
    </div>
  );
}
