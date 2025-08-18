import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu, Share2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import type { ChatRoom } from "@shared/schema";

interface ChatAreaProps {
  chatId: string | null;
  onToggleSidebar: () => void;
}

export default function ChatArea({ chatId, onToggleSidebar }: ChatAreaProps) {
  const { toast } = useToast();

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
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Menu className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No chat selected</h3>
          <p className="text-gray-500">Choose a chat room from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900" data-testid="text-chat-name">
              {chatRoom?.name || chatId}
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500" data-testid="text-chat-id">
                Chat ID: {chatId}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareChat}
            className="text-gray-400 hover:text-gray-600"
            data-testid="button-share-chat"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600"
            data-testid="button-chat-info"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList chatId={chatId} />
      </div>

      {/* Message Input */}
      <MessageInput chatId={chatId} />
    </div>
  );
}
