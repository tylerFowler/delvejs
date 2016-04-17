'use strict';

const gulp  = require('gulp');
const clean = require('gulp-clean');
const babel = require('gulp-babel');

gulp.task('clean-dist', () =>
  gulp.src('dist/', { read: false })
  .pipe(clean())
);

gulp.task('default', [ 'clean-dist' ], () =>
  gulp.src(['index.js', 'lib/*.js'], { base: './' })
  .pipe(babel({ presets: [ 'es2015' ] }))
  .pipe(gulp.dest('dist'))
);
