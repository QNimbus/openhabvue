'use strict';

const config = require('../config/config');
const plugins = require('gulp-load-plugins')();

const sass = plugins.sass;

module.exports = gulp => {
  gulp.task('styles', function() {
    return gulp
      .src(`${config.paths.scss.root}/${config.paths.scss.glob}`)
      .pipe(
        sass({
          // Compile SASS files
          outputStyle: 'compressed', // Values: nested, expanded, compact, compressed
          precision: 10,
          includePaths: ['.']
        }).on('error', sass.logError)
      )
      .pipe(gulp.dest(config.paths.dist.css));
  });
};
