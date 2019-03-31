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

const QUEUE_ITEM_TIMEOUT = 5000;

export class MessageQueue {
  constructor(storageConnector) {
    this.queue = {};
    this.messageID = 0;

    this.storageConnector = storageConnector;
  }

  remove(messageID) {
    delete this.queue[messageID];
  }

  get(messageID) {
    return this.queue[messageID];
  }

  add(type) {
    let newQueueItem = new QueueItem(this, this.storageConnector, type);
    this.queue[this.messageID++] = newQueueItem;
    this.messageID %= 1000;
    return newQueueItem;
  }
}

/**
 *
 *
 * @export
 * @class MessageQueue
 */
export class QueueItem {
  constructor(messageQueue, storageConnector, messageType) {
    this.queue = messageQueue;
    this.messageID = messageQueue.messageID;
    this.messageType = messageType;
    this.storageConnector = storageConnector;

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // Automatically expire queue item after timeout
    this.expireTimer = setTimeout(() => this.expire(), QUEUE_ITEM_TIMEOUT);
  }

  /**
   *
   *
   * @memberof QueueItem
   */
  delete() {
    this.queue.remove(this.messageID);
  }

  /**
   *
   *
   * @param {*} value
   * @memberof MessageQueue
   */
  accept(value) {
    this.delete();
    clearTimeout(this.expireTimer);

    if (value instanceof Error) {
      this.reject(value);
    } else {
      this.resolve(value);
    }
  }

  /**
   *
   *
   * @memberof MessageQueue
   */
  expire() {
    this.delete();
    this.reject(`StorageConnector queue item '${this.messageType}' timed out`);
  }
}
