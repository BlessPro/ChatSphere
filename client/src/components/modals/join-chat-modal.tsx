import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface JoinChatModalProps {
  onClose: () => void;
  onSuccess: (chatId: string) => void;
}

export default function JoinChatModal({ onClose, onSuccess }: JoinChatModalProps) {
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest('POST', `/api/chat-rooms/${chatId}/join`);
      return response.json();
    },
    onSuccess: (_, chatId) => {
      toast({
        title: "Joined chat room!",
        description: "You can now participate in the conversation",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-rooms"] });
      setLocation(`/chat/${chatId}`);
      onSuccess(chatId);
    },
    onError: (error) => {
      toast({
        title: "Failed to join chat room",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const extractChatId = (input: string): string => {
    const trimmed = input.trim();
    
    // If it's a URL, extract the chat ID from the path
    if (trimmed.includes('/chat/')) {
      const match = trimmed.match(/\/chat\/([A-Z0-9]{6})/);
      return match ? match[1] : trimmed;
    }
    
    // Otherwise, assume it's just the chat ID
    return trimmed.toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const chatId = extractChatId(input);
    
    // Validate chat ID format (6 alphanumeric characters)
    if (!/^[A-Z0-9]{6}$/.test(chatId)) {
      toast({
        title: "Invalid chat ID",
        description: "Chat ID must be 6 characters long (letters and numbers only)",
        variant: "destructive",
      });
      return;
    }

    joinChatMutation.mutate(chatId);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-join-chat">
        <DialogHeader>
          <DialogTitle>Join Chat Room</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="chat-input">Chat ID or Invite Link</Label>
            <Input
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter chat ID (e.g., ABC123) or paste invite link"
              required
              data-testid="input-chat-id"
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">How to join:</p>
              <ul className="text-sm space-y-1">
                <li>• Enter a 6-character chat ID (e.g., ABC123)</li>
                <li>• Or paste a full invite link</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!input.trim() || joinChatMutation.isPending}
              className="flex-1 bg-primary hover:bg-indigo-700"
              data-testid="button-join"
            >
              {joinChatMutation.isPending ? "Joining..." : "Join Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
