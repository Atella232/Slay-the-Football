const store = new Map<string, string>();

const memoryLocalStorage = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: memoryLocalStorage,
  configurable: true,
});
