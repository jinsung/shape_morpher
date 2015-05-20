var gestureLine = gestureLine || {};
var dat = dat || {};

gestureLine.config = function () {
	'use strict';
	this.rotationSpeed = 0.7;
	this.pointSize = 15.0;
	this.saturation = 0.12;
	this.colorVarious = 5.0;
};

gestureLine.configGUI = (function() {
	'use strict';
	return {
		init : function () {
			this.config = new gestureLine.config ();
			var gui = new dat.GUI();
			gui.add(this.config, 'rotationSpeed', 0.0, 15.0).onChange(gestureLine.main.guiChanged);
			gui.add(this.config, 'pointSize', 1.0, 100.0).onChange(gestureLine.main.guiChanged);
			gui.add(this.config, 'saturation', 0.0, 1.0).onChange(gestureLine.main.guiChanged);
			gui.add(this.config, 'colorVarious', 0.0, 6.0).onChange(gestureLine.main.guiChanged);
		}
	};
})();
