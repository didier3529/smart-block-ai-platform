import { StateSubscriber } from './websocket-context';

export class WebSocketStateManager {
  private state: Map<string, any>;
  private subscribers: Map<string, Set<StateSubscriber>>;
  private persistedKeys: Set<string>;
  private storageKey = 'websocket_state';

  constructor() {
    this.state = new Map();
    this.subscribers = new Map();
    this.persistedKeys = new Set();
    this.loadPersistedState();
  }

  private loadPersistedState() {
    try {
      const persistedState = localStorage.getItem(this.storageKey);
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        Object.entries(parsed).forEach(([key, value]) => {
          this.state.set(key, value);
          this.persistedKeys.add(key);
        });
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  private notifySubscribers(key: string, value: any) {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        try {
          subscriber.callback(value);
        } catch (error) {
          console.error(`Error notifying subscriber ${subscriber.id}:`, error);
        }
      });
    }
  }

  private persistState() {
    try {
      const persistedState: Record<string, any> = {};
      this.persistedKeys.forEach(key => {
        persistedState[key] = this.state.get(key);
      });
      localStorage.setItem(this.storageKey, JSON.stringify(persistedState));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  setState(key: string, value: any, persist: boolean = false): void {
    this.state.set(key, value);
    
    if (persist) {
      this.persistedKeys.add(key);
      this.persistState();
    }

    this.notifySubscribers(key, value);
  }

  getState<T>(key: string): T | undefined {
    return this.state.get(key) as T;
  }

  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    const subscriber: StateSubscriber = {
      id: Math.random().toString(36).substr(2, 9),
      callback
    };

    this.subscribers.get(key)?.add(subscriber);

    // Initial callback with current value
    const currentValue = this.state.get(key);
    if (currentValue !== undefined) {
      callback(currentValue);
    }

    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(subscriber);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  clearState(key?: string): void {
    if (key) {
      this.state.delete(key);
      this.persistedKeys.delete(key);
      this.subscribers.delete(key);
    } else {
      this.state.clear();
      this.persistedKeys.clear();
      this.subscribers.clear();
    }
    this.persistState();
  }

  getSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    this.state.forEach((value, key) => {
      snapshot[key] = value;
    });
    return snapshot;
  }

  restoreSnapshot(snapshot: Record<string, any>): void {
    Object.entries(snapshot).forEach(([key, value]) => {
      this.setState(key, value);
    });
  }

  getSubscriberCount(key: string): number {
    return this.subscribers.get(key)?.size || 0;
  }

  isStatePersisted(key: string): boolean {
    return this.persistedKeys.has(key);
  }
} 