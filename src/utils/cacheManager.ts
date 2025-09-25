/**
 * Comprehensive cache management utilities for aggressive cache clearing
 * Ensures fresh application state for testing and development
 */

// Version tracking for cache invalidation
const CACHE_VERSION = Date.now().toString();
const VERSION_KEY = 'app_cache_version';

/**
 * Clear all localStorage data
 */
export const clearLocalStorage = (): void => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('✅ LocalStorage cleared:', keysToRemove.length, 'items removed');
  } catch (error) {
    console.warn('⚠️ Failed to clear localStorage:', error);
  }
};

/**
 * Clear all sessionStorage data
 */
export const clearSessionStorage = (): void => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log('✅ SessionStorage cleared:', keysToRemove.length, 'items removed');
  } catch (error) {
    console.warn('⚠️ Failed to clear sessionStorage:', error);
  }
};

/**
 * Clear IndexedDB databases
 */
export const clearIndexedDB = async (): Promise<void> => {
  try {
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          }
          return Promise.resolve();
        })
      );
      console.log('✅ IndexedDB cleared:', databases.length, 'databases removed');
    }
  } catch (error) {
    console.warn('⚠️ Failed to clear IndexedDB:', error);
  }
};

/**
 * Clear all service worker caches
 */
export const clearServiceWorkerCaches = async (): Promise<void> => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Service Worker caches cleared:', cacheNames.length, 'caches removed');
    }
  } catch (error) {
    console.warn('⚠️ Failed to clear service worker caches:', error);
  }
};

/**
 * Unregister all service workers
 */
export const unregisterServiceWorkers = async (): Promise<void> => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('✅ Service Workers unregistered:', registrations.length, 'workers removed');
    }
  } catch (error) {
    console.warn('⚠️ Failed to unregister service workers:', error);
  }
};

/**
 * Force browser cache refresh by reloading with cache bypass
 */
export const forceCacheRefresh = (): void => {
  try {
    // Force reload without cache
    if ('location' in window) {
      window.location.reload();
    }
  } catch (error) {
    console.warn('⚠️ Failed to force cache refresh:', error);
  }
};

/**
 * Check if cache version has changed and needs clearing
 */
export const shouldClearCache = (): boolean => {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    return storedVersion !== CACHE_VERSION;
  } catch (error) {
    console.warn('⚠️ Failed to check cache version:', error);
    return true; // Clear cache if we can't check version
  }
};

/**
 * Update cache version after clearing
 */
export const updateCacheVersion = (): void => {
  try {
    localStorage.setItem(VERSION_KEY, CACHE_VERSION);
    console.log('✅ Cache version updated:', CACHE_VERSION);
  } catch (error) {
    console.warn('⚠️ Failed to update cache version:', error);
  }
};

/**
 * Comprehensive cache clearing function
 * Clears all browser storage and caches
 */
export const clearAllCaches = async (options: {
  skipVersionCheck?: boolean;
  skipReload?: boolean;
  logOperations?: boolean;
} = {}): Promise<void> => {
  const { skipVersionCheck = false, skipReload = false, logOperations = true } = options;

  if (logOperations) {
    console.log('🧹 Starting comprehensive cache clearing...');
  }

  // Check if we need to clear cache based on version
  if (!skipVersionCheck && !shouldClearCache()) {
    if (logOperations) {
      console.log('✅ Cache is up to date, skipping clear operation');
    }
    return;
  }

  try {
    // Clear all storage types
    clearLocalStorage();
    clearSessionStorage();
    await clearIndexedDB();
    await clearServiceWorkerCaches();
    await unregisterServiceWorkers();

    // Update version after clearing
    updateCacheVersion();

    if (logOperations) {
      console.log('✅ All caches cleared successfully!');
    }

    // Force reload if requested
    if (!skipReload) {
      setTimeout(() => {
        forceCacheRefresh();
      }, 100);
    }
  } catch (error) {
    console.error('❌ Error during cache clearing:', error);
  }
};

/**
 * Development mode detection
 */
export const isDevelopmentMode = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

/**
 * Clear cache only in development mode
 */
export const clearCacheInDevelopment = async (): Promise<void> => {
  if (isDevelopmentMode()) {
    await clearAllCaches({ logOperations: true });
  }
};

/**
 * Manual cache clear function for testing
 */
export const manualCacheClear = async (): Promise<void> => {
  console.log('🔧 Manual cache clear triggered');
  await clearAllCaches({ skipVersionCheck: true, skipReload: false, logOperations: true });
};

/**
 * Initialize cache management on app start
 */
export const initializeCacheManagement = async (): Promise<void> => {
  console.log('🚀 Initializing cache management...');
  
  // Always clear cache in development
  if (isDevelopmentMode()) {
    await clearAllCaches({ skipReload: true, logOperations: true });
  } else {
    // In production, only clear if version changed
    await clearAllCaches({ skipReload: false, logOperations: false });
  }
};