'use strict';

const config = require('../config/config');
const plugins = require('gulp-load-plugins')();

const vue = require('rollup-plugin-vue');
const rollup = require('rollup-stream');

module.exports = gulp => {
  gulp.task('bundle', function() {
    return rollup({
      plugins: [vue({ css: false })],
      format: 'es',
      input: './src/components/hello.vue',
    }).pipe(gulp.dest('./dist/'));
  });
};
