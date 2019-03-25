'use strict';

let copyTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    gulp
      .src(`${config.paths.html.root}/${config.paths.html.glob}`)
      .pipe(plugins.htmlPartial({ basePath: `${config.paths.partials.root}/` }))
      .pipe(gulp.dest(config.paths.dist.html))
      .on('error', error)
      .on('end', success);
  });

  func.displayName = 'Copying html files';
  func.description = 'Copying html files';

  return func;
};

module.exports = copyTask;
