import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import type { TypingIndicatorWithUser } from "@shared/schema";

interface TypingIndicatorProps {
  chatId: string;
}

export default function TypingIndicator({ chatId }: TypingIndicatorProps) {
  const { data: typingUsers = [] } = useQuery<TypingIndicatorWithUser[]>({
    queryKey: ["/api/chat-rooms", chatId, "typing"],
    enabled: !!chatId,
    refetchInterval: 1000, // Poll every second for typing indicators
  });

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    const names = typingUsers.map(user => user.user.displayName || user.user.email).filter(Boolean);
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length > 2) {
      return `${names[0]} and ${names.length - 1} others are typing...`;
    }
    
    return "Someone is typing...";
  };

  return (
    <div className="px-6 pb-2" data-testid="typing-indicator">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground italic">
            {getTypingText()}
          </p>
        </div>
      </div>
    </div>
  );
}