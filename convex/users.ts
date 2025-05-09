import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateUsername() {
  const adjectives = ["Happy", "Clever", "Swift", "Bright", "Cool"];
  const nouns = ["Panda", "Tiger", "Eagle", "Fox", "Wolf"];
  const number = Math.floor(Math.random() * 1000);
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${
    nouns[Math.floor(Math.random() * nouns.length)]
  }${number}`;
}

export const getUsername = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const existingUsername = await ctx.db
      .query("usermeta")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    return existingUsername?.username;
  },
});

export const generateNewUsername = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let newUsername: string = generateUsername();
    let existingWithUsername = await ctx.db
      .query("usermeta")
      .withIndex("by_username", (q) => q.eq("username", newUsername))
      .unique();
    
    // Keep trying until we find a unique username
    while (existingWithUsername) {
      newUsername = generateUsername();
      existingWithUsername = await ctx.db
        .query("usermeta")
        .withIndex("by_username", (q) => q.eq("username", newUsername))
        .unique();
    }

    const existingUsername = await ctx.db
      .query("usermeta")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (existingUsername) {
      await ctx.db.patch(existingUsername._id, { username: newUsername });
    } else {
      await ctx.db.insert("usermeta", { 
        userId, 
        username: newUsername,
        extended: "{}" // Default value for new users
      });
    }
    return newUsername;
  },
});

export const updateUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if username is already taken
    const existingWithUsername = await ctx.db
      .query("usermeta")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    
    if (existingWithUsername) {
      throw new Error("Username already taken");
    }

    const existingUsername = await ctx.db
      .query("usermeta")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (existingUsername) {
      await ctx.db.patch(existingUsername._id, { username: args.username });
    } else {
      await ctx.db.insert("usermeta", { 
        userId, 
        username: args.username,
        extended: "{}" // Default value for new users
      });
    }
  },
});

// New mutation to update profile fields
export const updateProfile = mutation({
  args: {
    profileImage: v.optional(v.string()),
    description: v.optional(v.string()),
    extended: v.optional(v.string()), // Must be valid JSON string
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate extended JSON if provided
    if (args.extended) {
      try {
        JSON.parse(args.extended);
      } catch (e) {
        throw new Error("Invalid JSON in extended field");
      }
    }

    const existingProfile = await ctx.db
      .query("usermeta")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    if (existingProfile) {
      // Only update provided fields
      const updates: {
        profileImage?: string;
        description?: string;
        extended?: string;
      } = {};
      
      if (args.profileImage !== undefined) updates.profileImage = args.profileImage;
      if (args.description !== undefined) updates.description = args.description;
      if (args.extended !== undefined) updates.extended = args.extended;

      await ctx.db.patch(existingProfile._id, updates);
    } else {
      // Create new profile with defaults
      await ctx.db.insert("usermeta", {
        userId,
        username: generateUsername(), // Generate a username since we need one
        profileImage: args.profileImage,
        description: args.description,
        extended: args.extended ?? "{}", // Use provided or default
      });
    }
  },
});

// New query to get full profile
export const getProfile = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const requesterId = await getAuthUserId(ctx);
    if (!requesterId) return null;

    // If no userId provided, get requester's profile
    const targetUserId = args.userId ?? requesterId;

    const profile = await ctx.db
      .query("usermeta")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .unique();
    
    return profile;
  },
});
