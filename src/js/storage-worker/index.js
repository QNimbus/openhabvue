import { staleWhileRevalidateStore } from '../storage/staleWhileRevalidateStore';

/**
 * TODO: Summary. (use period)
 *
 * TODO: Description. (use period)
 *
 * @link   https://github.com/QNimbus/openhabvue/blob/dev/src/js/storage/index.js
 * @file   This files defines the MyClass class.
 * @author B. van Wetten <bas.van.wetten@gmail.com>
 * @since  27-03-2019
 */

/** jshint {inline configuration here} */

class StorageWorker {
  constructor(worker) {
    this.store = new staleWhileRevalidateStore('OpenHAB');
    this.worker = worker;
    this.port = worker;

    this.store.connect('rancher.home.besqua.red', 18080);

    // Shared workers need to wait for the 'connect' event
    // See: https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker#Example
    this.worker.onconnect = connection => {
      [this.port] = connection.ports;
      this.port.onmessage = this.incomingMessage;
      this.postMessage('Connection succesfull');
    };

    this.port.onmessage = this.incomingMessage;

    this.store.addEventListener('storeItemChanged', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
    this.store.addEventListener('storeItemAdded', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
    this.store.addEventListener('connectionEstablished', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
    this.store.addEventListener('connectionLost', event => {
      this.postMessage({ type: event.type, msg: event.detail });
    });
  }

  incomingMessage(message) {
    // console.log(message);
  }

  postMessage(message) {
    let port = this.port;
    if (typeof port.postMessage === 'function') {
      port.postMessage(message);
    }
  }
}

const worker = new StorageWorker(self);
