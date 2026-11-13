/* ------------------------------------------------------------------ */
/*  Save states (browser-local).                                       */
/*                                                                     */
/*  Saves are ~800 KB binary blobs, so they are stored in IndexedDB    */
/*  rather than localStorage.  Keys are strings; values are raw          */
/*  Uint8Arrays returned by Snes9xEngine.saveState().                  */
/* ------------------------------------------------------------------ */

export class SaveStateStore {
    constructor(dbName = 'snes-emu', store = 'save-states') {
        this.dbName = dbName;
        this.store = store;
        this.db = null;
    }

    async ready() {
        if (this.db) return this.db;
        if (!('indexedDB' in window)) {
            throw new Error('Save states require IndexedDB (secure context).');
        }
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.dbName, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(this.store)) {
                    db.createObjectStore(this.store);
                }
            };
            req.onsuccess = () => { this.db = req.result; resolve(this.db); };
            req.onerror = () => reject(req.error);
        });
    }

    async _db() {
        if (!this.db) await this.ready();
        return this.db;
    }

    /** Store a save state. `data` is a Uint8Array (or ArrayBuffer). */
    async save(key, data) {
        const db = await this._db();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.store, 'readwrite');
            tx.objectStore(this.store).put(new Uint8Array(data), key);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }

    /** List all save-state keys. */
    async list() {
        const db = await this._db();
        return new Promise((resolve, reject) => {
            const req = db.transaction(this.store, 'readonly').objectStore(this.store).getAllKeys();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    /** Load a save state. Returns a Uint8Array (empty if none). */
    async get(key) {
        const db = await this._db();
        return new Promise((resolve, reject) => {
            const req = db.transaction(this.store, 'readonly').objectStore(this.store).get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    /** Delete a save state. */
    async remove(key) {
        const db = await this._db();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.store, 'readwrite');
            tx.objectStore(this.store).delete(key);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }

    /** Download a save state (browser download). */
    download(key, data) {
        const blob = new Blob([new Uint8Array(data)], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (key || 'snes-state') + '.sav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
