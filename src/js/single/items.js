import { store } from './app.js';

class ModelAdapter {
  constructor() {
    this.items = [];
  }

  getAll(options = null) {
    return this.get(options);
  }

  get(options = null) {
    return store.get('items', null, options).then(items => (this.items = items));
  }
}

export { ModelAdapter };
