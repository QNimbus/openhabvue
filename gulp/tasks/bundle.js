'use strict';

const config = require('../config/config');

const rename = require('gulp-rename');

const rollup = require('gulp-better-rollup');
const rollupEach = require('gulp-rollup-each');
const rollupPluginNodeModuleResolve = require('rollup-plugin-node-resolve');
const rollupPluginReplace = require('rollup-plugin-replace');

module.exports = gulp => {
  let bundleTask = function() {
    return gulp
      .src(config.paths.js_modules)
      .pipe(
        rollup(
          {
            external: config.external_js,
            plugins: [
              rollupPluginNodeModuleResolve({
                main: false,
                browser: false,
                modulesOnly: true,
              }),
              rollupPluginReplace({ 'process.env.NODE_ENV': '"development"' }),
            ],
          },
          { format: 'esm' },
          require('rollup')
        )
      )
      .pipe(
        rename(path => {
          let modulename = null;
          // Input is: js/bundles/{bundle-name}/index.js. Output is: js/{bundle-name}.js
          if (path.basename === 'index') {
            path.basename = modulename || path.dirname;
            path.dirname = '';
          } else if (singleFileBundle) {
            if (modulename) path.dirname = modulename;
          } else {
            // Input is: node_modules/monaco-editor/esm/vs/language/json/json.worker.js. Output is: json.worker.js
            path.dirname = '';
          }
          console.log('Build: ' + path.dirname + '/' + path.basename);
          return path;
        })
      )
      .pipe(gulp.dest(config.paths.dist.js));
  };

  bundleTask.displayName = 'TODO';
  bundleTask.description = 'TODO';

  gulp.task('bundle', bundleTask);
};
