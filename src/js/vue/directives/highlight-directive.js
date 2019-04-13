import Vue from 'vue/dist/vue.esm.js';

Vue.directive('highlight-on-change', {
  bind(el, { value }) {
    //
  },
  componentUpdated(el, { value, oldValue }) {
    if (value !== oldValue) {
      el.classList.remove('highlight');
      el.classList.add('highlight');

      setTimeout(_ => el.classList.remove('highlight'), 1000);
    }
  },
  unbind(el) {
    //
  }
});
