var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');

// Set the banner content
var banner = ['/*!\n',
    ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
    ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n',
    ' */\n',
    ''
].join('');

// Compile LESS files from /less into /css
gulp.task('less', function() {
    return gulp.src('less/*')
        .pipe(less())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('fonts', function() {
  return gulp.src('../node_modules/font-awesome/fonts/*')
    .pipe(gulp.dest('dist/fonts'))
})

// Minify compiled CSS
gulp.task('minify-css', gulp.series(['less'], function() {
    return gulp.src('dist/css/*')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
}));

// Copy JS to dist
gulp.task('js', function() {
    return gulp.src(['js/*'])
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({
            stream: true
        }))
})

// Minify JS
gulp.task('minify-js', gulp.series(['js'], function() {
    return gulp.src('js/*')
        .pipe(uglify())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({
            stream: true
        }))
}));

// Copy vendor libraries from /components into /vendor
gulp.task('copy', function() {
    gulp.src(['components/bootstrap/dist/**/*', '!**/npm.js', '!**/bootstrap-theme.*', '!**/*.map'])
        .pipe(gulp.dest('vendor/bootstrap'));

    gulp.src(['components/bootstrap-social/*.css', 'components/bootstrap-social/*.less', 'components/bootstrap-social/*.scss'])
        .pipe(gulp.dest('vendor/bootstrap-social'));

    gulp.src(['components/datatables/media/**/*'])
        .pipe(gulp.dest('vendor/datatables'));

    gulp.src(['node_modules/mdbootstrap/css/*', '!node_modules/mdbootstrap/js/jquery*', '!node_modules/mdbootstrap/js/bootstrap*', '!node_modules/mdbootstrap/js/popper*', 'node_modules/mdbootstrap/js/*'])
        .pipe(gulp.dest('vendor/mdbootstrap'));

    gulp.src(['components/datatables-plugins/integration/bootstrap/3/*'])
        .pipe(gulp.dest('vendor/datatables-plugins'));

    gulp.src(['components/datatables-responsive/css/*', 'components/datatables-responsive/js/*'])
        .pipe(gulp.dest('vendor/datatables-responsive'));

    gulp.src(['components/flot/*.js'])
        .pipe(gulp.dest('vendor/flot'));

    gulp.src(['components/flot.tooltip/js/*.js'])
        .pipe(gulp.dest('vendor/flot-tooltip'));

    gulp.src(['components/font-awesome/**/*', '!components/font-awesome/*.json', '!components/font-awesome/.*'])
        .pipe(gulp.dest('vendor/font-awesome'));

    gulp.src(['components/jquery/dist/jquery.js', 'components/jquery/dist/jquery.min.js'])
        .pipe(gulp.dest('vendor/jquery'));
})

// Run everything
gulp.task('default', gulp.parallel(['minify-css', 'minify-js', 'copy']));

// Configure the browserSync task
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: ''
        },
    })
})

// Dev task with browserSync
gulp.task('dev', gulp.series(['less', 'js', 'minify-css', 'minify-js',  'browserSync'], function() {
    gulp.watch('less/*.less', ['less']);
    gulp.watch('dist/css/*.css', ['minify-css']);
    gulp.watch('js/*.js', ['minify-js']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('pages/*.html', browserSync.reload);
    gulp.watch('dist/js/*.js', browserSync.reload);
}));
