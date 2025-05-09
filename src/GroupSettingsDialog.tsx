import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

const MAX_IMAGE_SIZE = 1024 * 1024; // 1 MiB in bytes

export function GroupSettingsDialog({
  conversationId,
  onClose,
}: {
  conversationId: Id<"conversations">;
  onClose: () => void;
}) {
  const conversation = useQuery(api.conversations.list)?.find(
    (c) => c._id === conversationId
  );
  const friends = useQuery(api.friends.getFriends) || [];
  const updateGroup = useMutation(api.conversations.updateGroup);
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const [name, setName] = useState(conversation?.name || "");
  const [icon, setIcon] = useState(conversation?.icon || "default");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = useQuery(api.auth.loggedInUser)?._id;

  if (!conversation || !userId) return null;

  const handleSave = async () => {
    await updateGroup({
      conversationId,
      name: name.trim() || undefined,
      icon: icon === conversation.icon ? undefined : icon,
    });
    onClose();
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`Image size must be less than 1 MiB. Selected image is ${(file.size / (1024 * 1024)).toFixed(2)} MiB`);
        e.target.value = ''; // Clear the input
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter out current user from participants list
  const otherParticipants = conversation.participants.filter(p => p.id !== userId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Group Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Icon
            </label>
            {error && (
              <p className="text-red-500 text-sm mb-2">{error}</p>
            )}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {icon === "default" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
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
                ) : (
                  <img
                    src={icon}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                Change Icon
              </button>
              {icon !== "default" && (
                <button
                  onClick={() => setIcon("default")}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Members
            </label>
            <div className="space-y-2">
              {otherParticipants.map((participant) => {
                const isFriend = friends.some(
                  (friend) => friend.userId === participant.id
                );
                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span>{participant.username}</span>
                    {!isFriend && (
                      <button
                        onClick={() =>
                          sendFriendRequest({
                            recipientUsername: participant.username,
                          })
                        }
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Add as friend"
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
