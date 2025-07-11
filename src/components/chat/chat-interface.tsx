
"use client";

import type { ChatConversation, ChatMessage, User } from "@/types";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, UserCircle2, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { addChatMessage, MOCK_CHAT_CONVERSATIONS } from "@/lib/mock-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  conversationId: string;
  currentUser: User;
}

export function ChatInterface({ conversationId, currentUser }: ChatInterfaceProps) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const foundConversation = MOCK_CHAT_CONVERSATIONS.find(c => c.id === conversationId);
    setConversation(foundConversation || null);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !conversation) return;

    const message: ChatMessage = {
      id: String(Date.now()) + currentUser.id.slice(0,5),
      chatId: conversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: newMessage,
      timestamp: Date.now(),
    };
    
    const updatedConv = addChatMessage(conversation.id, message);
    if (updatedConv) {
        setConversation(updatedConv);
    }
    
    setNewMessage("");
  };

  if (!conversation) {
    return <div className="text-center p-8 font-body">Conversation not found or loading...</div>;
  }

  const otherParticipant = conversation.participants.find(p => p.userId !== currentUser.id);

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-xl overflow-hidden border">
      <header className="p-4 border-b flex items-center space-x-3 bg-muted/50">
        <Link href="/chat" className="md:hidden mr-2">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
            </Button>
        </Link>
        <Avatar>
          <AvatarImage src={otherParticipant?.profileImageUrl || `https://placehold.co/100x100.png?text=${otherParticipant?.name.substring(0,2)}`} alt={otherParticipant?.name} />
          <AvatarFallback>{otherParticipant?.name.substring(0,2).toUpperCase() || <UserCircle2 />}</AvatarFallback>
        </Avatar>
        <div>
            <h2 className="text-xl font-headline font-semibold">{otherParticipant?.name || "Unknown User"}</h2>
            <p className="text-xs text-muted-foreground font-body">Regarding: {conversation.propertyName}</p>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 space-y-4">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex mb-4 max-w-[75%]",
              msg.senderId === currentUser.id ? "ml-auto justify-end" : "mr-auto justify-start"
            )}
          >
            <div className={cn(
                "py-2 px-4 rounded-xl shadow",
                msg.senderId === currentUser.id
                  ? "bg-gradient-to-r from-[hsl(197,78%,52%)] to-[hsl(var(--primary))] text-primary-foreground rounded-br-none"
                  : "bg-secondary text-secondary-foreground rounded-bl-none"
              )}>
              <p className="text-sm font-body">{msg.text}</p>
              <p className="text-xs mt-1 opacity-70 text-right">
                {format(new Date(msg.timestamp), "p")}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/30">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 font-code"
            aria-label="Chat message input"
          />
          <Button type="submit" className="btn-accent font-code" aria-label="Send message">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
