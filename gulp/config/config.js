'use strict';

module.exports = {
  external_js: ['./vue.js', '../vue.js', '../js/vue.js', './app.js', '../app.js', '../js/app.js'],
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
    components: {
      root: './src/components',
      glob: '*.js',
    },
    favicons: {
      masterPicture: './src/images/icons/siteIcon.png',
      dest: './dist/images/icons',
      urlPath: '/images/icons',
    },
    html: {
      root: './src/html',
      glob: '**/*.html',
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
    js_modules: ['./src/js/*/index.js', '!src/js/_*/index.js', '!src/js/single/*.js'],
    js_single_files: ['src/js/single/*.js'],
  },
};
