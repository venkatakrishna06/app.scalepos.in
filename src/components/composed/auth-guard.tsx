import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useEffect, useRef, useState, useCallback } from 'react';
import { tokenService } from '@/lib/services/token.service';
import { authService } from '@/lib/api/services/auth.service';
import { tokenBlacklistService } from '@/lib/services/token-blacklist.service';
import logger from '@/lib/services/logger.service';

interface AuthGuardProps {
    children: React.ReactNode;
}

const MAX_REFRESH_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds
const TOKEN_REFRESH_TIMEOUT = 15000; // 15 seconds

export function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, token, logout, setToken } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const refreshTimerRef = useRef<number | null>(null);
    const [refreshAttempts, setRefreshAttempts] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleLogout = useCallback(async () => {
        logger.info('User logged out due to token refresh failure or invalid token.');
        await logout();
        navigate('/login', { state: { from: location }, replace: true });
    }, [logout, navigate, location]);

    const scheduleTokenRefresh = useCallback(() => {
        if (refreshTimerRef.current) {
            window.clearTimeout(refreshTimerRef.current);
        }

        const expiryTime = tokenService.getTokenExpiryTime();
        if (!expiryTime) {
            logger.warn('Could not schedule token refresh: no expiry time found.');
            return;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = (expiryTime - currentTime) * 1000;
        const refreshBuffer = Math.min(300000, timeUntilExpiry / 2); // 5 minutes or halfway
        const refreshDelay = Math.max(0, timeUntilExpiry - refreshBuffer);

        logger.info(`Scheduling token refresh in ${refreshDelay / 1000} seconds.`);
        refreshTimerRef.current = window.setTimeout(() => {
            refreshToken();
        }, refreshDelay);
    }, []);

    const refreshToken = useCallback(async () => {
        if (isRefreshing) return;

        const currentRefreshToken = tokenService.getRefreshToken();
        if (!currentRefreshToken || tokenBlacklistService.isBlacklisted(currentRefreshToken)) {
            logger.warn('Refresh token is invalid or blacklisted.');
            return handleLogout();
        }

        setIsRefreshing(true);
        logger.info('Attempting to refresh token.');

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Token refresh timeout')), TOKEN_REFRESH_TIMEOUT);
            });

            const response = await Promise.race([
                authService.refreshToken(),
                timeoutPromise
            ]) as { token: string; refreshToken?: string };

            logger.info('Token refreshed successfully.');
            tokenBlacklistService.addToBlacklist(currentRefreshToken);
            tokenService.setToken(response.token);
            if (response.refreshToken) {
                tokenService.setRefreshToken();
            }

            setToken(response.token);
            setRefreshAttempts(0);
            scheduleTokenRefresh();
        } catch (error) {
            logger.error('Token refresh error:', { error });
            if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
                setRefreshAttempts(prev => prev + 1);
                logger.info(`Retrying token refresh in ${RETRY_DELAY / 1000} seconds.`);
                setTimeout(() => {
                    setIsRefreshing(false);
                    refreshToken();
                }, RETRY_DELAY);
            } else {
                logger.error('Max refresh attempts reached. Logging out.');
                handleLogout();
            }
        } finally {
            if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
                setIsRefreshing(false);
            }
        }
    }, [isRefreshing, handleLogout, setToken, scheduleTokenRefresh, refreshAttempts]);

    useEffect(() => {
        if (isAuthenticated) {
            scheduleTokenRefresh();
        }

        return () => {
            if (refreshTimerRef.current) {
                window.clearTimeout(refreshTimerRef.current);
            }
        };
    }, [isAuthenticated, scheduleTokenRefresh]);

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
