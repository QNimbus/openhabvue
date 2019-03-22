'use strict';

const config = require('../config/config');
const del = require('del');

module.exports = gulp => {
  let cleanTask = function() {
    return del(Object.values(config.paths.dist));
  };

  cleanTask.displayName = 'Cleaning dist folders';
  cleanTask.description = 'Does something';

  gulp.task('clean', cleanTask);
};
