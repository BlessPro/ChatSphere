# Real-Time Chat Application

A modern, browser-based real-time chat application built with React, Express.js, and PostgreSQL. Features user authentication, chat room creation, file sharing, and responsive design.

## 🚀 Features

- **User Authentication**: Secure login with Replit Auth integration
- **Chat Rooms**: Create private or public chat rooms with unique IDs
- **Real-Time Messaging**: Live message updates with 3-second polling
- **File Sharing**: Upload and share images, documents, and files (10MB limit)
- **Responsive Design**: Mobile-friendly interface with modern UI
- **User Profiles**: Customizable display names and profile colors

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **shadcn/ui** components for modern UI
- **TanStack Query** for state management
- **Wouter** for lightweight routing

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Drizzle ORM
- **Replit Auth** for authentication
- **Multer** for file uploads
- **Session management** with PostgreSQL storage

## 🏗️ Architecture

- **Frontend**: React SPA with component-based architecture
- **Backend**: RESTful API with Express.js
- **Database**: PostgreSQL with type-safe Drizzle ORM
- **Authentication**: OpenID Connect via Replit Auth
- **Real-time Updates**: HTTP polling (WebSocket-ready architecture)

## 📱 Key Components

### Database Schema
- **Users**: Profile management with customization
- **Chat Rooms**: Room metadata and privacy settings
- **Messages**: Text and file message support
- **Chat Room Members**: User-room relationships
- **Sessions**: Secure session persistence

### API Endpoints
- `GET/POST /api/chat-rooms` - Room management
- `GET/POST /api/chat-rooms/:id/messages` - Message handling
- `POST /api/chat-rooms/:id/join` - Room joining
- `POST /api/upload` - File upload handling
- `GET /api/auth/user` - User authentication

## 🔧 Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Replit environment (for auth integration)

### Installation
```bash
npm install
```

### Environment Variables
```bash
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
REPL_ID=your_replit_app_id
REPLIT_DOMAINS=your_domain
```

### Run Development Server
```bash
npm run dev
```

### Database Migration
```bash
npm run db:push
```

## 🌟 Usage

1. **Sign Up/Login**: Authenticate using Replit Auth
2. **Setup Profile**: Choose display name and profile color
3. **Create Room**: Start a new chat room with custom settings
4. **Join Room**: Use room ID or invitation link to join existing rooms
5. **Chat & Share**: Send messages, share files, and communicate in real-time

## 🔮 Future Enhancements

- WebSocket integration for true real-time messaging
- Push notifications for new messages
- WebRTC for peer-to-peer communication
- Message encryption and enhanced security
- Advanced file format support
- User status indicators (online/offline)
- Message reactions and threading

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using modern web technologies and deployed on Replit.