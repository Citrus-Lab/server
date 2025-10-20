# Backend Flow - AI Platform

## Project Overview
Ye ek AI platform hai jahan users multiple AI models ko ek hi page pe access kar sakte hain (ChatGPT, Claude, Perplexity, Gemini, etc.). Platform me 2 modes hain:
- **Manual Mode**: User khud model select karta hai
- **Auto Mode**: System automatically best model choose karta hai based on question type

## Current Implementation Status

### 1. Authentication System ✅
**Files involved:**
- `src/models/user.model.js` - User ka data structure
- `src/controllers/auth.controller.js` - Login/Register logic
- `src/routes/auth.routes.js` - Auth endpoints
- `src/middlewares/auth.middleware.js` - JWT token verification

**Flow:**
1. User register karta hai (name, email, password)
2. Password bcrypt se hash hota hai
3. Login pe JWT token generate hota hai
4. Token cookie me store hota hai
5. Protected routes pe middleware token verify karta hai

### 2. Chat System ✅
**Files involved:**
- `src/models/chat.model.js` - Chat aur messages ka structure
- `src/controllers/chat.controller.js` - Chat operations
- `src/routes/chat.routes.js` - Chat endpoints

**Flow:**
1. User new chat create karta hai
2. Messages array me user aur AI responses store hote hain
3. Chat history save hoti hai database me
4. User apni purani chats access kar sakta hai

### 3. AI Models Integration ✅
**Files involved:**
- `src/services/openrouter.service.js` - Main AI service
- `src/controllers/models.controller.js` - Models info
- `src/routes/models.routes.js` - Models endpoints

**Available Models:**
- GPT-4 (coding, reasoning ke liye)
- GPT-3.5 Turbo (fast responses)
- Claude 3 Opus (writing, analysis)
- Claude 3 Sonnet (balanced)
- Gemini Pro (multimodal)
- Perplexity Sonar (search, current events)

**Auto Mode Logic:**
- Message analyze karta hai keywords se
- Coding questions → GPT-4
- Current events → Perplexity
- Creative writing → Claude Opus
- Quick questions → GPT-3.5

### 4. Database Setup ✅
**Files involved:**
- `src/config/database.js` - MongoDB connection
- `src/config/redis.js` - Redis setup (caching ke liye)

**Structure:**
- MongoDB me users aur chats store hote hain
- Redis caching ke liye ready hai (abhi use nhi ho raha)

### 5. API Endpoints Structure

#### Authentication Routes (`/api/auth/`)
- `POST /register` - Naya user banane ke liye
- `POST /login` - Login karne ke liye  
- `POST /logout` - Logout karne ke liye

#### Chat Routes (`/api/chats/`)
- `POST /` - Naya chat create karna
- `GET /` - User ki chat history
- `GET /:chatId` - Specific chat details
- `POST /:chatId/messages` - Chat me naya message add karna

#### Models Routes (`/api/models/`)
- Available models ki list aur info

#### Simple Chat Endpoint
- `POST /api/chat` - Direct chat (no auth required, testing ke liye)

### 6. Middleware System ✅
**Files involved:**
- `src/middlewares/auth.middleware.js` - Authentication check
- `src/middlewares/validation.middleware.js` - Input validation

**Features:**
- JWT token verification
- Request data validation
- Error handling

### 7. Main Application Flow

#### Server Startup (`src/index.js`)
1. Environment variables load karta hai
2. Database connect karta hai
3. Express server start karta hai

#### App Configuration (`src/app.js`)
1. CORS setup (frontend ke saath communication)
2. JSON parsing
3. Cookie handling
4. Logging (Morgan)
5. Routes setup
6. Error handling

### 8. Key Features Implemented

#### Smart Model Selection
- Message content analyze karta hai
- Best model automatically choose karta hai
- Fallback mechanism hai agar koi error aaye

#### Error Handling
- Proper error messages
- Try-catch blocks everywhere
- Graceful fallbacks

#### Security
- Password hashing
- JWT tokens
- CORS protection
- Input validation

## What's Working
1. ✅ User registration/login
2. ✅ JWT authentication
3. ✅ Chat creation aur history
4. ✅ Multiple AI models integration
5. ✅ Auto model selection
6. ✅ Database operations
7. ✅ API endpoints
8. ✅ Error handling

## What's Missing/TODO
1. ❌ Socket.io for real-time chat
2. ❌ Redis caching implementation
3. ❌ Rate limiting
4. ❌ File upload support
5. ❌ Admin panel
6. ❌ Analytics/usage tracking
7. ❌ Email verification
8. ❌ Password reset functionality

## Technology Stack
- **Backend**: Node.js + Express
- **Database**: MongoDB (with Mongoose)
- **Caching**: Redis (setup ready)
- **Authentication**: JWT + bcrypt
- **AI Integration**: OpenRouter API
- **Validation**: express-validator
- **Logging**: Winston + Morgan

## Environment Variables Required
```
PORT=3001
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=your_openrouter_key
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:5000
```

Ye backend bilkul ready hai basic functionality ke saath. Frontend connect kar ke testing kar sakte hain!