var gestureLine = gestureLine || {};
var THREE = THREE || {};

gestureLine.sky = function () {
	'use strict';
	var geometry = new THREE.SphereGeometry( 
		gestureLine.sky.SIZE, 60, 20);
	var material = new THREE.ShaderMaterial( {
        vertexShader: gestureLine.sky.vertexShader.join(''),
        fragmentShader: gestureLine.sky.cloudFragmentShader.join(''),
        uniforms: gestureLine.sky.cloudUniforms,
//        side: THREE.BackSide 
        side: THREE.DoubleSide
    } ); 
	//var material
	THREE.Mesh.call( this, geometry, material );
};

gestureLine.sky.prototype = Object.create( THREE.Mesh.prototype );
gestureLine.sky.prototype.constructor = gestureLine.sky;

gestureLine.sky.prototype.draw = function () {
	'use strict';
	this.rotation.z += 0.001;
	this.rotation.y += 0.0015;
};

gestureLine.sky.SIZE = 2000;

gestureLine.sky.fractalUniforms = {
	time: {type: 'f', value: 0.0},
	resolution: {type: 'v2', value: new THREE.Vector2( 2, 1 )}
};

gestureLine.sky.cloudUniforms = {
    time: {type: 'f', value: 0.0},
    alpha: {type: 'f', value: 1.0}
};

gestureLine.sky.vertexShader = [
	'varying vec2 vUV;',
    'void main() {',
        'vUV = uv;',
        'vec4 pos = vec4(position, 1.0);',
        'gl_Position = projectionMatrix * modelViewMatrix * pos;',
    '}'
];

gestureLine.sky.cloudFragmentShader = [
    'uniform float time;',
    'uniform float alpha;',
    'varying vec2 vUV;',
    'void main() {',
      'float gray = vUV.y / 2.0 - 0.27;',
	  'vec3 color = vec3(gray, gray, gray);',
      'gl_FragColor = vec4(color, 1.0);',
    '}'
];

