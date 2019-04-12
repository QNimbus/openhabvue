import Vue from 'vue/dist/vue.esm.js';

// Local imports
import { OHVueBase } from './oh-vue-base';

class OHVueList extends OHVueBase {
  constructor() {
    super();

    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.ok = false;

    this.shadowRoot.innerHTML = `<slot name="app"></slot><slot name="list"></slot><slot name="item"></slot>`;
    this.listTemplate = this.shadowRoot.querySelector('slot[name="list"]');
    this.itemTemplate = this.shadowRoot.querySelector('slot[name="item"]');
    this.mountElement = this.shadowRoot.querySelector('slot[name="app"]').assignedNodes()[0];

    if (!this.itemTemplate || !this.listTemplate) {
      this.shadowRoot.innerHTML = '<div>No template slots given!</div>';
      return;
    }

    this.listTemplate = this.listTemplate.assignedNodes()[0];
    this.itemTemplate = this.itemTemplate.assignedNodes()[0];

    if (!this.itemTemplate || !this.listTemplate) {
      this.shadowRoot.innerHTML = '<div>Template slots must contain a template!</div>';
      return;
    }

    this.dispatchEvent(new Event('load'));
    this.ok = true;
  }

  start(context) {
    if (!this.ok) return;

    this.vue = new Vue({
      created: () => {
        this.store = context;
      },
      data: function() {
        return Object.assign(context, {
          message: '',
          status: true
        });
      },
      mounted: function() {
        this.$el.setAttribute('slot', 'app');
      },
      components: {
        'oh-vue-list-item': this.createComponent(this.itemTemplate.cloneNode(true))
      },
      template: this.listTemplate
    }).$mount(this.mountElement);
  }

  updateContext(context) {
    this.vue.context = context;
  }

  createComponent(template) {
    return {
      data: () => {
        return {
          item: Object.assign({}, this.listitem) // A copy of the database item entry
        };
      },
      props: ['listitem'],
      template: template
    };
  }
}

customElements.define('oh-vue-list', OHVueList);
