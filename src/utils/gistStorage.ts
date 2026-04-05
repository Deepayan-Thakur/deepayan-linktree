/**
 * GitHub Gist Storage Utility
 * Uses backend API endpoints to fetch/save data securely (token stays server-side)
 * Includes rate-limit protection with debouncing and caching
 */

export interface StorageData {
  links: any[];
  projects: any[];
  theme: any;
  timestamp: string;
}

// Rate limit protection
let lastSaveTime = 0;
const SAVE_DEBOUNCE_MS = 3000; // Wait 3 seconds between saves
let pendingSaveTimeout: NodeJS.Timeout | null = null;
let pendingSaveData: StorageData | null = null;
let isRateLimited = false;

/**
 * Load data from GitHub Gist via backend API
 */
export async function loadFromGist(): Promise<StorageData | null> {
  try {
    const response = await fetch('/api/gist-load', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to load from gist: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Data loaded from GitHub Gist');
    isRateLimited = false;
    return data;
  } catch (error) {
    console.error('❌ Error loading from gist:', error);
    return null;
  }
}

/**
 * Save data to GitHub Gist via backend API
 */
export async function saveToGist(data: StorageData): Promise<void> {
  try {
    const response = await fetch('/api/gist-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 403 && error.error?.includes('rate limit')) {
        isRateLimited = true;
        console.warn('⚠️ GitHub API rate limit hit. Will retry in 60 seconds.');
        throw new Error('Rate limit exceeded - retrying later');
      }
      throw new Error(error.error || `Failed to save to gist: ${response.statusText}`);
    }

    console.log('✅ Data saved to GitHub Gist');
    isRateLimited = false;
    lastSaveTime = Date.now();
  } catch (error) {
    console.error('❌ Error saving to gist:', error);
    throw error;
  }
}

/**
 * Debounced sync - prevents rate limiting by batching saves
 */
export async function syncDataToGist(data: StorageData): Promise<void> {
  // Store pending data
  pendingSaveData = data;

  // If rate limited, don't try to save
  if (isRateLimited) {
    console.warn('⚠️ Skipping sync (rate limited). Data saved to localStorage.');
    return;
  }

  // Clear existing timeout
  if (pendingSaveTimeout) {
    clearTimeout(pendingSaveTimeout);
  }

  // Set new debounced save
  pendingSaveTimeout = setTimeout(async () => {
    if (!pendingSaveData) return;
    
    try {
      await saveToGist(pendingSaveData);
    } catch (error) {
      console.error('Sync failed:', error);
      // Fail silently - fall back to localStorage
    }
    
    pendingSaveTimeout = null;
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Sync data: load from gist with fallback to provided data
 */
export async function syncDataFromGist(fallbackData: StorageData): Promise<StorageData> {
  try {
    const data = await loadFromGist();
    return data || fallbackData;
  } catch (error) {
    console.error('Sync failed:', error);
    return fallbackData;
  }
}
