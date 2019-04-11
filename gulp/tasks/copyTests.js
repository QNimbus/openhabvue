'use strict';

let copyTestsTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    gulp
      .src(`./test/**/*`)
      .pipe(gulp.dest(`./dist/test`))
      .on('error', error)
      .on('end', success);
  });

  func.displayName = 'Copying test files';
  func.description = 'Copying test files';

  return func;
};

module.exports = copyTestsTask;
