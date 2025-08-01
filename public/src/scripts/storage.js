class OfflineStorage {
    constructor() {
        this.dbName = 'MobileNetClassifierDB';
        this.dbVersion = 1;
        this.stores = {
            history: 'classificationHistory',
            settings: 'userSettings'
        };
        this.db = null;
        this.maxHistoryItems = 100;
    }
    
    async initDB() {
        if (this.db) return this.db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.stores.history)) {
                    const historyStore = db.createObjectStore(this.stores.history, { keyPath: 'id' });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                }
            };
        });
    }
    
    async saveClassificationResult(result) {
        const db = await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.stores.history], 'readwrite');
            const store = transaction.objectStore(this.stores.history);
            const request = store.add(result);
            
            request.onsuccess = async () => {
                await this.trimHistory();
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async getClassificationHistory(limit = 20) {
        const db = await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.stores.history], 'readonly');
            const store = transaction.objectStore(this.stores.history);
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');
            const results = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    async trimHistory() {
        const db = await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.stores.history], 'readwrite');
            const store = transaction.objectStore(this.stores.history);
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');
            const items = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    items.push({ id: cursor.value.id, timestamp: cursor.value.timestamp });
                    cursor.continue();
                } else {
                    if (items.length > this.maxHistoryItems) {
                        const toDelete = items.slice(this.maxHistoryItems);
                        this.deleteHistoryItems(toDelete.map(item => item.id))
                            .then(resolve)
                            .catch(reject);
                    } else {
                        resolve();
                    }
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteHistoryItems(ids) {
        const db = await this.initDB();
        const transaction = db.transaction([this.stores.history], 'readwrite');
        const store = transaction.objectStore(this.stores.history);
        
        const deletePromises = ids.map(id => {
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
        
        return Promise.all(deletePromises);
    }
    
    async clearHistory() {
        const db = await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.stores.history], 'readwrite');
            const store = transaction.objectStore(this.stores.history);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}