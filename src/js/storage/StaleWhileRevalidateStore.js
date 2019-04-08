/**
 * TODO: Summary. (use period)
 *
 * TODO: This class provides an interface between the IndeDB datastore and the client.
 * It uses the 'stale-while-revalidate' pattern. The stale-while-revalidate pattern allows you
 * to respond the request as quickly as possible with a cached response if available,
 * falling back to the network request if it’s not cached. The network request is then used to update the cache.
 *
 * @link   https://github.com/QNimbus/openhabvue/blob/dev/src/js/storage/StaleWhileRevalidateStore.js
 * @file   This files defines the StaleWhileRevalidateStore class.
 * @author B. van Wetten <bas.van.wetten@gmail.com>
 * @since  27-03-2019
 */

/** jshint {inline configuration here} */

// External imports
import { openDB } from 'idb';
import { isEqual } from 'lodash-es';

// Local imports
import { isIterable, arrayToObject, customFetch } from '../_helpers';
import { dbVersion, dataStructures, dataStructuresObj } from './OpenHabStorageModel';

/**
 *
 *
 * @export
 * @class StaleWhileRevalidateStore
 * @extends {EventTarget}
 */
export class StaleWhileRevalidateStore extends EventTarget {
  constructor(storeName = window.location.host) {
    super();

    this.connected = false;
    this.activeQueries = {};
    this.storeName = storeName;

    this.expireDurationMS = 1000 * 60 * 60; // 1 hour cache for `getAll`
    this.lastRefresh = {}; // Will contain entries like url:time where time is Date.now()-like.
  }

