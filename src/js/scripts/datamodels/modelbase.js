export class ModelAdapterBase {
  constructor() {
  }

  process(data) {
    return data;
  }

  getAll(options = null) {
    throw new TypeError(`Must override 'getAll' method`);
  }

  get(options = null) {
    throw new TypeError(`Must override 'get' method`);
  }
}
