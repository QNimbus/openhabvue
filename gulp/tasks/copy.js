'use strict';

const config = require('../config/config');
const htmlPartial = require('gulp-html-partial');

module.exports = gulp => {
  let copyTask = function() {
    return gulp
      .src(config.paths.html + 'main.html')
      .pipe(htmlPartial({ basePath: config.paths.partials }))
      .pipe(gulp.dest(config.paths.dist.html));
  };

  copyTask.displayName = 'Copying html files';
  copyTask.description = 'Does something';

  gulp.task('copy', copyTask);
};
