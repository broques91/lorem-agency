var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    newer = require('gulp-newer'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    minifyCss = require('gulp-clean-css'),
    notify = require("gulp-notify"),
    bower = require('gulp-bower'),
    livereload = require('gulp-livereload'),
    connect = require('gulp-connect'),
    beep = require('beepbeep'),
    plumber = require('gulp-plumber'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    autoprefixer = require('gulp-autoprefixer');

var onError = function (err) {
    beep([0, 0, 0]);
    gutil.log(gutil.colors.green(err));
};

var config_gulp = require('./config_gulp.js')

var config = {
    bowerDir: './assets_dev/vendor'
};

var paths = {
    src: 'assets_dev',
    dest: 'assets_dist',
    jsSRC: 'assets_dev/js/**/*.js',
    styleSRC: 'assets_dev/scss/**/*.scss',
    imgSRC: 'assets_dev/img/**/*',
    imgURL: 'assets_dist/img',
    htmlSRC: '**/*.html'
};

//Tâche pour le bower
gulp.task('bower', function () {
    return bower({
            cmd: 'update'
        })
        .pipe(gulp.dest(config.bowerDir))
});

//Tâche qui copie les fonts suite à la fonction bower et les mets dans le DIST
gulp.task('copy', ['bower'], function () {
    migration = config_gulp.migrationConfig;
    for (var key in migration) {
        if (migration.hasOwnProperty(key)) {
            gulp.src([key])
                .pipe(gulp.dest(migration[key]));
        }
    }
});

gulp.task('copyfonts', function () {
    return gulp.src(['./assets_dev/fonts/**/*'])
        .pipe(newer('./assets_dev/fonts/**/*'))
        .pipe(gulp.dest('./assets_dist/fonts'))
        .pipe(reload({
            stream: true
        }));
});

//Tâche concat et uglify le JS
gulp.task('concat_Build', function () {
    return gulp.src(paths.jsSRC)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(uglify())
        .pipe(concat('main.js'))
        .pipe(gulp.dest('./assets_dist/js'));
});

//Tâche concat le JS
gulp.task('concat', function () {
    return gulp.src(paths.jsSRC)
        .pipe(newer(paths.jsSRC))
        .pipe(sourcemaps.init())
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./assets_dist/js'))
        .pipe(reload({
            stream: true
        }));
});

//Tâche qui concat les Vendors
//TODO rendre les src du vendor dynamique
gulp.task('concat_Vendor', function () {
    return gulp.src(config_gulp.vendorConfig)
        .pipe(sourcemaps.init())
        .pipe(concat('vendor.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./assets_dist/js'));
});

//Tâche qui compresse les images
gulp.task('img', function () {
    return gulp.src(paths.imgSRC)
        .pipe(newer(paths.imgURL))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(paths.imgURL))
        .pipe(reload({
            stream: true
        }));
});

//Tâche qui SASS les CSS
gulp.task('sass', function () {
    gulp.src('./assets_dev/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(newer(paths.styleSRC))
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(
            sass({
                errLogToConsole: true,
                outputStyle: "compressed"
            })
        )
        .pipe(sourcemaps.write({
            includeContent: false
        }))
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./assets_dist/css'))
        .pipe(reload({
            stream: true
        }));
});

//Tâche qui SASS et minify les CSS
gulp.task('sass_Build', function () {
    gulp.src('./assets_dev/scss/**/*.scss')
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(minifyCss())
        .pipe(gulp.dest('./assets_dist/css'))
});

gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
});

//Tâche qui livereload les HTML
gulp.task('html', function () {
    gulp.src(paths.htmlSRC)
    gulp.watch(paths.htmlSRC).on('change', browserSync.reload);
});

// Tâche qui watch le js et le css
gulp.task('watch', function () {
    gulp.watch(paths.jsSRC, ['concat']);
    gulp.watch(paths.imgSRC, ['img']);
    gulp.watch(paths.styleSRC, ['sass']);
    migration = config_gulp.migrationConfig;
    for (var key in migration) {
        if (migration.hasOwnProperty(key)) {
            gulp.watch([key], ['copy']);
        }
    }
});

// Tâche DEFAULT
gulp.task('default', ['html', 'browser-sync', 'watch', 'concat_Vendor', 'sass', 'concat', 'copy', 'copyfonts', 'img']);
// Tâche START, première tâche à effectuer
gulp.task('start', ['bower']);
// Tâche BUILD
gulp.task('build', ['copy', 'copyfonts', 'sass_Build', 'concat_Vendor', 'concat_Build', 'img']);