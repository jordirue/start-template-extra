//////////////////// VARS ////////////////////

// Plugins Gulp
var babel = require('gulp-babel'),
    browserSync = require('browser-sync').create(),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    cache = require('gulp-cache'),
    del = require('del'),
    gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    size = require('gulp-size'),
    source = require('vinyl-source-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    uncss = require('postcss-uncss'),
    cssnano = require('gulp-cssnano'),
    panini = require('panini'),
    postcss = require('gulp-postcss'),
    precss = require('precss'),
    presetenv = require('postcss-preset-env'),
    utilities = require('postcss-utilities'),
    mqpacker = require('css-mqpacker'),
    duplicates = require('postcss-discard-duplicates'),
    extend = require('postcss-extend'),
    lost = require('lost'),
    pxtorem = require('postcss-pxtorem'),
    posthtml = require('gulp-posthtml'),
    bem = require('posthtml-bem'),
    lorem = require('posthtml-lorem'),
    altalways = require('posthtml-alt-always');

// Plugins postcss
var plugins_dev = [
    precss(),
    presetenv(),
    utilities(),
    mqpacker(),
    duplicates(),
    extend(),
    lost(),
    pxtorem()
];

// Plugins posthtml
var pluguin_html = [
    lorem(),
    bem(),
    altalways()
];

// Paths
var paths = {
    // html
    html: {
        all: 'src/**/*.html',
        src: 'src/pages/**/*.html',
        reset: 'src/{layouts,partials}/**/*',
        output: '/**/*.html'
    },
    // css
    css: {
        all: ['src/assets/css/**/*.css', 'src/assets/css/**/*.scss'],
        src: 'src/assets/css/main.css',
        output: '/assets/css/',
    },
    // js
    js: {
        all: 'src/assets/js/**/*.js',
        src: 'src/assets/js/main.js',
        output: '/assets/js/',
        file: 'main.js'
    },
    // img
    img: {
        src: [
            'src/assets/img/**/*.*'
        ],
        output: '/assets/img/'
    },
    // Fonts
    font: {
        src: [
            'src/assets/fonts/**/*.*'
        ],
        output: '/assets/fonts/'
    },
    // Others
    others: {
        src: [
            'src/assets/audio/**/*.*',
            'src/assets/video/**/*.*',
            'src/assets/docs/**/*.*'
        ],
        output: '/assets/others/'
    },
    // Clean
    clean: {
        output: '/*'
    },
    // Size
    size: {
        output: '/**/*'
    },
    // Static
    static: {
        input: ['src/*.*', '!src/*.html', '!src/files/**/*']
    },
    // Data
    data: {
        src: 'src/data/*.yml'
    }
};

// Reload browsers
var reload = browserSync.reload;

// _tmp o dist
var directory;


//////////////////// DEV / PROD DIRECTORIES ////////////////////

function dirDev(done) {
    directory = '_tmp/';
    done();
}

function dir(done) {
    directory = 'dist/';
    done();
}


//////////////////// DEV ////////////////////

// CSS
function cssDev() {
    return gulp.src(paths.css.src)
        .pipe(sourcemaps.init())
        .pipe(postcss(plugins_dev))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(directory + paths.css.output));
}

// JS Himt
function jsLint() {
    return gulp.src(paths.js.src)
        .pipe(jshint({ esversion: 6 }))
        .pipe(jshint.reporter('default'));
}

// JS
function jsDev(done) {
    var bundler = browserify(paths.js.src);
    var rebundle = function () {
        return bundler.bundle()
            .pipe(source(paths.js.file))
            .pipe(gulp.dest(directory + paths.js.output));
    }
    rebundle();
    done();
}


//////////////////// PROD ////////////////////

// CSS
function css() {
    const plugins = [...plugins_dev, uncss({
        html: [directory + paths.html.output],
        ignore: [/publicitat/, /adblock/]
    })];

    return gulp.src(paths.css.src)
        .pipe(postcss(plugins))
        .pipe(cssnano({
            safe: true,
            autoprefixer: false,
            discardComments: {
                removeAll: true
            }
        }))
        .pipe(gulp.dest(directory + paths.css.output));
}

// JS
function js(done) {
    var bundler = browserify(paths.js.src);
    var rebundle = function () {
        return bundler.bundle()
            .pipe(source(paths.js.file))
            .pipe(buffer())
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(uglify({
                compress: {
                    drop_console: true
                }}))
            .pipe(gulp.dest(directory + paths.js.output));
    }
    rebundle();
    done();
}


//////////////////// HTML - IMG - FONTS - STATIC FILES - OTHER FILES ////////////////////

// HTML
function html() {
    const plugins = [...pluguin_html];

    return gulp.src(paths.html.src)
        .pipe(panini({
            root: 'src/pages/',
            layouts: 'src/layouts/',
            partials: 'src/partials/',
            data: 'src/data'
        }))
        .pipe(posthtml(plugins))
        .pipe(gulp.dest(directory));
}

// RESET HTML
function htmlReset(done) {
    panini.refresh();
    done();
}
htmlReset.displayName = "Refresca el panini";

// IMG
function img() {
    return gulp.src(paths.img.src)
        .pipe(cache(imagemin({
            interlaced: true,
            progressive: true,
            optimizationLevel: 5,
            svgoPlugins: [{ removeViewBox: true }]
        })))
        .pipe(gulp.dest(directory + paths.img.output))
}

// FONTS
function fonts() {
    return gulp.src(paths.font.src)
        .pipe(gulp.dest(directory + paths.font.output))
}

// Others files
function others() {
    return gulp.src(paths.others.src)
        .pipe(gulp.dest(directory + paths.others.output))
}

// Static files
function statics() {
    return gulp.src(paths.static.input, {
        dot: true
    }).pipe(gulp.dest(directory));
}


//////////////////// CLEAN - CLEAR CACHE - SIZE ////////////////////

// Clean dev
function cleanTmp() {
    return del(directory + paths.clean.output);
}

// Clean prod
function cleanDist() {
    return del(directory + paths.clean.output);
}
function cleanDev() {
    return del('_tmp/');
}
cleanDev.displayName = "Clean (Development)";

// Clear cache
function clear(done) {
    return cache.clearAll(done);
}

// Size
function buildSize() {
    return gulp.src(directory + paths.size.output)
        .pipe(size({ title: 'Deployment build:', gzip: true }));
}


//////////////////// WATCHER ////////////////////

function watch() {
    browserSync.init({
        server: "./_tmp"
    });
    gulp.watch(paths.html.src).on('all', gulp.series(html, reload));
    gulp.watch(paths.html.reset).on('all', gulp.series(htmlReset, html, reload));
    gulp.watch(paths.css.all).on('all', gulp.series(cssDev, reload));
    gulp.watch(paths.js.all).on('all', gulp.series(jsDev, reload));
    gulp.watch(paths.img.src).on('all', gulp.series(img, reload));
    gulp.watch(paths.font.src).on('all', gulp.series(fonts, reload));
    gulp.watch(paths.others.src).on('all', gulp.series(others, reload));
    gulp.watch(paths.data.src).on('all', gulp.series(htmlReset, html, reload));
}


//////////////////// RUN DEV ////////////////////

gulp.task('dev', gulp.series(cleanTmp, dirDev, gulp.parallel(html, cssDev, gulp.series(jsLint, jsDev), img, fonts, others), watch));


//////////////////// RUN PROD ////////////////////

gulp.task('default', gulp.series(cleanDev, cleanDist, dir, gulp.parallel(gulp.series(html, css), js, img, fonts, others, statics), buildSize));


//////////////////// Clear cache ////////////////////

gulp.task(clear);