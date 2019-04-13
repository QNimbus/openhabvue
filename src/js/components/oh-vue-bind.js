import { store } from './app.js';

// Local imports
import { BindingBase } from './bindingbase';

class OHListBind extends BindingBase {
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

    this.key = this.getAttribute('key');
    this.target = document.getElementById(bindingForID);

    if (!this.target) {
      if (!this.nextElementSibling) {
        console.warn(`oh-vue-bind: Unable to find target element ('for' property or nextElementSibling)`);
        return;
      } else {
        this.target = this.nextElementSibling;
      }
    }

    if (!this.target.ok) {
      this.target.addEventListener('load', this.connectedCallback.bind(this), { once: true, passive: true });
      return;
    }

    const modelName = this.getAttribute('model');
    import(`./datamodels/${modelName}.js`)
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
    this.modelAdapter = new module.ModelAdapter(this);
    this.modelAdapterMixins = this.module.ModelAdapterMixins;
    this.modelAdapterComponentMixins = this.module.ModelAdapterComponentMixins;

    this.target.start(this.modelAdapter, this.modelAdapterMixins, this.modelAdapterComponentMixins);

    store.addEventListener('connectionEstablished', this.datastoreConnected.bind(this));
    store.addEventListener('connecting', this.datastoreConnecting.bind(this));
    store.addEventListener('connectionLost', this.datastoreDisconnected.bind(this));

    if (store.connected) this.datastoreConnected();
    else this.datastoreDisconnected();
  }

  stopBinding() {
    store.removeEventListener('connectionEstablished', this.datastoreConnected.bind(this));
    store.removeEventListener('connecting', this.datastoreConnecting.bind(this));
    store.removeEventListener('connectionLost', this.datastoreDisconnected.bind(this));
  }

  async datastoreConnected(event) {
    console.debug(`Connected!`);
    if (this.key) {
      await this.modelAdapter.get(this.key);
    } else {
      await this.modelAdapter.getAll();
    }
  }

  datastoreConnecting(event) {
    console.debug(`Connecting...`);
  }

  datastoreDisconnected(event) {
    console.debug(`Not connected...`);
  }

  storeEntryChanged(event) {
    if (!this.modelAdapter) return;

    let entry = event.value;
    let id = entry[this.modelAdapter.INDEX];

    // Only change pre-existing entries
    if (this.modelAdapter.hasKey(id)) {
      this.modelAdapter.set(id, entry);
    }
  }

  getValue(fieldName) {
    return this.modelAdapter[fieldName];
  }

  setValue(fieldName, value) {
    this.modelAdapter[fieldName] = value;
  }
}

customElements.define('oh-vue-bind', OHListBind);
