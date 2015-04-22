var gestureLine = gestureLine || {};
var THREE = THREE || {};

gestureLine.main = (function() {
  'use strict';
  var scope;
  var pointRecorder;
  var angleLine;
  var angleLineMorpher;
  var numAnglePoints;
  var numLines;
  var isMouseDown;
  var date;

  var canvasWidth;
  var canvasHeight;

  // threejs
  var container;
  var camera;
  var scene;
  var renderer;

  var vertexShaderText;
  var fragmentShaderText;

  var isCameraPersp = true;

  var currentShapeIndex = -1;
  var shapesArray = [];

  var tempIntervalTime = 0;

  return {
    init: function () {
      scope = this;
      date = new Date();
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;
      numAnglePoints = 200;
      numLines = 25;

      shapesArray = [5, 80, 4, 9];

      pointRecorder = new gestureLine.pointRecorder (numAnglePoints);
      angleLine = new gestureLine.angleLengthLine(numAnglePoints);
      angleLineMorpher = new gestureLine.angleLengthLineMorpher(numAnglePoints, numLines, 100, 100);

      container = document.createElement('div');
      document.body.appendChild( container );

      if (isCameraPersp) {
        camera = new THREE.PerspectiveCamera( 60, canvasWidth / canvasHeight, 1, 1000 );  
      } else {
        camera = new THREE.OrthographicCamera( canvasWidth / - 2, canvasWidth / 2, canvasHeight / 2, canvasHeight / - 2, 0.1, 1000 );
      }
      scene = new THREE.Scene();
      scene.add(camera);
      camera.position.set(0, 0, -180);
      camera.lookAt( scene.position );

      scene.add( new THREE.AmbientLight( 0x404040 ) );

      renderer = new THREE.WebGLRenderer( {antialias: true} );
      renderer.setClearColor ( 0x000000 );
      renderer.setPixelRatio ( window.devicePixelRatio );
      renderer.setSize( canvasWidth, canvasHeight );
      container.appendChild(renderer.domElement);

      vertexShaderText = document.getElementById( 'vertexshader' ).textContent;
      fragmentShaderText = document.getElementById( 'fragmentshader' ).textContent;

      gestureLine.main.changeShape();

      gestureLine.main.sendPoints();

      pointRecorder.clear();
      scene.add(pointRecorder.mesh);
      for (var j=0; j<numLines; j++) {
        scene.add(angleLineMorpher.meshes[j]);
      }

      isMouseDown = false;
      //container.addEventListener('mousedown', gestureLine.main.onMouseDown, false);
      //container.addEventListener('touchstart', gestureLine.main.onMouseDown, false);
      container.addEventListener('mouseup', gestureLine.main.onMouseUp, false);
      container.addEventListener('touchend', gestureLine.main.onMouseUp, false);
      /*container.addEventListener('mousemove', function(evt) {
        gestureLine.main.onMouseMove(container, evt);
      }, false);
      container.addEventListener('touchmove', function(evt) {
        gestureLine.main.onTouchMove(container, evt);
      }, false);

      container.addEventListener('mouseout', gestureLine.main.onMouseOut, false);
      */
      window.addEventListener( 'resize', gestureLine.main.onWindowResize, false );
      scope.draw();
    },

    draw: function () {
      
      requestAnimationFrame(scope.draw);

      var intervalTime = Math.floor(Date.now() / 1000);
      if ( intervalTime != tempIntervalTime && intervalTime % 2 === 0) {
        tempIntervalTime = intervalTime;
        gestureLine.main.changeShape();
      } 

      angleLineMorpher.draw(0, 0);
      //if (isMouseDown) {
        pointRecorder.draw(Date.now());
      //} 

      renderer.render( scene, camera );
    }, 

    changeShape: function () {
      var radius = 100;
      var offset = 100;
      currentShapeIndex = (currentShapeIndex+1) % shapesArray.length;
      var initNumPoints = shapesArray[currentShapeIndex];
      for (var i = 0; i < initNumPoints; i++) {
        var div = (i/(initNumPoints-1)) * (Math.PI * 2.0);
        pointRecorder.addPoint(offset + Math.cos(div)*radius, 
          offset+Math.sin(div)*radius);
      }

      gestureLine.main.sendPoints();
    },

    onWindowResize: function () {
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;

      if (isCameraPersp) {
        camera.aspect = canvasWidth / canvasHeight;
      } else {
        camera.left   = - canvasWidth / 2;
        camera.right  =   canvasWidth / 2;
        camera.top    =   canvasHeight / 2;
        camera.bottom = - canvasHeight / 2;
      }
      camera.updateProjectionMatrix();


      renderer.setSize( canvasWidth, canvasHeight );
    },

    onTouchMove: function (container, evt) {
      evt.preventDefault(); 
      if (isMouseDown) {
        var rect = container.getBoundingClientRect();
        var mouseX = evt.targetTouches[0].pageX - rect.left;
        var mouseY = evt.targetTouches[0].pageY - rect.top;
        pointRecorder.addPoint( mouseX, mouseY );
      }
    },

    onMouseMove: function (container, evt) {

      if (isMouseDown) {
        //var rect = container.getBoundingClientRect();

        var mouseX = - (evt.clientX / canvasWidth * 2 - 1) * (canvasWidth * 0.5);
        var mouseY = - (evt.clientY / canvasHeight * 2 - 1) * (canvasHeight * 0.5);

        pointRecorder.addPoint( mouseX, mouseY );
      }
    },

    onMouseDown: function () {
      isMouseDown = true;
    },

    onMouseUp: function () {
      /*if (isMouseDown) {
        gestureLine.main.sendPoints();
      }
      isMouseDown = false;*/
      gestureLine.main.changeShape();
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
      pointRecorder.clear();
    },

    millis: function () {
      return new Date().getTime();
    },

    getVertexShaderText: function() {
      return vertexShaderText;
    }, 

    getFragmentShaderText: function() {
      return fragmentShaderText;
    }

  };
})();

document.addEventListener('DOMContentLoaded', function () {
  'use strict';
    gestureLine.main.init();
});

