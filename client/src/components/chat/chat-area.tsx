import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu, Share2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import type { ChatRoom, MessageWithSender } from "@shared/schema";

interface ChatAreaProps {
  chatId: string | null;
  onToggleSidebar: () => void;
}

export default function ChatArea({ chatId, onToggleSidebar }: ChatAreaProps) {
  const { toast } = useToast();
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);

  const { data: chatRoom } = useQuery<ChatRoom>({
    queryKey: ["/api/chat-rooms", chatId],
    enabled: !!chatId,
  });

  const handleShareChat = () => {
    if (!chatId) return;
    
    const shareUrl = `${window.location.origin}/chat/${chatId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "Chat room link has been copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    });
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center p-12">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Menu className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">No chat selected</h3>
          <p className="text-muted-foreground text-lg">Choose a chat room from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden p-2"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-card-foreground" data-testid="text-chat-name">
              {chatRoom?.name || chatId}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-muted-foreground font-mono" data-testid="text-chat-id">
                ID: {chatId}
              </span>
              <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Active now
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareChat}
            className="text-muted-foreground hover:text-card-foreground p-2"
            data-testid="button-share-chat"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-card-foreground p-2"
            data-testid="button-chat-info"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList chatId={chatId} onReply={setReplyTo} />
      </div>

      {/* Message Input */}
      <MessageInput 
        chatId={chatId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