  /**
   *
   *
   * @memberof StaleWhileRevalidateStore
   */
  dispose() {
    if (this.db) {
      this.db.close();
    }
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  /**
   *
   *
   * @param {string} [host='localhost']
   * @param {number} [port=8080]
   * @returns
   * @memberof StaleWhileRevalidateStore
   */
  async connect(host = 'localhost', port = 8080) {
    // Delete previous database if it exists
    if (this.db) {
      this.db.close();
      delete this.db;
    }

    this.host = host;
    this.port = port;
    this.db = await openDB(this.storeName, dbVersion, {
      upgrade(db) {
        console.log('Upgrading database to version', dbVersion);
        for (let objectStore of db.objectStoreNames) {
          db.deleteObjectStore(objectStore);
        }
        for (let dataStructure of dataStructures) {
          if (dataStructure.key) {
            db.createObjectStore(dataStructure.id, {
              keyPath: dataStructure.key,
            });
          } else {
            db.createObjectStore(dataStructure.id, { autoIncrement: true });
          }
        }
      },
      blocked() {
        console.warn('This connection is blocked by previous versions of the database.');
      },
      blocking() {
        console.warn('This connection is blocking a future version of the database from opening.');
      },
    }).catch(error => {
      console.error(error);
    });

    // Fetch all endpoints in parallel, replace the stores with the received data
    const restURL = `http://${this.host}:${this.port}`;
    const requests = dataStructures
      .filter(item => item.onstart)
      .map(item =>
        customFetch(`${restURL}/${item.uri}`)
          .catch(error => {
            console.warn(`Failed to fetch ${restURL}/${item.uri}`, error);
          })
          .then(response => response.json())
          .then(json => this.initDatastore(item.id, json))
          .catch(error => {
            console.warn('Failed to fill', item.id, error);
          })
      );

    // Wait for all requests (promises) to complete and register SSE
    return Promise.all(requests)
      .then(() => {
        this.eventSource = new EventSource(`${restURL}/rest/events`);
        this.eventSource.onmessage = this.sseMessageReceived.bind(this);
        this.eventSource.onerror = this.sseError.bind(this);
        this.eventSource.onopen = this.sseOpen.bind(this);
      })
      .catch(error => {
        this.connected = false;
        this.dispatchEvent(new CustomEvent('connectionLost', { detail: { type: 404, message: error.toString() } }));
        throw error;
      });
  }

  /**
   *
   *
   * @param {*} message
   * @returns
   * @memberof StaleWhileRevalidateStore
   */
  sseMessageReceived(message) {
    const data = JSON.parse(message.data);
    const [_, storeName, itemName, fieldName] = data.topic.split('/');

    // Validate received event message
    if (!data || !data.payload || !data.type || !data.topic) {
      console.warn(`SSE has unknown format: type: ${data.type}, topic: ${data.topic}, payload: ${data.payload}`);
      return;
    }

    switch (data.type) {
      // Updates
      case 'ItemUpdatedEvent': {
        const [updatedItem, previousItem] = JSON.parse(data.payload);
        this.insert(storeName, updatedItem);
        break;
      }
      // State changed
      case 'ItemStateEvent': {
        const newState = JSON.parse(data.payload);
        this.update(storeName, itemName, fieldName, newState.value);
        break;
      }
      // Ignored events
      case 'ItemStateChangedEvent':
      case 'ItemStatePredictedEvent':
      case 'ItemCommandEvent':
      default: {
        return;
      }
    }
  }

  /**
   *
   *
   * @param {*} error
   * @memberof StaleWhileRevalidateStore
   */
  sseError(error) {
    if (this.eventSource.readyState !== 1) {
      this.connected = false;
      console.error(`Connection lost to http://${this.host}:${this.port}`);
      this.dispatchEvent(new CustomEvent('connectionLost', { detail: { type: 404, message: error.toString() } }));
    } else {
      throw error;
    }
  }

  /**
   *
   *
   * @param {*} message
   * @memberof StaleWhileRevalidateStore
   */
  sseOpen(message) {
    this.connected = true;
    this.dispatchEvent(new CustomEvent('connectionEstablished', { detail: this.host }));
  }

  /**
   *
   *
   * @param {*} storeName
   * @param {*} jsonData
   * @memberof StaleWhileRevalidateStore
   */
  async initDatastore(storeName, jsonData) {
    if (isIterable(jsonData)) {
      var transaction = this.db.transaction(storeName, 'readwrite');
      var store = transaction.store;

      await store.clear().catch(error => {
        console.warn(`Failed to clear store '${storeName}'`);
        throw error;
      });

      for (let entry of jsonData) {
        store.add(entry).catch(error => {
          console.warn(`Failed to add to '${storeName}': ${entry}`);
          throw error;
        });
      }

      // API DOC : https://www.npmjs.com/package/idb#txdone
      await transaction.done.catch(error => {
        console.warn(`Failed to initDatastore into '${storeName}'`);
        throw error;
      });
    } else {
      console.warn(`Unknown or invalid data structure: '${jsonData}'`);
    }
  }

  /**
   *
   *
   * @param {*} storeName
   * @param {*} jsonData
   * @memberof StaleWhileRevalidateStore
   */
  async insertAll(storeName, jsonData) {
    if (isIterable(jsonData)) {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.store;
      const oldStore = arrayToObject(await store.getAll(), store.keyPath);
      const keyName = store.keyPath;

      for (let newEntry of jsonData) {
        try {
          const key = newEntry[keyName];
          const oldEntry = oldStore[key];
          // Notify listeners
          if (oldEntry) {
            if (!isEqual(oldEntry, newEntry)) {
              this.dispatchEvent(new CustomEvent('storeItemChanged', { detail: { value: newEntry, storeName: storeName } }));
            } else {
              // Don't notify for existing, un-changed items
            }
          } else {
            this.dispatchEvent(new CustomEvent('storeItemAdded', { detail: { value: newEntry, storeName: storeName } }));
          }
          await store.put(newEntry);
        } catch (error) {
          console.warn(`Failed to add to '${storeName}': ${newEntry}`);
          throw error;
        }
      }

      await transaction.done.catch(error => {
        console.warn(`Failed to insertAll into '${storeName}'`);
        throw error;
      });

      return jsonData;
    } else {
      console.warn(`Unknown or invalid data structure: '${jsonData}'`);
    }
  }

  /**
   *
   *
   * @param {*} uri
   * @returns
   * @memberof StaleWhileRevalidateStore
   */
  queryRESTAPI(uri) {
    const isQueryRunning = this.activeQueries.hasOwnProperty(uri);
    if (isQueryRunning) {
      return this.activeQueries[uri];
    }

    this.activeQueries[uri] = customFetch(`http://${this.host}:${this.port}/${uri}`)
      .then(response => response.json())
      .catch(error => {
        throw error;
      })
      .finally(() => {
        delete this.activeQueries[uri];
        this.lastRefresh[uri] = Date.now();
      });

    return this.activeQueries[uri];
  }

  hasCacheExpired(uri) {
    return !!this.lastRefresh[uri] && this.lastRefresh[uri] + this.expireDurationMS < Date.now();
  }

  /**
   *
   *
   * @param {*} storeName
   * @param {*} objectID
   * @param {*} [options={}]
   * @returns
   * @memberof StaleWhileRevalidateStore
   */
  get(storeName, objectID, options = {}) {
    let dataStoreEntry;
    let newEntry;
    try {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.store;
      const uri = dataStructuresObj[storeName].uri;

      // Get current value from datastore
      dataStoreEntry = store.get(objectID);

      // Query REST API for actual/current state
      newEntry = this.queryRESTAPI(`${uri}/${objectID}`)
        .catch(error => {
          console.warn(`REST API query failed for ${uri}/${objectID}`);
          throw error;
        })
        .then(jsonData => this.insert(storeName, jsonData));
    } catch (error) {
      console.warn('Failed to read', storeName, objectID);
      dataStoreEntry = null;
    } finally {
      return dataStoreEntry || newEntry;
    }
  }

  /**
   *
   *
   * @param {*} storeName
   * @param {*} [options={}]
   * @returns
   * @memberof StaleWhileRevalidateStore
   */
  getAll(storeName, options = {}) {
    let dataStoreEntries;
    let newEntries;

    options = !!options ? options : {};
    const { forceRefresh = false } = options;
    try {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.store;
      const uri = dataStructuresObj[storeName].uri;

      // Get current values from datastore
      dataStoreEntries = store.getAll();

      // console.log(`hasCacheExpired(${uri}) = ${this.hasCacheExpired(uri)}`);
      // if (!this.hasCacheExpired(uri) && !forceRefresh) {
      //   return dataStoreEntries;
      // }

      // Query REST API for actual/current state
      newEntries = this.queryRESTAPI(`${uri}`)
        .catch(error => {
          console.warn(`REST API query failed for ${uri}`);
          throw error;
        })
        .then(jsonData => this.insertAll(storeName, jsonData));
    } catch (error) {
      console.warn('Failed to read', storeName, error);
      dataStoreEntries = null;
    } finally {
      return dataStoreEntries || newEntries;
    }
  }

  /**
   *
   *
   * @param {*} storeName
   * @param {*} newEntry
   * @returns
   * @memberof StaleWhileRevalidateStore
   */
  async insert(storeName, newEntry) {
    if (!newEntry || typeof newEntry !== 'object' || newEntry.constructor !== Object) {
      console.warn(`StaleWhileRevalidateStore.insert must be called with an object. (storeName: ${storeName}, newEntry: ${newEntry})`);
      return;
    }

    try {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.store;
      const keyName = dataStructuresObj[storeName].key;
      const oldEntry = await store.get(newEntry[keyName]);

      await store.put(newEntry);

      // Notify listeners
      if (oldEntry) {
        this.dispatchEvent(new CustomEvent('storeItemChanged', { detail: { value: newEntry, storeName: storeName } }));
      } else {
        this.dispatchEvent(new CustomEvent('storeItemAdded', { detail: { value: newEntry, storeName: storeName } }));
      }

      // API DOC : https://www.npmjs.com/package/idb#txdone
      await transaction.done.catch(error => {
        console.warn(`Failed to insert into '${storeName}'`);
        throw error;
      });

      return newEntry;
    } catch (error) {
      console.warn(`Failed to insert '${storeName}': `, newEntry);
      throw error;
    }
  }

  /**
   *
   *
   * @param {*} storeName
   * @param {*} itemName
   * @param {*} fieldName
   * @param {*} value
   * @returns
   * @memberof StaleWhileRevalidateStore
   */
  async update(storeName, itemName, fieldName, value) {
    try {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.store;
      const item = await store.get(itemName);

      if (!item) {
        console.warn(`Failed to update '${storeName}': ${itemName} not found`);
        return;
      } else {
        item[fieldName] = value;
        await store.put(item);

        // API DOC : https://www.npmjs.com/package/idb#txdone
        await transaction.done.catch(error => {
          console.warn(`Failed to update into '${storeName}'`);
          throw error;
        });

        // Notify listeners
        this.dispatchEvent(new CustomEvent('storeItemChanged', { detail: { value: item, storeName: storeName } }));
      }
    } catch (error) {
      console.warn(`Failed to update '${storeName}': ${itemName}.${fieldName} = ${value}`);
      throw error;
    }
  }

  async remove(storeName, entry) {
    if (!entry || typeof entry !== 'object' || entry.constructor !== Object) {
      console.warn(`StaleWhileRevalidateStore.remove must be called with an object. (storeName: ${storeName}, entry: ${entry})`);
      return;
    }

    try {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const keyName = dataStructuresObj[storeName].key;
      const key = entry[keyName];

      await store.delete(key);
      this.dispatchEvent(new CustomEvent('storeItemRemoved', { detail: { value: entry, storeName: storeName } }));
      return null;
    } catch (error) {
      console.warn(`Failed to remove '${storeName}': `, entry);
      throw error;
    }
  }
}
