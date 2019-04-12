import { store } from '../app.js';

// Local imports
import { ModelAdapterBase } from './modelbase';
import { dataStructuresObj } from '../../storage/OpenHabStorageModel';

export class ModelAdapter extends ModelAdapterBase {
  constructor() {
    super();

    this.INDEX = dataStructuresObj['items'].key;
    Object.freeze(this.INDEX);

    this.items = {};
  }

  /**
   *
   *
   * @param {*} items
   * @returns
   * @memberof ModelAdapter
   */
  process(items) {
    let processedItems = {};
    let index = this.INDEX;
    for (let key in items) {
      let item = items[key];
      processedItems[item[index]] = item;
    }
    return processedItems;
  }

  hasKey(key) {
    return this.items.hasOwnProperty(key);
  }

  set(key, value) {
    this.items[key] = value;
  }

  getAll(options = null) {
    return store.get('items', null, options).then(items => (this.items = this.process(items)));
  }

  get(key, options = null) {
    return store.get('items', key, options).then(item => (this.items = this.process({ item })));
  }
}
