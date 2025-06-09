
"use client";

import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function ChatMessageItem({ message, isCurrentUser }: ChatMessageItemProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-2 py-2",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://placehold.co/32x32.png?text=${getInitials(message.senderName)}`} alt={message.senderName} data-ai-hint="user avatar" />
          <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow",
          isCurrentUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted text-muted-foreground rounded-bl-none"
        )}
      >
        {!isCurrentUser && (
          <p className="text-xs font-semibold mb-0.5">
            {message.senderName} ({message.senderRole})
          </p>
        )}
        <p className="whitespace-pre-wrap">{message.text}</p>
        <p className={cn(
            "text-xs mt-1",
            isCurrentUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70 text-left"
          )}
        >
          {message.timestamp instanceof Date ? format(message.timestamp, 'p') : 'Sending...'}
        </p>
      </div>
      {isCurrentUser && (
         <Avatar className="h-8 w-8">
           <AvatarImage src={`https://placehold.co/32x32.png?text=${getInitials(message.senderName)}`} alt={message.senderName} data-ai-hint="user avatar" />
          <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
