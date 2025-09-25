# Deployment Security Guide

## Environment Variables Management

This guide provides comprehensive instructions for securely managing environment variables during deployment.

## 🔒 Security Overview

Your application has been secured with the following measures:
- ✅ All sensitive information moved to environment variables
- ✅ `.env` files excluded from version control
- ✅ Hardcoded secrets removed from source code
- ✅ `.env.example` template created for reference
- ✅ Git history cleaned of sensitive files

## 📋 Required Environment Variables

Based on your `.env.example` file, you need to configure:

### Supabase Configuration
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Session Security
```bash
SESSION_SECRET=your_secure_random_session_secret
```

### Development Mode (Optional)
```bash
DEV_MODE=false
```

### Test Credentials (Development Only)
```bash
TEST_USER_PASSWORD=your_test_password
```

### Stripe (When Implemented)
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🚀 Platform-Specific Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Set Environment Variables**:
   ```bash
   # Set production environment variables
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add SESSION_SECRET production
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Netlify Deployment

1. **Via Netlify Dashboard**:
   - Go to Site Settings → Environment Variables
   - Add each required variable

2. **Via Netlify CLI**:
   ```bash
   netlify env:set VITE_SUPABASE_URL "your_value"
   netlify env:set VITE_SUPABASE_ANON_KEY "your_value"
   # ... repeat for all variables
   ```

### Railway Deployment

1. **Via Railway Dashboard**:
   - Go to your project → Variables tab
   - Add environment variables

2. **Via Railway CLI**:
   ```bash
   railway variables set VITE_SUPABASE_URL=your_value
   railway variables set VITE_SUPABASE_ANON_KEY=your_value
   # ... repeat for all variables
   ```

## 🔐 Security Best Practices

### 1. Environment Variable Security
- **Never commit `.env` files** to version control
- **Use strong, unique secrets** for SESSION_SECRET (32+ characters)
- **Rotate keys regularly** especially in production
- **Use different keys** for development, staging, and production

### 2. Supabase Security
- **Service Role Key**: Only use on backend/server-side code
- **Anon Key**: Safe for frontend use (has limited permissions)
- **Enable RLS**: Ensure Row Level Security is enabled on all tables

### 3. Session Security
- Generate SESSION_SECRET using: `openssl rand -base64 32`
- Use HTTPS in production (most platforms handle this automatically)
- Set secure cookie flags in production

### 4. API Key Management
- **Stripe Keys**: Use test keys for development, live keys for production
- **Never log sensitive keys** in application logs
- **Use environment-specific keys** for different deployment stages

## 🛠️ Local Development Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values**:
   ```bash
   # Edit .env with your development credentials
   nano .env
   ```

3. **Verify setup**:
   ```bash
   npm run dev
   ```

## 🔍 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" Error**:
   - Verify all Supabase variables are set
   - Check variable names match exactly (case-sensitive)
   - Ensure no trailing spaces in values

2. **CORS Errors in Production**:
   - Update CORS origins in `api/app.ts`
   - Add your production domain to allowed origins

3. **Session Issues**:
   - Ensure SESSION_SECRET is set and consistent
   - Check cookie settings for production environment

### Verification Commands

```bash
# Test API health
curl https://your-domain.com/api/health

# Check environment variables (development)
node -e "console.log(process.env.VITE_SUPABASE_URL ? 'Supabase URL: Set' : 'Supabase URL: Missing')"
```

## 📚 Additional Resources

- [Supabase Environment Variables Guide](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

## ⚠️ Important Notes

- **Never share your `.env` file** or commit it to version control
- **Use `.env.example`** as a template for team members
- **Regularly audit** your environment variables for unused or outdated keys
- **Monitor** your application logs for any accidental key exposure
- **Test thoroughly** after deployment to ensure all integrations work

---

**Security Checklist Before Going Live:**
- [ ] All environment variables configured in production
- [ ] `.env` files excluded from version control
- [ ] Strong SESSION_SECRET generated and set
- [ ] Supabase RLS policies properly configured
- [ ] CORS origins updated for production domain
- [ ] SSL/HTTPS enabled (handled by most platforms)
- [ ] API endpoints tested in production environment