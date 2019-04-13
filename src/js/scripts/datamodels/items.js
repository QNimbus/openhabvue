import { store } from '../app.js';

// Local imports
import { ModelAdapterBase } from './modelbase';
import { dataStructuresObj } from '../../storage/OpenHabStorageModel';
import { customFetch } from '../../_helpers/index.js';

class ModelAdapter extends ModelAdapterBase {
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

const listMixins = {
  computed: {
    itemCount: function() {
      return Object.keys(this.items).length;
    }
  }
};

const listItemMixins = {
  methods: {
    sendCommand: function(event) {
      console.log(`Sending command... ${store.url}/rest/items/${this.listItem.name} => ${event.target.value}`);

      customFetch(`http://${store.url}/rest/items/${this.listItem.name}`, { body: event.target.value, method: 'POST', headers: new Headers({ 'content-type': 'text/plain' }) })
        .then(r => {
          console.log(r);
        })
        .catch(error => {
          if (error.status && error.status == 400) {
            this.message = 'Command not applicable for item type!';
          } else {
            this.message = error.toString();
          }
        });
    }
  },
  computed: {
    isGroup: function() {
      return this.listItem.type === 'Group';
    }
  }
};

const ModelAdapterMixins = [listMixins];
const ModelAdapterComponentMixins = [listItemMixins];

export { ModelAdapter, ModelAdapterMixins, ModelAdapterComponentMixins };
