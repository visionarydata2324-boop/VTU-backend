import NodeCache from "node-cache";
import { CacheOptions } from '../utils/types/cacheOptions';
import fs from 'fs';
import path from 'path';

class Cache {
  private static instance: Cache;
  public cache: NodeCache;
  private cacheFilePath: string;
  private saveInterval: NodeJS.Timeout | null = null;
  private isDirty: boolean = false;
  private debug: boolean;

  private constructor(options: CacheOptions = {}) {
    this.cacheFilePath = path.resolve(process.cwd(), 'cache.json');
    this.debug = options.debug || false;
    this.cache = new NodeCache({
      stdTTL: options.stdTTL || 900,
      checkperiod: options.checkperiod || 60,
      deleteOnExpire: options.deleteOnExpire !== false,
      useClones: options.useClones !== false
    });

    // Load cache from file on initialization
    this.loadCacheFromFile();

    // Setup minimal event listeners
    this.cache.on('expired', (key) => {
      if (this.debug) console.log(`Key expired: ${key}`);
      this.isDirty = true;
    });

    this.cache.on('set', (key) => {
      if (this.debug) console.log(`Key set: ${key}`);
      this.isDirty = true;
      
      // Save immediately after set for critical operations
      // Comment out if you prefer only interval-based saving
      this.saveCacheToFile();
    });

    this.cache.on('del', (key) => {
      if (this.debug) console.log(`Key deleted: ${key}`);
      this.isDirty = true;
      
      // Save immediately after delete for critical operations
      // Comment out if you prefer only interval-based saving
      this.saveCacheToFile();
    });

    // Save cache to file periodically
    const saveIntervalMs = options.saveInterval || 60000; // Default: 60 seconds
    this.saveInterval = setInterval(() => {
      if (this.isDirty) {
        if (this.debug) console.log('Saving cache to file (interval)');
        this.saveCacheToFile();
        this.isDirty = false;
      }
    }, saveIntervalMs);

    // Register shutdown handlers to save cache before exit
    this.registerShutdownHandlers();
  }

  /**
   * Register process signal handlers to save cache before server shutdown
   */
  private registerShutdownHandlers(): void {
    // Handle normal exit
    process.on('exit', () => {
      this.saveBeforeExit();
    });

    // Handle CTRL+C
    process.on('SIGINT', () => {
      this.saveBeforeExit();
      process.exit(0);
    });

    // Handle kill command
    process.on('SIGTERM', () => {
      this.saveBeforeExit();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.saveBeforeExit();
      process.exit(1);
    });
  }

  /**
   * Save cache before process exit
   */
  private saveBeforeExit(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    
    // Force save regardless of the dirty flag
    if (this.debug) console.log('Saving cache before exit');
    this.saveCacheToFile();
  }

