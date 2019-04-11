'use strict';

const fs = require('fs');

// File where the favicon markups are stored
const FAVICON_DATA_FILE = './gulp/config/faviconData.json';

let injectFaviconsTask = function(gulp, config, plugins, wrapFunc) {
  const realFavicon = plugins.realFavicon;
  let func = wrapFunc(function(success, error) {
    gulp
      .src(['./src/partials/favicons.html'], { allowEmpty: true })
      .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
      .pipe(gulp.dest('./src/partials'))
      .on('error', error)
      .on('end', success);
  });

  func.displayName = 'Injecting favicons';
  func.description = 'Injecting favicons';

  return func;
};

module.exports = injectFaviconsTask;
