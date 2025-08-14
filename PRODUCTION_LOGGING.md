# Production Logging Setup Guide

## 🚨 **Current Limitation**

The current logging system is **development-only**. Production issues won't show up in development logs.

## 🚀 **Production Logging Solutions**

### **Option 1: Vercel Function Logs (Built-in)**
✅ **Already Working** - All console.log statements appear in Vercel dashboard

**How to View:**
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Functions" tab
4. Click on any function to see logs
5. Or use Vercel CLI: `vercel logs`

**Pros:**
- No setup required
- Real-time logs
- Automatic error tracking
- Free with Vercel

**Cons:**
- Limited retention (7 days)
- No advanced filtering
- No custom dashboards

### **Option 2: Supabase Database Logging**
Store logs in your existing Supabase database

**Setup:**
1. Create a `logs` table in Supabase:
```sql
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  error TEXT,
  user_id TEXT,
  session_id TEXT,
  request_id TEXT,
  api TEXT,
  duration INTEGER,
  environment TEXT,
  deployment TEXT
);
```

2. Add environment variables:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Update logger to use Supabase (already prepared in code)

### **Option 3: External Logging Services**

#### **A. Sentry (Error Tracking)**
```bash
npm install @sentry/nextjs
```

**Setup:**
1. Create account at sentry.io
2. Add to `.env.local`:
```bash
SENTRY_DSN=your_sentry_dsn
```

#### **B. LogRocket (Session Replay)**
```bash
npm install logrocket
```

**Setup:**
1. Create account at logrocket.com
2. Add to `.env.local`:
```bash
LOGROCKET_APP_ID=your_app_id
```

#### **C. DataDog (Full APM)**
```bash
npm install dd-trace
```

**Setup:**
1. Create account at datadoghq.com
2. Add to `.env.local`:
```bash
DD_API_KEY=your_api_key
DD_SERVICE=buggies-with-brandon
```

### **Option 4: Vercel Analytics**
Built-in analytics with error tracking

**Setup:**
1. Enable in Vercel dashboard
2. Add to `.env.local`:
```bash
VERCEL_ANALYTICS_ID=your_analytics_id
```

## 🔧 **Recommended Setup**

### **For Your App (Free Tier):**
1. **Vercel Function Logs** (already working)
2. **Supabase Database Logging** (if you want persistence)

### **For Production Apps (Paid):**
1. **Sentry** for error tracking
2. **LogRocket** for session replay
3. **DataDog** for full APM

## 📊 **How to Monitor Production Issues**

### **Current Method (Vercel Dashboard):**
```bash
# View real-time logs
vercel logs

# View specific function logs
vercel logs --function=api/recognize-v2

# View error logs only
vercel logs --error
```

### **With Supabase Logging:**
```sql
-- View recent errors
SELECT * FROM logs 
WHERE level = 'ERROR' 
ORDER BY timestamp DESC 
LIMIT 10;

-- View recognition failures
SELECT * FROM logs 
WHERE api = 'recognition' AND level = 'ERROR'
ORDER BY timestamp DESC;

-- View user-specific issues
SELECT * FROM logs 
WHERE user_id = 'specific_user_id'
ORDER BY timestamp DESC;
```

## 🛠️ **Implementation Steps**

### **Step 1: Enable Supabase Logging (Recommended)**
1. Create the logs table in Supabase
2. Add environment variables
3. The logger is already prepared to use it

### **Step 2: Add Error Boundaries**
```tsx
// Add to your app layout
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
  logger.error('React Error Boundary caught error', error);
  return <div>Something went wrong</div>;
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  {children}
</ErrorBoundary>
```

### **Step 3: Add Performance Monitoring**
```tsx
// Add to your API routes
const startTime = Date.now();
// ... your code ...
logger.info('API completed', { duration: Date.now() - startTime });
```

## 🎯 **Quick Start (Recommended)**

1. **Use Vercel Function Logs** (already working)
2. **Add Supabase Database Logging** for persistence
3. **Monitor via Vercel Dashboard** for real-time issues

This gives you:
- ✅ Real-time error tracking
- ✅ Persistent log storage
- ✅ User-specific debugging
- ✅ Performance monitoring
- ✅ No additional costs

## 📈 **Advanced Monitoring**

Once you have basic logging set up, consider:
- **Error rate alerts**
- **Performance dashboards**
- **User journey tracking**
- **A/B testing integration**

Would you like me to implement any of these solutions?
