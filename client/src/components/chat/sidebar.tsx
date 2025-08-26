import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Settings, Plus, LogIn } from "lucide-react";
import type { ChatRoomWithMembers } from "@shared/schema";

interface SidebarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onJoinChat: () => void;
}

export default function Sidebar({ selectedChatId, onSelectChat, onCreateChat, onJoinChat }: SidebarProps) {
  const { user } = useAuth();

  const { data: chatRooms = [], isLoading } = useQuery<ChatRoomWithMembers[]>({
    queryKey: ["/api/chat-rooms"],
  });

  const getUserInitials = (displayName: string) => {
    return displayName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    if (messageDay.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDay.getTime() === today.getTime() - 86400000) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
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

  return (
    <div className="flex flex-col w-80 bg-card h-full">
      {/* User Profile */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-lg">
            {user?.displayName ? getUserInitials(user.displayName) : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-card-foreground truncate" data-testid="text-username">
              {user?.displayName || user?.firstName || "User"}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
          <button 
            className="text-muted-foreground hover:text-card-foreground p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Actions */}
      <div className="p-6 space-y-4 border-b border-border">
        <Button 
          onClick={onCreateChat}
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center space-x-3 rounded-lg font-medium"
          data-testid="button-create-chat"
        >
          <Plus className="w-5 h-5" />
          <span>Create Chat Room</span>
        </Button>
        <Button 
          variant="outline"
          onClick={onJoinChat}
          className="w-full h-12 border-border hover:bg-accent hover:text-accent-foreground flex items-center justify-center space-x-3 rounded-lg font-medium"
          data-testid="button-join-chat"
        >
          <LogIn className="w-5 h-5" />
          <span>Join Chat</span>
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
            Active Chats
          </h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted/70 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base text-muted-foreground mb-2">No chat rooms yet</p>
              <p className="text-sm text-muted-foreground/70">Create a room or join one to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onSelectChat(room.id)}
                  className={`
                    ${selectedChatId === room.id 
                      ? "bg-accent border border-border/50" 
                      : "hover:bg-accent/50"
                    }
                    rounded-lg p-4 cursor-pointer transition-all duration-200
                  `}
                  data-testid={`chat-room-${room.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-card-foreground truncate">
                        {room.name}
                      </p>
                      {room.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {room.lastMessage.sender.displayName || room.lastMessage.sender.firstName}: {
                            room.lastMessage.messageType === 'file' 
                              ? `📎 ${room.lastMessage.fileName}` 
                              : room.lastMessage.content
                          }
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {room.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(room.lastMessage.createdAt!)}
                        </span>
                      )}
                      {room.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center mt-3 space-x-2">
                    <div className="flex -space-x-1">
                      {room.members.slice(0, 3).map((member, index) => (
                        <div 
                          key={member.id}
                          className="w-6 h-6 bg-primary text-primary-foreground rounded-full border-2 border-card flex items-center justify-center text-xs font-medium"
                        >
                          {member.user.displayName ? getUserInitials(member.user.displayName)[0] : "U"}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {room.members.length > 3 
                        ? `+${room.members.length - 3} more`
                        : `${room.members.length} member${room.members.length !== 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
