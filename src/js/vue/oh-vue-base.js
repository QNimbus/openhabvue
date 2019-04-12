export class OHVueBase extends HTMLElement {
  constructor() {
    if (new.target === OHVueBase) {
      throw new TypeError('Cannot construct OHVueBase instances directly');
    }
    super();

    this.ok = false;
    this.vue = undefined;
  }

  connectedCallback() {
    this.ok = false;
    throw new TypeError(`Must override 'connectedCallback' method`);
  }

  disconnectedCallback() {
    throw new TypeError(`Must override 'disconnectedCallback' method`);
  }

  start(context) {
    throw new TypeError(`Must override 'start' method`);
  }
}
