import { StaleWhileRevalidateStore } from '../storage/StaleWhileRevalidateStore';

/**
 * TODO: Summary. (use period)
 *
 * TODO: StorageWorker class provides an interface between the SharedWorker/Worker instance (public class member)
 * and the StorageConnecter instance in the client (browser). This worker will handle the communication
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

    this.port.onmessage = this.incomingMessage.bind(this);

    this.store.connect('rancher.home.besqua.red', 18080);

    // Shared workers need to wait for the 'connect' event
    // See: https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker#Example
    this.worker.onconnect = event => {
      [this.port] = event.ports;
      this.port.onmessage = this.incomingMessage.bind(this);
      this.postMessage({ type: event.type, msg: event.detail });
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
    this.store.addEventListener('connectionEstablished', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
    this.store.addEventListener('connectionLost', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
  }

  async incomingMessage(messageEvent) {
    const data = messageEvent.data;
    let result;

    try {
      switch (data.type) {
        case 'get': {
          if (data.objectID) {
            result = await this.store.get(data.storeName, data.objectID, data.options);
          } else {
            result = await this.store.getAll(data.storeName, data.options);
          }
          break;
        }
        default: {
          break;
        }
      }
      this.postMessage({ type: data.type, result: result, msgID: data.msgID });
    } catch (error) {
      console.warn('Database error', data.type, error);
      this.postMessage({ type: e.type, result: error.toString(), isError: true, msgID: data.msgID });
    }
  }

  postMessage(message) {
    let port = this.port;
    if (typeof port.postMessage === 'function') {
      port.postMessage(message);
    }
  }
}

const worker = new StorageWorker(self);
