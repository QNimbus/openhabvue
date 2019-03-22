'use strict';

module.exports = {
  external_js: ['./vue.js', '../vue.js', '../js/vue.js'],
  localServer: {
    port: 8001,
  },
  paths: {
    partials: './src/partials/',
    dist: {
      root: './dist',
      html: './dist/',
      js: './dist/js/',
    },
    html: './src/html/',
    js_modules: ['./src/js/*/index.js', '!src/js/_*/index.js'],
  },
};
