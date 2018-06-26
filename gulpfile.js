// browserSync Middleware
global.setCharset = (req, res, next) => {
    let urlParse = url.parse(req.url);

    if (/\.html$/.test(urlParse.pathname)) {
        let data = fs.readFileSync(pathss.join('./', urlParse.pathname)),
            source = iconvLite.decode(new Buffer(data, 'binary'), "EUC-KR");

        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.end(source);
    } else {
        next();
    }
};
let url = require('url'),
    pathss = require('path'),
    iconvLite = require('iconv-lite'),
    fs = require('fs');


var pkg = require('./package.json'),
    gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    spritesmith = require('gulp.spritesmith'),
    plumber = require('gulp-plumber'),
    runSequence = require('run-sequence'),
    jschardet = require('jschardet'),
    minify = require('gulp-minify'),
    chokidar = require('chokidar'),
    concat = require('gulp-concat'),
    cleanCSS = require('gulp-clean-css'),
    inquirer = require('inquirer');

gulp.task('concat', function() {
    gulp.src([
        './ftp/common/js/site/common.js',
        './ftp/common/js/site/site.js',
        './ftp/common/js/site/site.js',
    ])
        .pipe(concat('ui.js'))
        .pipe(gulp.dest('./ftp/common/js/site/'))
});




gulp.task('compress-pc-js', function() {
    console.log('~~~ js run');
    gulp.src('./ftp/common/js/site/ui.js')
        .pipe(minify({
            ext:{
                src:'-debug.js',
                min:'.min.js'
            },
            exclude: ['tasks'],
            ignoreFiles: ['.combo.js', '-min.js']
        }))
        .pipe(gulp.dest('./ftp/common/js/site/minify/'));


    gulp.watch([
        './ftp/common/js/site/ui.js'
    ], ['compress-pc-js']);
});


gulp.task('m-sass', function () {
    gulp.src('./m/common/sass/*.scss')
        .pipe(plumber({ errorHandler: function(e) {
            console.error(e.message);
            this.emit('end');
        }}))
        .pipe(sourcemaps.init())
        .pipe(sass({
            sourceComments: false,
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 4 versions'],
            cascade: true
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./m/common/sass/css/'));

    gulp.watch([
        './m/common/sass/*.scss',
        './m/common/sass/**/*.scss'
    ], ['m-sass']);
});



gulp.task('compress-m-css', function() {
    console.log('~~~ compress-m-css');
    gulp.src('./m/common/css/mobile.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('./m/common/css/min.css/'));


    gulp.watch([
        './m/common/css/mobile.css'
    ], ['compress-m-css']);
});


gulp.task('choiceSprites', function () {
    inquirer.prompt([
        {
            type: 'rawlist',
            name: 'theme',
            message: 'choice sprite folder',
            choices: ['common','home','curriculum']
        }
    ]).then(function (task) {
        var task = task.theme;

        gulp.task('sass2', function() {
            gulp.src('./ftp/common/sass/*.scss')
                .pipe(plumber({ errorHandler: function(e) {
                    console.error(e.message);
                    this.emit('end');
                }}))
                .pipe(sourcemaps.init())
                .pipe(sass({
                    sourceComments: false,
                    outputStyle: 'compressed'
                }).on('error', sass.logError))
                .pipe(autoprefixer({
                    browsers: ['last 4 versions'],
                    cascade: true
                }))
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('./ftp/common/css/site/'))
        });


        gulp.task('sprite2', function() {
            var spriteData = gulp.src([
                './ftp/images/sprites/' + task + '/sprite/*.png',
                './ftp/images/sprites/' + task + '/sprite/*.jpg',
                './ftp/images/sprites/' + task + '/sprite/*.jpeg',
                './ftp/images/sprites/' + task + '/sprite/*.gif'
            ])
                .pipe(plumber({ errorHandler: function(e) {
                    console.error(e.message);
                    this.emit('end');
                }}))
                .pipe(spritesmith({
                    imgName: 'sprite.png',
                    padding: 20,
                    imgPath : '/images/sprites/' + task + '/sprite.png',
                    cssName: '_' + task + 'Sprite.scss'
                }));

            spriteData.img.pipe(gulp.dest('./ftp/images/sprites/' + task));
            spriteData.css.pipe(gulp.dest('./ftp/common/sass/styles/'))
        });

        runSequence('sprite2', 'sass2', function(e){
            var watcher = chokidar.watch('./ftp/images/sprites/**/sprite/*', {});

            watcher.on('add', function (event) {
                console.log('> eventtype is ', event);
                gulp.start(['sprite2']);
            });

            gulp.watch([
                './ftp/common/sass/styles/*.scss',
                './ftp/common/sass/*.scss'
            ], ['sass2']);
        });
    });
});



















gulp.task('mobile', function(){
    var target = pkg.paths.m;
    $ = require('gulp-load-plugins')({
        pattern: ["*"],
        scope: ["dependencies"]
    });

    require('gulp-task-loader')({
        dir: 'tasks',
        paths: target,
        plugins: $,
        errorHandler: function(e) {
            console.error(e.message);
            this.emit('end');
        }
    });

    var PATH = target;

    gulp.task('js', function() {
        gulp.src(target.src + 'js/site.js')
            .pipe($.sourcemaps.init())
            .pipe($.minify({
                ext:{
                    src:'-debug.js',
                    min:'.js'
                },
                exclude: ['tasks'],
                ignoreFiles: ['.combo.js', '-min.js']
            }))
            .pipe($.size({ gzip: true, showFiles: true }))
            .pipe($.sourcemaps.write('./'))
            .pipe(gulp.dest(target.dist + 'js/'))
            .pipe($.browserSync.reload({stream: true}));
    });


    gulp.task('trigger', ['browserSync', 'sprite', 'sass', 'include'], function () {
        gulp.start(['js']);

        gulp.watch(PATH.src + 'sass/**/*', ['sass']);
        gulp.watch(PATH.src + 'js/*', ['js']);
        gulp.watch([PATH.src + '*.html', PATH.src + '**/*.html'], ['include']);

        var imgWatcher = $.chokidar.watch(PATH.images + 'sprite/*', {});

        imgWatcher.on('all', function (event) {
            console.log('> eventtype is ', event);

            gulp.start(['sprite']);
        });
    });

    gulp.start(['trigger']);
});