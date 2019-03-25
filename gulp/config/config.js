'use strict';

module.exports = {
  external_js: ['./vue.js', '../vue.js', '../js/vue.js'],
  localServer: {
    port: 8001,
    host: 'localhost',
    protocol: 'http',
    path: '/main.html',
  },
  paths: {
    partials: {
      root: './src/partials',
      glob: '**/*.html',
    },
    html: {
      root: './src/html',
      glob: '*.html',
    },
    scss: {
      root: './src/scss',
      glob: '*.scss',
    },
    dist: {
      root: './dist/',
      html: './dist/',
      js: './dist/js/',
      css: './dist/css/',
    },
    js_modules: ['./src/js/*/index.js', '!src/js/_*/index.js'],
  },
};
