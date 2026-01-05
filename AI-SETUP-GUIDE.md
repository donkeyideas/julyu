# 🤖 AI System Setup Guide

## Overview

The Julyu platform uses AI models for:
1. **Product Matching** (DeepSeek) - Semantic understanding of user input
2. **Receipt OCR** (OpenAI GPT-4 Vision) - Extract structured data from receipt images

All AI calls are tracked for:
- Cost analysis
- Performance monitoring
- Training data collection (for future LLM model training)

---

## 🔑 API Key Configuration

### 1. Get API Keys

**DeepSeek:**
1. Visit: https://platform.deepseek.com
2. Sign up / Login
3. Navigate to API Keys section
4. Create new API key
5. Copy the key

**OpenAI:**
1. Visit: https://platform.openai.com
2. Sign up / Login
3. Navigate to API Keys section
4. Create new API key
5. Copy the key

### 2. Configure in Environment

Add to `.env.local`:
```env
DEEPSEEK_API_KEY=your_deepseek_key_here
OPENAI_API_KEY=your_openai_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 3. Configure in Admin Panel

1. Go to Admin Dashboard → AI Models
2. Click "🔑 Configure API Keys"
3. Enter your API keys
4. Click "💾 Save API Keys"
5. Test connection using "Test Connection" button

---

## 📊 Database Setup

### Run AI Tracking Schema

```sql
-- Run this in your Supabase SQL Editor
-- File: database/ai-tracking-schema.sql
```

This creates:
- `ai_model_usage` - Tracks all API calls
- `ai_training_data` - Stores training data for future models
- `ai_model_config` - Stores API configurations
- `ai_performance_metrics` - Aggregated performance data

---

## 🔄 How It Works

### 1. API Call Flow

```
User Request
    ↓
API Route (/api/ai/match-products or /api/receipts/scan)
    ↓
AI Client (DeepSeek or OpenAI)
    ↓
AI Tracker (logs usage, cost, training data)
    ↓
Response to User
```

### 2. Usage Tracking

Every API call automatically:
- ✅ Logs to `ai_model_usage` table
- ✅ Calculates cost based on tokens
- ✅ Tracks response time
- ✅ Stores request/response payloads
- ✅ Records success/failure

### 3. Training Data Collection

All successful AI interactions are stored in `ai_training_data`:
- Input data (user queries, images)
- Output data (AI responses)
- Accuracy scores
- User feedback (when available)

This data will be used to train custom LLM models in the future.

---

## 📈 Monitoring & Analytics

### AI Models Page
- View all configured models
- Check API key status
- See request counts (24h)
- Test API connections

### API Usage & Costs Page
- Total costs by time period
- Cost breakdown by model
- Token usage statistics
- Response time metrics
- Recent API calls log

---

## 🧠 Making the LLM Smart

### Current System

1. **Data Collection:**
   - All AI inputs/outputs stored
   - User feedback captured
   - Accuracy scores tracked

2. **Performance Tracking:**
   - Response times monitored
   - Success rates calculated
   - Cost per request analyzed

### Future Enhancements

1. **Custom Model Training:**
   - Use collected training data
   - Fine-tune models for specific use cases
   - Improve accuracy over time

2. **Learning System:**
   - Analyze patterns in successful matches
   - Learn from user corrections
   - Adapt to regional preferences

3. **Smart Routing:**
   - Route requests to best model
   - Fallback strategies
   - Cost optimization

---

## 🛠️ Testing

### Test API Connections

1. Go to Admin → AI Models
2. Click "Test Connection" for each model
3. Verify successful connection

### Test Product Matching

```bash
POST /api/ai/match-products
{
  "items": ["milk", "bread", "eggs"]
}
```

### Test Receipt OCR

```bash
POST /api/receipts/scan
{
  "image": "base64_encoded_image"
}
```

---

## 📝 Notes

- **API Keys:** Store securely, never commit to git
- **Costs:** Monitor regularly in AI Costs page
- **Training Data:** Grows automatically, used for future model training
- **Privacy:** Training data stored securely, user data anonymized when possible

---

## ✅ Checklist

- [ ] DeepSeek API key obtained
- [ ] OpenAI API key obtained
- [ ] Keys added to `.env.local`
- [ ] Database schema run (ai-tracking-schema.sql)
- [ ] API keys configured in admin panel
- [ ] Test connections successful
- [ ] Monitoring AI Costs page
- [ ] Training data collection verified

---

**The AI system is now ready to learn and improve!** 🚀


