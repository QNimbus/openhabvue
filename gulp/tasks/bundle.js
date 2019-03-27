'use strict';

const rollupPluginNodeModuleResolve = require('rollup-plugin-node-resolve');
const rollupPluginReplace = require('rollup-plugin-replace');

let bundleTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    gulp
      .src(config.paths.js_modules)
      .pipe(
        plugins.betterRollup(
          {
            treeshake: true,
            external: config.external_js,
            plugins: [
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
      .pipe(gulp.dest(config.paths.dist.js))
      .on('error', error)
      .on('end', success);
  });

  func.displayName = 'Bundle JS files';
  func.description = 'Bundle JS files';

  return func;
};

module.exports = bundleTask;
