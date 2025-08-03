import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

/**
 * Formats a time string in 12-hour format with AM/PM
 * @param dateString - ISO date string
 * @returns Formatted time string (e.g., "3:45 PM")
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString.replace(/Z$/, ''));
  return format(date, 'h:mm a');
}

/**
 * Formats a date with contextual information (Today/Yesterday) and time
 * @param dateString - ISO date string
 * @returns Formatted date string with contextual information
 */
export function formatDateWithContext(dateString: string): string {
  const date = new Date(dateString.replace(/Z$/, ''));
  
  if (isToday(date)) {
    return `Today, ${formatTime(dateString)}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${formatTime(dateString)}`;
  } else {
    return format(date, 'MMM d, h:mm a');
  }
}

/**
 * Formats a date in ISO format (YYYY-MM-DD HH:MM:SS)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in ISO format
 */
export function formatDateISO(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date.replace(/Z$/, '')) : date;
  return format(dateObj, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Formats a date for filenames (YYYY-MM-DD_HH-MM)
 * @param date - Date object
 * @returns Formatted date string for filenames
 */
export function formatDateForFilename(date: Date): string {
  return format(date, 'yyyy-MM-dd_HH-mm');
}

/**
 * Formats a date in short format (MM/DD/YYYY)
 * @param dateString - ISO date string
 * @returns Formatted date string in short format
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString.replace(/Z$/, ''));
  return format(date, 'MM/dd/yyyy');
}

/**
 * Formats a date in long format (Month DD, YYYY)
 * @param dateString - ISO date string
 * @returns Formatted date string in long format
 */
export function formatLongDate(dateString: string): string {
  const date = new Date(dateString.replace(/Z$/, ''));
  return format(date, 'MMMM dd, yyyy');
}

/**
 * Formats a date as a relative time (e.g., "2 hours ago")
 * @param dateString - ISO date string or timestamp
 * @param options - Options for formatDistanceToNow
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateString: string | number | Date, options: { addSuffix?: boolean } = { addSuffix: true }): string {
  const date = typeof dateString === 'string' 
    ? new Date(dateString.replace(/Z$/, '')) 
    : (dateString instanceof Date ? dateString : new Date(dateString));
  
  return formatDistanceToNow(date, options);
}

/**
 * Formats a date for date range display (Month DD, YYYY)
 * @param date - Date object
 * @returns Formatted date string for date range display
 */
export function formatDateRange(date: Date): string {
  return format(date, "LLL dd, y");
}