
"use client";

import type { ChatConversation } from "@/types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

interface ChatListItemProps {
  conversation: ChatConversation;
  currentUserId: string;
  isActive: boolean;
}

export function ChatListItem({ conversation, currentUserId, isActive }: ChatListItemProps) {
  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  const displayName = otherParticipant ? otherParticipant.name : "Unknown User";
  const avatarText = displayName.substring(0, 2).toUpperCase();

  const lastMessageText = conversation.lastMessage ? 
    `${conversation.lastMessage.senderName === displayName ? '' : 'You: '}${conversation.lastMessage.text}` 
    : "No messages yet";
    
  const lastMessageTimestamp = conversation.lastMessage?.timestamp 
    ? formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })
    : "";

  return (
    <Link 
      href={`/chat/${conversation.id}`}
      className={cn(
        "flex items-center p-4 rounded-lg transition-colors cursor-pointer",
        isActive ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      <Avatar className="h-12 w-12 mr-4">
        <AvatarImage src={`https://placehold.co/100x100.png?text=${avatarText}`} alt={displayName} />
        <AvatarFallback>{avatarText}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold font-headline truncate">{displayName}</h3>
          {conversation.lastMessage?.timestamp && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">{lastMessageTimestamp}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate font-body">
          {lastMessageText}
        </p>
        <p className="text-xs text-primary/80 truncate font-body mt-1">
          Re: {conversation.propertyName}
        </p>
      </div>
    </Link>
  );
}

