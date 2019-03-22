'use strict';

const config = require('../config/config');

const connect = require('gulp-connect');

module.exports = gulp => {
  let serveTask = function() {
    connect.server(
      {
        root: config.paths.dist.root, port: config.localServer.port,
        livereload: false
      });
  };

  serveTask.displayName = 'Starting live reload webserver';
  serveTask.description = 'Starting live reload webserver';

  gulp.task('serve', serveTask);
};
