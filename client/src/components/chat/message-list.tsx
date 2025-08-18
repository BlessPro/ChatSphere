import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MessageWithSender } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface MessageListProps {
  chatId: string;
}

export default function MessageList({ chatId }: MessageListProps) {
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

  const getUserInitials = (displayName: string) => {
    return displayName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileColorClass = (color: string) => {
    const colorMap = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      red: "bg-red-500",
      yellow: "bg-yellow-500",
      indigo: "bg-indigo-500",
    };
    return colorMap[color as keyof typeof colorMap] || "bg-blue-500";
  };

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isCurrentUser = (senderId: string) => {
    return user?.id === senderId;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">Start the conversation!</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => {
            const isOwn = isCurrentUser(message.senderId);
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
            const senderName = message.sender.displayName || message.sender.firstName || "Unknown";

            return (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${isOwn ? 'justify-end' : ''}`}
                data-testid={`message-${message.id}`}
              >
                {!isOwn && (
                  <div className="flex flex-col items-center">
                    {showAvatar ? (
                      <div className={`w-8 h-8 ${getProfileColorClass(message.sender.profileColor || 'blue')} text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                        {getUserInitials(senderName)}
                      </div>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                )}
                
                <div className={`flex-1 min-w-0 ${isOwn ? 'flex flex-col items-end' : ''}`}>
                  {showAvatar && (
                    <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <span className="text-sm font-medium text-gray-900">
                        {isOwn ? 'You' : senderName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.createdAt!)}
                      </span>
                    </div>
                  )}
                  
                  <div className={`
                    ${isOwn 
                      ? 'bg-primary text-white rounded-lg rounded-tr-sm max-w-md' 
                      : 'bg-white rounded-lg rounded-tl-sm shadow-sm border border-gray-200'
                    } p-3
                  `}>
                    {message.messageType === 'file' ? (
                      <div className={`border ${isOwn ? 'border-indigo-400' : 'border-gray-200'} rounded-lg p-3 ${isOwn ? 'bg-indigo-600' : 'bg-gray-50'}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${isOwn ? 'bg-indigo-500' : 'bg-indigo-100'} rounded-lg flex items-center justify-center`}>
                            <Download className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-indigo-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                              {message.fileName}
                            </p>
                            <p className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
                              {message.fileSize && formatFileSize(message.fileSize)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={isOwn ? "secondary" : "ghost"}
                            onClick={() => window.open(message.fileUrl!, '_blank')}
                            className="p-1"
                            data-testid={`button-download-${message.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : message.messageType === 'image' ? (
                      <div>
                        {message.content && (
                          <p className={`text-sm mb-2 ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                            {message.content}
                          </p>
                        )}
                        <img
                          src={message.fileUrl!}
                          alt={message.fileName || "Shared image"}
                          className="rounded-lg w-full h-auto max-w-md border border-indigo-400"
                          data-testid={`image-${message.id}`}
                        />
                      </div>
                    ) : (
                      <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>

                {isOwn && (
                  <div className="flex flex-col items-center">
                    {showAvatar ? (
                      <div className={`w-8 h-8 ${getProfileColorClass(user?.profileColor || 'blue')} text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                        {user?.displayName ? getUserInitials(user.displayName) : "U"}
                      </div>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
