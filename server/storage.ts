import {
  users,
  chatRooms,
  chatRoomMembers,
  messages,
  type User,
  type UpsertUser,
  type ChatRoom,
  type ChatRoomMember,
  type Message,
  type InsertChatRoom,
  type InsertMessage,
  type ChatRoomWithMembers,
  type MessageWithSender,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Chat room operations
  createChatRoom(chatRoom: InsertChatRoom, createdBy: string): Promise<ChatRoom>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  getChatRoomsForUser(userId: string): Promise<ChatRoomWithMembers[]>;
  joinChatRoom(chatRoomId: string, userId: string): Promise<ChatRoomMember>;
  isMemberOfChatRoom(chatRoomId: string, userId: string): Promise<boolean>;
  
  // Message operations
  createMessage(chatRoomId: string, senderId: string, message: InsertMessage): Promise<Message>;
  getMessagesForChatRoom(chatRoomId: string): Promise<MessageWithSender[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatRooms: Map<string, ChatRoom>;
  private chatRoomMembers: Map<string, ChatRoomMember>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.chatRooms = new Map();
    this.chatRoomMembers = new Map();
    this.messages = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      ...existingUser,
      ...userData,
      id: userData.id || randomUUID(),
      displayName: userData.displayName || null,
      profileColor: userData.profileColor || 'blue',
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Chat room operations
  async createChatRoom(chatRoom: InsertChatRoom, createdBy: string): Promise<ChatRoom> {
    const id = this.generateChatId();
    const newChatRoom: ChatRoom = {
      id,
      name: chatRoom.name,
      description: chatRoom.description || null,
      isPrivate: chatRoom.isPrivate || false,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.chatRooms.set(id, newChatRoom);
    
    // Add creator as member
    await this.joinChatRoom(id, createdBy);
    
    return newChatRoom;
  }

  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }

  async getChatRoomsForUser(userId: string): Promise<ChatRoomWithMembers[]> {
    const userMemberships = Array.from(this.chatRoomMembers.values())
      .filter(member => member.userId === userId);
    
    const chatRoomsWithMembers: ChatRoomWithMembers[] = [];
    
    for (const membership of userMemberships) {
      const chatRoom = this.chatRooms.get(membership.chatRoomId);
      if (chatRoom) {
        const members = Array.from(this.chatRoomMembers.values())
          .filter(member => member.chatRoomId === chatRoom.id)
          .map(member => ({
            ...member,
            user: this.users.get(member.userId)!
          }));
        
        const roomMessages = Array.from(this.messages.values())
          .filter(msg => msg.chatRoomId === chatRoom.id)
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        
        const lastMessage = roomMessages[0] ? {
          ...roomMessages[0],
          sender: this.users.get(roomMessages[0].senderId)!
        } : undefined;
        
        chatRoomsWithMembers.push({
          ...chatRoom,
          members,
          lastMessage,
          unreadCount: 0, // TODO: Implement proper unread count
        });
      }
    }
    
    return chatRoomsWithMembers.sort((a, b) => 
      new Date(b.lastMessage?.createdAt || b.createdAt!).getTime() - 
      new Date(a.lastMessage?.createdAt || a.createdAt!).getTime()
    );
  }

  async joinChatRoom(chatRoomId: string, userId: string): Promise<ChatRoomMember> {
    const id = randomUUID();
    const member: ChatRoomMember = {
      id,
      chatRoomId,
      userId,
      joinedAt: new Date(),
    };
    this.chatRoomMembers.set(id, member);
    return member;
  }

  async isMemberOfChatRoom(chatRoomId: string, userId: string): Promise<boolean> {
    return Array.from(this.chatRoomMembers.values())
      .some(member => member.chatRoomId === chatRoomId && member.userId === userId);
  }

  // Message operations
  async createMessage(chatRoomId: string, senderId: string, message: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const newMessage: Message = {
      id,
      chatRoomId,
      senderId,
      content: message.content || null,
      messageType: message.messageType || 'text',
      fileName: message.fileName || null,
      fileUrl: message.fileUrl || null,
      fileSize: message.fileSize || null,
      createdAt: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesForChatRoom(chatRoomId: string): Promise<MessageWithSender[]> {
    const roomMessages = Array.from(this.messages.values())
      .filter(msg => msg.chatRoomId === chatRoomId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    
    return roomMessages.map(message => ({
      ...message,
      sender: this.users.get(message.senderId)!
    }));
  }

  private generateChatId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const storage = new MemStorage();
