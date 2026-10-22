# TaskFlow 🚀

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14.1.1-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-5.21.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Microservices-Architecture-orange?style=for-the-badge&logo=micro.blog&logoColor=white" alt="Microservices" />
</div>

<br />

<div align="center">
  <h3>A comprehensive productivity and collaboration platform built with modern web technologies and microservices architecture</h3>
  <p>Streamline your workflow with intelligent task management, real-time collaboration, and gamified productivity tracking.</p>
</div>

---

## ✨ Features Overview

TaskFlow is a full-stack productivity platform that combines task management, mind mapping, time tracking, and collaboration tools into one seamless experience. Built with Next.js 14, microservices architecture, and powered by advanced features like real-time synchronization, AI integration, and a comprehensive gamification system.

### 🎯 Core Features

- **Smart Task Management** - Rich text editor with auto-save, tagging, assignments, and deadline tracking
- **Interactive Mind Maps** - Visual project planning with drag-and-drop functionality
- **Pomodoro Timer** - Built-in focus sessions with customizable settings
- **Real-time Collaboration** - Live workspace sharing with role-based permissions
- **Gamified Points System** - Earn points and achievements for productivity
- **DSA Practice Integration** - Coding practice with LeetCode integration
- **Calendar Integration** - Unified calendar view for tasks and deadlines
- **Notes System** - Rich text notes with collaboration features
- **Chat System** - Real-time messaging within workspaces
- **🔐 Dedicated Auth Service** - Separate microservice for authentication and onboarding

---

## 🏗️ Architecture

TaskFlow uses a **microservices architecture** for better scalability and maintainability:

- **Main App** (Port 3000) - Next.js frontend and core features
- **Auth Service** (Port 3003) - Authentication, OAuth, and onboarding
- **Socket Server** (Port 3002) - Real-time communication
- **Redis** (Port 6379) - Caching and session storage
- **PostgreSQL** (Port 5432) - Shared database for main app and auth service

📖 See [MICROSERVICES_ARCHITECTURE.md](./MICROSERVICES_ARCHITECTURE.md) for detailed architecture documentation.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Rich Text Editor**: TipTap
- **State Management**: Zustand + React Query
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend & Microservices
- **Runtime**: Node.js
- **Frameworks**: Next.js API Routes, Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js + JWT
- **Real-time**: Socket.io
- **Cache**: Redis
- **File Upload**: UploadThing
- **Email**: Nodemailer

