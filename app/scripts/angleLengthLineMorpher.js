var gestureLine = gestureLine || {};
var THREE = THREE || {};

gestureLine.angleLengthLineMorpher = (function() {
	'use strict';
	var angleLengthLineMorpherClass = function (nPtsToRecord, pNumLines, x, y) {
		this.numPoints = nPtsToRecord;
		this.numLines = pNumLines;

		this.anglePtsPresents = [];
		this.anglePtsTargets = [];
		this.anglePtsDiffs = [];
 
		this.pts = [];
		this.angles = [];
		this.rightUpControlPts = [];
		this.rightDownControlPts = [];
		this.leftUpControlPts = [];
		this.leftDownControlPts = [];
		this.centroid = new THREE.Vector3();
		this.centroidOffsetCatch = new THREE.Vector3();

		this.gp0 = new THREE.Vector3();
		this.gp1 = new THREE.Vector3();
		this.p0 = new THREE.Vector3();
		this.p1 = new THREE.Vector3();
		this.pOrig = new THREE.Vector3();
		this.gp0.x = x;
		this.gp0.y = y;
		this.lineLength = 1.1;
		this.angleTotalBack = 0;
		this.angleTotalForw = 0;
		this.tweenFactor = 0.06;
		this.firstCall = true;
		this.displacementF = 10.0;
		this.maxDisplacementF = 100.0;
		this.minDisplacementF = 5.0;
		this.maxOpacity = 0.7;
		this.minOpacity = 0.3;
		this.opacityIncreaseStep = 0.005;
		
		this.curve = new THREE.SplineCurve();
		this.startTime = new Date();

		this.saturation = gestureLine.configGUI.config.saturation;
		this.maxSaturation = 0.8;
		this.minSaturation = gestureLine.configGUI.config.saturation;
		this.colorVarious = gestureLine.configGUI.config.colorVarious;
		this.rotationSpeed = gestureLine.configGUI.config.rotationSpeed;

		for (var i = 0; i < this.numPoints; i++) {
			this.anglePtsPresents[i] = new gestureLine.anglePoint();
			this.anglePtsTargets[i] = new gestureLine.anglePoint();
			this.anglePtsDiffs[i] = new gestureLine.anglePoint();
			this.pts[i] = new THREE.Vector3();
			this.angles[i] = 0;
			this.rightUpControlPts[i] = new THREE.Vector3();
			this.rightDownControlPts[i] = new THREE.Vector3();
			this.leftUpControlPts[i] = new THREE.Vector3();
			this.leftDownControlPts[i] = new THREE.Vector3();
		}

		this.meshes = [];
		this.shaderAttrs = [];
		this.shaderUniforms = [];
		//this.materials = [];
		var vsText = document.getElementById( 'noise_vertexshader' ).textContent;
		var fsText = document.getElementById( 'fragmentshader' ).textContent;
		for (var j=0; j<this.numLines; j++) {
			var geometry = new THREE.Geometry();
			geometry.dynamic = true;
			var attrs = {
				aPosition: {type: 'v3', value: []},
				displacement: {type: 'v3', value: []},
				customColor: {type: 'c', value: []},
				noiseSource: {type: 'v3', value: []}
			};
			var uniforms = {
				amplitude: { type: 'f', value: 1.0 },
				opacity: { type: 'f', value: 0.3 },
				color: {type: 'c', value: new THREE.Color(0xffffff)},
				iGlobalTime: {type: 'f', value: 0.0},
				texture: {type: 't', value: THREE.ImageUtils.loadTexture( 'images/particle3.png' )},
				size: {type: 'f', value: gestureLine.configGUI.config.pointSize}
			};
			var material = new THREE.ShaderMaterial( {
				uniforms: uniforms,
				attributes: attrs,
				vertexShader: vsText,
				fragmentShader: fsText,
				blending: THREE.AdditiveBlending,
				depthTest: false,
				transparent: true
			} );
			//material.lineWidth = 0.5;
			for (var k = 0; k < this.numPoints; k++) {
				geometry.vertices.push( new THREE.Vector3( 0, 0, 1 ) );
				attrs.aPosition.value[k] = new THREE.Vector3( 0, 0, 1 );
				attrs.displacement.value[k] = new THREE.Vector3();
				attrs.noiseSource.value[k] = new THREE.Vector3();
				attrs.customColor.value[k] = new THREE.Color( 0xffffff );
				attrs.customColor.value[k].setHSL( 1, 0.0, 0.5);
			}
			//var mesh = new THREE.Line( geometry, material , THREE.LinePieces );
			var mesh = new THREE.Line( geometry, material );
			//var mesh = new THREE.PointCloud( geometry, material );
			this.shaderAttrs.push(attrs);
			this.shaderUniforms.push(uniforms);
			//mesh.scale.x = mesh.scale.y = mesh.scale.z = 3;
			mesh.rotation.z = Math.PI / 2;
			mesh.rotation.y += j * (Math.PI * 0.8)/this.numLines;
			this.meshes.push(mesh);

		}

		this.clear();
	};

	var proto = angleLengthLineMorpherClass.prototype;

	proto.clear = function() {
		this.ptCount = 0;
		this.totalTimeMillis = 1500;
		this.startTimeMillis = 0;
		this.bAmAnimating = false;
		this.ptcAnimating = 0;
	};

	proto.setPresents = function (angleLengthLines) {
		for ( var i = 0; i < this.numPoints; i++ ) {
			this.anglePtsPresents[i].angle = angleLengthLines[i].angle;
		}
	};

	proto.setTargets = function (angLine) {
		this.startTimeMillis = gestureLine.main.millis();
		this.bAmAnimating = true;

		var totalDiff = 0;
		this.anglePtsPresents = this.anglePtsTargets.slice();
		this.anglePtsTargets = angLine.anglePoints.slice();
		for (var i = 0; i < this.numPoints; i++) {
			this.anglePtsDiffs[i].angle = this.anglePtsTargets[i].angle - this.anglePtsPresents[i].angle;
			totalDiff += Math.abs(this.anglePtsDiffs[i].angle);
		}

		this.totalTimeMillis = Math.max(totalDiff * 35, 750);
		this.ptCount = this.numPoints;
	};

	proto.increaseDisplacement = function () {
		if (this.displacementF < this.maxDisplacementF) {
			this.displacementF += 0.5;
		}
		if (this.saturation < this.maxSaturation) {
			this.saturation += 0.01;
		}

		for (var i = 0, l = this.shaderUniforms.length; i < l; i++) {
			if (this.shaderUniforms[i].opacity.value < this.maxOpacity) {
				this.shaderUniforms[i].opacity.value += this.opacityIncreaseStep;
			}
		}
	};

	proto.decreaseDisplacement = function () {
		if (this.displacementF > this.minDisplacementF) {
			this.displacementF -= 0.5;
		}

		if (this.saturation > this.minSaturation) {
			this.saturation -= 0.01;
		}

		for (var i = 0, l = this.shaderUniforms.length; i < l; i++) {
			if (this.shaderUniforms[i].opacity.value > this.minOpacity) {
				this.shaderUniforms[i].opacity.value -= this.opacityIncreaseStep;
			}
		}
	};

	proto.draw = function (x, y) {
		if (this.bAmAnimating) {
			if ( (gestureLine.main.millis() - this.startTimeMillis) < this.totalTimeMillis ) {
				this.ptcAnimating = (gestureLine.main.millis() - this.startTimeMillis) / this.totalTimeMillis;
			} else {
				this.bAmAnimating = false;
				this.anglePtsPresents = this.anglePtsTargets.slice();
			}
		}

		// pctShapedByCos return between 0.5 and 0 various by angDiff.angle
		var pctShapedByCos = 0.5 - 0.5 * Math.cos(this.ptcAnimating * Math.PI);

		if (this.bAmAnimating === true || this.firstCall === true ) {
			this.calcForward(pctShapedByCos);
			this.calcCentroid(x,y);
		}

		this.drawPoints();
		this.firstCall = false;
	};

	proto.setPointSize = function (size) {
		for (var i = 0, l = this.shaderUniforms.length; i < l; i++) {
			this.shaderUniforms[i].size.value = size;
		}
	};

	/**
	 * @pct --> pctShapedByCos ( between 0.5 and 0 )
	 * called by draw in here.
	 * gp0, 1 start and end ponts of the uncurling line
	 * p0, 1 tmp value
	 */
	proto.calcForward = function (pct) {
		this.p0.x = (1.0 - this.tweenFactor) * this.gp0.x + this.tweenFactor * 200.0;
		this.p0.y = (1.0 - this.tweenFactor) * this.gp0.y + this.tweenFactor * 180.0;

		this.pOrig.x = this.p0.x;
		this.pOrig.y = this.p0.y;

		var angleAdder = 0;

		var angleA, angleB, angleToAdd;
		for (var i=0; i<this.ptCount; i++) {
			angleA = this.anglePtsPresents[i].angle;
			angleB = pct * this.anglePtsDiffs[i].angle;
			angleToAdd = (angleA + angleB);

			if (angleToAdd > Math.PI) {
				angleToAdd -= Math.PI*2;
			} 
			if (angleToAdd < Math.PI) {
				angleToAdd += Math.PI*2;
			}
			angleAdder += angleToAdd;

			// walk along, blur a little...
			this.p1.x = this.p0.x + this.lineLength * Math.cos(angleAdder);
			this.p1.y = this.p0.y + this.lineLength * Math.sin(angleAdder);

			this.pts[i].x = (1.0 - this.tweenFactor) * this.pts[i].x + this.tweenFactor * this.p1.x;
			this.pts[i].y = (1.0 - this.tweenFactor) * this.pts[i].y + this.tweenFactor * this.p1.y;
			this.angles[i] = angleToAdd;
			this.p0.set(this.p1.x, this.p1.y, 1);
		}

		this.gp1.set(this.p1.x, this.p1.y, 1);
		this.angleTotalBack = Math.atan2(this.p1.y - this.p0.y, this.p1.x - this.p0.x);
		//var angleNotLevel = Math.atan2(this.p1.y - this.pOrig.y, this.p1.x - this.pOrig.x);
		//this.angleToBeLevel = -angleNotLevel;
	};

	// it just make whole form's registration point to center or left upper
	proto.calcCentroid = function(x, y) {
		if (this.ptCount<=0) {return;}

		for (var i=0; i<this.ptCount; i++) {
			this.centroid.x += this.pts[i].x;
			this.centroid.y += this.pts[i].y;
		}

		this.centroid.x /= this.ptCount;
		this.centroid.y /= this.ptCount;

		this.centroidOffsetCatch.x = 0.1 * this.centroidOffsetCatch.x + 0.9 * this.centroid.x;
		this.centroidOffsetCatch.y = 0.1 * this.centroidOffsetCatch.y + 0.9 * this.centroid.y;

		var diffInY = y - this.centroidOffsetCatch.y; // locaion controller
		var diffInX = x - this.centroidOffsetCatch.x;

		for (var j=0; j<this.ptCount; j++) {
			/*if (j === (this.ptCount - 1)) {
				
			} else {*/
				this.pts[j].y += diffInY;
				this.pts[j].x += diffInX;
			//}
		}

		//this.pts[0].y = this.pts[186].x;
		//this.pts[0].x = this.pts[187].y;
	};

	proto.drawPoints = function() {

		if (this.ptCount <= 0) {return;}
		var time = (Date.now() - this.startTime.getTime()) * 0.01;
		var cosTime = Math.abs( Math.cos (time * 0.02) );
		var sinTime = Math.sin(time * 0.1);

		for (var j=0; j<this.numLines; j++) {
			var attrs = this.shaderAttrs[j];
			var uniform = this.shaderUniforms[j];
			var displaceLineFactor = j / this.numLines * 2 - 1;
			uniform.amplitude.value = 1;// * Math.sin( 0.5 * time );
			uniform.color.value.offsetHSL( 0.0005, 0, 0 );
			uniform.iGlobalTime.value = time;

			for (var i=0; i<this.ptCount; i++) {
				//var displacementF = 1 - Math.abs(i / this.ptCount * 2 - 1) + 0.1;
				//var displacementF = gestureLine.configGUI.config.displacement;
				var dx = displaceLineFactor * this.displacementF;
				var dy = displaceLineFactor * this.displacementF;
				var dz = 0;

				var nx = this.angles[i] * 0.001;
				var ny = ((-this.centroid.x - this.pts[i].x) + 
					( this.centroid.y - this.pts[i].y)) * 0.00015;
				var nz = time * 0.001;

				attrs.noiseSource.value[i].set(nx, ny, nz);
				//attrs.noiseSource.value[i].set(0, 0, 0);
				attrs.displacement.value[i].set( dx, dy, dz );
				//attrs.displacement.value[i].set( 0, 0, 0 );
				attrs.aPosition.value[i].set(-this.pts[i].x * 2, -this.pts[i].y *2, 1);
				attrs.customColor.value[i].setHSL( this.colorVarious * (i * cosTime * 0.0007), this.saturation, 
					(1 - Math.abs(displaceLineFactor)) * 0.9 + 0.1);
			}
			attrs.noiseSource.needsUpdate = true;
			attrs.displacement.needsUpdate = true;
			attrs.aPosition.needsUpdate = true;
			attrs.customColor.needsUpdate = true;
			
			var jmitter = 1 + sinTime * (j*0.009);
			var rot = ((cosTime) * this.rotationSpeed) * (Math.PI * jmitter);
			//var rot1 = j* 0.003;
			this.meshes[j].rotation.y += rot * 0.01;
			//this.meshes[j].rotation.z = Math.PI / 2;
		}

		//console.log(time);
	};

	return angleLengthLineMorpherClass;
})();