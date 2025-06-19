
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
import { io, type Socket } from 'socket.io-client';

interface ChatInterfaceProps {
  conversationId: string;
  currentUser: User;
}

export function ChatInterface({ conversationId, currentUser }: ChatInterfaceProps) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const foundConversation = MOCK_CHAT_CONVERSATIONS.find(c => c.id === conversationId);
    setConversation(foundConversation || null);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io({ 
        path: '/api/socket', 
        addTrailingSlash: false, 
        transports: ['websocket', 'polling'] // Explicitly define transports
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server:', newSocket.id);
      if (conversationId) {
        newSocket.emit('joinConversation', conversationId);
      }
    });

    newSocket.on('receiveMessage', (message: ChatMessage) => {
      // Only process if the message is for the current conversation AND not from the current user
      if (message.chatId === conversationId && message.senderId !== currentUser.id) {
        const updatedConv = addChatMessage(conversationId, message); // addChatMessage handles duplicates
        if (updatedConv) {
          setConversation(prevConv => {
            // Ensure we are updating the correct conversation if it changed
            if (prevConv && prevConv.id === conversationId) {
              return updatedConv;
            }
            return prevConv;
          });
        }
      }
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message, err.cause);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
    });
    
    // If conversationId changes, re-join the new room
    // This is important if the component stays mounted but conversationId prop changes
    if (newSocket.connected && conversationId) {
        newSocket.emit('joinConversation', conversationId);
    }


    return () => {
      console.log('Disconnecting socket...', newSocket.id);
      newSocket.disconnect();
      setSocket(null);
    };
  }, [conversationId, currentUser.id]); // currentUser.id to ensure correct sender check in 'receiveMessage'

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !conversation || !socket || !socket.connected) {
        if(!socket?.connected) console.warn("Socket not connected, cannot send message.");
        return;
    }

    const message: ChatMessage = {
      id: String(Date.now()) + currentUser.id.slice(0,5), // Slightly more unique ID
      chatId: conversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: newMessage,
      timestamp: Date.now(),
    };

    // Optimistically update UI and persist for sender
    const updatedConv = addChatMessage(conversation.id, message);
    if (updatedConv) {
      setConversation(updatedConv); // This updates the local state which triggers re-render
    }
    
    // Emit message to server
    socket.emit('sendMessage', { conversationId: conversation.id, message });
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
            disabled={!socket?.connected}
          />
          <Button type="submit" className="btn-accent font-code" aria-label="Send message" disabled={!socket?.connected}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
        {!socket?.connected && <p className="text-xs text-destructive mt-1">Chat disconnected. Attempting to reconnect...</p>}
      </form>
    </div>
  );
}
