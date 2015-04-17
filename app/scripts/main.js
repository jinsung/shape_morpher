var gestureLine = gestureLine || {};

gestureLine.main = (function() {
  'use strict';
  var scope;
  var context;
  var canvas;
  var pointRecorder;
  var pointRecorderBuf;
  var angleLine;
  var angleLineMorpher;
  var numAnglePoints;
  var isMouseDown;
  var date;

  return {
    init: function () {
      scope = this;
      date = new Date();
      numAnglePoints = 250;
      pointRecorderBuf = new gestureLine.pointRecorder (numAnglePoints*4);
      pointRecorder = new gestureLine.pointRecorder (numAnglePoints);
      angleLine = new gestureLine.angleLengthLine(numAnglePoints);
      angleLineMorpher = new gestureLine.angleLengthLineMorpher(numAnglePoints, 100, 100);

      canvas = document.getElementById('mainCanvas');
      context = canvas.getContext('2d');

      var initLength = 30;
      var radius = 100;
      var offset = 100;
      for (var i = 0; i < initLength; i++) {
        var div = (i/(initLength-1)) * (Math.PI * 2.0);
        pointRecorderBuf.addPoint(offset + Math.cos(div)*radius, 
          offset+Math.sin(div)*radius);

        if (pointRecorderBuf.pointCounter > 4) {
          pointRecorder.resampleIntoMe(pointRecorderBuf, numAnglePoints);
        } 
      }

      for (var j=0; j<numAnglePoints; j++) {

      }

      pointRecorder.clear();
      pointRecorderBuf.clear();

      isMouseDown = false;
      canvas.addEventListener('mousedown', gestureLine.main.onMouseDown, false);
      canvas.addEventListener('touchstart', gestureLine.main.onMouseDown, false);
      canvas.addEventListener('mouseup', gestureLine.main.onMouseUp, false);
      canvas.addEventListener('touchend', gestureLine.main.onMouseUp, false);
      canvas.addEventListener('mousemove', function(evt) {
        gestureLine.main.onMouseMove(canvas, evt);
      }, false);
      canvas.addEventListener('touchmove', function(evt) {
        gestureLine.main.onTouchMove(canvas, evt);
      }, false);

      canvas.addEventListener('mouseout', gestureLine.main.onMouseOut, false);
      scope.draw();
    },

    draw: function () {
      //console.log("draw");
      requestAnimationFrame(scope.draw);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 0.5;

      angleLineMorpher.draw(canvas.width*0.5, canvas.height*0.5);
      if (isMouseDown) {
        pointRecorder.draw(context);
      } else {
        if (!angleLineMorpher.bAmAnimating) {
          
        }
      }
    }, 

    onTouchMove: function (canvas, evt) {
      evt.preventDefault(); 
      if (isMouseDown) {
        var rect = canvas.getBoundingClientRect();
        var mouseX = evt.targetTouches[0].pageX - rect.left;
        var mouseY = evt.targetTouches[0].pageY - rect.top;
        pointRecorderBuf.addPoint( mouseX, mouseY );
        if (pointRecorderBuf.pointCounter > 4) {
          pointRecorder.resampleIntoMe( pointRecorderBuf, numAnglePoints );
        }
      }
    },

    onMouseMove: function (canvas, evt) {

      if (isMouseDown) {
        var rect = canvas.getBoundingClientRect();
        var mouseX = evt.clientX - rect.left;
        var mouseY = evt.clientY - rect.top;
        pointRecorderBuf.addPoint( mouseX, mouseY );
        if (pointRecorderBuf.pointCounter > 4) {
          pointRecorder.resampleIntoMe( pointRecorderBuf, numAnglePoints );
        }
      }
    },

    onMouseDown: function () {
      isMouseDown = true;
    },

    onMouseUp: function () {
      if (isMouseDown) {
        gestureLine.main.sendPoints();
      }
      isMouseDown = false;

    },

    onMouseOut: function () {
      if (isMouseDown) {
        gestureLine.main.sendPoints();
      }
      isMouseDown = false;
      
    },

    sendPoints: function () {
      angleLine.convertFromAngleLengthLine(pointRecorder);
      angleLineMorpher.setTargets(angleLine);
      pointRecorderBuf.clear();
      pointRecorder.clear();
    },

    millis: function () {
      return date.getTime();
    },

    getContext: function () {
      return context;
    }

  };
})();

document.addEventListener('DOMContentLoaded', function () {
  'use strict';
    gestureLine.main.init();
});