### AI & External Services
- **AI Integration**: Google Gemini AI
- **LeetCode Integration**: leetcode-query
- **Calendar**: Google Calendar API
- **Storage**: Supabase (optional)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Redis (optional, for development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AayusBhat26/TaskFlow.git
   cd TaskFlow
   ```

2. **Install dependencies for all services**
   ```bash
   npm install
   cd auth-service
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   cp auth-service/.env.example auth-service/.env
   ```

   Update `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/taskflow"
   DIRECT_URL=""

   # Microservices
   AUTH_SERVICE_URL="http://localhost:3003"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"

   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"

   # Socket.io
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"
   SOCKET_PORT=3002
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # File Upload
   UPLOADTHING_TOKEN="your-uploadthing-token"

   # Billing (the built-in test gateway moves no money)
   BILLING_ALLOW_TEST_PAYMENTS="true"
   RAZORPAY_KEY_ID=""
   RAZORPAY_KEY_SECRET=""
   NEXT_PUBLIC_RAZORPAY_KEY_ID=""
   RAZORPAY_WEBHOOK_SECRET=""

   # Optional: Supabase
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate

   # Generate Prisma client for auth service
   cd auth-service
   npx prisma generate --schema=../prisma/schema.prisma
   cd ..
   ```

5. **Start all services**

   **Option A: Manual start (Recommended for development)**
   ```bash
   # Use the startup script
   start-all-services.bat  # Windows
   # or
   ./start-all-services.sh  # Linux/Mac

   # Then open separate terminals for each service:

   # Terminal 1 - Main App
   npm run dev

   # Terminal 2 - Auth Service
   cd auth-service
   npm run dev

   # Terminal 3 - Socket Server (if needed)
   cd socket-server
   npm start
   ```

   **Option B: Docker Compose**
   ```bash
   docker-compose --profile dev up
   ```

6. **Access the application**
   - Main App: [http://localhost:3000](http://localhost:3000)
   - Auth Service: [http://localhost:3003/health](http://localhost:3003/health)
   - Socket Server: [http://localhost:3002](http://localhost:3002)

---

## 🔐 Authentication Microservice

TaskFlow uses a dedicated authentication microservice for handling all auth-related operations:

- **Registration**: Email/password user registration
- **Login**: JWT-based authentication
- **OAuth**: Google, GitHub, and Apple sign-in
- **Onboarding**: New user onboarding flow
- **Shared Database**: Uses the same PostgreSQL database as the main app

📖 See [AUTH_MICROSERVICE_MIGRATION.md](./AUTH_MICROSERVICE_MIGRATION.md) for migration details and API documentation.

---

## 📋 Detailed Features

### 🎯 Task Management System

TaskFlow's task management system is built for both individual productivity and team collaboration.

#### Key Features:
- **Rich Text Editor**: Powered by TipTap with markdown support
- **Auto-save**: Never lose your work with automatic saving
- **Task Assignment**: Assign tasks to team members
- **Tags & Categories**: Organize tasks with customizable tags
- **Due Dates**: Set deadlines with calendar integration
- **Priority Levels**: High, medium, low priority classification
- **Status Tracking**: Todo, In Progress, Review, Completed
- **Time Tracking**: Built-in timer to track time spent on tasks
- **Comments**: Discuss tasks with team members
- **File Attachments**: Upload and attach files to tasks

#### Task Creation Flow:
1. Click "New Task" from any workspace
2. Choose from templates or start blank
3. Add title, description, and details
4. Assign to team members
5. Set tags, priority, and due date
6. Save and track progress

### 🧠 Mind Maps

Visual thinking made easy with interactive mind maps.

#### Features:
- **Drag & Drop Interface**: Intuitive node manipulation
- **Real-time Collaboration**: Multiple users editing simultaneously
- **Custom Styling**: Colors, shapes, and themes
- **Export Options**: PNG, SVG, PDF exports
- **Task Integration**: Convert mind map nodes to tasks
- **Infinite Canvas**: Unlimited space for your ideas
- **Auto-layout**: Smart positioning algorithms
- **Version History**: Track changes over time

#### Mind Map Types:
- **Project Planning**: Break down complex projects
- **Brainstorming**: Capture ideas and concepts
- **Process Mapping**: Visualize workflows
- **Knowledge Management**: Organize information hierarchically

### ⏰ Pomodoro Timer

Built-in focus timer to enhance productivity using the Pomodoro Technique.

#### Features:
- **Customizable Sessions**: 15-60 minute work sessions
- **Break Management**: Short (5min) and long (15-30min) breaks
- **Sound Notifications**: Various alert sounds with volume control
- **Session Tracking**: Track completed sessions
- **Points Integration**: Earn points for completed sessions (10-45 points)
- **Workspace Context**: Track sessions within specific workspaces
- **Statistics**: View productivity patterns and trends

#### Pomodoro Settings:
- Work Duration: 5-60 minutes
- Short Break: 1-15 minutes
- Long Break: 10-45 minutes
- Long Break Interval: Every 2-10 sessions
- Total Rounds: 1-10 rounds per cycle

### 🎮 Points & Gamification System

Stay motivated with a comprehensive points and achievements system.

#### Point Earning:
- **Task Completion**: 5 points per task
- **Pomodoro Sessions**:
  - 25 minutes: 10 points
  - 30-40 minutes: 20 points
  - 60+ minutes: 45 points
- **DSA Questions**:
  - Easy: 30 points
  - Medium: 50 points
  - Hard: 80 points

#### Achievement System:
- **Daily Streaks**: Consecutive days of activity
- **Task Master**: Complete milestone numbers of tasks
- **Focus Champion**: Complete multiple pomodoro sessions
- **Code Warrior**: Solve DSA problems consistently
- **Team Player**: Active collaboration in workspaces

#### Leaderboards:
- **Total Points**: Overall productivity ranking
- **Weekly Performance**: Current week's activity
- **Task Completion**: Most tasks completed
- **Pomodoro Sessions**: Most focused time

### 👥 Collaboration & Workspaces

Built for teams with advanced collaboration features.

#### Workspace Management:
- **Role-based Permissions**:
  - **Owner**: Full access, can delete workspace
  - **Admin**: Manage users, settings, and content
  - **Editor**: Create and edit content
  - **Viewer**: Read-only access
- **Invite System**: Share workspaces via email or links
- **Real-time Updates**: See changes as they happen
- **Activity Feed**: Track all workspace activity
- **User Presence**: See who's online and active

#### Real-time Features:
- **Live Cursors**: See where team members are working
- **Instant Sync**: Changes appear immediately
- **Conflict Resolution**: Smart handling of simultaneous edits
- **Offline Support**: Work offline, sync when reconnected

### 💬 Chat System
Integrated messaging for seamless team communication.

#### Features:
- **Workspace Channels**: Dedicated chat per workspace
- **Real-time Messaging**: Instant message delivery
- **File Sharing**: Share files directly in chat
- **Emoji Support**: Rich emoji picker
- **Message History**: Search and browse past messages
- **Notifications**: Desktop and in-app notifications
- **User Status**: Online/offline indicators

### 💳 Plans, Checkout and Billing

TaskFlow plans are **prepaid**: a purchase unlocks the plan until a fixed date
and never charges automatically. Users can extend the same plan from the
upgrade page, and the added period stacks onto the time that remains.

- **Built-in TaskFlow Pay gateway (local/test)** – enabled with
  `BILLING_ALLOW_TEST_PAYMENTS="true"`. It collects no payment details and
  moves no money, but exercises the complete order lifecycle and activates the
  plan immediately. A prominent "Test mode" badge is shown at checkout.
- **Razorpay (live)** – set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
  `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_WEBHOOK_SECRET`, then set
  `BILLING_ALLOW_TEST_PAYMENTS="false"`. Checkout uses Razorpay Orders and the
  signature is verified server-side before the plan is granted. Register the
  webhook `https://your-domain/api/webhooks/razorpay` for `payment.captured` and
  `order.paid`; the webhook verifies `x-razorpay-signature`, checks the amount
  and activates the plan even if the browser closes before verification.
- **Ledger** – every attempt is stored in the `BillingOrder` table with amount,
  interval, provider, receipt and payment state. Paid plans store
  `planStartedAt` / `planExpiresAt` on the user.
- **Expiry** – an expired plan is treated as Free by theme gating, the mind-map
  limit and the session. Billing screens also reconcile the stored plan back to
  Free the next time they load.

### 📅 Calendar Integration

Unified calendar view for all your tasks and deadlines.

#### Features:
- **Multiple Views**: Month, week, day views
- **Task Integration**: See all task deadlines
- **Drag & Drop**: Reschedule tasks by dragging
- **Color Coding**: Different colors for different workspaces
- **External Sync**: Google Calendar integration (coming soon)
- **Time Blocking**: Dedicated time slots for focused work
- **Event Creation**: Create events directly from calendar

### 💻 DSA Practice Integration

Integrated coding practice with progress tracking.

#### Features:
- **LeetCode Integration**: Import problems and track progress
- **Difficulty-based Points**: Earn more points for harder problems
- **Progress Tracking**: Monitor solving patterns
- **Topic Organization**: Group problems by algorithms/data structures
- **Statistics Dashboard**: View solving statistics
- **Custom Problem Sets**: Create curated problem collections

#### Supported Topics:
- Arrays & Strings
- Linked Lists
- Trees & Graphs
- Dynamic Programming
- Sorting & Searching
- Hash Tables
- And many more...

### 📝 Notes System

Rich note-taking with collaboration features.

#### Features:
- **Rich Text Editor**: Full formatting capabilities
- **Real-time Collaboration**: Multiple users editing simultaneously
- **Version History**: Track changes and revert if needed
- **Tagging System**: Organize notes with tags
- **Search Functionality**: Full-text search across all notes
- **Export Options**: Markdown, PDF, HTML exports
- **Templates**: Pre-built note templates
- **Linking**: Link between notes and tasks

---

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npx prisma migrate dev  # Run database migrations
npx prisma generate     # Generate Prisma client
npx prisma studio       # Open Prisma Studio

# DSA Data Management
npm run import-dsa      # Import DSA questions from LeetCode
npm run debug-dsa       # Debug DSA import process
npm run fresh-import-dsa # Fresh import of DSA data
npm run seed-curated    # Seed curated questions
npm run check-db        # Check database state
npm run remove-duplicates # Remove duplicate DSA questions
npm run normalize-topics # Normalize topic names
npm run test-points     # Test points system
```

---

## 📁 Project Structure

```
taskflow/
├── app/                    # Next.js 14 App Router
│   ├── [locale]/          # Internationalization
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── tasks/            # Task-related components
│   ├── mindMaps/         # Mind map components
│   ├── pomodoro/         # Pomodoro timer components
│   ├── auth/             # Authentication components
│   └── ...
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   ├── points.ts         # Points system logic
│   └── utils.ts          # General utilities
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── services/             # Business logic services
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── socket-server/        # Socket.io server
├── scripts/              # Database and utility scripts
└── public/               # Static assets
```

---

## 🔐 Authentication & Security

### Authentication Methods
- **Email/Password**: Traditional signup with bcrypt hashing
- **Google OAuth**: Sign in with Google account
- **GitHub OAuth**: Sign in with GitHub account

New OAuth users are sent to the dashboard, which redirects them into onboarding until they have a workspace.

### Enabling Google and GitHub sign-in

Set `NEXTAUTH_URL` to the exact origin you use locally or in production, then create the providers:

**Google**
1. Open [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. Configure the OAuth consent screen. For local testing, choose **External** / **Testing** and add your Google account as a test user.
3. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
4. Add an authorized JavaScript origin: `http://localhost:3005` (or your domain).
5. Add an authorized redirect URI: `http://localhost:3005/api/auth/callback/google`.
6. Copy the client ID and client secret into `.env`:
   ```env
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```

**GitHub**
1. Open [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers) and click **New OAuth App**.
2. Set the homepage URL to `http://localhost:3005` (or your domain).
3. Set the authorization callback URL to `http://localhost:3005/api/auth/callback/github`.
4. Generate a client secret and add both values to `.env`:
   ```env
   GITHUB_CLIENT_ID="..."
   GITHUB_CLIENT_SECRET="..."
   ```

Restart the app after changing `.env`. Both buttons stay visible on the auth screens; a provider shows **Setup needed** until its pair of variables is present.

### Security Features
- **JWT Tokens**: Secure session management
- **CSRF Protection**: Cross-site request forgery protection
- **Input Validation**: Zod schema validation
- **Rate Limiting**: API rate limiting with express-rate-limit
- **Password Hashing**: bcrypt with salt rounds
- **Environment Variables**: Sensitive data protection

---

## 🌐 Internationalization

TaskFlow supports multiple languages with next-intl:

### Supported Languages
- **English (en)**: Default language
- **Telugu (te)**: Regional language support

### Adding New Languages
1. Create message files in `messages/[locale].json`
2. Add locale to `i18n.ts` configuration
3. Update middleware for locale routing

---

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

### Core Models
- **User**: User accounts and profiles
- **Workspace**: Team workspaces
- **Task**: Task management
- **MindMap**: Mind map data
- **PomodoroSession**: Focus session tracking
- **PointTransaction**: Points and rewards
- **Notification**: System notifications

### Relationships
- Users can belong to multiple workspaces
- Tasks and mind maps belong to workspaces
- Points are tracked per user globally
- Real-time features use optimistic updates

---

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Run migrations: `npx prisma migrate deploy`
4. Start the application: `npm start`
5. Set up Socket.io server separately

### Environment Setup
- Set up PostgreSQL database (local or cloud)
- Configure OAuth applications (Google, GitHub)
- Set up UploadThing for file uploads
- Configure Socket.io server

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** (if applicable)
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use the existing code style
- Add proper error handling
- Include JSDoc comments for functions
- Test your changes thoroughly

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Prisma](https://prisma.io/) - Modern database access
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [TipTap](https://tiptap.dev/) - Rich text editor
- [Socket.io](https://socket.io/) - Real-time communication
- [React Query](https://tanstack.com/query) - Data fetching and caching

---

## 🐛 Known Issues & Roadmap

### Current Limitations
- Mobile responsiveness needs improvement
- Calendar sync with external providers (in progress)
- Offline mode limitations
- File size limits for uploads

### Upcoming Features
- Mobile app (React Native)
- Advanced reporting and analytics
- Integration with more productivity tools
- AI-powered task suggestions
- Advanced workflow automation
- Video conferencing integration

---

## 📞 Support

If you encounter any issues or have questions:

1. **Check the documentation** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join our community** discussions

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/AayusBhat26">Aayus Bhat</a></p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
