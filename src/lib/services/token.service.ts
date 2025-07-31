import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    exp: number;
    // ... other properties from your JWT payload
}

class TokenService {
    private TOKEN_KEY = 'auth_token';
    private REFRESH_TOKEN_KEY = 'refresh_token_flag';
    private PERSISTENT_SESSION_KEY = 'persistent_session';

    // --- Session Persistence ---

    setPersistentSession(isPersistent: boolean): void {
        localStorage.setItem(this.PERSISTENT_SESSION_KEY, String(isPersistent));
    }

    isPersistentSession(): boolean {
        return localStorage.getItem(this.PERSISTENT_SESSION_KEY) === 'true';
    }

    private getStorage(): Storage {
        return this.isPersistentSession() ? localStorage : sessionStorage;
    }

    // --- Access Token ---

    getToken(): string | null {
        return this.getStorage().getItem(this.TOKEN_KEY);
    }

    setToken(token: string): void {
        this.getStorage().setItem(this.TOKEN_KEY, token);
    }

    removeToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
    }

    getTokenExpiryTime(): number | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            return decoded.exp;
        } catch {
            return null;
        }
    }

    // --- Refresh Token Flag ---

    getRefreshToken(): boolean {
        // We can't access HttpOnly cookies, but we can track if we should have one.
        // This helps with UI state management and refresh logic.
        return this.getStorage().getItem(this.REFRESH_TOKEN_KEY) === 'true';
    }

    setRefreshToken(): void {
        // Store a flag indicating we have a refresh token.
        // The actual token is an HttpOnly cookie handled by the server.
        this.getStorage().setItem(this.REFRESH_TOKEN_KEY, 'true');
    }

    removeRefreshToken(): void {
        // Remove the refresh token flag from storage.
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }

    // --- General ---

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
            return decoded.exp > currentTime;
        } catch {
            return false;
        }
    }
}

export const tokenService = new TokenService();
