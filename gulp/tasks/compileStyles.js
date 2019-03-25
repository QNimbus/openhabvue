'use strict';

let compileStylesTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    gulp
      .src(`${config.paths.scss.root}/${config.paths.scss.glob}`)
      .pipe(
        plugins.sass({
          // Compile SASS files
          outputStyle: 'compressed',
          precision: 10,
          includePaths: ['.'],
          onError: console.error.bind(console, 'Sass error:')
        })
      )
      .pipe(gulp.dest(config.paths.dist.css))
      .pipe(plugins.connect.reload())
      .on('error', error)
      .on('end', success);
  });

  func.displayName = 'Generating css from scss';
  func.description = 'Generating css from scss';

  return func;
};

module.exports = compileStylesTask;
