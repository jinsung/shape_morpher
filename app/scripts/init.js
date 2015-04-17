var gestureLine = {};

gestureLine.ns = function(name) {
	'use strict';
    var parts = name.split('.'),
        namespace = window,
        part;

    for (var i = 0, L = parts.length; i < L; i++) {
      part = parts[i];
      namespace[part] = namespace[part] || {};
      namespace = namespace[part];
    }

    return namespace;
};