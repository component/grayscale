
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture || false);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture || false);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("jkroso-computed-style/index.js", function(exports, require, module){

/**
 * Get the computed style of a DOM element
 * 
 *   style(document.body) // => {width:'500px', ...}
 * 
 * @param {Element} element
 * @return {Object}
 */

// Accessing via window for jsDOM support
module.exports = window.getComputedStyle

// Fallback to elem.currentStyle for IE < 9
if (!module.exports) {
	module.exports = function (elem) {
		return elem.currentStyle
	}
}

});
require.register("grayscale/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var event = require('event');
var computedStyle = require('computed-style');

/**
 * Module exports.
 */

module.exports = grayscale;

/**
 * Accepts an <img> or any other type of element with `background-image` CSS
 * defined, and replaces the URL of the image with a grayscale version processed
 * through <canvas>.
 *
 * @param {Element} el DOM element to alter
 * @param {Function} fn Optional callback function to invoke when done, or an error occurs
 * @api public
 */

function grayscale (el, fn) {
  if ('function' != typeof fn) fn = function (err) { if (err) throw err; };

  var img;
  var url;
  var tag = el.tagName.toLowerCase();

  if ('img' == tag) {
    url = el.src;
    if (!url) return fn(new Error('<img> element does not have the "src" attribute set'));
  } else {
    // a <div> or something - should have `background-image` set
    url = el.style.backgroundImage;
    if (!url) url = computedStyle(el)['background-image'];
    if (!url) return fn(new Error('<' + tag + '> element does not have "background-image" CSS set'));
    var match = /^url\((.*)\)$/.exec(url);
    if (match) url = match[1];
  }

  img = new Image();
  event.bind(img, 'load', onload);
  event.bind(img, 'error', fn);
  img.src = url;

  function onload () {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    // Grayscale converting logic borrowed respectfully from:
    // http://tech.pro/tutorial/1083/html-5-canvas-tutorial-converting-images-to-grayscale

    // Get the width/height of the image and set
    // the canvas to the same size.
    var width = img.width;
    var height = img.height;

    canvas.width = width;
    canvas.height = height;

    // Draw the image to the canvas.
    ctx.drawImage(img, 0, 0);

    // Get the image data from the canvas, which now
    // contains the contents of the image.
    var imageData;
    try {
      // `getImageData()` may throw if the <img> is cross-domain
      imageData = ctx.getImageData(0, 0, width, height);
    } catch (e) {
      fn(e);
      return;
    }

    // The actual RGBA values are stored in the data property.
    var pixelData = imageData.data;

    // 4 bytes per pixels - RGBA
    var bytesPerPixel = 4;

    // Loop through every pixel - this could be slow for huge images.
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        // Get the index of the first byte of the pixel.
        var startIdx = (y * bytesPerPixel * width) + (x * bytesPerPixel);

        // Get the RGB values.
        var red = pixelData[startIdx];
        var green = pixelData[startIdx + 1];
        var blue = pixelData[startIdx + 2];

        // Convert to grayscale.  An explanation of the ratios
        // can be found here: http://en.wikipedia.org/wiki/Grayscale
        var grayScale = (red * 0.3) + (green * 0.59) + (blue * 0.11);

        // Set each RGB value to the same grayscale value.
        pixelData[startIdx] = grayScale;
        pixelData[startIdx + 1] = grayScale;
        pixelData[startIdx + 2] = grayScale;
      }
    }

    // draw the converted image data back to the canvas.
    ctx.putImageData(imageData, 0, 0);

    // finally set the "src"/"background-image" to the data URI of the canvas
    var uri = canvas.toDataURL();
    if ('img' == tag) {
      el.src = uri;
    } else {
      el.style.backgroundImage = 'url(' + uri + ')';
    }

    fn(); // done!
  }
}

});
require.alias("component-event/index.js", "grayscale/deps/event/index.js");

require.alias("jkroso-computed-style/index.js", "grayscale/deps/computed-style/index.js");

