import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return []; // Return empty array instead of throwing

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      return []; // Return empty list instead of throwing
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc") // Changed to ascending order so newest are at bottom
      .collect();
  },
});

export const send = mutation({
  args: { 
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error("Not authorized");
    }

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      authorId: userId,
      content: args.content,
    });
  },
});
