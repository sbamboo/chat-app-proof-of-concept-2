import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function GroupMembersDialog({
  conversationId,
  onClose,
}: {
  conversationId: Id<"conversations">;
  onClose: () => void;
}) {
  const friends = useQuery(api.friends.getFriends) || [];
  const conversation = useQuery(api.conversations.list)?.find(
    (c) => c._id === conversationId
  );
  const [selectedFriends, setSelectedFriends] = useState<Set<Id<"users">>>(new Set());
  const addMembers = useMutation(api.conversations.addMembers);
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);

  if (!conversation) return null;

  const nonMemberFriends = friends.filter(
    (friend) => !conversation.participants.some((p) => p.id === friend.userId)
  );

  const handleAddMembers = async () => {
    if (selectedFriends.size === 0) return;
    await addMembers({
      conversationId,
      memberIds: Array.from(selectedFriends),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Members</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {nonMemberFriends.map((friend) => (
            <label
              key={friend.userId}
              className="flex items-center p-2 hover:bg-gray-50 rounded"
            >
              <input
                type="checkbox"
                checked={selectedFriends.has(friend.userId)}
                onChange={(e) => {
                  const newSelected = new Set(selectedFriends);
                  if (e.target.checked) {
                    newSelected.add(friend.userId);
                  } else {
                    newSelected.delete(friend.userId);
                  }
                  setSelectedFriends(newSelected);
                }}
                className="mr-3"
              />
              {friend.username}
            </label>
          ))}
          {nonMemberFriends.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No friends to add
            </p>
          )}
        </div>

        <button
          onClick={handleAddMembers}
          disabled={selectedFriends.size === 0}
          className="w-full py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Selected
        </button>
      </div>
    </div>
  );
}
