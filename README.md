# Julyu - The Bloomberg Terminal for Grocery Consumers

AI-powered grocery price comparison platform that helps users save money by comparing prices across 50+ retailers.

##  Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- **Supabase account** (REQUIRED)
- **Instacart Connect API access** (REQUIRED)
- **DeepSeek API key** (REQUIRED)
- **OpenAI API key** (REQUIRED for receipt OCR)

### Installation

```powershell
# Install dependencies
npm install

# Set up environment variables
Copy-Item .env.example .env.local
notepad .env.local
# Add your API keys

# Set up Supabase
# 1. Create project at https://supabase.com
# 2. Run database/schema.sql in SQL Editor

# Start development server (runs on port 3825)
npm run dev
```

##  Project Structure

```
julyu/
├── app/ # Next.js pages and API routes
├── components/ # React components
├── lib/ # Utilities and API clients
├── database/ # Database schema
└── shared/types/ # TypeScript types
```

##  Required API Keys

### Supabase (Database & Auth)
- Get from: https://supabase.com
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Instacart Connect API
- Get from: https://docs.instacart.com/connect/
- Contact Instacart for API access
- Required: `INSTACART_API_KEY`, `INSTACART_API_SECRET`

### DeepSeek API (Product Matching)
- Get from: https://platform.deepseek.com
- Required: `DEEPSEEK_API_KEY`

### OpenAI (Receipt OCR)
- Get from: https://platform.openai.com
- Required: `OPENAI_API_KEY`

## ️ Important

**NO MOCK DATA** - All features require real APIs and database connections.

##  Documentation

- [Clean Setup Guide](./CLEAN-SETUP.md) - Complete setup instructions
- [PowerShell Commands](./POWERSHELL-COMMANDS.md) - All commands
- [Implementation Plan](./IMPLEMENTATION-PLAN.md) - Development roadmap

##  External APIs

- **Instacart Connect** - Primary data source for prices and products
- **DeepSeek API** - Product matching
- **OpenAI GPT-4 Vision** - Receipt OCR

##  License

Proprietary - All rights reserved
