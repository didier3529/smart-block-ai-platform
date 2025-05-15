/**
 * Format a number as a currency string
 * @param value - The value to format
 * @param currency - The currency code (e.g. 'USD', 'ETH')
 * @param options - Additional formatting options
 * @returns The formatted currency string
 */
export const formatCurrency = (
  value: number, 
  currency = 'USD',
  options?: Intl.NumberFormatOptions
): string => {
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  };

  // Customize based on currency
  if (currency === 'ETH' || currency === 'BTC' || currency === 'MATIC') {
    const precision = currency === 'MATIC' ? 4 : 6;
    
    if (value < 0.000001) {
      return '< 0.000001 ' + currency;
    }
    
    return value.toFixed(precision) + (options?.suffix !== false ? ' ' + currency : '');
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: currency === 'USD' ? 'currency' : 'decimal',
      currency: currency === 'USD' ? currency : undefined,
      ...defaultOptions,
      ...options,
    }).format(value);
  } catch (e) {
    // Fallback if Intl is not supported
    return `${value.toFixed(2)} ${currency}`;
  }
};

/**
 * Format a date object to a readable string
 * @param date - The date to format
 * @param format - The format to use (default: 'medium')
 * @returns The formatted date string
 */
export const formatDate = (
  date: Date, 
  format: 'short' | 'medium' | 'long' | 'relative' = 'medium'
): string => {
  if (!date || !(date instanceof Date)) return '';
  
  if (format === 'relative') {
    return getRelativeTimeString(date);
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'short',
    day: 'numeric',
    hour: format === 'long' ? 'numeric' : undefined,
    minute: format === 'long' ? 'numeric' : undefined,
  };

  try {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (e) {
    // Fallback if Intl is not supported
    return date.toDateString();
  }
};

/**
 * Get a relative time string (e.g. "2 days ago", "just now")
 * @param date - The date to get relative time for
 * @returns The relative time string
 */
export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Just now
  if (diffInSeconds < 60) return 'just now';
  
  // Minutes ago
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  
  // Hours ago
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  
  // Days ago
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  
  // Weeks ago
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  
  // Months ago
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  
  // Years ago
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

/**
 * Format a large number with abbreviations (K, M, B)
 * @param num - The number to format
 * @param digits - The number of digits to show after decimal point
 * @returns Abbreviated number as string
 */
export const formatLargeNumber = (num: number, digits = 1): string => {
  if (isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum < 1000) return sign + absNum.toFixed(digits).replace(/\.0+$/, '');
  
  const units = ['', 'K', 'M', 'B', 'T'];
  const unit = Math.floor(Math.log10(absNum) / 3);
  const value = absNum / Math.pow(1000, unit);
  
  return sign + value.toFixed(digits).replace(/\.0+$/, '') + units[unit];
}; 