"use strict";

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    through = require('through'),
    rename = require('gulp-rename'),
    build = require('gulp-build-tools/build');

// from http://stackoverflow.com/questions/17191265/legal-characters-for-sass-and-scss-variable-names
var escapableCharactersRegex = /(["!#$%&\'()*+,.\/:;\s<=>?@\[\]^\{\}|~])/g;
function escapeCharacters(str) {
    return str.replace(escapableCharactersRegex, function(a,b) {
        return '\\' + b;
    });
}

var SassVars = {};

SassVars.sass = function() {
    return through(processJSON);

    function processJSON(file) {

        var JSONObj;
        // load the JSON
        try {
            JSONObj = JSON.parse(file.contents);
        } catch (e) {
            build.log( "! vars ", "Invalid JSON at", file.path );
            return;
        }

        var spacesFor = function( depth ) {
            var s = "";
            for ( var i = 0; i < depth; i++ ) {
                s += "  ";
            }
            return s;
        };

        var parseJsonRecursive = function( obj, depth ) {
            var s = "",
                i,
                rows;
            if ( Array.isArray( obj ) ) {
                s += "(\n";
                rows = [];
                for ( i = 0; i < obj.length; i++ ) {
                    var val = parseJsonRecursive( obj[ i ], depth + 1 );
                    val = escapeCharacters( val );
                    rows.push( spacesFor( depth + 1 ) + val );
                }
                s += rows.join( ",\n" );
                s += "\n" + spacesFor( depth ) + ")";

            } else if ( typeof obj === 'object') {
                var keys = Object.keys( obj );
                rows = [];
                s += "(\n";
                for ( i = 0; i < keys.length; i++ ) {
                    var key = escapeCharacters( keys[ i ] );
                    var row = "";
                    row += "$" + key + ": ";
                    row += parseJsonRecursive( obj[ key ], depth + 1 );
                    rows.push( spacesFor( depth + 1 ) + row );
                }
                s += rows.join( ",\n" );
                s += "\n" + spacesFor( depth ) + ")";

            } else {
                s = escapeCharacters( String( obj ) );
            }
            return s;
        };

        var parseJson = function( obj ) {
            var s = "";
            var keys = Object.keys( obj );
            for ( var i = 0; i < keys.length; i++ ) {
                var key = keys[ i ];
                s += "$" + key + ": " + parseJsonRecursive( obj[ key ], 0 ) + ";\n";
            }
            return s;
        };

        var sass = parseJson(JSONObj);

        file.contents = Buffer(sass);
        this.push(file);
    }
};




SassVars.toSass = function(src_globs, dest_folder) {
    var label = build.globsToString(src_globs);

    var sassComplete = function() {
        build.log( " vars ",
            gutil.colors.cyan( label ),
            "JSON files compiled to SASS in",
            gutil.colors.cyan( dest_folder ) );
    };

    gulp.src( src_globs )
        .pipe( SassVars.sass() )
        .pipe( rename({
            prefix: "_",
            extname: ".scss"
        }))
        .pipe( gulp.dest( dest_folder ).on("finish", sassComplete) );
};

module.exports = SassVars;

