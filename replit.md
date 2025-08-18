# Overview

This is a browser-based real-time chat application built with React, Express.js, and PostgreSQL. The application allows users to create and join chat rooms, send messages and files, and receive real-time updates. It features user authentication via Replit Auth, a modern UI built with shadcn/ui components, and a clean architectural separation between frontend and backend.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for fast development and builds
- **UI Components**: shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **File Uploads**: Multer middleware for handling multipart form data (images, videos, files)
- **API Design**: RESTful API endpoints with proper error handling and logging middleware

## Database Schema
- **Users Table**: Stores user profiles with display names, profile colors, and Replit Auth integration
- **Chat Rooms Table**: Contains room metadata, privacy settings, and creation details
- **Chat Room Members Table**: Junction table for user-room relationships
- **Messages Table**: Stores all chat messages with support for different message types (text, file, image, video)
- **Sessions Table**: Required for Replit Auth session persistence

## Real-time Communication
- **Current Implementation**: HTTP polling every 3 seconds for message updates
- **Architecture Ready**: Structure supports WebSocket integration for true real-time communication
- **File Sharing**: Support for multiple file types with preview capabilities

## Authentication & Authorization
- **Provider**: Replit Auth (mandatory for deployment environment)
- **Flow**: OpenID Connect with automatic user creation and profile management
- **Session Security**: HTTP-only cookies with CSRF protection and secure flags
- **User Profiles**: Customizable display names and avatar colors

# External Dependencies

## Core Runtime Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations and migrations
- **express**: Web application framework for Node.js backend
- **passport**: Authentication middleware with OpenID Connect strategy

## Frontend UI Libraries
- **@radix-ui/\***: Comprehensive set of low-level UI primitives for accessibility
- **@tanstack/react-query**: Powerful data synchronization library for React
- **tailwindcss**: Utility-first CSS framework for styling
- **wouter**: Minimalist routing library for React applications

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety across the entire codebase
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay integration
- **esbuild**: Fast JavaScript bundler for production builds

## File Upload & Processing
- **multer**: Node.js middleware for handling multipart/form-data
- **File size limits**: 10MB maximum per file upload
- **Supported formats**: Images, videos, and general file attachments

## Database & Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **drizzle-kit**: Database migration and schema management toolkit
- **Session TTL**: 7-day session persistence with automatic cleanup