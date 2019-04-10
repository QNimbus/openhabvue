'use strict';

const fs = require('fs');

let createFoldersTask = function(gulp, config, plugins, wrapFunc) {
  let func = wrapFunc(function(success, error) {
    const folders = ['./dist/images/icons'];
    try {
      folders.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log('📁  folder created:', dir);
        }
      });
    } catch (e) {
      error(e);
    }

    success();
  });

  func.displayName = 'Creating dist folders';
  func.description = 'Creating dist folders';

  return func;
};

module.exports = createFoldersTask;
