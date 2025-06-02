import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
  sub: string;
  // Using Record<string, unknown> instead of any for better type safety
  [key: string]: unknown;
}

class TokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly REMEMBER_ME_KEY = 'remember_me';

  // Check if user has chosen to be remembered
  isPersistentSession(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === "true";
  }

  // Set remember me preference
  setPersistentSession(remember: boolean): void {
    if (remember) {
      localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.removeItem(this.REMEMBER_ME_KEY);
    }
  }

  // Get token from appropriate storage based on remember me preference
  getToken(): string | null {
    return this.isPersistentSession()
      ? localStorage.getItem(this.TOKEN_KEY)
      : sessionStorage.getItem(this.TOKEN_KEY);
  }

  // Set token in appropriate storage based on remember me preference
  setToken(token: string): void {
    if (this.isPersistentSession()) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  // Remove token from both storages to ensure it's completely cleared
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  // For HttpOnly cookies, we can't access them via JavaScript
  // This method returns a boolean indicating if we're in a session that should have a refresh token
  getRefreshToken(): boolean {
    return true;
    // The actual token is sent automatically with requests via HttpOnly cookie
  }

  // Set refresh token - for HttpOnly cookies, this is handled by the server
  // We just store a flag to indicate that we have a valid refresh token
  setRefreshToken(): void {
    // Store a flag indicating we have a refresh token
    // The actual token is stored as an HttpOnly cookie by the server
    if (this.isPersistentSession()) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, 'true');
    } else {
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, 'true');
    }
  }

  // Remove refresh token flag from storage
  // The actual HttpOnly cookie needs to be cleared by the server
  removeRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    // The actual cookie will be cleared by the server on logout
  }

  // Clear all tokens from both storages
  clearTokens(): void {
    this.removeToken();
    this.removeRefreshToken();
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;

      // Check if token is expired
      return decoded.exp > currentTime;
    } catch {
      // If token can't be decoded, consider it invalid
      return false;
    }
  }

  getUserIdFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.sub;
    } catch {
      // If token can't be decoded, return null
      return null;
    }
  }
}

export const tokenService = new TokenService();