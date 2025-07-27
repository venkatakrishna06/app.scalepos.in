import {Navigate, useLocation, useNavigate} from 'react-router-dom';
import {useAuthStore} from '@/lib/store/auth.store';
import {useEffect, useRef, useState} from 'react';
import {tokenService} from '@/lib/services/token.service';
import {authService} from '@/lib/api/services/auth.service';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({children}: AuthGuardProps) {
    const {isAuthenticated, token, logout, setToken} = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const refreshTimerRef = useRef<number | null>(null);
    const [refreshAttempts, setRefreshAttempts] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const MAX_REFRESH_ATTEMPTS = 3;
    const RETRY_DELAY = 5000; // 5 seconds

    useEffect(() => {
        // Function to refresh token
        const refreshToken = async () => {
            if (!token) return;
            
            // If already refreshing, don't start another refresh
            if (isRefreshing) return;
            
            setIsRefreshing(true);
            
            try {
                // Only attempt to refresh if we have a valid token and refresh token
                if (tokenService.isTokenValid() && tokenService.getRefreshToken()) {
                    
                    // Set a timeout to prevent hanging indefinitely
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Token refresh timeout')), 15000); // 15 seconds timeout
                    });
                    
                    // Race between the refresh request and the timeout
                    const response = await Promise.race([
                        authService.refreshToken(),
                        timeoutPromise
                    ]) as { token: string; refreshToken?: string };

                    // Reset refresh attempts on success
                    setRefreshAttempts(0);
                    
                    // Update tokens in storage and state
                    tokenService.setToken(response.token);
                    if (response.refreshToken) {
                        // This now just sets a flag indicating we have a refresh token
                        // The actual token is stored as an HttpOnly cookie by the server
                        tokenService.setRefreshToken();
                    }

                    // Update token in auth store
                    setToken(response.token);

                    // Schedule next refresh
                    scheduleTokenRefresh();
                }
            } catch (error) {
                console.error('Token refresh error:', error);
                
                // Check if we should retry
                if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
                    // Increment attempts and retry after delay
                    setRefreshAttempts(prev => prev + 1);
                    
                    // Schedule retry
                    window.setTimeout(() => {
                        setIsRefreshing(false);
                        refreshToken();
                    }, RETRY_DELAY);
                } else {
                    // If all retries fail, log the user out
                    await logout();
                    navigate('/login', {state: {from: location}, replace: true});
                }
            } finally {
                // Only set isRefreshing to false if we're not scheduling a retry
                if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
                    setIsRefreshing(false);
                }
            }
        };

        // Function to schedule token refresh
        const scheduleTokenRefresh = () => {
            // Clear any existing timer
            if (refreshTimerRef.current) {
                window.clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }

            // Get token expiry time
            const expiryTime = tokenService.getTokenExpiryTime();
            if (!expiryTime) {

                return;
            }

            // Calculate time until token expires (in milliseconds)
            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = (expiryTime - currentTime) * 1000;

            // Refresh 5 minutes (300,000 ms) before expiry, or halfway to expiry if less than 10 minutes remain
            const refreshBuffer = Math.min(300000, timeUntilExpiry / 2);
            const refreshDelay = Math.max(0, timeUntilExpiry - refreshBuffer);
            // Schedule refresh
            refreshTimerRef.current = window.setTimeout(refreshToken, refreshDelay);
        };

        // Initialize token refresh schedule if authenticated
        if (isAuthenticated) {
            scheduleTokenRefresh();
        }

        // Cleanup function
        return () => {
            if (refreshTimerRef.current) {

                window.clearTimeout(refreshTimerRef.current);
            }
        };
    }, [token, isAuthenticated, logout, navigate, location, setToken]);

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{from: location}} replace/>;
    }

    return <>{children}</>;
}
