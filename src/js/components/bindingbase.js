export class BindingBase extends HTMLElement {
  constructor(store) {
    if (new.target === BindingBase) {
      throw new TypeError('Cannot construct BindingBase instances directly');
    }

    super();
    this.store = store;

    // Add events listeners
    this.store.addEventListener(
      'storeChanged',
      (event => {
        this.storeChanged(event.detail);
      }).bind(this)
    );

    this.store.addEventListener(
      'storeItemChanged',
      (event => {
        this.storeEntryChanged(event.detail);
      }).bind(this)
    );

    this.store.addEventListener(
      'storeItemAdded',
      (event => {
        this.storeEntryAdded(event.detail);
      }).bind(this)
    );

    this.store.addEventListener(
      'storeItemRemoved',
      (event => {
        this.storeEntryRemoved(event.detail);
      }).bind(this)
    );
  }

  dispose() {
    // Remove events listeners
    this.store.removeEventListener(
      'storeChanged',
      (event => {
        this.storeChanged(event.detail);
      }).bind(this)
    );

    this.store.removeEventListener(
      'storeItemChanged',
      (event => {
        this.storeEntryChanged(event.detail);
      }).bind(this)
    );

    this.store.removeEventListener(
      'storeItemAdded',
      (event => {
        this.storeEntryAdded(event.detail);
      }).bind(this)
    );

    this.store.removeEventListener(
      'storeItemRemoved',
      (event => {
        this.storeEntryRemoved(event.detail);
      }).bind(this)
    );
  }

  connectedCallback() {
    throw new TypeError(`Must override 'connectedCallback' method`);
  }

  disconnectedCallback() {
    throw new TypeError(`Must override 'disconnectedCallback' method`);
  }

  storeChanged(event) {
    throw new TypeError(`Must override 'storeChanged' method`);
  }

  storeEntryChanged(event) {
    throw new TypeError(`Must override 'storeEntryChanged' method`);
  }

  storeEntryAdded(event) {
    throw new TypeError(`Must override 'storeEntryAdded' method`);
  }

  storeEntryRemoved(event) {
    throw new TypeError(`Must override 'storeEntryRemoved' method`);
  }

  getValue(fieldName) {
    throw new TypeError(`Must override 'getValue' method`);
  }

  setValue(fieldName, value) {
    throw new TypeError(`Must override 'setValue' method`);
  }
}
