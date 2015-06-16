"use strict";

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    through = require('through'),
    rename = require('gulp-rename'),
    build = require('gulp-build-tools/build');

function escapeCharacters(str) {
    //pass
    return str;
    /*
    return str.replace(/(["!#$%&\'()*+,.\/:;\s<=>?@\[\]^\{\}|~])/g, function(a,b) {
        return '\\' + b;
    });
    */
}

var StyleVars = {};

var parseFile = function( file ) {
    var JSONObj;
    try {
        JSONObj = eval( "(" + file.contents + ")()" );
    } catch (e) {
        build.log( "! vars ", "Invalid JS at", gutil.colors.cyan( file.path ), ":", "" + e );
        build.error( "Variable Build", file.path+ ": \n" + e );
        return;
    }

    return JSONObj;
};

StyleVars.sass = function(opts) {
    opts = opts || {};
    opts.indent = opts.indent || 4;

    var indentSpaces = "";
    for ( var i = 0; i < opts.indent; i++ ) {
        indentSpaces += " ";
    }

    return through(processFile);

    function processFile(file) {
        var JSONObj = parseFile( file );

        if ( JSONObj === undefined ) {
            this.emit('error');
            return;
        }

        var spacesFor = function( depth ) {
            var s = "";
            for ( var i = 0; i < depth; i++ ) {
                s += indentSpaces;
            }
            return s;
        };

        var sassParseJSONRecursive = function( obj, depth ) {
            var s = "",
                i,
                rows;
            if ( Array.isArray( obj ) ) {
                s += "(\n";
                rows = [];
                for ( i = 0; i < obj.length; i++ ) {
                    var val = sassParseJSONRecursive( obj[ i ], depth + 1 );
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
                    row += sassParseJSONRecursive( obj[ key ], depth + 1 );
                    rows.push( spacesFor( depth + 1 ) + row );
                }
                s += rows.join( ",\n" );
                s += "\n" + spacesFor( depth ) + ")";

            } else {
                s = escapeCharacters( String( obj ) );
            }
            return s;
        };

        var sassParseJSON = function( obj ) {
            var s = "";
            var keys = Object.keys( obj );
            for ( var i = 0; i < keys.length; i++ ) {
                var key = keys[ i ];
                s += "$" + key + ": " + sassParseJSONRecursive( obj[ key ], 0 ) + ";\n";
            }
            return s;
        };

        var sass = sassParseJSON(JSONObj);

        file.contents = Buffer(sass);
        this.push(file);
    }
};

StyleVars.toSass = function(src_globs, dest_folder, opts) {
    opts = opts || {};
    opts.prefix = opts.prefix || "_";
    opts.extension = opts.extension || ".scss";
    opts.indent = opts.indent || 4;
    opts.label = opts.label || build.globsToString(src_globs);

    var sassComplete = function() {
        build.log( " vars ",
            gutil.colors.cyan( opts.label ),
            "JS files compiled to SASS at",
            gutil.colors.cyan( dest_folder ) );
    };

    gulp.src( src_globs )
        .pipe( StyleVars.sass().on('error', function() {}) )
        .pipe( rename({
            prefix: opts.prefix,
            extname: opts.extension
        }))
        .pipe( gulp.dest( dest_folder ).on("finish", sassComplete) );
};

StyleVars.jsmodule = function(opts) {
    opts = opts || {};
    opts.definition = opts.definition || "";
    opts.indent = opts.indent || 4;

    return through(processFile);

    function processFile(file) {
        var JSONObj = parseFile( file );

        if ( JSONObj === undefined ) {
            this.emit('error');
            return;
        }

        var js = opts.definition + JSON.stringify( JSONObj, null, opts.indent ) + ";";

        file.contents = Buffer(js);
        this.push(file);
    }
};

StyleVars.toModule = function(src_globs, dest_folder, opts) {
    opts = opts || {};
    opts.prefix = opts.prefix || "";
    opts.extension = opts.extension || ".js";
    opts.label = opts.label || build.globsToString(src_globs);
    opts.definition = opts.definition || "module.exports = ";
    opts.indent = opts.indent || 4;


    var jsComplete = function() {
        build.log( " vars ",
            gutil.colors.cyan( opts.label ),
            "JS files compiled to JS module at",
            gutil.colors.cyan( dest_folder ) );
    };

    gulp.src( src_globs )
        .pipe( StyleVars.jsmodule({
            definition: opts.definition,
            indent: opts.indent
            }).on('error', function() {} ))
        .pipe( rename({
            prefix: opts.prefix,
            extname: opts.extension
        }))
        .pipe( gulp.dest( dest_folder ).on("finish", jsComplete) );
};

module.exports = StyleVars;
