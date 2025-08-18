import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserSetupModalProps {
  onClose: () => void;
  onComplete: () => void;
}

const profileColors = [
  { name: 'blue', class: 'bg-blue-500', focusClass: 'focus:ring-blue-300' },
  { name: 'green', class: 'bg-green-500', focusClass: 'focus:ring-green-300' },
  { name: 'purple', class: 'bg-purple-500', focusClass: 'focus:ring-purple-300' },
  { name: 'red', class: 'bg-red-500', focusClass: 'focus:ring-red-300' },
  { name: 'yellow', class: 'bg-yellow-500', focusClass: 'focus:ring-yellow-300' },
  { name: 'indigo', class: 'bg-indigo-500', focusClass: 'focus:ring-indigo-300' },
];

export default function UserSetupModal({ onClose, onComplete }: UserSetupModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [profileColor, setProfileColor] = useState("blue");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string; profileColor: string }) => {
      const response = await apiRequest('PATCH', '/api/auth/user', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile created!",
        description: "Welcome to ChatConnect",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Failed to create profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    updateProfileMutation.mutate({
      displayName: displayName.trim(),
      profileColor,
    });
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideClose data-testid="modal-user-setup">
        <DialogHeader>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              <MessageCircle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to ChatConnect
            </DialogTitle>
            <p className="text-gray-600">Set up your profile to start chatting</p>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              required
              data-testid="input-display-name"
            />
          </div>

          <div>
            <Label>Profile Color</Label>
            <div className="flex space-x-2 mt-2">
              {profileColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setProfileColor(color.name)}
                  className={`
                    w-8 h-8 ${color.class} rounded-full border-2 transition-all
                    ${profileColor === color.name 
                      ? 'border-gray-900 ring-2 ring-gray-300' 
                      : 'border-transparent hover:border-gray-300'
                    }
                  `}
                  data-testid={`button-color-${color.name}`}
                />
              ))}
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Privacy & Security:</p>
              <p className="text-sm">
                Your profile is only visible to people in your chat rooms. We don't store personal information beyond what you provide.
              </p>
            </AlertDescription>
          </Alert>

          <Button 
            type="submit" 
            disabled={!displayName.trim() || updateProfileMutation.isPending}
            className="w-full bg-primary hover:bg-indigo-700 font-medium"
            data-testid="button-get-started"
          >
            {updateProfileMutation.isPending ? "Setting up..." : "Get Started"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
