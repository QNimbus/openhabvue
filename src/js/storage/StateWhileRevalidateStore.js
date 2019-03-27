/**
 * TODO: Summary. (use period)
 *
 * TODO: Description. (use period)
 *
 * @link   https://github.com/QNimbus/openhabvue/blob/dev/src/js/storage/stateWhileRevalidate.js
 * @file   This files defines the MyClass class.
 * @author B. van Wetten <bas.van.wetten@gmail.com>
 * @since  27-03-2019
 */

/** jshint {inline configuration here} */

// External imports
import { openDB } from 'idb';
import { isEqual } from 'lodash-es';

// Local imports
import { isIterable, arrayToObject, customFetch } from '../_helpers';
import { dbVersion, dataStructures, dataStructuresObj } from './openHabStorageModel';

/**
 *
 *
 * @export
 * @class StateWhileRevalidateStore
 * @extends {EventTarget}
 */
export class StateWhileRevalidateStore extends EventTarget {
  constructor(storeName = window.location.host) {
    super();

    this.connected = false;
    this.storeName = storeName;
  }

  dispose() {
    if (this.db) {
      this.db.close();
    }
  }

  async connect(host = 'localhost', port = 8080) {
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
    });

    // Fetch all endpoints in parallel, replace the stores with the received data
    const restURL = `http://${this.host}:${this.port}`;
    const requests = dataStructures
      .filter(item => item.onstart)
      .map(item =>
        customFetch(`${restURL}/${item.uri}`)
          .catch(error => {
            console.warn(`Failed to fetch ${restURL}/${item.uri}`);
          })
          .then(response => response.json())
          .then(json => this.initData(item.id, json))
          .catch(error => {
            console.warn('Failed to fill', item.id);
            throw error;
          })
      );

    // Wait for all requests (promises) to complete and register SSE
    return Promise.all(requests)
      .then(() => {
        this.evtSource = new EventSource(`${restURL}/rest/events`);
        this.evtSource.onmessage = this.sseMessageReceived.bind(this);
        this.evtSource.onerror = this.sseError.bind(this);
      })
      .then(() => {
        this.dispatchEvent(new CustomEvent('connectionEstablished', { detail: this.host }));
        this.connected = true;
      });
    // .catch(e => {
    //   this.connected = false;
    //   const message = e.toString();
    //   let type = 404;
    //   if (message.includes('TypeError') && !message.includes('Failed to fetch')) {
    //     type = 4041; // custom error code for Cross-orgin access
    //   }
    //   this.dispatchEvent(new CustomEvent('connectionLost', { detail: { type, message } }));
    //   throw e;
    // });
  }

  sseMessageReceived(message) {
    const data = JSON.parse(message.data);
    const [_, storeName, itemName] = data.topic.split('/');

    // Validate received event message
    if (!data || !data.payload || !data.type || !data.topic) {
      console.warn(`SSE has unknown format: type: ${data.type}, topic: ${data.topic}, payload: ${data.payload}`);
      return;
    }
  }

  sseError(message) {
    console.log('sse error', message);
  }

  /**
   *
   *
   * @param {*} storeName
   * @param {*} jsonData
   * @memberof StateWhileRevalidateStore
   */
  async initData(storeName, jsonData) {
    if (isIterable(jsonData)) {
      const transaction = (await this.db).transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      try {
        await store.clear();
      } catch (error) {
        console.warn(`Failed to clear store '${storeName}'`);
        throw error;
      }

      for (let entry of jsonData) {
        try {
          store.add(entry);
        } catch (error) {
          console.warn(`Failed to add to '${storeName}': ${entry}`);
          throw error;
        }
      }

      await transaction.done.catch(error => {
        console.warn(`Failed to initData into '${storeName}'`);
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
   * @memberof StateWhileRevalidateStore
   */
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
          if (oldEntry && !isEqual(oldEntry, newEntry)) {
            this.dispatchEvent(
              new CustomEvent('storeItemChanged', {
                detail: { value: newEntry, storeName: storeName },
              })
            );
          }
          await store.add(newEntry);
        } catch (error) {
          console.warn(`Failed to add to '${storeName}': ${newEntry}`);
          throw error;
        }
      }

      await transaction.done.catch(error => {
        console.warn(`Failed to refreshData into '${storeName}'`);
        throw error;
      });
    } else {
      console.warn(`Unknown or invalid data structure: '${jsonData}'`);
    }
  }

  /**
   *
   *
   * @param {*} val
   * @returns
   * @memberof StateWhileRevalidateStore
   */
  async set(val) {
    try {
      return (await this.db).put('items', val);
    } catch (error) {
      console.error(error);
    }
  }
}
