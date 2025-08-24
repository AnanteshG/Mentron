# 🎯 Mentron - AI-Powered Mock Interview Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Latest-38B2AC)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![HeyGen](https://img.shields.io/badge/HeyGen-AI%20Avatar-purple)](https://heygen.com/)

> **Mentron** is an innovative AI-powered mock interview platform that provides realistic interview experiences with AI mentors. Get personalized feedback, improve your skills, and ace your next job interview!

## 🎬 Demo Video

![Demo Video](./public/Mentron.mp4)

_Watch Mentron in action - see how our AI mentors conduct realistic interviews and provide detailed feedback._

## ✨ Features

### 🤖 **AI-Powered Interviews**

- **Interactive AI Mentors**: Lifelike avatar mentors powered by HeyGen
- **Voice & Video Chat**: Real-time conversation with AI interviewers
- **Personalized Questions**: Questions tailored to your resume and job role
- **Multiple Mentor Personalities**: Choose from various AI mentors with different expertise

### 📄 **Smart Resume Analysis**

- **PDF Upload & Processing**: Advanced PDF parsing with text extraction
- **Resume Summarization**: AI-generated resume insights using Google Gemini
- **Job Matching**: Questions aligned with your experience and target role

### 📊 **Comprehensive Feedback**

- **Multi-dimensional Scoring**: Technical, communication, and problem-solving assessments
- **Detailed Analytics**: Performance breakdowns with actionable insights
- **Strengths & Improvements**: Personalized recommendations for growth
- **Interview Transcripts**: Complete conversation history for review

### 🔐 **Secure & User-Friendly**

- **Authentication**: Secure login with Clerk
- **Data Storage**: Reliable data management with Supabase
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Theme**: Adaptive UI for better user experience

## 🛠️ Tech Stack

### **Frontend**

- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI Components
- **State Management**: React Hooks & Context API

### **Backend & APIs**

- **Runtime**: Node.js with Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **File Storage**: Supabase Storage
- **AI Services**:
  - Google Gemini (Text generation & analysis)
  - HeyGen (AI Avatar & Streaming)
  - ElevenLabs (Voice synthesis)
  - Deepgram (Speech-to-text)

### **Key Libraries**

- `@heygen/streaming-avatar` - AI avatar integration
- `@ai-sdk/google` - Google Gemini AI
- `@clerk/nextjs` - Authentication
- `@supabase/supabase-js` - Database & storage
- `pdf-parse-fork` - PDF processing
- `lucide-react` - Icons
- `tailwind-merge` - Styling utilities

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account
- HeyGen API access
- Google AI API key

### 1. Clone the Repository

```bash
git clone https://github.com/AnanteshG/Mentron.git
cd Mentron
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# HeyGen API
HEYGEN_API_KEY=your_heygen_api_key
NEXT_PUBLIC_BASE_API_URL=https://api.heygen.com

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
```

### 4. Database Setup

Run the database migration in your Supabase SQL editor:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  resume_url TEXT,
  resume_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create interviews table
CREATE TABLE interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  user_summary TEXT NOT NULL,
  job_summary TEXT NOT NULL,
  mentor_id TEXT,
  status TEXT DEFAULT 'scheduled',
  start_date_time TIMESTAMPTZ,
  end_date_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  overall_score INTEGER,
  technical_score INTEGER,
  communication_score INTEGER,
  problem_solving_score INTEGER,
  feedback TEXT,
  strengths TEXT[],
  improvements TEXT[],
  key_highlights TEXT[],
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
mentron/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── create-interview/     # Interview creation
│   │   ├── get-access-token/     # HeyGen token management
│   │   ├── process-resume/       # Resume processing
│   │   ├── process-job/          # Job description analysis
│   │   └── user-profile/         # User data management
│   ├── interview/                # Interview pages
│   │   ├── [id]/                 # Dynamic interview routes
│   │   └── new/                  # New interview setup
│   ├── sign-in/                  # Authentication pages
│   └── sign-up/
├── components/                   # React Components
│   ├── avatar/                   # Avatar-related components
│   ├── logic/                    # Custom hooks & logic
│   ├── ui/                       # Reusable UI components
│   └── ...                       # Feature components
├── lib/                          # Utilities & configurations
├── public/                       # Static assets
└── types/                        # TypeScript definitions
```

## 🎯 Key Features Walkthrough

### 1. **Resume Upload & Analysis**

- Upload PDF resume with advanced parsing
- AI-powered summarization and skills extraction
- Intelligent job-resume matching

### 2. **Interview Setup**

- Job title and description input
- AI mentor selection
- Personalized interview configuration

### 3. **Live Interview Experience**

- Real-time video chat with AI avatars
- Voice recognition and natural conversation
- Dynamic question generation based on responses

### 4. **Performance Analytics**

- Comprehensive scoring across multiple dimensions
- Detailed feedback with actionable insights
- Interview transcript and replay functionality

## 🔧 Configuration

### HeyGen Avatar Setup

1. Create a HeyGen account
2. Generate API key from dashboard
3. Configure avatar names in `components/mentors.tsx`
4. Ensure avatar names match your HeyGen account

### Supabase Configuration

1. Create a new Supabase project
2. Run the database migration script
3. Configure Row Level Security (RLS) policies
4. Set up storage bucket for resume uploads

### Google AI Integration

1. Create a Google Cloud project
2. Enable the Generative AI API
3. Generate an API key
4. Configure quota and usage limits

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy with automatic CI/CD

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:

- Supabase credentials
- Clerk authentication keys
- HeyGen API key
- Google AI API key

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Test thoroughly before submitting PRs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **HeyGen** for AI avatar technology
- **Google** for Gemini AI capabilities
- **Supabase** for backend infrastructure
- **Clerk** for authentication services
- **Vercel** for deployment platform

## 📞 Support

For support and questions:

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/AnanteshG/Mentron/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/AnanteshG/Mentron/discussions)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/AnanteshG">AnanteshG</a></p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
