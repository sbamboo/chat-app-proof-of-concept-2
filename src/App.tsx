import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { FriendsCard } from "./FriendsCard";
import { ProfileCard } from "./ProfileCard";
import { ConversationList } from "./ConversationList";
import { ConversationView } from "./ConversationView";
import { Id } from "../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  const [showFriends, setShowFriends] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(null);
  
  const user = useQuery(api.auth.loggedInUser);
  const username = useQuery(api.users.getUsername);
  const generateUsername = useMutation(api.users.generateNewUsername);
  const conversations = useQuery(api.conversations.list) || [];

  // Clear selected conversation if it no longer exists
  useEffect(() => {
    if (selectedConversation && !conversations.some(c => c._id === selectedConversation)) {
      setSelectedConversation(null);
    }
  }, [conversations, selectedConversation]);

  // Generate username if logged in but no username exists
  useEffect(() => {
    if (user && !username) {
      generateUsername();
    }
  }, [user, username]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="h-16 sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold">Chat app</h2>
        <div className="flex items-center gap-4">
          <Authenticated>
            <>
              <button
                onClick={() => setShowFriends(true)}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Friends"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Profile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </>
          </Authenticated>
          <SignOutButton />
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex overflow-hidden"> {/* Add overflow-hidden here */}
        {/* Sidebar */}
        <Authenticated>
          <div className="w-64 bg-gray-50 border-r overflow-y-auto"> {/* Make sidebar scrollable */}
            <ConversationList
              selectedId={selectedConversation}
              onSelect={setSelectedConversation}
            />
          </div>
        </Authenticated>

        {/* Main content */}
        <div className="flex-1 overflow-hidden"> {/* Add overflow-hidden here */}
          <Unauthenticated>
            <div className="max-w-md mx-auto p-8">
              <div className="text-center">
                <p className="text-xl text-slate-600 mb-8">Sign in to get started</p>
                <SignInForm />
              </div>
            </div>
          </Unauthenticated>
          <Authenticated>
            {selectedConversation ? (
              <ConversationView 
                conversationId={selectedConversation} 
                onDeleted={() => setSelectedConversation(null)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a conversation to start chatting
              </div>
            )}
          </Authenticated>
        </div>
      </div>

      {showFriends && <FriendsCard onClose={() => setShowFriends(false)} />}
      {showProfile && <ProfileCard onClose={() => setShowProfile(false)} />}
      <Toaster />
    </div>
  );
}
