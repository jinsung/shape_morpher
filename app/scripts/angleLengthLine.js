var gestureLine = gestureLine || {};

gestureLine.angleLengthLine = (function() {
	'use strict';

	var angleLengthLineClass = function (nPointsToRecord) {
		this.nPoints = nPointsToRecord;
		this.gesturePoints = [];
		this.anglePoints = [];
		for (var i = 0; i < this.nPoints; i++) {
			this.gesturePoints[i] = new gestureLine.gesturePoint(0,0);
			this.anglePoints[i] = new gestureLine.anglePoint(0);
		}
		this.pointCounter = 0;
	};

	var proto = angleLengthLineClass.prototype;

	proto.convertFromAngleLengthLine = function(mom, startAngle) {
		// I will have less points then a pointRecorder since, eh, I respresent angles not points.
		// there for I  will be n - 2, as the first and last point DONT have angles.
		// angle from 3 points routine:

		var f1, f2, f3;
		f2 = 0;

		if (!startAngle) {
			startAngle = 0;
		}

		this.pointCounter = mom.nPoints - 2;
		for ( var i = 2; i < mom.nPoints; i++ ) {
			//var anglePointData = mom.pos[i-2];
			var anglePointData1 = mom.pos[i-1];
			var anglePointData2 = mom.pos[i];

			if (i === 2) {
				f2 = Math.PI - this.returnAngle(anglePointData1, anglePointData2);
			} else {
				f1 = Math.PI - this.returnAngle(anglePointData1, anglePointData2);
				f3 = f1 - f2;
				if (f3 >= Math.PI) {
					f3 = -(f2 + (Math.PI * 2.0 - f1));
				} else 	if (f3 < -Math.PI) {
					f3 = f1 + (Math.PI * 2.0 - f2);
				}
				var angleIndex = i - 2 + startAngle;
				this.anglePoints[angleIndex].setAngle(f3);
				f2 = f1;
			}
		}
	};

	proto.returnAngle = function(gesturePoint1, gesturePoint2) {
		return Math.atan2( gesturePoint2.x - gesturePoint1.x, 
			gesturePoint2.y - gesturePoint1.y );
	};

	proto.draw = function(context, scalef, offsetx, offsety, rot, startoff) {
		var p0, p1;
		p0 = new gestureLine.gesturePoint(0,0);
		p1 = new gestureLine.gesturePoint(0,0);
		p0.x = offsetx;
		p0.y = offsety;
		var length = scalef;

		var angleAdder = rot;

		context.beginPath();
		for (var i = startoff; i < this.pointCounter - 24; i++) {
			angleAdder += this.anglePoints[i].angle;
			p1.x = p0.x - length * Math.cos(angleAdder);
			p1.y = p0.y - length * Math.sin(angleAdder);
			context.moveTo(p0.x, p0.y);
			context.lineTo(p1.x, p1.y);
			p0.x = p1.x;
			p0.y = p1.y;
		}
		context.stroke();

	};

	return angleLengthLineClass;
})();