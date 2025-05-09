import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function FriendsCard({ onClose }: { onClose: () => void }) {
  const [newFriend, setNewFriend] = useState("");
  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const respondToRequest = useMutation(api.friends.respondToFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);
  const pendingRequests = useQuery(api.friends.getPendingRequests) || [];
  const friends = useQuery(api.friends.getFriends) || [];
  const [showConfirm, setShowConfirm] = useState<Id<"users"> | null>(null);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriend.trim()) return;

    try {
      await sendRequest({ recipientUsername: newFriend.trim() });
      setNewFriend("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send request");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Friends</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSendRequest} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFriend}
              onChange={(e) => setNewFriend(e.target.value)}
              placeholder="Enter username"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Send Request
            </button>
          </div>
        </form>

        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Pending Requests</h3>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded"
                >
                  <span>{request.senderUsername}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        respondToRequest({ requestId: request._id, accept: true })
                      }
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        respondToRequest({ requestId: request._id, accept: false })
                      }
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Friends</h3>
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.userId}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <span>{friend.username}</span>
                <button
                  onClick={() => setShowConfirm(friend.userId)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-4">Remove Friend</h3>
              <p className="mb-4">Are you sure you want to remove this friend?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await removeFriend({ friendId: showConfirm });
                    setShowConfirm(null);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