  /**
   * Save cache to file
   */
  private saveCacheToFile(): void {
    try {
      const allData: Record<string, any> = {};
      
      // Get all keys from the cache
      const keys = this.cache.keys();
      
      if (keys.length === 0) {
        if (this.debug) console.log('No keys to save, skipping file write');
        return;
      }
      
      // Iterate over each key to get its value and TTL
      keys.forEach((key) => {
        const value = this.cache.get(key);
        const ttl = this.cache.getTtl(key);
        
        // Store the value directly with TTL as a property
        allData[key] = {
          value: value,
          ttl: ttl ? ttl : undefined, // Store the absolute timestamp
        };
      });

      // Write to a temporary file first to ensure atomic operation
      const tempFilePath = `${this.cacheFilePath}.tmp`;
      
      // Make sure the directory exists
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, JSON.stringify(allData, null, 2), 'utf8');
      
      // Rename temp file to actual file (atomic operation)
      fs.renameSync(tempFilePath, this.cacheFilePath);
      
      if (this.debug) console.log(`Cache saved to ${this.cacheFilePath} (${keys.length} keys)`);
    } catch (error) {
      console.error('Error saving cache to file:', error);
    }
  }

  /**
   * Load cache from file
   */
  private loadCacheFromFile(): void {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const cacheData = fs.readFileSync(this.cacheFilePath, 'utf8');
        if (!cacheData || cacheData.trim() === '') {
          if (this.debug) console.log('Cache file exists but is empty');
          return;
        }
        
        const parsedData = JSON.parse(cacheData);
        let loadedCount = 0;
        
        for (const [key, data] of Object.entries(parsedData)) {
          const entry = data as { value: any; ttl: number | undefined };
          
          // Check if the entry has already expired
          if (entry.ttl && entry.ttl < Date.now()) {
            if (this.debug) console.log(`Skipping expired key during load: ${key}`);
            continue;
          }
          
          // Set in the cache with or without TTL
          if (entry.ttl) {
            // Calculate remaining TTL in seconds
            const remainingTtl = Math.max(0, Math.floor((entry.ttl - Date.now()) / 1000));
            if (remainingTtl > 0) {
              this.cache.set(key, entry.value, remainingTtl);
              loadedCount++;
            }
          } else {
            // No TTL specified, use default
            this.cache.set(key, entry.value);
            loadedCount++;
          }
        }
        
        if (this.debug) console.log(`Cache loaded from ${this.cacheFilePath} (${loadedCount} keys)`);
      } else {
        if (this.debug) console.log(`Cache file does not exist: ${this.cacheFilePath}`);
      }
    } catch (error) {
      console.error('Error loading cache from file:', error);
      // If the cache file is corrupted, we might want to rename it and start fresh
      if (fs.existsSync(this.cacheFilePath)) {
        const backupPath = `${this.cacheFilePath}.backup.${Date.now()}`;
        fs.renameSync(this.cacheFilePath, backupPath);
        console.error(`Corrupted cache file moved to ${backupPath}`);
      }
    }
  }

  /**
   * Get singleton instance of Cache
   * @param options - Optional cache configuration options
   * @returns The singleton cache instance
   */
  public static getInstance(options: CacheOptions = {}): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache(options);
    }
    return Cache.instance;
  }

  /**
   * Store value in cache
   * @param key - The cache key
   * @param value - The cache value
   * @param ttl - The time to live in seconds(optional)
   * @returns True on success
   */
  set<T>(key: string, value: T, ttl: number): boolean {
    const result = this.cache.set(key, value, ttl);
    // Save immediately is handled by the 'set' event handler
    return result;
  }

  /**
   * Retrieve a value from the cache
   * @param key - The cache key
   * @return the stored value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (this.debug && value === undefined) {
      console.log(`Cache miss for key: ${key}`);
    }
    return value;
  }

  /**
   * Check if a key exists in cache and is not expired
   * @param key - The cache key
   * @returns true if the key exists, false otherwise
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from cache
   * @param key - The cache key or array of keys to delete
   * @returns Number of deleted entries
   */
  delete(key: string | string[]): number {
    return this.cache.del(key);
    // Save immediately is handled by the 'del' event handler
  }

  /**
   * Clear all keys from cache
   */
  clear(): void {
    this.cache.flushAll();
    this.isDirty = true;
    this.saveCacheToFile(); // Save immediately after clearing
  }

  /**
   * Get cache statistics
   */
  getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get all cache key-value pairs
   * @returns Record with all key-value pairs
   */
  getAll<T>(): Record<string, T> {
    return this.cache.mget<T>(this.cache.keys());
  }

  /**
   * Set default TTL for future entries
   * @param ttl - Time to live in seconds
   */
  setDefaultTTL(ttl: number): void {
    this.cache.options.stdTTL = ttl;
  }

  /**
   * Cleanup resources when the cache is no longer needed
   */
  destroy(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    
    // Save any pending changes before destroying
    if (this.isDirty) {
      this.saveCacheToFile();
    }
    
    this.cache.close();
  }

  /**
   * Force saving cache to file immediately
   */
  forceSave(): void {
    if (this.debug) console.log('Force saving cache to file');
    this.saveCacheToFile();
    this.isDirty = false;
  }
  
  /**
   * Force reloading cache from file
   */
  forceReload(): void {
    if (this.debug) console.log('Force reloading cache from file');
    this.loadCacheFromFile();
  }
  
  /**
   * Debug method to dump the current cache to console
   */
  dumpCache(): void {
    const keys = this.cache.keys();
    console.log(`Cache contains ${keys.length} keys:`);
    
    keys.forEach(key => {
      const value = this.cache.get(key);
      const ttl = this.cache.getTtl(key);
      console.log(`- ${key}: ${JSON.stringify(value)} (TTL: ${ttl ? new Date(ttl).toISOString() : 'none'})`);
    });
  }
}

// Update the CacheOptions type definition
// In ../utils/types/cacheOptions.ts:
/*
export interface CacheOptions {
  stdTTL?: number;
  checkperiod?: number;
  deleteOnExpire?: boolean;
  useClones?: boolean;
  saveInterval?: number;
  debug?: boolean;
}
*/

// Export a singleton instance with default options
export const cacheInstance = Cache.getInstance({ debug: process.env.NODE_ENV !== 'production' });

// Also export the class for custom instances if needed
export default Cache;