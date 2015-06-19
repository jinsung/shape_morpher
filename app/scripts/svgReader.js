var gestureLine = gestureLine || {};
var THREE = THREE || {};

gestureLine.svgReader = (function() {
	'use strict';
	var scope;
	var line = new THREE.Path();

	return {
		init: function(index, path) {
			scope = this;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', path, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					var svg = xhr.responseXML;
					for (var i = 0, l = svg.querySelectorAll('path').length; i < l; i++) {
						var d = svg.querySelectorAll('path')[i].getAttribute('d');
						scope.pathDataTo3D(d);
					}
					gestureLine.ee.emitEvent('svgLoaded', [index, line]);
				}
			};
			xhr.send(null); 
		},

		pathDataTo3D: function(pathData) {
			pathData = pathData
						.replace(/([0-9]) ([0-9])/g,'$1,$2')
						.replace(/(,?)\s+(,?)/g,'$1$2')
						.replace(/([0-9])-/g,'$1,-')
						.replace(/(.)([a-z])/ig,'$1|$2')
						.replace(/([a-z])/ig,'$1,')
						.split('|');

			line = new THREE.Path();
			var currentPoint = new THREE.Vector2();
			var x1, y1, x2, y2;
			
			var mult = 1;
			for (var i = 0, l = pathData.length; i < l; i++) {
				pathData[i] = pathData[i].split(',');
				var command = pathData[i][0];

				switch (command) {
					case 'M':
						currentPoint.x = (mult * pathData[i][1]);
						currentPoint.y = (mult * pathData[i][2]);
						line.moveTo( currentPoint.x, currentPoint.y );
						break;
					case 'm':
						currentPoint.x += (mult * pathData[i][1]);
						currentPoint.y += (mult * pathData[i][2]);
						line.moveTo( currentPoint.x, currentPoint.y );
						break;
					case 'L':
						currentPoint.x = (mult * pathData[i][1]);
						currentPoint.y = (mult * pathData[i][2]);
						line.lineTo( currentPoint.x, currentPoint.y );
						break;
					case 'l':
						currentPoint.x += (mult * pathData[i][1]);
						currentPoint.y += (mult * pathData[i][2]);
						line.lineTo( currentPoint.x, currentPoint.y );
						break;
					case 'H':
						currentPoint.x = (mult * pathData[i][1]);
						line.lineTo( currentPoint.x, currentPoint.y );
						break;
					case 'h':
						currentPoint.x += (mult * pathData[i][1]);
						line.lineTo( currentPoint.x, currentPoint.y );
						break;
					case 'V':
						currentPoint.y = (mult * pathData[i][1]);
						line.lineTo( currentPoint.x, currentPoint.y );
						break;
					case 'v':
						currentPoint.y += (mult * pathData[i][1]);
						line.lineTo( currentPoint.x, currentPoint.y );
						break;
					case 'C':
						x1 = (mult * pathData[i][1]);
						y1 = (mult * pathData[i][2]);
						x2 = (mult * pathData[i][3]);
						y2 = (mult * pathData[i][4]);
						currentPoint.x = (mult * pathData[i][5]);
						currentPoint.y = (mult * pathData[i][6]);
						line.bezierCurveTo( x1, y2, x2, y2, currentPoint.x, currentPoint.y );
						break;
					
					case 'c':
						x1 = currentPoint.x + (mult * pathData[i][1]);
						y1 = currentPoint.y + (mult * pathData[i][2]);
						x2 = currentPoint.x + (mult * pathData[i][3]);
						y2 = currentPoint.y + (mult * pathData[i][4]);
						currentPoint.x += (mult * pathData[i][5]);
						currentPoint.y += (mult * pathData[i][6]);
						line.bezierCurveTo( x1, y2, x2, y2, currentPoint.x, currentPoint.y );
						break;
					
					case 'S':
						x1 = currentPoint.x * 2 - x1;
						y1 = currentPoint.x * 2 - y1;
						x2 = (mult * pathData[i][1]);
						y2 = (mult * pathData[i][2]);
						currentPoint.x = (mult * pathData[i][3]);
						currentPoint.y = (mult * pathData[i][4]);
						line.bezierCurveTo( x1, y2, x2, y2, currentPoint.x, currentPoint.y );
						break;
					
					case 's':
						x1 = currentPoint.x * 2 - x1;
						y1 = currentPoint.x * 2 - y1;
						x2 += (mult * pathData[i][1]);
						y2 += (mult * pathData[i][2]);
						currentPoint.x += (mult * pathData[i][3]);
						currentPoint.y += (mult * pathData[i][4]);
						line.bezierCurveTo( x1, y2, x2, y2, currentPoint.x, currentPoint.y );
						break;

					case 'Z':
						// TODO - Close path
						break;
					case 'z':
						// TODO - Close path
						break;
				}
			}

		}

	};
})();