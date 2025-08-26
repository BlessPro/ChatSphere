import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/chat/sidebar";
import ChatArea from "@/components/chat/chat-area";
import UserSetupModal from "@/components/modals/user-setup-modal";
import CreateChatModal from "@/components/modals/create-chat-modal";
import JoinChatModal from "@/components/modals/join-chat-modal";
import { useLocation } from "wouter";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [showJoinChat, setShowJoinChat] = useState(false);

  // Extract chat ID from URL
  useEffect(() => {
    const match = location.match(/^\/chat\/(.+)$/);
    if (match) {
      setSelectedChatId(match[1]);
    } else {
      setSelectedChatId(null);
    }
  }, [location]);

  // Show user setup modal if profile is incomplete
  useEffect(() => {
    if (user && !user?.displayName) {
      setShowUserSetup(true);
    }
  }, [user]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-300 ease-in-out
        fixed md:relative z-50 md:z-auto
        w-80 h-full bg-card border-r border-border
      `}>
        <Sidebar
          selectedChatId={selectedChatId}
          onSelectChat={(chatId) => {
            setSelectedChatId(chatId);
            setSidebarOpen(false);
          }}
          onCreateChat={() => setShowCreateChat(true)}
          onJoinChat={() => setShowJoinChat(true)}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea
          chatId={selectedChatId}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Modals */}
      {showUserSetup && (
        <UserSetupModal
          onClose={() => setShowUserSetup(false)}
          onComplete={() => setShowUserSetup(false)}
        />
      )}

      {showCreateChat && (
        <CreateChatModal
          onClose={() => setShowCreateChat(false)}
          onSuccess={(chatId) => {
            setShowCreateChat(false);
            setSelectedChatId(chatId);
          }}
        />
      )}

      {showJoinChat && (
        <JoinChatModal
          onClose={() => setShowJoinChat(false)}
          onSuccess={(chatId) => {
            setShowJoinChat(false);
            setSelectedChatId(chatId);
          }}
        />
      )}
    </div>
  );
}
