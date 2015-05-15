// Constants

var Const = (function() {
  var lerpFun  = function(t) { return (1 + Math.sin(10*t))/2; }

  // Constants
  return({
    selector: { colorRange: { selected: { to: { r: 0, g: 0, b: 255 },
                                          from:  { r: 0, g: 0, b: 127 } },
                              unselected: { to: { r: 100, g: 100, b: 100 },
                                            from: { r: 50, g: 50, b: 50} }
                            },
                lerpFun:    lerpFun,
                radius:     5 // radius within a unit that you can select it
              },
    unit: { color:   { r: 0,   g: 50, b: 200},
            size:     1,
            velocity: 1,
            health:  50 },
    enemy: { color:   { r: 200,   g: 50, b: 0 },
             size:    1,
             health:  50 },
    healthMeter: { background: { r:50, g:0, b:0}, foreground: { r: 180, g: 0, b: 0} }

    });
})();


var UnitState = { Stationary: 0, Moving: 1 };

//--------------------------------------------------------------------------------------------------


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

var dist = function(p1, p2) {
  var dx = p1.x - p2.x, dy = p1.y - p2.y;
  return(Math.sqrt(dx*dx + dy*dy));
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

  var leftDown   = function() { return down(MouseButton.Left) };
  var rightDown  = function() { return down(MouseButton.Right)};
  var middleDown = function() { return down(MouseButton.Middle)};

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
    down:       down,
    leftDown:   leftDown,
    rightDown:  rightDown,
    middleDown: middleDown,
    location:   location
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

  var drawSelector = function(unit, elapsedTime) {
    var cp          = conv(unit);
    var sel         = Const.selector;
    var range       = unit.selected ? sel.colorRange.selected : sel.colorRange.unselected;
    var col         = lerp(range.from, range.to, sel.lerpFun, elapsedTime);
    var circle      = raph.circle(cp.x,cp.y, Const.selector.radius*scale);
    var circleWidth = Const.selector.radius/10*scale;
    circle.attr("stroke", col2rgb(col)).attr("stroke-width", circleWidth);
  }


  var drawUnit = function(unit) {
    var i, circ, cp;
    cp = conv(unit);
    circ = raph.circle(cp.x, cp.y, Const.unit.size*scale);
    circ.attr("fill", col2rgb(Const.unit.color));
    if ( unit.selected ) {
      drawHealthMeter(unit);
    }
  };


  var drawEnemy = function(enemy) {
    var i, circ, cp;
    cp = conv(enemy);
    circ = raph.circle(cp.x, cp.y, Const.enemy.size*scale);
    circ.attr("fill", col2rgb(Const.enemy.color));
    if ( enemy.attacked ) {
      drawHealthMeter(enemy);
    }

  };



  // Draws a health meter slightly above a unit
  var drawHealthMeter = function(unit) {
    var dy = Const.unit.size*2,
        dx = Const.unit.size*1.5,
        p1 = conv({ x: unit.x - dx, y: unit.y + dy }),
        p2 = conv({ x: unit.x + dx, y: unit.y + dy });

    var percent = unit.health / Const.unit.health;
        strokeWidth = 0.5*scale;

    raph.path(["M", p1.x, p1.y, "L", p2.x, p2.y ]).
         attr({ stroke: col2rgb(Const.healthMeter.background),
                "stroke-width": strokeWidth });
    raph.path(["M", p1.x, p1.y, "L", (1.0 - percent)*p1.x + percent*p2.x, p2.y]).
         attr({ stroke: col2rgb(Const.healthMeter.foreground),
                "stroke-width": strokeWidth});
  };

  //------------------------------------------------------------------------------------------------
  // Initialise

  container = $('#'+container_id);
  rect = container[0].getBoundingClientRect();
  raph = Raphael(container[0], rect.width, rect.height);

  scale = rect.width / worldBounds.width;

  //------------------------------------------------------------------------------------------------
  return({
    drawSelector:    drawSelector,
    drawUnit:        drawUnit,
    drawEnemy:       drawEnemy,
    drawHealthMeter: drawHealthMeter,
    clear:        function() { raph.clear(); },
  });
};


//--------------------------------------------------------------------------------------------------
var Game = function (canvas_id) {
  var canvas, width, height, startTime, keyboard, g, st;

  var start = function() {
    window.requestAnimationFrame(animate, canvas);
  };

  // may return 'false' if there are no units to select
  var closestSelectableUnit = function() {
    var i, minD = 1e8, minUnit = false, d, unit;
    loc = mouse.location();
    for (i in st.units) {
      unit = st.units[i];
      d = dist(loc, st.units[i]);
      if ( d <= Const.selector.radius && d < minD) {
        minD = d;
        minUnit = unit;
      }
    }
    return minUnit;
  };

  var moveUnit = function(unit) {
    var ang, p1, p2;
    if ( unit.state.id === UnitState.Moving ) {
      if ( dist(unit, unit.state.movingTo) < Const.unit.size/2 ) {
        unit.state = { id: UnitState.Stationary };
      } else {
        p2 = unit.state.movingTo;
        ang = Math.atan2(p2.y - unit.y, p2.x - unit.x);
        unit.x += Const.unit.velocity*Math.cos(ang);
        unit.y += Const.unit.velocity*Math.sin(ang);
      }
    }

  };


  var animate = function() {
    var p, i, unit, mouseDown;
    g.clear();
    var elapsedTime = ((new Date()).getTime() - startTime)/1000.0;

    p = mouse.location();

    unit = closestSelectableUnit();

    mouseDown = mouse.leftDown();

    if ( unit ) {
      g.drawSelector(unit, elapsedTime);
      if ( !unit.selected && mouseDown ) {
        if (st.selectedUnit) { st.selectedUnit.selected = false }
        unit.selected = true;
        st.selectedUnit = unit;
      }
    }

    if ( mouseDown && st.selectedUnit && dist(st.selectedUnit, p) > Const.selector.radius ) {
      st.selectedUnit.state = { id: UnitState.Moving, movingTo: p };
    }

    for (i in st.units) {
      unit = st.units[i];
      // draw
      g.drawUnit(st.units[i]);
      if (unit.selected) {
        g.drawSelector(unit, elapsedTime);
      }

      // move
      moveUnit(unit);

    }

    for (i in st.enemies) {
      g.drawEnemy(st.enemies[i]);
    }




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
  st = { units: [ { x: 60, y: 20,
                    health: Const.unit.health/2,
                    state: { id: UnitState.Stationary },
                    attacked: false,
                    selected: false
                  },
                  { x: 80, y: 20,
                    health: Const.unit.health,
                    state: { id: UnitState.Stationary } ,
                    attacked: false,
                    selected: false
                  }],
         enemies: [ { x: 20, y: 80, attacked: false}],
         selectedUnit: false,
       };

  //------------------------------------------------------------------------------------------------
  return ({
    start: start
  });


};

