var gestureLine = gestureLine || {};

gestureLine.gesturePoint = (function() {
	'use strict';
	var gestureClass = function (_x, _y) {
		if (!_x || !_y) {
			this.x = 0;
			this.y = 0;
		} else {
			this.x = _x;
			this.y = _y;
		}
	};

	var proto = gestureClass.prototype;

	proto.setPos = function(_x, _y) {
		this.x = _x;
		this.y = _y;
	};

	return gestureClass;
})();