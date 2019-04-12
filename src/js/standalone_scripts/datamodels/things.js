import { store } from '../app.js';

// Local imports
import { ModelAdapterBase } from './modelbase';
import { dataStructuresObj } from '../../storage/OpenHabStorageModel';

export class ModelAdapter extends ModelAdapterBase {
  constructor() {
    super();

    this.INDEX = dataStructuresObj['things'].key;
    Object.freeze(this.INDEX);

    this.things = {};
  }

  /**
   *
   *
   * @param {*} things
   * @returns
   * @memberof ModelAdapter
   */
  process(things) {
    let processedThings = {};
    let index = this.INDEX;
    for (let key in things) {
      let thing = things[key];
      processedThings[thing[index]] = thing;
    }
    return processedThings;
  }

  hasKey(key) {
    return this.things.hasOwnProperty(key);
  }

  set(key, value) {
    this.things[key] = value;
  }

  getAll(options = null) {
    return store.get('things', null, options).then(things => (this.things = this.process(things)));
  }

  get(key, options = null) {
    return store.get('things', key, options).then(thing => (this.things = this.process({ thing })));
  }
}
