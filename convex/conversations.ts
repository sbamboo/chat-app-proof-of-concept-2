import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all conversations and filter in memory
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const userConversations = conversations.filter(conv => 
      conv.participants.includes(userId)
    );

    // Fetch usernames for all participants
    const userIds = new Set<string>();
    userConversations.forEach((conv) => {
      conv.participants.forEach((id) => userIds.add(id));
    });

    const usernames = new Map<string, string>();
    for (const id of Array.from(userIds)) {
      const user = await ctx.db
        .query("usermeta")
        .withIndex("by_user", (q) => q.eq("userId", id as any))
        .unique();
      if (user) {
        usernames.set(id, user.username);
      }
    }

    return userConversations.map((conv) => ({
      ...conv,
      participants: conv.participants.map((id) => ({
        id,
        username: usernames.get(id) || "Unknown",
      })),
    }));
  },
});

export const createGroup = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("usermeta")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("conversations", {
      type: "group",
      name: `${user.username}'s Group`,
      initiatorId: userId,
      participants: [userId],
      icon: "default",
    });
  },
});

export const addMembers = mutation({
  args: {
    conversationId: v.id("conversations"),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participants.includes(userId)) throw new Error("Not authorized");
    if (conversation.type !== "group") throw new Error("Not a group conversation");

    // Add new members
    const newParticipants = [...new Set([...conversation.participants, ...args.memberIds])];
    await ctx.db.patch(args.conversationId, {
      participants: newParticipants,
    });
  },
});

export const leaveGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participants.includes(userId)) throw new Error("Not a member");
    if (conversation.type !== "group") throw new Error("Not a group conversation");

    const newParticipants = conversation.participants.filter(id => id !== userId);
    
    if (newParticipants.length === 0) {
      // Delete all messages first
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
        .collect();
      
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      // Then delete the group if no participants left
      await ctx.db.delete(args.conversationId);
    } else {
      // Update participants list
      await ctx.db.patch(args.conversationId, {
        participants: newParticipants,
      });
    }
  },
});

export const updateGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participants.includes(userId)) throw new Error("Not authorized");
    if (conversation.type !== "group") throw new Error("Not a group conversation");

    const updates: { name?: string; icon?: string } = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.icon !== undefined) updates.icon = args.icon;

    await ctx.db.patch(args.conversationId, updates);
  },
});
