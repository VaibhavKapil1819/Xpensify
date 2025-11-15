# Authentication Setup Guide

## Overview
This authentication system uses JWT tokens with HTTP-only cookies for secure session management, integrated with Prisma and PostgreSQL.

## Setup Instructions

### 1. Update Environment Variables
Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated secret to your `.env` file:
```
JWT_SECRET="your-generated-secret-here"
```

### 2. Run Database Migration
Apply the Prisma schema changes to add authentication fields:

```bash
npx prisma migrate dev --name add_auth_fields
```

This will:
- Add `password_hash` field to the Profile model
- Make `email` field unique
- Add UUID auto-generation for profile IDs

### 3. Generate Prisma Client
After migration, regenerate the Prisma client:

```bash
npx prisma generate
```

## Architecture

### API Routes Created

#### 1. **POST /api/auth/signup**
Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    ...
  },
  "session": {
    "access_token": "jwt-token",
    "expires_at": 1234567890,
    "user": { ... }
  }
}
```

#### 2. **POST /api/auth/signin**
Authenticates an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "session": { ... }
}
```

#### 3. **POST /api/auth/signout**
Signs out the current user by clearing the auth cookie.

**Response (200):**
```json
{
  "message": "Signed out successfully"
}
```

#### 4. **GET /api/auth/session**
Checks the current session and returns user data if authenticated.

**Response (200):**
```json
{
  "user": { ... },
  "session": { ... }
}
```

## Components

### AuthContext
The `AuthContext` provides authentication state and methods throughout your app:

```typescript
const { user, session, signUp, signIn, signOut, loading } = useAuth();
```

**Methods:**
- `signUp(email, password, fullName)` - Register a new user
- `signIn(email, password)` - Sign in an existing user
- `signOut()` - Sign out the current user

**State:**
- `user` - Current user object or null
- `session` - Current session object or null
- `loading` - Boolean indicating if auth state is loading

### Usage Example

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signIn, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <button onClick={() => signIn(email, password)}>Sign In</button>;
  }

  return <div>Welcome, {user.full_name}!</div>;
}
```

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds of 10
2. **HTTP-Only Cookies**: JWT tokens stored in HTTP-only cookies (not accessible via JavaScript)
3. **Secure Cookies**: Cookies marked as secure in production (HTTPS only)
4. **Token Expiration**: JWT tokens expire after 7 days
5. **Input Validation**: Zod schema validation on all API endpoints
6. **Password Requirements**: Minimum 6 characters

## File Structure

```
src/
├── app/
│   └── api/
│       └── auth/
│           ├── signup/route.ts
│           ├── signin/route.ts
│           ├── signout/route.ts
│           └── session/route.ts
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   ├── auth.ts          # Authentication utilities
│   └── prisma.ts        # Prisma client
└── models/
    └── user.ts          # User and Session types
```

## Prisma Schema Changes

```prisma
model Profile {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email               String   @unique
  password_hash       String
  full_name           String?
  // ... other fields
}
```

## Testing the API

### Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

### Check Session
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
```

### Sign Out
```bash
curl -X POST http://localhost:3000/api/auth/signout \
  -b cookies.txt
```

## Next Steps

1. **Run the migration** (see step 2 above)
2. **Start your development server**: `npm run dev`
3. **Test the authentication flow** using your existing Auth component
4. Consider adding:
   - Email verification
   - Password reset functionality
   - OAuth providers (Google, GitHub, etc.)
   - Rate limiting on auth endpoints
   - Two-factor authentication

## Troubleshooting

### "User with this email already exists"
The email is already registered. Try signing in or use a different email.

### "Invalid email or password"
Check your credentials. Passwords are case-sensitive.

### Session not persisting
Ensure cookies are enabled in your browser and you're using `credentials: 'include'` in fetch requests.

### Database connection errors
Verify your `DATABASE_URL` in `.env` is correct and the database is running.

## Production Considerations

1. **Strong JWT Secret**: Use a cryptographically secure random string
2. **HTTPS**: Always use HTTPS in production
3. **Environment Variables**: Never commit `.env` files to version control
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Monitoring**: Set up logging and monitoring for authentication events
6. **Backup**: Regular database backups
7. **Password Policy**: Consider implementing stronger password requirements
8. **Token Refresh**: Consider implementing refresh tokens for longer sessions

