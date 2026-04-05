/**
 * GitHub Gist Storage Utility
 * Uses backend API endpoints to fetch/save data securely (token stays server-side)
 */

export interface StorageData {
  links: any[];
  projects: any[];
  theme: any;
  timestamp: string;
}

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
      throw new Error(error.error || `Failed to save to gist: ${response.statusText}`);
    }

    console.log('✅ Data saved to GitHub Gist');
  } catch (error) {
    console.error('❌ Error saving to gist:', error);
    throw error;
  }
}

/**
 * Sync data: save to gist and return the data
 */
export async function syncDataToGist(data: StorageData): Promise<void> {
  try {
    await saveToGist(data);
  } catch (error) {
    console.error('Sync failed:', error);
    // Fail silently - fall back to localStorage
  }
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
