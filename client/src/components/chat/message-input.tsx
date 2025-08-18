import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, Smile, Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MessageWithSender } from "@shared/schema";

interface MessageInputProps {
  chatId: string;
  replyTo?: MessageWithSender;
  onCancelReply?: () => void;
}

interface FileInfo {
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
}

export default function MessageInput({ chatId, replyTo, onCancelReply }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File): Promise<FileInfo> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest('POST', '/api/upload', formData);
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content?: string; messageType?: string; fileName?: string; fileUrl?: string; fileSize?: string; replyToId?: string }) => {
      return apiRequest('POST', `/api/chat-rooms/${chatId}/messages`, data);
    },
    onSuccess: () => {
      setMessage("");
      setSelectedFiles([]);
      onCancelReply?.(); // Clear reply state
      queryClient.invalidateQueries({ queryKey: ["/api/chat-rooms", chatId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-rooms"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Typing indicator mutations
  const setTypingMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/chat-rooms/${chatId}/typing`, {}),
    onError: () => {
      // Silent fail for typing indicators
    }
  });

  const clearTypingMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/chat-rooms/${chatId}/typing`, {}),
    onError: () => {
      // Silent fail for typing indicators
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      try {
        const fileInfo = await uploadFileMutation.mutateAsync(file);
        setSelectedFiles(prev => [...prev, fileInfo]);
      } catch (error) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Typing indicator logic
  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      setTypingMutation.mutate();
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      clearTypingMutation.mutate();
    }, 2000);
  }, [isTyping, setTypingMutation, clearTypingMutation]);

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      clearTypingMutation.mutate();
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isTyping, clearTypingMutation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        clearTypingMutation.mutate();
      }
    };
  }, [clearTypingMutation, isTyping]);

  const handleSendMessage = () => {
    const textContent = message.trim();
    
    if (!textContent && selectedFiles.length === 0) return;

    // Stop typing indicator when sending
    stopTyping();

    // Send text message if there's content
    if (textContent) {
      sendMessageMutation.mutate({
        content: textContent,
        messageType: 'text',
        replyToId: replyTo?.id,
      });
    }

    // Send file messages
    selectedFiles.forEach(file => {
      const messageType = file.mimeType.startsWith('image/') ? 'image' : 'file';
      sendMessageMutation.mutate({
        content: messageType === 'image' ? textContent : undefined,
        messageType,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        replyToId: replyTo?.id,
      });
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setMessage(newValue);
    
    // Start typing indicator if there's content
    if (newValue.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
    
    // Auto-resize textarea
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="bg-card border-t border-border p-6">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-4 p-3 bg-muted rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-card-foreground">
                Replying to {replyTo.sender.displayName || replyTo.sender.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="text-muted-foreground hover:text-card-foreground p-1"
              data-testid="button-cancel-reply"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {replyTo.content || `${replyTo.messageType === 'image' ? '📷 Image' : '📎 File'}: ${replyTo.fileName}`}
          </p>
        </div>
      )}
      
      <div className="flex items-end space-x-4">
        {/* File upload button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-muted-foreground hover:text-card-foreground p-3 rounded-lg"
          disabled={uploadFileMutation.isPending}
          data-testid="button-attach-file"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          data-testid="input-file"
        />

        {/* Message input area */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="resize-none min-h-[48px] max-h-[120px] border-input bg-background text-foreground rounded-lg"
            data-testid="input-message"
          />
          
          {/* File preview area */}
          {selectedFiles.length > 0 && (
            <div className="mt-3 p-4 bg-muted rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-card-foreground">Files to send:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  className="text-muted-foreground hover:text-card-foreground p-2"
                  data-testid="button-clear-files"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-card-foreground p-2"
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={handleSendMessage}
          disabled={(!message.trim() && selectedFiles.length === 0) || sendMessageMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-lg h-12 min-w-12"
          data-testid="button-send"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick emoji reactions */}
      <div className="flex items-center space-x-2 mt-4">
        <button onClick={() => addEmoji('👍')} className="text-muted-foreground hover:text-card-foreground p-2 rounded-lg text-lg transition-colors" data-testid="button-emoji-thumbs-up">👍</button>
        <button onClick={() => addEmoji('❤️')} className="text-muted-foreground hover:text-card-foreground p-2 rounded-lg text-lg transition-colors" data-testid="button-emoji-heart">❤️</button>
        <button onClick={() => addEmoji('😊')} className="text-muted-foreground hover:text-card-foreground p-2 rounded-lg text-lg transition-colors" data-testid="button-emoji-smile">😊</button>
        <button onClick={() => addEmoji('🎉')} className="text-muted-foreground hover:text-card-foreground p-2 rounded-lg text-lg transition-colors" data-testid="button-emoji-party">🎉</button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-card-foreground p-2"
          data-testid="button-emoji-picker"
        >
          <Smile className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
