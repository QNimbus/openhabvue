/**
 * TODO: Summary. (use period)
 *
 * TODO: Description. (use period)
 *
 * @link   https://github.com/QNimbus/openhabvue/blob/dev/src/js/app/store.js
 * @file   This files defines the StorageConnector class.
 * @author B. van Wetten <bas.van.wetten@gmail.com>
 * @since  27-03-2019
 */

/** jshint {inline configuration here} */

// Local imports
import { MessageQueue } from './MessageQueue';

export class StorageConnector extends EventTarget {
  constructor(shared = true) {
    super();

    // Initialize queue
    this.queue = new MessageQueue(this);

    // Configure worker thread (prefer SharedWorker over dedicated Worker)
    this.worker = shared
      ? new SharedWorker('js/storage-worker.js', { name: 'Storage Worker (shared)' })
      : new Worker('js/storage-worker.js', { name: 'Storage Worker' });

    this.worker.port instanceof MessagePort ? (this.port = this.worker.port) : (this.port = this.worker);

    // Setup event handlers
    this.worker.onerror = this.error.bind(this);
    this.port.onmessage = this.incomingMessage.bind(this);

    // Initialize worker datastore connection
    this.postMessage({ type: 'connect', host: 'rancher.home.besqua.red', port: '18080' });
  }

  /**
   *
   *
   * @memberof StorageConnector
   */
  dispose() {
    this.worker.terminate();
  }

  /**
   *
   *
   * @param {*} error
   * @memberof StorageConnector
   */
  error(error) {
    console.warn('Database worker failed!', error);
    this.dispatchEvent(new CustomEvent('connectionLost', { detail: error }));
  }

  /**
   *
   *
   * @param {*} messageEvent
   * @memberof StorageConnector
   */
  incomingMessage(messageEvent) {
    const data = messageEvent.data;

    // Received response to datastore method
    if (data.msgID !== undefined) {
      const queueItem = this.queue.get(data.msgID);

      if (queueItem) {
        if (data.isError) {
          queueItem.accept(new Error(data.result));
        } else {
          queueItem.accept(data.result);
        }
      } else {
        // No queue item found for message
      }
      return;
    }

    switch (data.type) {
      case 'storeItemChanged':
      case 'storeItemRemoved':
      case 'storeItemAdded':
      case 'connectionEstablished':
      case 'connectionLost':
      case 'connect': {
        this.dispatchEvent(new CustomEvent(data.type, { detail: messageEvent }));
        break;
      }
      default: {
        // Unknown event or regular message
        if (!data.type) {
          console.warn(`Database event received without 'type' property`, data);
        } else {
          this.dispatchEvent(new CustomEvent('message', { detail: messageEvent }));
        }
        break;
      }
    }
  }

  /**
   *
   *
   * @param {*} message
   * @memberof StorageConnector
   */
  postMessage(message) {
    let port = this.port;
    // If postMessage gets called before the SharedWorker has a connection it cannot be called
    if (port && typeof port.postMessage === 'function') {
      port.postMessage(message);
    }
  }

  /**
   *
   *
   * @param {*} storename
   * @param {*} [objectid=null]
   * @param {*} [options=null]
   * @returns
   * @memberof StorageConnector
   */
  get(storeName, objectID = null, options = {}) {
    const type = 'get';
    const queueItem = this.queue.add(type);
    this.port.postMessage({ type: type, msgID: queueItem.messageID, storeName: storeName, objectID: objectID, options: options });
    return queueItem.promise;
  }
}
