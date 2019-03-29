'use strict';

let reloadTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    gulp
      .src(__filename)
      .pipe(plugins.connect.reload())
      .on('error', error)
      .on('end', success);
  });

  func.displayName = 'Reload webserver';
  func.description = 'Reload webserver';

  return func;
};

module.exports = reloadTask;
