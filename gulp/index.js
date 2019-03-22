'use strict';

module.exports = gulp => {
  require('./tasks/clean')(gulp);
  require('./tasks/copy')(gulp);
  require('./tasks/bundle')(gulp);
  require('./tasks/serve')(gulp);

  gulp.task('build', gulp.series(gulp.parallel('bundle', 'copy')), function(done) {
    done();
  });

  gulp.task('clean', gulp.series('clean'), function(done) {
    done();
  });

  gulp.task('test', gulp.series('serve'), function(done) {
    done();
  });
};
