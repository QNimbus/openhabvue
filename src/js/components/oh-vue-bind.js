import { store } from './app.js';

class AbstractBinding extends HTMLElement {
  constructor(store) {
    if (new.target === AbstractBinding) {
      throw new TypeError('Cannot construct AbstractBinding instances directly');
    }

    super();
    this.store = store;

    // Add events listeners
    this.store.addEventListener(
      'storeItemChanged',
      (event => {
        this.listEntryChanged(event.detail);
      }).bind(this)
    );
  }

  dispose() {
    // Remove events listeners
    this.store.removeEventListener(
      'storeItemChanged',
      (event => {
        this.listEntryChanged(event.detail);
      }).bind(this)
    );
  }

  listEntryChanged(event) {
    throw new TypeError(`Must override 'listEntryChanged' method`);
  }

  getValue(fieldName) {
    throw new TypeError(`Must override 'getValue' method`);
  }

  setValue(fieldName, value) {
    throw new TypeError(`Must override 'setValue' method`);
  }
}

class OHListBind extends AbstractBinding {
  constructor() {
    super(store);
    this.style.display = 'none';
    this.target = null;
  }

  /**
   *
   * 'connectedCallback' Invoked each time the custom element is appended into a document-connected element
   *
   * See: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#High-level_view
   * @memberof OHListBind
   */
  connectedCallback() {
    const bindingForID = this.getAttribute('for');

    this.target = document.getElementById(bindingForID);

    if (!this.target) {
      this.target = this.nextElementSibling;
    }
    if (!this.target.ok) {
      this.target.addEventListener('load', this.connectedCallback.bind(this), { once: true, passive: true });
      return;
    }

    const modelName = this.getAttribute('model');
    import(`./${modelName}.js`)
      .then(this.startBinding.bind(this))
      .catch(error => {
        console.warn(error);
      });
  }

  /**
   *
   * 'disconnectedCallback' Invoked each time the custom element is disconnected from the document's DOM.
   *
   * See: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#High-level_view
   * @memberof OHListBind
   */
  disconnectedCallback() {
    this.stopBinding();
    this.dispose();
  }

  /**
   *
   * 'attributeChangedCallback' Invoked each time one of the custom element's attributes is added, removed, or changed.
   * Which attributes to notice change for is specified in a static get observedAttributes method
   *
   * See: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#High-level_view
   * @memberof OHListBind
   */
  attributeChangedCallback() {}

  startBinding(module) {
    this.module = module;
    this.modeladapter = new module.ModelAdapter(this);

    this.target.start(this.modeladapter);

    store.addEventListener('connectionEstablished', this.datastoreConnected.bind(this));
    store.addEventListener('connectionLost', this.datastoreDisconnected.bind(this));

    if (store.connected) this.datastoreConnected();
    else this.datastoreDisconnected();
  }

  stopBinding() {
    store.removeEventListener('connectionEstablished', this.datastoreConnected.bind(this));
    store.removeEventListener('connectionLost', this.datastoreDisconnected.bind(this));
  }

  datastoreConnected(event) {
    this.modeladapter.getAll();
  }

  datastoreDisconnected(event) {
  }

  listEntryChanged(event) {
    if (!this.modeladapter) return;
  }

  getValue(fieldName) {
    return this.modeladapter[fieldName];
  }

  setValue(fieldName, value) {
    this.modeladapter[fieldName] = value;
  }
}

customElements.define('oh-vue-bind', OHListBind);
