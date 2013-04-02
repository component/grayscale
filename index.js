
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
    url = computedStyle(el)['background-image'];
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
