# Authentication System Documentation

This document provides an overview of the authentication system implemented in the QuickQuick frontend application.

## Overview

The authentication system follows industry best practices for secure user authentication in React/TypeScript applications:

1. **Secure Token Storage**: Tokens are stored in sessionStorage instead of localStorage for better security against XSS attacks
2. **Token Refresh Mechanism**: Automatic token refresh when expired or unauthorized
3. **Route Protection**: Protected routes that require authentication
4. **Role-Based Access Control**: Support for role-based access to routes
5. **Consistent API Usage**: Centralized API endpoint definitions
6. **Proper Error Handling**: Consistent error handling throughout the authentication flow
7. **Automatic Authentication**: Checks for valid tokens on application startup

## Key Components

### Token Service (`token.service.ts`)

Handles all token-related operations:
- Secure storage of tokens in sessionStorage
- Token validation and expiry checking
- JWT decoding for user information

```typescript
// Example usage
import { tokenService } from '@/lib/services/token.service';

// Check if user is authenticated
const isAuthenticated = tokenService.isTokenValid();

// Get user ID from token
const userId = tokenService.getUserIdFromToken();
```

### Authentication Store (`auth.store.ts`)

Manages authentication state using Zustand:
- User information
- Authentication status
- Login/logout functionality
- Token management
- Profile updates

```typescript
// Example usage
import { useAuthStore } from '@/lib/store/auth.store';

const { login, logout, user, isAuthenticated } = useAuthStore();

// Login
await login(email, password);

// Logout
await logout();
```

### Protected Route Component (`protected-route.tsx`)

Protects routes that require authentication:
- Redirects unauthenticated users to login
- Supports role-based access control
- Shows loading state during authentication checks

```tsx
// Example usage in routes
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } 
/>

// With role-based access
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPage />
    </ProtectedRoute>
  } 
/>
```

## Authentication Flow

1. **Initial Load**:
   - Application checks for existing valid tokens
   - If valid, user is authenticated automatically
   - If invalid, user is redirected to login

2. **Login**:
   - User submits credentials
   - Server validates and returns tokens
   - Tokens are securely stored
   - User is redirected to the requested page

3. **Protected Routes**:
   - Authentication is verified before rendering
   - Unauthenticated users are redirected to login
   - Role requirements are checked if specified

4. **Token Refresh**:
   - When a request returns 401 Unauthorized
   - System attempts to refresh the token
   - If successful, the original request is retried
   - If unsuccessful, user is logged out

5. **Logout**:
   - Tokens are removed from storage
   - Server is notified
   - User is redirected to login

## Best Practices

1. **Always use the ProtectedRoute component** for routes that require authentication
2. **Never store sensitive information** in localStorage
3. **Handle authentication errors gracefully** with user-friendly messages
4. **Use the tokenService** for all token-related operations
5. **Initialize authentication** on application startup
6. **Implement proper CSRF protection** on the server side
7. **Set appropriate token expiration times** (short-lived access tokens, longer refresh tokens)