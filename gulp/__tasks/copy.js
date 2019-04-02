'use strict';

const config = require('../config/config');
const plugins = require('gulp-load-plugins')();

const htmlPartial = plugins.htmlPartial;

module.exports = gulp => {
  gulp.task('copy:html', function() {
    return gulp
      .src(`${config.paths.html.root}/${config.paths.html.glob}`)
      .pipe(htmlPartial({ basePath: `${config.paths.partials.root}/` }))
      .pipe(gulp.dest(config.paths.dist.html));
  });
};
