# TradeTrackr - Advanced Trading Journal Platform

A comprehensive trading journal and analytics platform built with React, TypeScript, and Supabase. TradeTrackr helps traders track their performance, analyze trading patterns, and improve their strategies through detailed trade logging and advanced analytics.

## 🚀 Features

### 📊 Dashboard & Analytics
- **Real-time Performance Metrics**: Track total trades, P&L, win rate, and growth trends
- **Interactive Charts**: Visualize profit over time with responsive line charts
- **Trading Session Analysis**: Compare performance across different market sessions (London, New York, Tokyo, Sydney)
- **Win/Loss Ratio Tracking**: Detailed breakdown of trading outcomes

### 💼 Account Management
- **Multiple Trading Accounts**: Create and manage multiple trading accounts
- **Account-specific Tracking**: Associate trades with specific accounts
- **Balance Management**: Track starting balances and account performance
- **CRUD Operations**: Full create, read, update, delete functionality for accounts

### 📈 Advanced Trade Logging
- **Comprehensive Trade Details**: Log entry/exit prices, dates, times, and market conditions
- **Forex-Specific Features**:
  - Advanced P&L calculations for 25+ major forex pairs
  - Lot size management (Standard, Mini, Micro lots)
  - Pip calculation and pip value determination
  - Currency pair categorization and validation
- **Market Analysis Tools**:
  - Confluence tracking (Support/Resistance, Trend Lines, Moving Averages, etc.)
  - Mistake analysis and learning from errors
  - Market bias and trading session tracking
  - News impact assessment

### 🔍 Trade Management
- **Full CRUD Operations**: Create, view, edit, and delete trades
- **Trade Details Modal**: Comprehensive view of individual trade information
- **Real-time Validation**: Input validation with immediate feedback
- **Search and Filter**: Find trades quickly with advanced filtering
- **Newest-First Ordering**: Always see your latest trades first

### 🔐 Authentication & Security
- **Secure User Authentication**: Email/password login with Supabase Auth
- **Password Recovery**: Forgot password and reset functionality
- **User Profiles**: Manage personal information and preferences
- **Row Level Security**: Database-level security for user data isolation

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant cache invalidation and data refresh
- **Toast Notifications**: User-friendly feedback for all actions
- **Loading States**: Smooth loading indicators throughout the app
- **Error Handling**: Comprehensive error boundaries and validation

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons & Lucide React** - Beautiful icon libraries
- **Recharts** - Responsive chart library
- **Sonner** - Toast notifications
- **Zustand** - Lightweight state management

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Authentication & authorization
- **Express.js** - Node.js web framework
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Express Rate Limit** - API rate limiting

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **Nodemon** - Development server auto-restart
- **Concurrently** - Run multiple commands simultaneously

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trading-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   - Run the migration files in `supabase/migrations/` in order
   - Ensure RLS policies are properly configured
   - Grant necessary permissions to `anon` and `authenticated` roles

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   This runs both the frontend (Vite) and backend (Express) servers concurrently.

## 🎯 Usage

### Getting Started
1. **Register/Login**: Create an account or sign in
2. **Create Trading Account**: Set up your first trading account with starting balance
3. **Log Your First Trade**: Use the comprehensive trade logging form
4. **View Analytics**: Check your dashboard for performance insights

### Key Workflows

#### Logging a Forex Trade
1. Navigate to "Log Trade"
2. Select your trading account
3. Enter trade details (symbol, entry/exit prices, dates)
4. Choose lot type (Standard/Mini/Micro) for forex pairs
5. Select confluences and note any mistakes
6. System automatically calculates P&L, pips, and pip values

#### Managing Trades
1. Go to "Trades" page to view all trades
2. Use search to find specific trades
3. Click "View" for detailed trade information
4. Click "Edit" to modify trade details
5. Click "Delete" to remove trades (with confirmation)

#### Analyzing Performance
1. Visit the Dashboard for overview metrics
2. Check Analytics page for detailed breakdowns
3. Review session-based performance
4. Track win/loss ratios and profit trends

## 📁 Project Structure

```
trading-platform/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main app layout
│   │   ├── LoadingSpinner.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useSupabaseCache.ts # Caching hook
│   │   └── useTheme.ts      # Theme management
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── TradeLog.tsx     # Trade logging form
│   │   ├── Trades.tsx       # Trade management
│   │   ├── Analytics.tsx    # Advanced analytics
│   │   ├── Accounts.tsx     # Account management
│   │   └── Auth pages...
│   ├── utils/               # Utility functions
│   │   ├── forexCalculations.ts # Forex P&L calculations
│   │   ├── validation.ts    # Input validation
│   │   ├── cacheUtils.ts    # Cache management
│   │   └── cacheManager.ts  # Cache invalidation
│   └── lib/                 # External library configs
│       ├── supabase.ts      # Supabase client
│       └── utils.ts         # General utilities
├── api/                     # Express.js backend
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   └── lib/                 # Backend utilities
├── supabase/
│   ├── migrations/          # Database migrations
│   └── email-templates/     # Email templates
└── public/                  # Static assets
```

## 🔧 Key Features Deep Dive

### Forex Calculations Engine
- **25+ Major Pairs**: Support for EUR/USD, GBP/USD, USD/JPY, and more
- **Lot Size Management**: Automatic conversion between Standard (100k), Mini (10k), and Micro (1k) lots
- **Pip Calculations**: Accurate pip counting for 4-decimal and 2-decimal (JPY) pairs
- **P&L Accuracy**: Precise profit/loss calculations in account currency

### Advanced Validation System
- **Real-time Input Validation**: Immediate feedback on form inputs
- **SQL Injection Prevention**: Comprehensive input sanitization
- **Trading Logic Validation**: Ensures stop loss and take profit align with market bias
- **Symbol Recognition**: Automatic detection of forex vs. other instruments

### Caching & Performance
- **Intelligent Caching**: Reduces database queries with smart cache invalidation
- **Real-time Updates**: Instant UI updates after data modifications
- **Optimistic Updates**: Smooth user experience with immediate feedback

### Security Features
- **Row Level Security**: Database-level user data isolation
- **Input Sanitization**: Protection against malicious inputs
- **Rate Limiting**: API protection against abuse
- **Secure Headers**: Helmet.js security middleware

## 🚀 Deployment

The application is configured for deployment on Vercel with the included `vercel.json` configuration.

```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**TradeTrackr** - Empowering traders with data-driven insights and comprehensive trade management.
