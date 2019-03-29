'use strict';

let serveTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    try {
      plugins.connect.server({
        root: config.paths.dist.root,
        port: config.localServer.port,
        livereload: true,
      });
    } catch (e) {
      error(e);
    }
    success();
  });

  func.displayName = 'Starting live reload webserver';
  func.description = 'Starting live reload webserver';

  return func;
};

module.exports = serveTask;
