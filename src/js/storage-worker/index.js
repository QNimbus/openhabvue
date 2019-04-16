import { StaleWhileRevalidateStore } from '../storage/StaleWhileRevalidateStore';

/**
 * Proxy for the 'StaleWhileRevalidateStore' class.
 *
 * StorageWorker class provides an interface between the StaleWhileRevalidateStore instance (public class member)
 * and the StorageConnector instance in the client (browser). This worker will handle the communication
 * with the IndexDB datastore where OpenHAB entities are stored and updated upon incoming events.
 *
 * @link   https://github.com/QNimbus/openhabvue/blob/dev/src/js/storage-worker/index.js
 * @file   This files defines the StorageWorker class.
 * @author B. van Wetten <bas.van.wetten@gmail.com>
 * @since  27-03-2019
 */

/** jshint {inline configuration here} */

class StorageWorker {
  constructor(worker) {
    this.store = new StaleWhileRevalidateStore('OpenHAB');
    this.worker = worker;
    this.port = worker;
    this.connected = false;

    this.port.onmessage = this.incomingMessage.bind(this);

    // Shared workers need to wait for the 'connect' event
    // See: https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker#Example
    this.worker.onconnect = event => {
      [this.port] = event.ports;
      this.port.onmessage = this.incomingMessage.bind(this);
    };

    this.store.addEventListener('storeItemChanged', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
    this.store.addEventListener('storeItemAdded', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
    this.store.addEventListener('storeItemRemoved', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
    this.store.addEventListener('connecting', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
    this.store.addEventListener('connectionEstablished', event => {
      this.connected = true;
      this.postMessage({ type: event.type, msg: event.detail });
    });
    this.store.addEventListener('connectionLost', event => {
      this.connected = false;
      this.postMessage({ type: event.type, msg: event.detail });
    });
  }

  async incomingMessage(messageEvent) {
    const data = messageEvent.data;
    let result;

    console.debug(`storage-worker.incomingMessage: `, data);
    try {
      switch (data.type) {
        case 'connect': {
          let host = data.host;
          let port = data.port;
          if (!host || !port || isNaN(port)) {
            console.warn(`Invalid or unspecificied host:post (${host}:${port})`);
          } else {
            this.store.connect(host, port);
          }
          break;
        }
        case 'get': {
          try {
            if (data.objectID) {
              result = await this.store.get(data.storeName, data.objectID, data.options);
            } else {
              result = await this.store.getAll(data.storeName, data.options);
            }
          } catch (error) {
            console.error(error);
          }
          this.postMessage({ type: data.type, result: result, msgID: data.msgID });
          break;
        }
        default: {
          break;
        }
      }
    } catch (error) {
      console.warn('Database error', data.type, error);
      this.postMessage({ type: error.type, result: error.toString(), isError: true, msgID: data.msgID });
    }
  }

  postMessage(message) {
    // Utility method to remove 'window' from cloned object
    function cloneObject(obj) {
      var clone = [];
      for (var i in obj) {
        if (typeof obj[i] === 'object' && obj[i] !== null) {
          if ('' + obj[i] === '[object Window]') {
            delete obj[i];
            continue;
          }

          clone[i] = cloneObject(obj[i]);
        } else clone[i] = obj[i];
      }
      return clone;
    }

    // // To avoid weird error causing by window object by JSON.stringify() execution.
    // const clone = cloneObject(message);

    let port = this.port;
    if (port && typeof port.postMessage === 'function') {
      console.debug(`storage-worker.postMessage: `, message);
      port.postMessage(JSON.parse(JSON.stringify(message)));
    }
  }
}

console.clear();

const worker = new StorageWorker(self);
