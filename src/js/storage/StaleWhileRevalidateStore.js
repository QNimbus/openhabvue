/**
 * Interface to IDBDatabase instance for storing openHAB items, things, etc
 *
 * This class provides an interface between the IndexedDB datastore and the client.
 * It uses the 'stale-while-revalidate' pattern. The stale-while-revalidate pattern allows you
 * to respond the request as quickly as possible with a cached response if available,
 * falling back to the network request if it’s not cached. The network request is then used to update the cache.
 *
 * The database initializes its data by performing a REST API query to the openHAB instance and listens
 * for SSE (server-side-events) to perform mutations on the dataset to keep it in sync with the openHAB state.
 *
 * It emits the following events: connecting, connectionLost, connectionEstablished, storeItemRemoved, storeItemAdded, storeItemChanged
 *
 * @link   https://github.com/QNimbus/openhabvue/blob/dev/src/js/storage/StaleWhileRevalidateStore.js
 * @file   This files defines the StaleWhileRevalidateStore class.
 * @author B. van Wetten <bas.van.wetten@gmail.com>
 * @since  27-03-2019
 */

/** jshint {inline configuration here} */

// External imports
import { openDB } from 'idb';
import { isEqual, defaults } from 'lodash-es';

// Local imports
import { isIterable, arrayToObject, customFetch, FetchException, CustomException } from '../_helpers';
import { dbVersion, dataStructures, dataStructuresObj } from './OpenHabStorageModel';
import { extractFromArray } from '../_helpers/helpers';

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
    this.db = undefined;

    this.expireDurationMS = 1000 * 60 * 60; // 1 hour cache for `getAll`
    this.lastRefresh = {}; // Will contain entries like url:time where time is Date.now()-like.
  }

  /**
   * Disposes StaleWhileRevalidateStore; close IndexedDB database connection and closing EventSource connection
   *
   * @memberof StaleWhileRevalidateStore
   */
  dispose() {
    if (this.db) {
      this.db.close();
      delete this.db;
    }
    if (this.eventSource) {
      ['onerror', 'onmessage', 'onopen'].forEach(eventHandler => {
        this.eventSource[eventHandler] = null;
      });
      this.eventSource.close();
    }
    this.activeQueries = {};
  }

  /**
   * Connects to local IndexedDB database, initializes the database with values using the openHAB REST API and
   * starts an EventSource instance to capture all subsequent incomming events to keep the IndexedDB database in
   * sync with the openHAB instance.
   *
   * @param {string} [host='localhost']
   * @param {number} [port=8080]
   * @returns
   * @throws {FetchException} Throws exception when unable to connect to REST API or when receiving invalid response
   * @throws {CustomException} Throws exception when unable to fill the IndexedDB datastore
   * @memberof StaleWhileRevalidateStore
   */
  async connect(host = 'localhost', port = 8080) {
    this.dispose();

    this.dispatchEvent(new CustomEvent('connecting', { detail: this.host }));

    this.connected = false;
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
              keyPath: dataStructure.key
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
      }
    }).catch(error => {
      console.error(error);
    });

    // Fetch all endpoints in parallel, replace the stores with the received data
    const restURL = `http://${this.host}:${this.port}`;
    const requests = dataStructures
      .filter(item => item.onstart)
      .map(item =>
        customFetch(`${restURL}/${item.uri}`)
          .then(response => (response ? response.json() : response))
          .then(json => (json ? this.initDatastore(item.id, json) : json))
          .catch(error => {
            if (error.constructor === FetchException) {
              let errorMessage = `Failed to fetch ${restURL}/${item.uri}`;
              throw new FetchException(errorMessage, error);
            } else {
              let errorMessage = `Failed to fill '${item.id}'`;
              throw new CustomException(errorMessage, item, error);
            }
          })
      );

    // Wait for all requests (promises) to complete and register SSE
    return Promise.all(requests).then(() => {
      this.eventSource = new EventSource(`${restURL}/rest/events`);
      this.eventSource.onmessage = this.sseMessageReceived.bind(this);
      this.eventSource.onerror = this.sseError.bind(this);
      this.eventSource.onopen = this.sseOpen.bind(this);
    });
  }

  /**
   * This method processes incomming SSE messages and calls corresponding methods for each event received to
   * keep the IDB datastore in sync with the openHAB instance. It is bound to the EventSource.onmessage handler.
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
      // Additions
      case 'ItemAddedEvent': {
        const newItem = JSON.parse(data.payload);
        this.insert(storeName, newItem);
        return;
      }
      // Updates
      case 'ItemUpdatedEvent': {
        const [updatedItem, previousItem] = JSON.parse(data.payload);
        this.insert(storeName, updatedItem);
        return;
      }
      // State changed
      case 'ItemStateEvent': {
        const newState = JSON.parse(data.payload);
        this.update(storeName, itemName, fieldName, newState.value);
        return;
      }
      // Removals
      case 'ItemRemovedEvent': {
        const item = JSON.parse(data.payload);
        this.remove(storeName, item);
        return;
      }
      // Ignored events
      case 'InboxAddedEvent':
      case 'InboxUpdatedEvent':
      case 'ThingUpdatedEvent':
      case 'GroupItemStateChangedEvent':
      case 'ItemStateChangedEvent':
      case 'ItemStatePredictedEvent':
      case 'ItemCommandEvent':
      case 'ThingStatusInfoEvent':
      case 'ThingStatusInfoChangedEvent': {
        return;
      }
    }
    console.warn(`Unhandled SSE`, data);
  }

  /**
   * Method bound to EventSource.onerror which handles EventSource errors.
   *
   * @param {*} error
   * @memberof StaleWhileRevalidateStore
   */
  sseError(error) {
    if (this.eventSource.readyState !== 1) {
      this.connected = false;
      console.warn(`Connection lost to http://${this.host}:${this.port}`);
      this.dispatchEvent(new CustomEvent('connectionLost', { detail: { type: 404, message: error.toString() } }));
      this.eventSource.close();
    } else {
      console.warn(`SSE Error received from http://${this.host}:${this.port}: `, error);
    }
  }

  /**
   * Method bound to EventSource.onopen which gets called when the EventSource instance has
   * successfully established a connection with openHAB SSE.
   *
   * @param {*} message
   * @memberof StaleWhileRevalidateStore
   */
  sseOpen(message) {
    this.connected = true;
    this.dispatchEvent(new CustomEvent('connectionEstablished', { detail: { host: this.host, message: message } }));
  }

  /**
   * Method clears existing IndexedDB datastore and inserts all object within jsonData into store with 'storeName'
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
   * Method accepts a JSON object and inserts/updates into store with name 'storeName'.
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
   * Executes a REST API query. Times out after a while when no valid response has been received. If query is already running,
   * it returns the promise of the original query instead of submitting a new query. To aid in the caching of the data,
   * a timestamp is recorded for when the query was last run.
   *
   * @param {*} uri
   * @returns Promise
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

  /**
   * Returns true/false depening on SSE connection state.
   *
   * @returns boolean
   * @memberof StaleWhileRevalidateStore
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Returns true/false depending on the age of the query
   *
   * @param {*} uri
   * @returns boolean
   * @memberof StaleWhileRevalidateStore
   */
  isCacheStillValid(uri) {
    return this.lastRefresh[uri] !== undefined && this.lastRefresh[uri] + this.expireDurationMS > Date.now();
  }

  /**
   * Method gets value from IndexedDB database and simultaneously performs an asynchronous REST query to the
   * openHAB instance.
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

    defaults(options, {});

    try {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.store;
      const metaData = dataStructuresObj[storeName];
      const uriParts = metaData.uri.split('?');
      const uri = metaData.allowSingleItem === true ? `${uriParts[0]}/${objectID}?${uriParts[1]}` : `${uriParts[0]}?${uriParts[1]};`;

      // Get current value from datastore
      dataStoreEntry = store.get(objectID);

      // Query REST API for actual/current state
      newEntry = this.queryRESTAPI(uri)
        .then(jsonData => (metaData.allowSingleItem === true ? jsonData : extractFromArray(jsonData, metaData.key, objectID)))
        .then(jsonData => this.insert(storeName, jsonData))
        .catch(error => {
          console.warn(`REST API query failed for ${uri}: `, error);
          return Promise.resolve({ result: undefined });
        });
    } catch (error) {
      console.warn(`Failed to read ${storeName}:${objectID}: `, error);
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

    defaults(options, {
      forceRefresh: false
    });

    try {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.store;
      const metaData = dataStructuresObj[storeName];
      const uri = metaData.uri;

      // Get current values from datastore
      dataStoreEntries = store.getAll();

      if (this.isCacheStillValid(uri) || options.forceRefresh) {
        return dataStoreEntries;
      }

      // Query REST API for actual/current state
      newEntries = this.queryRESTAPI(`${uri}`)
        .then(jsonData => this.insertAll(storeName, jsonData))
        .catch(error => {
          console.warn(`REST API query failed for ${uri}: `, error);
          return Promise.resolve({ result: undefined });
        });
    } catch (error) {
      console.warn(`Failed to read ${storeName}: `, error);
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
      const metaData = dataStructuresObj[storeName];
      const keyName = metaData.key;
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
      const metaData = dataStructuresObj[storeName];
      const keyName = metaData.key;
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
