import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertChatRoomSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { displayName, profileColor } = req.body;
      
      const updateData = {
        id: userId,
        displayName,
        profileColor,
      };
      
      const user = await storage.upsertUser(updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Chat room routes
  app.post('/api/chat-rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsedData = insertChatRoomSchema.parse(req.body);
      
      const chatRoom = await storage.createChatRoom(parsedData, userId);
      res.json(chatRoom);
    } catch (error) {
      console.error("Error creating chat room:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid chat room data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create chat room" });
      }
    }
  });

  app.get('/api/chat-rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRooms = await storage.getChatRoomsForUser(userId);
      res.json(chatRooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  app.get('/api/chat-rooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRoomId = req.params.id;
      
      // Check if user is member of the chat room
      const isMember = await storage.isMemberOfChatRoom(chatRoomId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied. You are not a member of this chat room." });
      }
      
      const chatRoom = await storage.getChatRoom(chatRoomId);
      if (!chatRoom) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      res.json(chatRoom);
    } catch (error) {
      console.error("Error fetching chat room:", error);
      res.status(500).json({ message: "Failed to fetch chat room" });
    }
  });

  app.post('/api/chat-rooms/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRoomId = req.params.id;
      
      const chatRoom = await storage.getChatRoom(chatRoomId);
      if (!chatRoom) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      
      // Check if already a member
      const isMember = await storage.isMemberOfChatRoom(chatRoomId, userId);
      if (isMember) {
        return res.status(400).json({ message: "You are already a member of this chat room" });
      }
      
      const member = await storage.joinChatRoom(chatRoomId, userId);
      res.json(member);
    } catch (error) {
      console.error("Error joining chat room:", error);
      res.status(500).json({ message: "Failed to join chat room" });
    }
  });

  // Message routes
  app.get('/api/chat-rooms/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRoomId = req.params.id;
      
      // Check if user is member of the chat room
      const isMember = await storage.isMemberOfChatRoom(chatRoomId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied. You are not a member of this chat room." });
      }
      
      const messages = await storage.getMessagesForChatRoom(chatRoomId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat-rooms/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRoomId = req.params.id;
      
      // Check if user is member of the chat room
      const isMember = await storage.isMemberOfChatRoom(chatRoomId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied. You are not a member of this chat room." });
      }
      
      const parsedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(chatRoomId, userId, parsedData);
      
      // Fetch the message with sender info
      const messageWithSender = {
        ...message,
        sender: await storage.getUser(userId)
      };
      
      res.json(messageWithSender);
    } catch (error) {
      console.error("Error creating message:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create message" });
      }
    }
  });

  // Typing indicator routes
  app.post('/api/chat-rooms/:id/typing', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRoomId = req.params.id;
      
      // Check if user is member of the chat room
      const isMember = await storage.isMemberOfChatRoom(chatRoomId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied. You are not a member of this chat room." });
      }
      
      await storage.setTypingIndicator(chatRoomId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting typing indicator:", error);
      res.status(500).json({ message: "Failed to set typing indicator" });
    }
  });

  app.delete('/api/chat-rooms/:id/typing', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRoomId = req.params.id;
      
      await storage.clearTypingIndicator(chatRoomId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing typing indicator:", error);
      res.status(500).json({ message: "Failed to clear typing indicator" });
    }
  });

  app.get('/api/chat-rooms/:id/typing', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatRoomId = req.params.id;
      
      // Check if user is member of the chat room
      const isMember = await storage.isMemberOfChatRoom(chatRoomId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied. You are not a member of this chat room." });
      }
      
      const indicators = await storage.getTypingIndicators(chatRoomId);
      // Filter out the current user from typing indicators
      const filteredIndicators = indicators.filter(indicator => indicator.userId !== userId);
      res.json(filteredIndicators);
    } catch (error) {
      console.error("Error fetching typing indicators:", error);
      res.status(500).json({ message: "Failed to fetch typing indicators" });
    }
  });

  // File upload route
  app.post('/api/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      const fileInfo = {
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size.toString(),
        mimeType: req.file.mimetype
      };
      
      res.json(fileInfo);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'uploads', req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Background cleanup for expired messages
  const cleanupExpiredMessages = async () => {
    try {
      await storage.cleanupExpiredMessages();
    } catch (error) {
      console.error("Error cleaning up expired messages:", error);
    }
  };

  // Run cleanup every hour
  setInterval(cleanupExpiredMessages, 60 * 60 * 1000);
  
  // Run initial cleanup
  cleanupExpiredMessages();

  const httpServer = createServer(app);
  return httpServer;
}
