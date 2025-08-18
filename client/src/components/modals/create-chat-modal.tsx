import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface CreateChatModalProps {
  onClose: () => void;
  onSuccess: (chatId: string) => void;
}

export default function CreateChatModal({ onClose, onSuccess }: CreateChatModalProps) {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createChatMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPrivate: boolean }) => {
      const response = await apiRequest('POST', '/api/chat-rooms', data);
      return response.json();
    },
    onSuccess: (chatRoom) => {
      toast({
        title: "Chat room created!",
        description: `${chatRoom.name} is ready for conversations`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-rooms"] });
      setLocation(`/chat/${chatRoom.id}`);
      onSuccess(chatRoom.id);
    },
    onError: (error) => {
      toast({
        title: "Failed to create chat room",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createChatMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      isPrivate,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-create-chat">
        <DialogHeader>
          <DialogTitle>Create New Chat Room</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Team Discussion, Project Alpha"
              required
              data-testid="input-room-name"
            />
          </div>
          
          <div>
            <Label htmlFor="room-description">Description (Optional)</Label>
            <Textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this chat room..."
              rows={3}
              className="resize-none"
              data-testid="input-room-description"
            />
          </div>

          <div>
            <Label>Privacy Settings</Label>
            <RadioGroup
              value={isPrivate ? "private" : "public"}
              onValueChange={(value) => setIsPrivate(value === "private")}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" data-testid="radio-public" />
                <Label htmlFor="public" className="text-sm">
                  Public - Anyone with the link can join
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" data-testid="radio-private" />
                <Label htmlFor="private" className="text-sm">
                  Private - Invite only
                </Label>
              </div>
            </RadioGroup>
          </div>

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
              disabled={!name.trim() || createChatMutation.isPending}
              className="flex-1 bg-primary hover:bg-indigo-700"
              data-testid="button-create"
            >
              {createChatMutation.isPending ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
