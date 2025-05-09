import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import ReactMarkdown from "react-markdown";

const MAX_IMAGE_SIZE = 1024 * 1024; // 1 MiB in bytes

export function ProfileCard({ onClose }: { onClose: () => void }) {
  const profile = useQuery(api.users.getProfile, {}) || null;
  const generateNewUsername = useMutation(api.users.generateNewUsername);
  const updateUsername = useMutation(api.users.updateUsername);
  const updateProfile = useMutation(api.users.updateProfile);
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editDescription, setEditDescription] = useState(false);
  const [description, setDescription] = useState(profile?.description || "");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      try {
        await updateUsername({ username: newUsername.trim() });
        setEditMode(false);
        setNewUsername("");
      } catch (error) {
        alert("Username already taken");
      }
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`Image size must be less than 1 MiB. Selected image is ${(file.size / (1024 * 1024)).toFixed(2)} MiB`);
        e.target.value = ''; // Clear the input
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await updateProfile({ profileImage: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDescriptionSave = async () => {
    await updateProfile({ description });
    setEditDescription(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image
            </label>
            {error && (
              <p className="text-red-500 text-sm mb-2">{error}</p>
            )}
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.profileImage && profile.profileImage !== "default" ? (
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
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
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Upload Image
                </button>
                {profile?.profileImage && profile.profileImage !== "default" && (
                  <button
                    onClick={() => updateProfile({ profileImage: "default" })}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            {profile?.username && !editMode ? (
              <div className="flex gap-2 items-center">
                <p className="text-xl text-slate-600">{profile.username}</p>
                <button
                  onClick={() => setEditMode(true)}
                  className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => generateNewUsername()}
                  className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                  Regenerate
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="px-3 py-1 border rounded"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                >
                  Save
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </form>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="relative bg-gray-50 rounded-lg p-4">
              {editDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-32 p-2 border rounded"
                    placeholder="Write your description in Markdown..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setDescription(profile?.description || "");
                        setEditDescription(false);
                      }}
                      className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDescriptionSave}
                      className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{profile?.description || "*No description set*"}</ReactMarkdown>
                  <button
                    onClick={() => {
                      setDescription(profile?.description || "");
                      setEditDescription(true);
                    }}
                    className="absolute bottom-2 right-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full"
                    title="Edit description"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
