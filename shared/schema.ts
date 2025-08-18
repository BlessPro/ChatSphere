import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  displayName: varchar("display_name"),
  profileColor: varchar("profile_color").default('blue'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat rooms table
export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat room members table
export const chatRoomMembers = pgTable("chat_room_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull().references(() => chatRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull().references(() => chatRooms.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content"),
  messageType: varchar("message_type").default('text'), // 'text', 'file', 'image'
  fileName: varchar("file_name"),
  fileUrl: varchar("file_url"),
  fileSize: varchar("file_size"),
  // Thread support - using string reference to avoid circular dependency
  replyToId: varchar("reply_to_id"),
  // Auto-deletion support (24hr disappearing messages)
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '24 hours'`),
  createdAt: timestamp("created_at").defaultNow(),
});

// Typing indicators table
export const typingIndicators = pgTable("typing_indicators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull().references(() => chatRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  displayName: true,
  profileColor: true,
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  name: true,
  description: true,
  isPrivate: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  messageType: true,
  fileName: true,
  fileUrl: true,
  fileSize: true,
  replyToId: true,
});

export const insertTypingIndicatorSchema = createInsertSchema(typingIndicators).pick({
  chatRoomId: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertTypingIndicator = z.infer<typeof insertTypingIndicatorSchema>;
export type TypingIndicator = typeof typingIndicators.$inferSelect;

// Extended types with relations
export type ChatRoomWithMembers = ChatRoom & {
  members: (ChatRoomMember & { user: User })[];
  lastMessage?: Message & { sender: User };
  unreadCount: number;
};

export type MessageWithSender = Message & {
  sender: User;
  replyTo?: MessageWithSender;
};

export type TypingIndicatorWithUser = TypingIndicator & {
  user: User;
};
