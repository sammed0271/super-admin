import type { Center } from "../types/centerEntry";

const DB_NAME = "dairy-superadmin-db";
const DB_VERSION = 1;
const CENTER_STORE = "centers";

const openCenterDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CENTER_STORE)) {
        const store = database.createObjectStore(CENTER_STORE, { keyPath: "id" });
        store.createIndex("dairyCode", "dairyCode", { unique: true });
        store.createIndex("createdAt", "system.createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB."));
  });
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>
): Promise<T> => {
  const db = await openCenterDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(CENTER_STORE, mode);
    const store = transaction.objectStore(CENTER_STORE);

    operation(store)
      .then((value) => {
        transaction.oncomplete = () => {
          db.close();
          resolve(value);
        };
      })
      .catch((error) => {
        db.close();
        reject(error);
      });

    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };
  });
};

export const getCentersFromDb = async (): Promise<Center[]> => {
  return withStore("readonly", (store) => {
    return new Promise<Center[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const rows = (request.result as Center[]).sort((a, b) =>
          b.system.createdAt.localeCompare(a.system.createdAt)
        );
        resolve(rows);
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Unable to read centers from IndexedDB."));
    });
  });
};

export const saveCenterToDb = async (center: Center): Promise<void> => {
  return withStore("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.put(center);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Unable to save center to IndexedDB."));
    });
  });
};

export const updateCenterInDb = async (center: Center): Promise<void> => {
  return saveCenterToDb(center);
};

export const deleteCenterFromDb = async (centerId: string): Promise<void> => {
  return withStore("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(centerId);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Unable to delete center from IndexedDB."));
    });
  });
};

export const seedCentersToDb = async (centers: Center[]): Promise<void> => {
  if (centers.length === 0) return;

  return withStore("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      let completed = 0;

      centers.forEach((center) => {
        const request = store.put(center);
        request.onsuccess = () => {
          completed += 1;
          if (completed === centers.length) {
            resolve();
          }
        };
        request.onerror = () =>
          reject(request.error ?? new Error("Unable to seed centers in IndexedDB."));
      });
    });
  });
};
