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
    <div className="flex flex-col w-80 bg-white border-r border-gray-200 h-full">
      {/* User Profile */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${getProfileColorClass(user?.profileColor || 'blue')} text-white rounded-full flex items-center justify-center font-semibold`}>
            {user?.displayName ? getUserInitials(user.displayName) : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate" data-testid="text-username">
              {user?.displayName || user?.firstName || "User"}
            </p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
          <button 
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Actions */}
      <div className="p-4 space-y-3 border-b border-gray-200">
        <Button 
          onClick={onCreateChat}
          className="w-full bg-primary text-white hover:bg-indigo-700 flex items-center justify-center space-x-2"
          data-testid="button-create-chat"
        >
          <Plus className="w-4 h-4" />
          <span>Create Chat Room</span>
        </Button>
        <Button 
          variant="outline"
          onClick={onJoinChat}
          className="w-full flex items-center justify-center space-x-2"
          data-testid="button-join-chat"
        >
          <LogIn className="w-4 h-4" />
          <span>Join Chat</span>
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Active Chats
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3 p-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">No chat rooms yet</p>
              <p className="text-xs text-gray-400">Create a room or join one to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onSelectChat(room.id)}
                  className={`
                    ${selectedChatId === room.id 
                      ? "bg-indigo-50 border border-indigo-200" 
                      : "hover:bg-gray-50"
                    }
                    rounded-lg p-3 cursor-pointer transition-colors
                  `}
                  data-testid={`chat-room-${room.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {room.name}
                      </p>
                      {room.lastMessage && (
                        <p className="text-xs text-gray-500 truncate">
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
                        <span className="text-xs text-gray-500">
                          {formatTime(room.lastMessage.createdAt)}
                        </span>
                      )}
                      {room.unreadCount > 0 && (
                        <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center mt-2 space-x-1">
                    <div className="flex -space-x-1">
                      {room.members.slice(0, 3).map((member, index) => (
                        <div 
                          key={member.id}
                          className={`w-5 h-5 ${getProfileColorClass(member.user.profileColor || 'blue')} rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium`}
                        >
                          {member.user.displayName ? getUserInitials(member.user.displayName)[0] : "U"}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
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
