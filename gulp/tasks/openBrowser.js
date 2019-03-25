'use strict';

let openBrowserTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    gulp
      .src(__filename)
      .pipe(
        plugins.open({
          uri: `${config.localServer.protocol}://${config.localServer.host}:${
            config.localServer.port
          }${config.localServer.path}`
        })
      )
      .on('error', error);
    success();
  });

  func.displayName = 'Opening browser';
  func.description = 'Opening browser';

  return func;
};

module.exports = openBrowserTask;
