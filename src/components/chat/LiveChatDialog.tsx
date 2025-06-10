
"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Removed DialogClose
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { sendMessage, getMessagesSubscription } from '@/lib/chatService';
import type { ChatMessage } from '@/types';
import ChatMessageItem from './ChatMessageItem';
import { useToast } from '@/hooks/use-toast';

interface LiveChatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function LiveChatDialog({ isOpen, onOpenChange }: LiveChatDialogProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !user) {
      setMessages([]); // Clear messages if dialog is closed or no user
      return;
    }

    const unsubscribe = getMessagesSubscription((newMessages) => {
      setMessages(newMessages);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe(); 
      }
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    try {
      await sendMessage(newMessage, user.name, user.role);
      setNewMessage('');
    } catch (error) {
      toast({
        title: "Error Sending Message",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Live Chat
          </DialogTitle>
          <DialogDescription>
            {user.role === 'staff' ? "Chat with Admin Support" : "General Support Chat"}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-2">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                isCurrentUser={msg.senderName === user.name && msg.senderRole === user.role}
              />
            ))}
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">
                No messages yet. Start the conversation!
              </p>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t">
          <div className="flex w-full items-center gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
