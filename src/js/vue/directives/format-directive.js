import Vue from 'vue/dist/vue.esm.js';

Vue.directive('format', function(el, binding, vnode) {
  const modifiers = binding.modifiers;
  if (modifiers.underline) {
    el.style.textDecoration = 'underline';
  }
  if (modifiers.bold) {
    el.style.fontWeight = 'bold';
  }
  if (modifiers.highlight) {
    el.style.background = '#ffff00';
  }
});
