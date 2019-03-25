'use strict';

const del = require('del');

let cleanTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    try {
      del(['./dist/**/*']);
    } catch (e) {
      error(e);
    }
    success();
  });

  func.displayName = 'Cleaning dist folders';
  func.description = 'Cleaning dist folders';

  return func;
};

module.exports = cleanTask;
