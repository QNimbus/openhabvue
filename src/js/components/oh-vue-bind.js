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
   * Attempts to bind to a Vue component specified by the 'for' attribute on the element. If none such component
   * is specified it goes through all the sibling elements until it find a Vue component it can bind to.
   * If the Vue component has not been loaded yet, it waits for the 'load' event and retries the databinding.
   *
   * See: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#High-level_view
   * @memberof OHListBind
   */
  connectedCallback() {
    const bindingForID = this.getAttribute('for');
    const modelName = this.getAttribute('model');

    this.key = this.getAttribute('key');
    this.target = document.getElementById(bindingForID);

    if (!modelName) {
      console.warn(`No datamodel specified. Use 'model' attribute on <${this.tagName}>`);
      return;
    }

    if (!this.target) {
      console.debug(`No 'for' attribute specified on <${this.tagName}>, finding next Vue component`);
      this.target = this;
      while ((this.target = this.target.nextElementSibling)) {
        if (this.target.hasOwnProperty('vue')) {
          console.debug(`Attempting to bind to next Vue component: <${this.target.tagName}>`);
          break;
        }
      }

      if (!this.target) {
        console.warn(`Unable to bind to vue component`);
        return;
      } else {
        console.debug(`<${this.tagName}> bound to <${this.target.tagName}>`);
      }
    }

    // If the target Vue component has not been loaded yet, await the 'load' event fired from the component
    if (!this.target.ok) {
      console.debug(`Waiting for <${this.target.tagName}> to become ready...`);
      this.target.addEventListener('load', this.connectedCallback.bind(this), { once: true, passive: true });
      return;
    }

    // Load the datamodel and start the datamodel binding
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
    let index = this.modelAdapter.indexOf(id);
    if (index) {
      entry = this.modelAdapter.process(entry);
      this.modelAdapter.change(index, entry);
    }
  }

  storeEntryAdded(event) {
    if (!this.modelAdapter) return;

    let entry = event.value;
    let id = entry[this.modelAdapter.INDEX];

    // Only add new (non-existing) entries
    let index = this.modelAdapter.indexOf(id);
    if (index === undefined) {
      entry = this.modelAdapter.process(entry);
      this.modelAdapter.add(entry);
    }
  }

  storeEntryRemoved(event) {
    if (!this.modelAdapter) return;

    let id = event.value[this.modelAdapter.INDEX];

    // Only remove pre-existing entries
    let index = this.modelAdapter.indexOf(id);
    if (index) {
      this.modelAdapter.remove(index);
    }
  }

  // getValue(fieldName) {
  //   return this.modelAdapter[fieldName];
  // }

  // setValue(fieldName, value) {
  //   this.modelAdapter[fieldName] = value;
  // }
}

customElements.define('oh-vue-bind', OHListBind);
