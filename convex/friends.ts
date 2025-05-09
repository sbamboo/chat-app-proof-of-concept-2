import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const sendFriendRequest = mutation({
  args: { recipientUsername: v.string() },
  handler: async (ctx, args) => {
    const senderId = await getAuthUserId(ctx);
    if (!senderId) throw new Error("Not authenticated");

    // Get sender's username
    const sender = await ctx.db
      .query("usermeta")
      .withIndex("by_user", (q) => q.eq("userId", senderId))
      .unique();
    if (!sender) throw new Error("Sender not found");

    // Get recipient's user ID
    const recipient = await ctx.db
      .query("usermeta")
      .withIndex("by_username", (q) => q.eq("username", args.recipientUsername))
      .unique();
    if (!recipient) throw new Error("User not found");

    // Check if request already exists
    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) => 
        q.eq("senderId", senderId).eq("recipientId", recipient.userId)
      )
      .unique();
    
    if (existingRequest) {
      if (existingRequest.status === "pending") {
        throw new Error("Friend request already sent");
      }
      // Update existing request if it was declined
      await ctx.db.patch(existingRequest._id, { status: "pending" });
      return;
    }

    // Create new request
    await ctx.db.insert("friendRequests", {
      senderId,
      senderUsername: sender.username,
      recipientId: recipient.userId,
      recipientUsername: recipient.username,
      status: "pending",
    });
  },
});

export const respondToFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.recipientId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.requestId, {
      status: args.accept ? "accepted" : "declined",
    });

    if (args.accept) {
      // Create DM conversation
      await ctx.db.insert("conversations", {
        type: "dm",
        initiatorId: userId,
        participants: [userId, request.senderId],
        icon: "default",
      });
    }
  },
});

export const removeFriend = mutation({
  args: {
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find and update both directions of the friendship
    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) => 
        q.eq("senderId", userId).eq("recipientId", args.friendId)
      )
      .collect();
    
    const reverseRequests = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) => 
        q.eq("senderId", args.friendId).eq("recipientId", userId)
      )
      .collect();

    // Update all relevant requests to declined
    for (const request of [...requests, ...reverseRequests]) {
      if (request.status === "accepted") {
        await ctx.db.patch(request._id, { status: "declined" });
      }
    }

    // Find and delete the DM conversation
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    for (const conversation of conversations) {
      if (
        conversation.type === "dm" &&
        conversation.participants.includes(args.friendId) &&
        conversation.participants.includes(userId)
      ) {
        // Delete all messages in the conversation
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect();
        
        for (const message of messages) {
          await ctx.db.delete(message._id);
        }

        // Delete the conversation
        await ctx.db.delete(conversation._id);
      }
    }
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("friendRequests")
      .withIndex("by_recipient", (q) => 
        q.eq("recipientId", userId).eq("status", "pending")
      )
      .collect();
  },
});

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sentRequests = await ctx.db
      .query("friendRequests")
      .withIndex("by_sender", (q) => 
        q.eq("senderId", userId).eq("status", "accepted")
      )
      .collect();

    const receivedRequests = await ctx.db
      .query("friendRequests")
      .withIndex("by_recipient", (q) => 
        q.eq("recipientId", userId).eq("status", "accepted")
      )
      .collect();

    const friends = new Map();
    for (const request of sentRequests) {
      friends.set(request.recipientId, {
        userId: request.recipientId,
        username: request.recipientUsername,
      });
    }
    for (const request of receivedRequests) {
      friends.set(request.senderId, {
        userId: request.senderId,
        username: request.senderUsername,
      });
    }

    return Array.from(friends.values());
  },
});
