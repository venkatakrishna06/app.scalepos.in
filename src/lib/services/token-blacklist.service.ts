// src/lib/services/token-blacklist.service.ts

class TokenBlacklistService {
    private blacklistedTokens: Set<string> = new Set();

    addToBlacklist(token: string): void {
        this.blacklistedTokens.add(token);
        console.log(`Token added to blacklist: ${token}`);
    }

    isBlacklisted(token: string): boolean {
        return this.blacklistedTokens.has(token);
    }
}

export const tokenBlacklistService = new TokenBlacklistService();
