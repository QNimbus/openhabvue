import { store } from '../app.js';
import Vue from 'vue/dist/vue.esm.js';

// External imports
import { orderBy } from 'lodash-es';

// Local imports
import { ModelAdapterBase } from './modelbase';
import { dataStructuresObj } from '../../storage/OpenHabStorageModel';
import { customFetch } from '../../_helpers/index.js';

class ModelAdapter extends ModelAdapterBase {
  constructor() {
    super();

    this.INDEX = dataStructuresObj['items'].key;
    Object.freeze(this.INDEX);

    this.itemsList = [];
  }

  process(data) {
    const processData = data => {
      switch (data.state) {
        case 'NULL': {
          break;
        }
        default: {
          switch (data.type) {
            case 'Dimmer':
            case 'Number': {
              data.state = parseFloat(data.state);
              break;
            }
            default: {
              break;
            }
          }
        }
      }

      return data;
    };

    if (Array.isArray(data)) {
      return data.map(dataEntry => processData(dataEntry));
    } else {
      return processData(data);
    }
  }

  indexOf(id) {
    let returnValue;
    return this.itemsList.some((value, index) => {
      returnValue = index;
      return value[this.INDEX] === id;
    })
      ? returnValue
      : undefined;
  }

  add(value) {
    this.itemsList.push(value);
  }

  remove(index) {
    this.itemsList.splice(index, 1);
  }

  change(index, value) {
    this.itemsList.splice(index, 1, value);
  }

  getAll(options = null) {
    return store.get('items', null, options).then(items => (this.itemsList = this.process(items)));
  }

  get(key, options = null) {
    return store.get('items', key, options).then(items => (this.itemsList = this.process(items)));
  }
}

const listMixins = {
  data: {
    sortByProperties: 'name',
    orders: 'asc',
    itemFilter: {
      // type: 'Group',
      // name: item => item.name.startsWith('VT_MQTT_'),
      // name: 'VT_MQTT_DSMRReader_ElectricityCurrentlyDelivered',
    },
  },
  methods: {
    filterItems(itemFilter = {}) {
      this.itemFilter = itemFilter;
    },
    sortItems(sortByProperties = 'name', orders = 'asc') {
      this.sortByProperties = sortByProperties;
      this.orders = orders;
    },
  },
  computed: {
    items: function() {
      const filterFunc = item => {
        const filter = this.itemFilter;
        for (var key in filter) {
          if (typeof filter[key] === 'function') {
            if (!filter[key](item)) return false;
          } else {
            if (item[key] !== filter[key]) return false;
          }
        }
        return true;
      };

      let items = Object.keys(this.itemFilter).length ? this.itemsList.filter(filterFunc) : this.itemsList;
      return orderBy(items, this.sortByProperties, this.orders);
    },
    isEmpty: function() {
      return Object.keys(this.items).length === 0;
    },
    itemCount: function() {
      return Object.keys(this.items).length;
    },
  },
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
    },
  },
  computed: {
    isGroup: function() {
      return this.listItem.type === 'Group';
    },
  },
};

const ModelAdapterMixins = [listMixins];
const ModelAdapterComponentMixins = [listItemMixins];

export { ModelAdapter, ModelAdapterMixins, ModelAdapterComponentMixins };
