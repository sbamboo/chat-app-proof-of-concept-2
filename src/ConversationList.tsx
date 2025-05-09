import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useQuery as useAuthQuery } from "convex/react";

export function ConversationList({
  selectedId,
  onSelect,
}: {
  selectedId: Id<"conversations"> | null;
  onSelect: (id: Id<"conversations">) => void;
}) {
  const conversations = useQuery(api.conversations.list) || [];
  const userId = useAuthQuery(api.auth.loggedInUser)?._id;
  const createGroup = useMutation(api.conversations.createGroup);

  // Get all profiles for DM participants
  const allParticipantIds = new Set<Id<"users">>();
  conversations.forEach(conv => {
    if (conv.type === "dm") {
      conv.participants.forEach(p => {
        if (p.id !== userId) {
          allParticipantIds.add(p.id);
        }
      });
    }
  });

  const participantProfiles = useQuery(api.users.getProfile, {}) || null;
  const otherProfiles = new Map<Id<"users">, { profileImage?: string }>();
  if (participantProfiles) {
    Array.from(allParticipantIds).forEach(id => {
      if (participantProfiles.userId === id) {
        otherProfiles.set(id, {
          profileImage: participantProfiles.profileImage,
        });
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 py-4 space-y-2">
        {conversations.map((conversation) => {
          const otherParticipants = conversation.participants.filter(
            (p) => p.id !== userId
          );
          const title =
            conversation.type === "dm"
              ? otherParticipants[0]?.username || "Unknown"
              : conversation.name || "Group";

          // For DMs, use the other participant's profile image
          const dmPartnerProfile = conversation.type === "dm" 
            ? otherProfiles.get(otherParticipants[0]?.id)
            : null;
          const icon = conversation.type === "dm" && dmPartnerProfile
            ? dmPartnerProfile.profileImage
            : conversation.icon;

          return (
            <button
              key={conversation._id}
              onClick={() => onSelect(conversation._id)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                selectedId === conversation._id ? "bg-gray-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {(!icon || icon === "default") ? (
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
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  ) : (
                    <img
                      src={icon}
                      alt=""
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                </div>
                <span className="truncate">{title}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="p-4 border-t">
        <button
          onClick={() => createGroup()}
          className="w-full flex items-center justify-center p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
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
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
