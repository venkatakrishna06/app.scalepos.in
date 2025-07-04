import {Navigate, useLocation, useNavigate} from 'react-router-dom';
import {useAuthStore} from '@/lib/store/auth.store';
import {useEffect, useRef} from 'react';
import {tokenService} from '@/lib/services/token.service';
import {authService} from '@/lib/api/services/auth.service';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, token, logout, setToken } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Function to refresh token
    const refreshToken = async () => {
      if (!token) return;

      try {
        // Only attempt to refresh if we have a valid token and refresh token
        if (tokenService.isTokenValid() && tokenService.getRefreshToken()) {

          const response = await authService.refreshToken();

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

        // If refresh fails, log the user out
        await logout();
        navigate('/login', { state: { from: location }, replace: true });
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

      // Format time until expiry for logging
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
      const secondsUntilExpiry = Math.floor((timeUntilExpiry % 60000) / 1000);

      // Refresh 5 minutes (300,000 ms) before expiry, or halfway to expiry if less than 10 minutes remain
      const refreshBuffer = Math.min(300000, timeUntilExpiry / 2);
      const refreshDelay = Math.max(0, timeUntilExpiry - refreshBuffer);

      // Format refresh delay for logging
      const minutesUntilRefresh = Math.floor(refreshDelay / 60000);
      const secondsUntilRefresh = Math.floor((refreshDelay % 60000) / 1000);

      // Schedule refresh
      refreshTimerRef.current = window.setTimeout(refreshToken, refreshDelay);
    };

    // Initialize token refresh schedule if authenticated
    if (isAuthenticated && token) {

      scheduleTokenRefresh();
    } else {

    }

    // Cleanup function
    return () => {
      if (refreshTimerRef.current) {

        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [token, isAuthenticated, logout, navigate, location, setToken]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
