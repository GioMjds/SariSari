/**
 * Timezone utility functions for handling local timestamps correctly
 * Fixes issue where SQLite CURRENT_TIMESTAMP is UTC but needs to be stored as local time
 */

/**
 * Get current timestamp in local timezone as ISO string
 * This should be used when inserting timestamps into the database
 */
export const getCurrentLocalTimestamp = (): string => {
	const now = new Date();
	return now.toISOString();
};

/**
 * Convert a stored ISO timestamp string to a proper Date object
 * Accounts for timezone offset issues
 */
export const parseStoredTimestamp = (timestamp: string | null | undefined): Date | null => {
	if (!timestamp) return null;
	
	try {
		// If the timestamp is in ISO format (from database)
		const date = new Date(timestamp);
		return date;
	} catch (error) {
		console.error('Error parsing timestamp:', timestamp, error);
		return null;
	}
};

/**
 * Get timezone offset in hours
 */
export const getTimezoneOffsetHours = (): number => {
	const now = new Date();
	return now.getTimezoneOffset() / -60; // Negative because getTimezoneOffset returns opposite sign
};

/**
 * Get today's date in YYYY-MM-DD format in local timezone
 * Use this for date comparisons in SQL queries
 */
export const getTodayDateString = (): string => {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

/**
 * Alternative: Store timestamps with offset information
 * Returns ISO string that includes local timezone info
 */
export const getCurrentTimestampWithOffset = (): string => {
	const now = new Date();
	// Format: "2024-11-19T10:30:45+08:00" (with timezone offset)
	return now.toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
		.replace(' ', 'T')
		.concat(getTimezoneOffsetString());
};

/**
 * Get current timezone offset as string (e.g., "+08:00" or "-05:00")
 */
export const getTimezoneOffsetString = (): string => {
	const now = new Date();
	const offset = -now.getTimezoneOffset();
	const hours = Math.floor(Math.abs(offset) / 60);
	const minutes = Math.abs(offset) % 60;
	const sign = offset >= 0 ? '+' : '-';
	
	return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Format a timestamp for display
 * Handles both ISO strings and Date objects
 */
export const formatTimestampForDisplay = (timestamp: string | Date | null, format: string = 'MMM dd, yyyy h:mm a'): string => {
	if (!timestamp) return '';
	
	const date = timestamp instanceof Date ? timestamp : parseStoredTimestamp(timestamp);
	if (!date) return '';
	
	// Using simple formatting since we're in React Native without heavy dependencies
	return date.toLocaleString('en-PH', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: true,
	});
};
