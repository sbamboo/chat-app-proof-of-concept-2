import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { FormEvent, useRef, useState, useEffect } from "react";
import { useQuery as useAuthQuery } from "convex/react";
import ReactMarkdown from "react-markdown";
import { GroupMembersDialog } from "./GroupMembersDialog";
import { GroupSettingsDialog } from "./GroupSettingsDialog";

export function ConversationView({
  conversationId,
  onDeleted,
}: {
  conversationId: Id<"conversations">;
  onDeleted: () => void;
}) {
  const messages = useQuery(api.messages.list, { conversationId }) || [];
  const conversation = useQuery(api.conversations.list)?.find(
    (c) => c._id === conversationId
  );
  const sendMessage = useMutation(api.messages.send);
  const leaveGroup = useMutation(api.conversations.leaveGroup);
  const userId = useAuthQuery(api.auth.loggedInUser)?._id;
  const [content, setContent] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Call onDeleted when conversation is deleted
  useEffect(() => {
    if (!conversation) {
      onDeleted();
    }
  }, [conversation, onDeleted]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      // Check if we're already at the bottom before new messages
      const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      
      if (wasAtBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await sendMessage({
      conversationId,
      content: content.trim(),
    });
    setContent("");
    
    // Scroll to bottom after sending
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleLeaveGroup = async () => {
    await leaveGroup({ conversationId });
    setShowLeaveConfirm(false);
  };

  if (!conversation) return null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {conversation.type === "group" && (
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-semibold">{conversation.name}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMembers(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Add members"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Leave group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Group settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div 
        ref={messagesContainerRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto"
      >
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${
              message.authorId === userId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg ${
                message.authorId === userId
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Markdown supported)"
          className="w-full px-3 py-2 border rounded-lg resize-none"
          rows={3}
        />
      </form>

      {showAddMembers && (
        <GroupMembersDialog
          conversationId={conversationId}
          onClose={() => setShowAddMembers(false)}
        />
      )}

      {showSettings && (
        <GroupSettingsDialog
          conversationId={conversationId}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Leave Group</h3>
            <p className="mb-4">Are you sure you want to leave this group?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
