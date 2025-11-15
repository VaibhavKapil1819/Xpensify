# 🚀 Authentication Quick Start

## ✅ What Was Implemented

### 1. **API Routes** (Next.js App Router)
- ✅ `POST /api/auth/signup` - User registration
- ✅ `POST /api/auth/signin` - User login
- ✅ `POST /api/auth/signout` - User logout
- ✅ `GET /api/auth/session` - Session verification

### 2. **Authentication Utilities** (`src/lib/auth.ts`)
- ✅ Password hashing with bcrypt
- ✅ JWT token generation and verification
- ✅ HTTP-only cookie management
- ✅ Session management helpers

### 3. **Updated Components**
- ✅ `AuthContext` - Fully integrated with API routes
- ✅ `User` model types - Updated to match Prisma Profile schema

### 4. **Prisma Schema Updates**
- ✅ Added `password_hash` field to Profile model
- ✅ Made `email` field unique
- ✅ Added UUID auto-generation for profile IDs

## 🔧 Setup Steps (Required)

### Step 1: Add JWT Secret to Environment Variables

Add this to your `.env` file:

```bash
JWT_SECRET="your-secret-key-change-in-production"
```

**Generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Run Database Migration

```bash
npx prisma migrate dev --name add_auth_fields
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Start Development Server

```bash
npm run dev
```

## 📝 Usage Example

Your existing Auth component already works with the new system! Here's how it integrates:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function AuthComponent() {
  const { user, signUp, signIn, signOut, loading } = useAuth();

  // Sign up a new user
  await signUp(email, password, fullName);

  // Sign in existing user
  await signIn(email, password);

  // Sign out
  await signOut();

  // Access current user
  console.log(user); // User object or null
}
```

## 🔒 Security Features

- ✅ bcrypt password hashing (10 salt rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ HTTP-only cookies (XSS protection)
- ✅ Secure cookies in production
- ✅ Input validation with Zod
- ✅ Password minimum length (6 chars)

## 📁 Files Created/Modified

### Created:
- `src/lib/auth.ts` - Authentication utilities
- `src/app/api/auth/signup/route.ts` - Signup endpoint
- `src/app/api/auth/signin/route.ts` - Signin endpoint
- `src/app/api/auth/signout/route.ts` - Signout endpoint
- `src/app/api/auth/session/route.ts` - Session check endpoint
- `AUTHENTICATION_SETUP.md` - Detailed documentation

### Modified:
- `src/contexts/AuthContext.tsx` - Integrated with API routes
- `src/models/user.ts` - Updated types for Profile schema
- `prisma/schema.prisma` - Added auth fields

## 🧪 Test the Authentication

Once you run the migration, test with your existing `/auth` page at:
```
http://localhost:3000/auth
```

The form already has all the fields needed and will work automatically!

## ⚠️ Important Notes

1. **Run the migration** before testing (Step 2 above)
2. **Set JWT_SECRET** in your `.env` file (Step 1 above)
3. **Database must be running** for migrations and auth to work
4. Existing profiles without passwords won't be able to sign in (you can manually add test users or sign up new ones)

## 🎯 What Happens on Auth?

### Sign Up Flow:
1. User submits email, password, and full name
2. API validates input (Zod schema)
3. API checks if email already exists
4. Password is hashed with bcrypt
5. User profile created in database
6. JWT token generated
7. Token stored in HTTP-only cookie
8. User redirected to `/onboarding`

### Sign In Flow:
1. User submits email and password
2. API validates input
3. API finds user by email
4. Password verified against hash
5. JWT token generated
6. Token stored in HTTP-only cookie
7. User redirected to `/dashboard`

### Session Check (Automatic on Page Load):
1. AuthContext checks for existing session
2. Calls `/api/auth/session` endpoint
3. Cookie sent automatically with request
4. JWT verified and user data returned
5. User and session state updated

## 🚨 Need Help?

Check `AUTHENTICATION_SETUP.md` for:
- Detailed API documentation
- Security best practices
- Testing with curl
- Production considerations
- Troubleshooting guide

---

**Ready to go!** Just run the migration and start your server. Your existing Auth page will work perfectly with the new backend! 🎉

