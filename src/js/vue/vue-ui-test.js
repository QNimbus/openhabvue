import Vue from 'vue/dist/vue.esm.js';

class VueOHTest extends HTMLElement {
  constructor() {
    super();

    this.vue = undefined;
    this.rootTemplate = '<child-component v-bind:context="context"><slot></slot></child-component>';
    this.template = '<span>context: {{ context }}</span>';
  }

  connectedCallback() {
    console.log('Connected!');
    this.dispatchEvent(new Event('load'));
  }

  start(context) {
    this.vue = new Vue({
      data: function() {
        return {
          context: context
        };
      },
      template: this.rootTemplate,
      components: {
        'child-component': this.createComponent(this.template)
      }
    }).$mount(this.appendChild(document.createElement('div')));
  }

  updateContext(context) {
    this.vue.context = context;
  }

  createComponent(template) {
    return {
      mounted: () => {
        console.log('mounted!');
      },
      props: ['context'],
      template: template,
      watch: {
        context: {
          handler: function(newVal, oldVal) {
            console.log(`newVal: ${newVal}`);
            console.log(`oldVal: ${oldVal}`);
            // this.original = newVal;
            // if (!this.changed) {
            //   this.ignoreWatch = true;
            //   this.item = JSON.parse(JSON.stringify(this.original));
            //   this.inProgress = false;
            //   this.changed = false;
            //   this.changeNotification();
            // } else {
            //   this.message = "If you save your changes, you'll overwrite the newer version.";
            //   this.messagetitle = 'Warning: Update received';
            //   this.inProgress = true;
            // }
          },
          deep: true,
          immediate: true
        }
      }
    };
  }
}

customElements.define('vue-oh-test', VueOHTest);
