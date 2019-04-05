'use strict';

const _ = require('lodash');

const plugins = require('gulp-load-plugins')();
const config = require('./config/config');

var tasks = {};
var taskNames = ['clean', 'copy', 'bundle', 'bundleSingle', 'serve', 'openBrowser', 'eslint', 'compileStyles', 'reload'];

/**
 * Helper function for better error handling during Gulp tasks
 *
 * @param {*} taskFn
 * @returns
 */
let wrapFunc = taskFn => {
  return function(done) {
    var onSuccess = function() {
      done();
    };
    var onError = function(err) {
      done(err);
    };
    var outStream = taskFn(onSuccess, onError);
    if (outStream && typeof outStream.on === 'function') {
      outStream.on('end', onSuccess);
    }
  };
};

module.exports = gulp => {
  /**
   * Helper to include task using filename
   * Function passes gulp, config, plugins and wrapFunc objects to the task definition as scope
   *
   * @param {*} taskName
   * @returns
   */
  function getTask(taskName) {
    return require('./tasks/' + taskName)(gulp, config, plugins, wrapFunc);
  }

  const task = gulp.task;
  const series = gulp.series;
  const parallel = gulp.parallel;

  tasks = _.zipObject(taskNames, _.map(taskNames, t => getTask(t)));

  // Register tasks
  _.forEach(tasks, (taskObject, taskName) => {
    task(`__${taskName}`, taskObject);
  });

  gulp.task('__watch', function(done) {
    gulp.watch(['./src/html/**/*.html', './src/partials/**/*.html'], series(buildHTML, reload));
    gulp.watch(['./src/scss/**/*.scss'], series(buildCSS, reload));
    gulp.watch(['./src/js/**/*.js'], series(buildJS, reload));
    done();
  });

  //let preBuild = [tasks.clean, tasks.eslint];
  let preBuild = [tasks.clean];
  let buildHTML = [tasks.copy];
  let buildCSS = [tasks.compileStyles];
  let buildJS = [tasks.bundle, tasks.bundleSingle];
  let build = [tasks.compileStyles, tasks.bundle, tasks.bundleSingle, tasks.copy];
  let serve = [tasks.serve, tasks.openBrowser];
  let reload = [tasks.reload];

  // Actual task definition

  tasks.build = task('build', series(preBuild, parallel(build)));
  tasks.dev = task('dev', series(parallel(preBuild), parallel(build), series(serve)));

  tasks.watchdev = task('watchdev', series(parallel(preBuild), parallel(build), series(serve), series('__watch')));
};
