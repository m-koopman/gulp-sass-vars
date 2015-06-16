# gulp-style-vars

A simple module to allow style configuration to be shared across the codebase. 

Each input file is given as an anonymous Javascript function which returns a JSON object, which can be parsed into readable representations for each system.

All basic JSON structures are supported, including objects and lists. 

The following is a basic example of the input file used by the system.

```js
function() {
  return {
    "sidebar-width": "50px",
    "color-scheme": {
      "theme": "#666666",
      "background": "#333333"
    },
    "width-breakpoints": [
      "800px",
      "1200px"
    ]
  };
}
```

Currently, this representation can be automatically converted to both SCSS and a standalone JS module.

## StyleVars.toSass(src_globs, dest_folder, options)

Takes any file matching src_globs, interprets it as the StyleVars representation and converts to a SCSS variable file and outputs it to the specified folder. 

Configurable options are

- **options.prefix** `String` - A prefix to add to the compiled SCSS files, defaults to "_".
- **options.extension** `String` - The extension to set for the output files, defaults to ".scss".
- **options.indent** `Integer` - The number of spaces to indent by, defaults to 4.
- **options.label** `String` - A label to be used for logging, defaults to a string representation of the source globs.
- **options.cb** `Function` - A function to call on completion, will not be called if none is provided.

Running the example above, we get

```scss
$sidebar-width: 50px;
$color-scheme: (
    "theme": #666666,
    "background": #333333
);
$width-breakpoints: (
    800px,
    1200px
);

```

## StyleVars.toModule(src_globs, dest_folder, options)

Takes any file matching src_globs, interprets it as the StyleVars representation and converts to a standalone Javascript module (which can be required) and outputs it to the specified folder. 

Configurable options are

- **options.prefix** `String` - A prefix to add to the compiled JS files, defaults to "".
- **options.extension** `String` - The extension to set for the output files, defaults to ".js".
- **options.definition** `String` - A definition prefix to add to the contents of the compiled file, defaults to "module.exports = ".
- **options.indent** `Integer` - The number of spaces to indent by, defaults to 4.
- **options.label** `String` - A label to be used for logging, defaults to a string representation of the source globs.
- **options.cb** `Function` - A function to call on completion, will not be called if none is provided.

Running the example above, we get

```js
module.exports = {
    "sidebar-width": "50px",
    "color-scheme": {
        "theme": "#666666",
        "background": "#333333"
    },
    "width-breakpoints": [
        "800px",
        "1200px"
    ]
};
```

## More complicated input files

Though everything can be done statically in the input file, all code will be evaluated on load, so more complicated structures are possible. Anything that returns a JSON object is valid, and will be compiled.

#### input: config.js

```js
function() {
  var colors = {
    "red": "#ff0000",
    "green": "#00ff00"
  };

  var config = {
    "theme-color": colors["red"],
    "sidebar-width": "200px",
    "app-width": "1000px"
  };

  config["content-width"] = (parseInt(config["app-width"]) - parseInt(config["sidebar-width"])) + "px";

  return config;
}
```

#### output: config.js

```js
module.exports = {
    "theme-color": "#ff0000",
    "sidebar-width": "200px",
    "app-width": "1000px",
    "content-width": "800px"
};
```

#### output: _config.scss

```scss
$theme-color: #ff0000;
$sidebar-width: 200px;
$app-width: 1000px;
$content-width: 800px;
```
