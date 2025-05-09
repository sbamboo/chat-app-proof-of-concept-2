import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  usermeta: defineTable({
    userId: v.id("users"),
    username: v.string(),
    profileImage: v.optional(v.string()),
    description: v.optional(v.string()),
    extended: v.optional(v.string()), // Make optional temporarily
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"]),
  
  friendRequests: defineTable({
    senderId: v.id("users"),
    senderUsername: v.string(),
    recipientId: v.id("users"),
    recipientUsername: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
  })
    .index("by_recipient", ["recipientId", "status"])
    .index("by_sender", ["senderId", "status"])
    .index("by_users", ["senderId", "recipientId"]),

  conversations: defineTable({
    type: v.union(v.literal("dm"), v.literal("group")),
    name: v.optional(v.string()),
    initiatorId: v.id("users"),
    participants: v.array(v.id("users")),
    icon: v.string(),
  })
    .index("by_participant", ["participants"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    authorId: v.id("users"),
    content: v.string(),
  })
    .index("by_conversation", ["conversationId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
