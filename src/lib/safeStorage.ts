// Safe, resilient storage wrapper to handle localStorage limitations in high-privacy contexts
// e.g., Safari Private Mode, restricted WebViews, or environments where localStorage throws or is blocked.

const memoryStore: Record<string, string> = {};

const isLocalStorageAvailable = (): boolean => {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const testKey = "__storage_test_value__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const hasLocalStorage = isLocalStorageAvailable();

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (hasLocalStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn("[IDEMO Storage] Failed to getItem from localStorage:", e);
      }
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, key)
      ? memoryStore[key]
      : null;
  },

  setItem: (key: string, value: string): void => {
    if (hasLocalStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn("[IDEMO Storage] Failed to setItem in localStorage:", e);
      }
    }
    memoryStore[key] = String(value);
  },

  removeItem: (key: string): void => {
    if (hasLocalStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn(
          "[IDEMO Storage] Failed to removeItem from localStorage:",
          e,
        );
      }
    }
    delete memoryStore[key];
  },

  clear: (): void => {
    if (hasLocalStorage) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {
        console.warn("[IDEMO Storage] Failed to clear localStorage:", e);
      }
    }
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  },

  key: (index: number): string | null => {
    if (hasLocalStorage) {
      try {
        return window.localStorage.key(index);
      } catch (e) {
        console.warn("[IDEMO Storage] Failed to get key from localStorage:", e);
      }
    }
    return Object.keys(memoryStore)[index] || null;
  },

  get length(): number {
    if (hasLocalStorage) {
      try {
        return window.localStorage.length;
      } catch (e) {
        console.warn(
          "[IDEMO Storage] Failed to get length of localStorage:",
          e,
        );
      }
    }
    return Object.keys(memoryStore).length;
  },

  // Helper to retrieve all active keys (useful for purgeMemories and prefix clearing)
  getAllKeys: (): string[] => {
    if (hasLocalStorage) {
      try {
        return Object.keys(window.localStorage);
      } catch (e) {
        console.warn(
          "[IDEMO Storage] Failed to get all keys from localStorage:",
          e,
        );
      }
    }
    return Object.keys(memoryStore);
  },
};
