import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Reply, Download, MoreVertical } from "lucide-react";
import type { MessageWithSender } from "@shared/schema";

interface MessageItemProps {
  message: MessageWithSender;
  isCurrentUser: boolean;
  onReply: (message: MessageWithSender) => void;
}

export default function MessageItem({ message, isCurrentUser, onReply }: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserInitial = (name?: string, email?: string) => {
    return (name || email || 'U').charAt(0).toUpperCase();
  };

  const renderMessageContent = () => {
    if (message.messageType === 'image' && message.fileUrl) {
      return (
        <div className="max-w-sm">
          <img
            src={message.fileUrl}
            alt={message.fileName || 'Image'}
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.fileUrl!, '_blank')}
            data-testid="image-preview"
          />
          {message.content && (
            <p className="mt-2 text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.messageType === 'file' && message.fileUrl) {
      return (
        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg border border-border max-w-sm">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.fileName}</p>
            <p className="text-xs text-muted-foreground">{message.fileSize} bytes</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(message.fileUrl!, '_blank')}
            className="p-2"
            data-testid="button-download-file"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return <p className="text-sm break-words">{message.content}</p>;
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;

    return (
      <div className="mb-2 p-2 bg-muted/50 rounded border-l-2 border-primary">
        <div className="flex items-center space-x-2 mb-1">
          <Reply className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {message.replyTo.sender.displayName || message.replyTo.sender.email}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {message.replyTo.content || `${message.replyTo.messageType === 'image' ? '📷 Image' : '📎 File'}: ${message.replyTo.fileName}`}
        </p>
      </div>
    );
  };

  return (
    <div
      className={`flex space-x-3 p-4 hover:bg-muted/50 transition-colors group ${
        isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`message-${message.id}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
        isCurrentUser ? 'bg-primary' : 'bg-muted-foreground'
      }`}>
        {getUserInitial(message.sender.displayName, message.sender.email)}
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'text-right' : ''}`}>
        {/* Sender name and time */}
        <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <span className="text-sm font-semibold text-card-foreground">
            {message.sender.displayName || message.sender.email}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt!)}
          </span>
        </div>

        {/* Reply preview */}
        {renderReplyPreview()}

        {/* Message content */}
        <div className={`${isCurrentUser ? 'text-right' : ''}`}>
          {renderMessageContent()}
        </div>

        {/* Action buttons */}
        {isHovered && !isCurrentUser && (
          <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(message)}
              className="text-muted-foreground hover:text-card-foreground p-1 h-6 w-6"
              data-testid="button-reply"
            >
              <Reply className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-card-foreground p-1 h-6 w-6"
              data-testid="button-more"
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}