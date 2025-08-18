import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MessageInputProps {
  chatId: string;
}

interface FileInfo {
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
}

export default function MessageInput({ chatId }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    mutationFn: async (data: { content?: string; messageType?: string; fileName?: string; fileUrl?: string; fileSize?: string }) => {
      return apiRequest('POST', `/api/chat-rooms/${chatId}/messages`, data);
    },
    onSuccess: () => {
      setMessage("");
      setSelectedFiles([]);
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

  const handleSendMessage = () => {
    const textContent = message.trim();
    
    if (!textContent && selectedFiles.length === 0) return;

    // Send text message if there's content
    if (textContent) {
      sendMessageMutation.mutate({
        content: textContent,
        messageType: 'text',
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
    setMessage(event.target.value);
    
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
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end space-x-3">
        {/* File upload button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-gray-600 p-2"
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
            className="resize-none min-h-[44px] max-h-[120px]"
            data-testid="input-message"
          />
          
          {/* File preview area */}
          {selectedFiles.length > 0 && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Files to send:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  data-testid="button-clear-files"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">
                        <Paperclip className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600 p-1"
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
          className="bg-primary hover:bg-indigo-700 p-3"
          data-testid="button-send"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick emoji reactions */}
      <div className="flex items-center space-x-1 mt-2">
        <button onClick={() => addEmoji('👍')} className="text-gray-400 hover:text-gray-600 p-1 rounded text-lg" data-testid="button-emoji-thumbs-up">👍</button>
        <button onClick={() => addEmoji('❤️')} className="text-gray-400 hover:text-gray-600 p-1 rounded text-lg" data-testid="button-emoji-heart">❤️</button>
        <button onClick={() => addEmoji('😊')} className="text-gray-400 hover:text-gray-600 p-1 rounded text-lg" data-testid="button-emoji-smile">😊</button>
        <button onClick={() => addEmoji('🎉')} className="text-gray-400 hover:text-gray-600 p-1 rounded text-lg" data-testid="button-emoji-party">🎉</button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-gray-600 p-1"
          data-testid="button-emoji-picker"
        >
          <Smile className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
