// Linear interpolation between two colours.
// f must be a function which takes a time argument and returns a value between 0 and 1.
// t is the time value
var lerp = function(c1, c2, f, t) {
  var lf = function(a,b,v) {
    return v*a + (1.0-v)*b;
  };
  v = f(t);
  return({ r: lf(c1.r,c2.r,v), g: lf(c1.g,c2.g,v), b: lf(c1.b,c2.b,v)} );
};

/*
 * Converts colour of form { r: <r>, g: <g>, b: <b>, a: <a>} to RGB string.
 * r,g,b (integers) in range 0 to 255. a (fractional) in range 0 to 1.
 */
var col2rgb = function(c) {
  var alpha;

  if (c.a) {
    alpha = c.a;
  } else {
    alpha = 1;
  }

  return "rgb(" + Math.floor(c.r) +","+Math.floor(c.g)+","+Math.floor(c.b)+"," + alpha+")";
};


var Keyboard = function() {
  var keypresses = [];
  var body = $('body');

  var keydownHandler = function(ev) {
//    console.log(ev.which);
    keypresses[ev.which] = true;
  };

  var keyupHandler = function(ev) {
    keypresses[ev.which] = false;
  };

  /* Returns true if 'key' is down, false otherwise */
  var down = function(key) {
    return (keypresses[key] === true);
  }

  // Initialise
  body.keydown(keydownHandler);
  body.keyup(keyupHandler);

  return({
    down: down
  });
};

//
// FIXME: This is 1, 4, 2 on IE8 and below!
//
var MouseButton = { Left: 0, Middle: 1, Right: 2 };

/*
 * Returns mouse location in world co-ordinates, not screen co-ordinates.
 * worldBounds is of form { width: <width>, height: <height> }
 *
 * The container _must_ have the same aspect ratio as the world, otherwise
 * the behaviour of this module is undefined.
 *
 * The origin on the world is in the bottom,left and the x-axis goes from left to right
 * and the y-axis from bottom to top.
 */

var Mouse = function(container_id, worldBounds) {
  var buttons, loc, container, rect, scale;

  var mousedownHandler = function(ev) {
    buttons[ev.button] = true;
  };

  var mouseupHandler = function(ev) {
    buttons[ev.button] = false;
  };

  var mousemoveHandler = function(ev) {
    var pos = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };

    loc = { x: pos.x * scale, y: (rect.height - pos.y) * scale };
  };

  /*
   * Returns 'true' if 'button' is down, 'false' otherwise.
   * It's meant to be used with constants 'Left', 'Middle', 'Right' below.
   * e.g. down(MouseButton.Left)
   */
  var down = function(button) {
    return (buttons[button] === true);
  };

  var location = function() {
    return loc;
  };

  //------------------------------------------------------------------------------------------------
  // Initialise
  buttons = [];
  loc = { x: 0, y: 0};
  container = $('#' + container_id)
  rect = container[0].getBoundingClientRect();
  scale = worldBounds.width / container.width();

  container.mousedown(mousedownHandler);
  container.mouseup(mouseupHandler);
  container.mousemove(mousemoveHandler);
  //------------------------------------------------------------------------------------------------
  return({
    down: down,
    location: location
  });

};

//--------------------------------------------------------------------------------------------------
/*
 * I don't like using screen co-ordinate systems. First, the axes are not mathematical (the y-axis
 * goes top to bottom) and it's better to have a a world-coordinate system that is independent
 * of the actual resolution you use.
 */
var Graphics = function(container_id, worldBounds) {
  var container, rect, scale, selector_col_range, selector_speed, selector_lerp_fun;

  // Convert from world-coordinates to screen co-ordinates
  var conv = function(p) {
    var cp = { x: p.x * scale, y: (worldBounds.height -  p.y) * scale };
    return cp;
  };

  var drawSelector = function(p, r, elapsedTime) {
    var cp = conv(p);


    var col = lerp(selector_col_range.from, selector_col_range.to, selector_lerp_fun, elapsedTime);
    var circle = raph.circle(cp.x,cp.y, r*scale);
    var circleWidth = r/10*scale;
    circle.attr("stroke", col2rgb(col)).attr("stroke-width", circleWidth);

  }
  //------------------------------------------------------------------------------------------------
  // Initialise

  container = $('#'+container_id);
  rect = container[0].getBoundingClientRect();
  raph = Raphael(container[0], rect.width, rect.height);

  selector_col_range = { to: { r: 0, g: 0, b: 255 } , from:  { r: 0, g: 0, b: 127 } };
  selector_speed = 2;
  selector_lerp_fun = function(t) { return (1 + Math.sin(2*t))/2; };
  scale = rect.width / worldBounds.width;

  //------------------------------------------------------------------------------------------------
  return({
    drawSelector: drawSelector,
    clear: function() { raph.clear(); }
  });
};


//--------------------------------------------------------------------------------------------------
var Game = function (canvas_id) {
  var canvas, width, height, startTime, keyboard, g;

  var start = function() {
    window.requestAnimationFrame(animate, canvas);
  };

  var animate = function() {
    var p;
    g.clear();
    var elapsedTime = ((new Date()).getTime() - startTime)/1000.0;

    p = mouse.location();
    g.drawSelector(p,5, elapsedTime);
    window.requestAnimationFrame(animate, canvas);
  }

  // Initialise
  aspectRatio = 4/3;
  worldHeight = 90; // should be divisible by 3

  worldBounds = { width: aspectRatio*worldHeight, height: worldHeight };
  canvas = $('#'+canvas_id);
  width = canvas.width();
  height = canvas.height();
  keyboard = Keyboard();
  mouse    = Mouse(canvas_id, worldBounds);
  startTime = (new Date()).getTime();
  keyboard  = Keyboard();
  g = Graphics(canvas_id, worldBounds);

  //------------------------------------------------------------------------------------------------
  return ({
    start: start
  });


};

