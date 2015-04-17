var gestureLine = gestureLine || {};

gestureLine.pointRecorder = (function() {
	'use strict';
	var pointRecorderClass = function (nPointsToRecord) {
		this.nPoints = nPointsToRecord;
		this.pos = [];
		for ( var i = 0; i < this.nPoints; i++ ) {
			this.pos[i] = new gestureLine.gesturePoint(0,0);
		}
		this.pointCounter = 0;
	}; 

	var proto = pointRecorderClass.prototype;

	proto.addPoint = function( x, y ) {
		if ( this.pointCounter < this.nPoints ) {
			var posInArray = this.pointCounter % this.nPoints;
			this.pos[posInArray].setPos(x,y);
			this.pointCounter++;
		}
	};

	proto.draw = function(context) {
		// we have two scenarios: (a) we haven't filled the ring buffer
		//						  (b) we have filled the ring buffer

		if ( this.pointCounter < this.nPoints ) { // (a)
			// draw in a normal manner.
			context.beginPath();
			for (var i = 0; i < this.pointCounter-1; i++) {
				context.moveTo(this.pos[i].x, this.pos[i].y);
				context.lineTo(this.pos[i+1].x, this.pos[i+1].y);
			}
			context.stroke();

		} else { 							 // (b)
			// draw based on ring buffer oldest to newest,
			var start = this.pointCounter;
			var end = this.pointCounter + this.nPoints - 1;

			context.beginPath();
			for (var j = start; j < end; j++) {
				var posInArray = j % this.nPoints;
				context.moveTo(this.pos[posInArray].x, this.pos[posInArray].y);
				context.lineTo(this.pos[posInArray+1].x, this.pos[posInArray+1].y);
			}

			context.stroke();
		}
	};

	proto.clear = function () {
		this.pointCounter = 0;
	};

	proto.calculateLength = function() {
		if (this.nPoints < 2) {
			return 0;
		} else {
			var len = 0.0;
			var difx, dify;
			for (var i = 1; i< this.pointCounter; i++) {
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