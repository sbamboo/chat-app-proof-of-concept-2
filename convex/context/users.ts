import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const getProfile = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("usermeta")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      return {
        userId: args.userId,
        username: "Unknown",
        profileImage: "default",
        description: "",
        extended: "{}"
      };
    }

    return {
      userId: profile.userId,
      username: profile.username,
      profileImage: profile.profileImage || "default",
      description: profile.description || "",
      extended: profile.extended || "{}"
    };
  },
});
