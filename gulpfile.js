const projectFolder = require('path').basename(__dirname);
const sourceFolder = 'src';

const fs = require('fs');

const { src, dest, watch, series, parallel } = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');
const del = require('del');
const imagemin = require('gulp-imagemin');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');
const webpack = require('webpack-stream');
const gilpIf = require('gulp-if');

const isDev = false;
const isProd = !isDev;

const webpackConfig = {
    output: {
        filename: 'script.js',
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'eval-source-map' : 'none',
};

// browser sync
function watcher() {
    serveSass();
    webPack();
    browserSync.init({
        server: {
            baseDir: `./src`,
        },
        notify: false,
    });

    watch('./src/sass/**/*.sass', serveSass);
    watch('./src/sass/**/*.scss', serveSass);
    watch(['./src/js/**/*.js', '!./src/js/script.js'], webPack);
    watch('./src/*.html').on('change', browserSync.reload);
}

// сжатие и конвертация картинок
function images(done) {
    src('./src/img/**/*')
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [
                    {
                        removeViewBox: false,
                    },
                ],
                interlaced: true,
                optimizationLevel: 3, // 0 to 7
            })
        )
        .pipe(dest(projectFolder + '/img'));
    done();
}
// компилятор Sass
function serveSass() {
    return src('./src/sass/**/*.sass', './src/sass/**/*.scss')
        .pipe(sass())
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['> 0.1%'],
                cascade: false,
            })
        )
        .pipe(dest('./src/css'))
        .pipe(browserSync.stream());
}
// минимизируем Css
function styles() {
    return src('./src/css/**/*.css')
        .pipe(
            cleanCSS({
                level: 1,
            })
        )
        .pipe(dest(projectFolder + '/css'));
}
// минимизируем Js
function webPack() {
    return src('./src/js/index.js')
        .pipe(webpack(webpackConfig))
        .pipe(gilpIf(isProd, dest(projectFolder + '/js')))
        .pipe(gilpIf(isDev, dest('./src/js')))
        .pipe(browserSync.stream());
}
// минимизируем HTML
function html() {
    return src('./src/**.html')
        .pipe(
            htmlmin({
                collapseWhitespace: true,
            })
        )
        .pipe(dest(projectFolder + '/'));
}
// переброс файлов PHP
function php(done) {
    src('./src/**.php').pipe(dest(projectFolder + '/'));
    src('./src/phpmailer/**/**').pipe(dest(projectFolder + '/phpmailer'));
    done();
}
// переброс шрифтов
function fonts(done) {
    src('./src/fonts/**/**').pipe(dest(projectFolder + '/fonts'));
    done();
}
// конвертация из otf в ttf
function otf2ttf(done) {
    src('./src/fonts/*.otf')
        .pipe(
            fonter({
                formats: ['ttf'],
            })
        )
        .pipe(dest('./src/fonts'));
    setTimeout(() => {
        done();
    }, 1500);
}
// конвертация из ttf в woff и woff2
function fontsConvert(done) {
    src('./src/fonts/*.ttf').pipe(ttf2woff()).pipe(dest('./src/fonts'));
    src('./src/fonts/*.ttf').pipe(ttf2woff2()).pipe(dest('./src/fonts'));
    done();
}
// удаляем не нужные шрифты
function cleanFonts(done) {
    del(['./src/fonts/*.ttf', './src/fonts/*.otf']);
    done();
}
// подключаем шрифты к css
function fontsStyle(done) {
    const fileContent = fs.readFileSync(sourceFolder + '/sass/_fonts.scss');
    if (fileContent === '') {
        fs.writeFile(sourceFolder + '/sass/_fonts.scss', '', done);
        return fs.readdir(sourceFolder + '/fonts/', (err, items) => {
            if (items) {
                let cFontname;
                for (let i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (cFontname !== fontname) {
                        fs.appendFile(
                            sourceFolder + '/sass/_fonts.scss',
                            '@include font("' +
                                fontname +
                                '", "' +
                                fontname +
                                '", "400", "normal");\r\n',
                            done
                        );
                    }
                    cFontname = fontname;
                }
            }
        });
    }
    done();
}

function clean(done) {
    del([`${projectFolder}/*`]);
    done();
}

exports.serve = watcher;
exports.build = series(
    clean,
    webPack,
    parallel(styles, html, php, fonts, images)
);

exports.convertFonts = series(otf2ttf, fontsConvert);
exports.cleanFonts = cleanFonts;
exports.fontsStyle = fontsStyle;
