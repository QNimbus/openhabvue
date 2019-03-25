'use strict';

let eslintTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    gulp
      .src(['src/js/**/*.js', '!src/js/_*/*.js'])
      // eslint() attaches the lint output to the "eslint" property
      // of the file object so it can be used by other modules.
      .pipe(plugins.eslint())
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach() (see Docs).
      .pipe(plugins.eslint.formatEach())
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failAfterError last.
      .on('error', error)
      // .pipe(plugins.eslint.failAfterError());
      .on('end', success);
  });

  func.displayName = 'ESLint';
  func.description = 'ESLint';

  return func;
};

module.exports = eslintTask;
