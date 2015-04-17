var gestureLine = gestureLine || {};

gestureLine.anglePoint = (function() {
	'use strict';
	var angleClass = function (_angle) {
		if (!_angle) {
			this.angle = 0;
		} else {
			this.angle = _angle;
		}
	};

	var proto = angleClass.prototype;

	proto.setAngle = function(_angle) {
		this.angle = _angle;
	};

	return angleClass;
})();