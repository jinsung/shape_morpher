var gestureLine = gestureLine || {};
var THREE = THREE || {};

gestureLine.pointRecorder = (function() {
	'use strict';
	var pointRecorderClass = function (nPointsToRecord) {
		this.nPoints = nPointsToRecord;
		this.geometry = new THREE.Geometry();
		this.geometry.dynamic = true;
		this.shaderAttrs = {
			aPosition: {type: 'v3', value: []},
			displacement: {type: 'v3', value: []},
			customColor: {type: 'c', value: []}
		};
		this.shaderUniforms = {
			amplitude: { type: 'f', value: 1.0 },
			opacity: { type: 'f', value: 0.3 },
			color: {type: 'c', value: new THREE.Color(0x000000)}
		};
		this.material = new THREE.ShaderMaterial( {
			uniforms: this.shaderUniforms,
			attributes: this.shaderAttrs,
			vertexShader: document.getElementById( 'vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
			depthTest: false,
			tranparent: true
		} );
		this.material.lineWidth = 1;

		this.pos = [];
		this.tempPos = [];
		this.curve = new THREE.SplineCurve();

		var aPositions = this.shaderAttrs.aPosition.value;
		var aColors = this.shaderAttrs.customColor.value;
		for ( var i = 0; i < this.nPoints; i++ ) {
			//this.pos[i] = new THREE.Vector2( 0, 0 );;
			this.geometry.vertices.push(new THREE.Vector3( 0, 0, 1 ));
			aPositions[i] = new THREE.Vector3( 0, 0, 0 );
			aColors[i] = new THREE.Color(0x000000);
		}

		this.clear();

		this.mesh = new THREE.Line( this.geometry, this.material, THREE.LineLoop );
	}; 

	var proto = pointRecorderClass.prototype;

	proto.addPoint = function( x, y ) {
		this.tempPos[this.pointCounter] = new THREE.Vector2( x, y );
		this.pointCounter++;
	};

	proto.setPath = function ( path ) {
		
		if (path.getPoints().length > 3) {
			this.curve = path;
			this.pos = this.curve.createSpacedPointsGeometry(this.nPoints-1).vertices;
			var points = path.getPoints(); 
			var pathL = points.length;
			this.pos.push(points[pathL]);
		}
	};

	proto.setShape = function () {
		if (this.tempPos.length > 3) {
			this.curve = new THREE.Shape(this.tempPos);
			
			this.pos = this.curve.createSpacedPointsGeometry(this.nPoints-1).vertices;
			this.pos.push(this.tempPos[this.pointCounter-1]);
		}
	};

	proto.draw = function() {
		
		if (this.curve){
			//var poses = this.curve.getPoints( this.nPoints );
			//console.log(poses[this.nPoints-1].x + ' :: ' + poses[this.nPoints-1].y);
			for (var i = 0; i < this.pos.length; i++) {
				this.shaderAttrs.aPosition.value[i] = new THREE.Vector3(this.pos[i].x, this.pos[i].y, 1);
			}
		} else {
			for (var j = 0; j < this.nPoints; j++) {
				this.shaderAttrs.aPosition.value[j] = new THREE.Vector3( 0, 0, -1 );
			}
		}
		this.shaderAttrs.aPosition.needsUpdate = true;
	};

	proto.clear = function () {
		this.pointCounter = 0;
		this.tempPos = [];
		this.curve = null;
	};

	proto.calculateLength = function() {
		if (this.nPoints < 2) {
			return 0;
		} else {
			var len = 0.0;
			var difx, dify;
			for (var i = 1; i< this.nPoints; i++) {
				difx = this.pos[i].x - this.pos[i-1].x;
				dify = this.pos[i].y - this.pos[i-1].y;
				len += Math.sqrt(difx*difx + dify*dify);
			}
			return len;
		}
	};

	proto.resampleIntoMe = function( mom, nPointsResample ) {
		var lower;
		var upper;
		var nResampledPoints = nPointsResample;
		var nPts = mom.pointCounter;
		var nPathPoints = nPts;
		var totalPathLength = mom.calculateLength();
		if (totalPathLength === 0) { totalPathLength = 0.0001; }
		var newPathLength = 0;
		
		var RSL = totalPathLength / (nResampledPoints-1);
		// Dx and Dy is distance between lower and upper x, y
		var Dx, Dy;//, Dz;
		var dx, dy;//, dz;
		var px, py;//, pz;
		var RSLdx, RSLdy;//, RSLdz;

		var segLength, ASL; // available segment length
		var remainder, neededSpace;
		var prevRemainder = RSL;
		var p = 0;
		var i;
		var nPtsToDo;
		var nResamples = 0;
		var smallNum = 0.0001;

		if (nPathPoints <= 1) { // special case for one-point path
			for (p=0; p<nResampledPoints; p++) {
				// if there is no points that added now, put all the registered point in the
				// small gap.
				lower = mom.pos[0];
				px = lower.x + p * smallNum;
				py = lower.y + p * smallNum;

				this.pos[nResamples].x = px;
				this.pos[nResamples].y = py;

				nResamples++;
			}
		} else {
			for (i=0; i<nPathPoints-1; i++) {
				lower = mom.pos[i];
				upper = mom.pos[i+1];

				Dx = upper.x - lower.x;
				Dy = upper.y - lower.y;

				if (Dx === 0 && Dy === 0) {
					Dx = smallNum;
					Dy = smallNum;
				}
				segLength = Math.sqrt(Dx*Dx + Dy*Dy);
				ASL = segLength;
				dx = (Dx/segLength);
				dy = (Dy/segLength);

				RSLdx = dx * RSL; // re-sampled segment vector components
				RSLdy = dy * RSL;

				neededSpace = RSL - prevRemainder;

				if ( ASL >= neededSpace ) {
					// if there is enough room to place the first point
					// then place the first resample point in the latest segment
					remainder = ASL;

					px = lower.x + (neededSpace * dx);
					py = lower.y + (neededSpace * dy);

					if (p < (nResampledPoints-1)) {
						this.pos[nResamples].x = px;
						this.pos[nResamples].y = py;

						nResamples++;
						newPathLength += RSL;
						remainder -= neededSpace;
						p++;
					} else {
						console.log('This line is comes out whenever p is bigger than resampled points');
					}

					nPtsToDo = remainder/RSL;
					for ( var d=0; d<nPtsToDo; d++ ) {
						px += RSLdx;
						py += RSLdy;

						if (p < (nResampledPoints-1)) {
							this.pos[nResamples].x = px;
							this.pos[nResamples].y = py;
							nResamples++;
							newPathLength += RSL;
							remainder -= RSL;
							p++;
						}
					}
					prevRemainder = remainder;
				} else {
					// if there is not enough room to place the first point
					prevRemainder += ASL;
				}
			}
			upper = mom.pos[nPts-1];

			while(nResamples < nPointsResample) {
				this.pos[nResamples].x = upper.x;
				this.pos[nResamples].y = upper.y;
				nResamples++;
			}
		}
		this.pointCounter = nResamples;
	};
	return pointRecorderClass;
})();