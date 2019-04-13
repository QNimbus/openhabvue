'use strict';

const rollupPluginNodeModuleResolve = require('rollup-plugin-node-resolve');
const rollupPluginReplace = require('rollup-plugin-replace');
const rollupPluginVue = require('rollup-plugin-vue');
const rollupCommonjs = require('rollup-plugin-commonjs');

let bundleSingleTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    gulp
      .src(config.paths.js_single_files)
      .pipe(
        plugins.betterRollup(
          {
            // treeshake: true,
            cache: false,
            external: config.external_js,
            plugins: [
              // rollupCommonjs(),
              // rollupPluginVue(),
              rollupPluginNodeModuleResolve({
                main: false,
                browser: false,
                modulesOnly: true
              }),
              rollupPluginReplace({ 'process.env.NODE_ENV': '"development"' })
            ]
          },
          { format: 'esm' },
          plugins.rollup
        )
      )
      .pipe(
        plugins.rename(path => {
          console.log('Build: ' + path.basename);
          return path.basename;
        })
      )
      .pipe(gulp.dest(config.paths.dist.js))
      .on('error', error)
      .on('end', success);
  });

  func.displayName = 'Bundle JS files';
  func.description = 'Bundle JS files';

  return func;
};

module.exports = bundleSingleTask;
