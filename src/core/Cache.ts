// src/Cache.ts
export class Cache<T> {
  private cache: Map<string, T> = new Map();
  private devMode: boolean;

  constructor(devMode: boolean = true) {
    this.devMode = devMode;
  }

  set(key: string, value: T) {
    if (this.devMode) return; // do not cache in dev
    this.cache.set(key, value);
  }

  get(key: string): T | undefined {
    if (this.devMode) return undefined; // always miss in dev
    return this.cache.get(key);
  }

  has(key: string): boolean {
    if (this.devMode) return false;
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}
