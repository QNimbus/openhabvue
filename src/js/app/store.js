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

export class StorageConnector extends EventTarget {
  constructor(shared = false) {
    super();

    // Configure worker thread (prefer SharedWorker over dedicated Worker)
    this.worker = shared
      ? new SharedWorker('js/storage-worker.js', { name: 'Storage Worker (shared)' })
      : new Worker('js/storage-worker.js', { name: 'Storage Worker' });

    this.worker.port instanceof MessagePort ? (this.port = this.worker.port) : (this.port = this.worker);

    // Setup event handlers
    this.worker.onerror = this.error;
    this.port.onmessage = this.incomingMessage;
  }

  dispose() {
    this.worker.terminate();
  }

  error(error) {
    console.warn('Database worker failed!', error);
    this.dispatchEvent(new CustomEvent('connectionLost', { detail: error }));
  }

  incomingMessage(message) {
    // console.log(message);
  }

  postMessage(message) {
    let port = this.port;
    // If postMessage gets called before the SharedWorker has a connection it cannot be called
    if (typeof port.postMessage === 'function') {
      port.postMessage(message);
    }
  }
}
