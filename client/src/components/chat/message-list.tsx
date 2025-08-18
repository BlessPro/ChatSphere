import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { MessageWithSender } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import MessageItem from "./message-item";
import TypingIndicator from "./typing-indicator";

interface MessageListProps {
  chatId: string;
  onReply: (message: MessageWithSender) => void;
}

export default function MessageList({ chatId, onReply }: MessageListProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/chat-rooms", chatId, "messages"],
    enabled: !!chatId,
    refetchInterval: 3000, // Poll for new messages every 3 seconds
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">Start the conversation!</p>
          </div>
        </div>
      ) : (
        <div className="pb-4">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isCurrentUser={isCurrentUser(message.senderId)}
              onReply={onReply}
            />
          ))}
          
          {/* Typing indicators */}
          <TypingIndicator chatId={chatId} />
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}