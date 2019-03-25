import { openDB } from 'idb';
import {
  dbVersion,
  dataStructures,
  dataStructuresObj
} from './openHabStorageModel';
import { isIterable, arrayToObject } from '../_helpers';
import _ from 'lodash-es';

const FETCH_TIMEOUT = 5000;

export async function customFetch(url) {
  let controller = new AbortController();
  let signal = controller.signal;
  let headers = new Headers({ 'content-type': 'application/json' });
  let options = {
    mode: 'cors',
    headers: headers,
    signal: signal
  };

  setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT);

  const response = await fetch(url, { options }).catch(error => {
    console.error(`Fetch error: ${error.message}`);
  });

  return response.json();
}

export class StateWhileRevalidateStore extends EventTarget {
  constructor(storeName = window.location.host) {
    super();

    this.storeName = storeName;
    this.db = openDB(this.storeName, dbVersion, {
      upgrade(db) {
        for (let dataStructure of dataStructures) {
          if (dataStructure.key) {
            db.createObjectStore(dataStructure.id, {
              keyPath: dataStructure.key
            });
          } else {
            db.createObjectStore(dataStructure.id, { autoIncrement: true });
          }
        }
      },
      blocked() {
        console.warn(
          'This connection is blocked by previous versions of the database.'
        );
      },
      blocking() {
        console.warn(
          'This connection is blocking a future version of the database from opening.'
        );
      }
    });
  }

  async initData(storeName, jsonData) {
    if (isIterable(jsonData)) {
      const transaction = (await this.db).transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      try {
        await store.clear();
      } catch (e) {
        console.warn(`Failed to clear store '${storeName}'`);
        throw e;
      }

      for (let entry of jsonData) {
        try {
          store.add(entry);
        } catch (e) {
          console.warn(`Failed to add to '${storeName}': ${entry}`);
          throw e;
        }
      }

      await transaction.done.catch(e => {
        console.warn(`Failed to initData into '${storeName}'`);
        throw e;
      });
    } else {
      console.warn(`Unknown or invalid data structure: '${jsonData}'`);
    }
  }

  async refreshData(storeName, jsonData) {
    if (isIterable(jsonData)) {
      const transaction = (await this.db).transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const oldStore = arrayToObject(await store.getAll(), store.keyPath);
      const keyName = store.keyPath;

      // Clear and add entry per entry
      await store.clear();

      for (let newEntry of jsonData) {
        try {
          const key = newEntry[keyName];
          const oldEntry = oldStore[key];
          if (oldEntry && !_.isEqual(oldEntry, newEntry)) {
            this.dispatchEvent(
              new CustomEvent('storeItemChanged', {
                detail: { value: newEntry, storeName: storeName }
              })
            );
          }
          await store.add(newEntry);
        } catch (e) {
          console.warn(`Failed to add to '${storeName}': ${newEntry}`);
          throw e;
        }
      }

      await transaction.done.catch(e => {
        console.warn(`Failed to refreshData into '${storeName}'`);
        throw e;
      });
    } else {
      console.warn(`Unknown or invalid data structure: '${jsonData}'`);
    }
  }

  async set(val) {
    try {
      return (await this.db).put('items', val);
    } catch (e) {
      console.error(e);
    }
  }
}
