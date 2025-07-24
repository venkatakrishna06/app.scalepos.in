import {type ClassValue, clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Generates a sequential token number for takeaway and quick-bill orders
 * Format: YYMMDD-XXX (date-sequential number)
 * The counter resets daily
 */
export function generateTokenNumber(): string {
    // Get today's date in YYMMDD format
    const today = new Date();
    const datePrefix = `${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

    // Get the current count from localStorage or start at 1
    const currentCount = parseInt(localStorage.getItem(`token_count_${datePrefix}`) || '0') + 1;

    // Save the updated count
    localStorage.setItem(`token_count_${datePrefix}`, currentCount.toString());

    // Format: YYMMDD-XXX (date-sequential number)
    return `${datePrefix}-${currentCount.toString().padStart(3, '0')}`;
}

/**
 * Debounces a function to prevent multiple rapid calls
 * @param func The function to debounce
 * @param wait The time to wait in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * In-flight request cache to prevent duplicate API calls
 */
const inFlightRequests: Record<string, Promise<any>> = {};

/**
 * Deduplicates identical API calls that happen concurrently
 * @param key A unique key for the request
 * @param requestFn The API request function
 * @returns The result of the API call
 */
export async function deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
): Promise<T> {
    // If there's already an in-flight request with this key, return its promise
    if (inFlightRequests[key]) {
        return inFlightRequests[key];
    }
    
    // Otherwise, make the request and store its promise
    try {
        inFlightRequests[key] = requestFn();
        const result = await inFlightRequests[key];
        return result;
    } finally {
        // Clean up after the request is complete
        delete inFlightRequests[key];
    }
}

/**
 * Simple in-memory cache for API responses
 */
const apiCache: Record<string, {
    data: any;
    timestamp: number;
}> = {};

/**
 * Caches API responses to prevent unnecessary network requests
 * @param key A unique key for the cached data
 * @param requestFn The API request function
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 * @returns The cached or fresh API response
 */
export async function cacheApiResponse<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
    const now = Date.now();
    const cached = apiCache[key];
    
    // If we have a valid cached response, return it
    if (cached && now - cached.timestamp < ttl) {
        return cached.data;
    }
    
    // Otherwise, make the request and cache the result
    const data = await requestFn();
    apiCache[key] = { data, timestamp: now };
    return data;
}
