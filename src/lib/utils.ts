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
