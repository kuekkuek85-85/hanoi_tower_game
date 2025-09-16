# 하노이타워 게임 웹사이트

## Overview

This is an educational web-based Tower of Hanoi game designed for middle school students. The application allows students to play the classic puzzle with 3-10 disks, save their records, and view a leaderboard of achievements. The game emphasizes intuitive learning of problem-solving strategies through drag-and-drop gameplay and provides audio feedback for enhanced user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks for local state, TanStack Query for server state
- **Game Logic**: Custom hooks managing game state, drag-and-drop interactions, and audio feedback

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **API Pattern**: RESTful API design with `/api` prefix routing
- **Database Layer**: Drizzle ORM with PostgreSQL dialect
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development
- **Build Process**: ESBuild for server bundling, Vite for client bundling

### Game Engine
- **Drag and Drop**: Pointer Events API for cross-platform touch/mouse support
- **Audio System**: Web Audio API with preloaded sound effects
- **Game State**: Immutable state management with history tracking for undo functionality
- **Validation**: Real-time rule checking for valid moves (larger disk cannot be placed on smaller disk)

### Data Models
- **Game Records**: Student ID (5 digits), name, disk count, move count, completion time, and timestamp
- **Input Validation**: Regex pattern matching for student information format
- **Game Statistics**: Move efficiency calculation and performance tracking

### Development Environment
- **Hot Reload**: Vite development server with HMR support
- **Error Handling**: Runtime error overlay for development
- **Path Aliases**: TypeScript path mapping for clean imports
- **Asset Management**: Static asset handling with Vite's asset pipeline

## External Dependencies

### Database and Storage
- **Supabase Database**: Cloud PostgreSQL 17.6 database with real-time capabilities
- **Drizzle**: Type-safe ORM with `drizzle-orm` and schema generation
- **Session Storage**: PostgreSQL session store with `connect-pg-simple`
- **Migration**: Successfully migrated from local PostgreSQL to Supabase cloud database (September 2025)

### UI and Interaction
- **Radix UI**: Comprehensive primitive component library for accessibility
- **Embla Carousel**: Touch-friendly carousel component
- **React Hook Form**: Form state management with validation
- **Date-fns**: Date manipulation and formatting utilities

### Development Tools
- **Replit Integration**: Custom Vite plugins for Replit environment
- **TypeScript**: Full type safety across client and server
- **ESLint/Prettier**: Code quality and formatting (configured via package.json)

### Audio and Media
- **Web Audio API**: Native browser audio capabilities for game sound effects
- **Preloaded Assets**: Sound files for move success and error feedback

### Build and Deployment
- **Vite**: Modern build tool with ES modules support
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **Replit Deployment**: Configured for Replit hosting environment with custom error handling and development banners