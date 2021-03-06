// Grav - Canvas
// An orbit simulation program using Canvas for animations
// By: Roberto Sanchez
// Inspired by the program Planets by Yaron Minsky (planets.homedns.org)

/*
 * Globals to avoid garbage collection
 * http://www.scirra.com/blog/76/how-to-write-low-garbage-real-time-javascript
 */
derivative1 = [];
derivative2 = [];
derivative3 = [];
derivative4 = []; 
yt = [];
massiveColliders = [];
smallColliders = [];
hh = 0.5; //rk4 half timestep
h6 = 1/6;  //rk4 1/6 timestep
collidingDiff = [0, 0];
derivativesDiff = [0, 0];
globalCom = [0, 0];
/*
 * Some Utility Functions
 */
function debug(e) {
    if (window.console && console.log) {
        // Firebug
        return console.log(e);
    }
    if (window.opera && opera.postError) {
        // Dragonfly
        return opera.postError(e);
    }
    if (window.console && console.debug) {
        // Webkit
        return console.debug(e);
    }
}
function randInt(limit) {
    return Math.floor(Math.random() * limit);
}

function getHeight() {
    return Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight);
}

function getWidth() {
    return document.documentElement.clientWidth;
}
/*
 * Add vector mathematics methods to the Array prototype (based on methods found in the Sylvester Javascript Library)
 */
//Self versions are so that new arrays are not generated
//SelfComponents versions are so that new arrays are not passed 
Array.prototype.zeroSelf = function() {
    this[0] = 0;
    this[1] = 0;
    return this;
}
Array.prototype.copy = function(copy) {
    this[0] = copy[0];
    this[1] = copy[1];
    return this;
}
Array.prototype.add = function(addarray) {
    //return [this[0] + addarray[0], this[1] + addarray[1], (this[2] || 0) + (addarray[2] || 0)];
    return [this[0] + addarray[0], this[1] + addarray[1]];
}
Array.prototype.addComponents = function(first, second) {
    return [this[0] + first, this[0] + second];
}
Array.prototype.addSelf = function(addarray) {
    this[0] += addarray[0];
    this[1] += addarray[1];
    return this;
}
Array.prototype.addSelfComponents = function(first, second) {
    this[0] += first;
    this[1] += second;
    return this;
}
Array.prototype.subtract = function(subarray) {
    //return [this[0] - subarray[0], this[1] - subarray[1], (this[2] || 0) - (subarray[2] || 0)];
    return [this[0] - subarray[0], this[1] - subarray[1]];
}
Array.prototype.subtractComponents = function(first, second) {
    return [this[0] - first, this[1] - second];
}
Array.prototype.subtractSelf = function(subarray) {
    this[0] -= subarray[0];
    this[1] -= subarray[1];
    return this;
}
Array.prototype.subtractSelfComponents = function(first, second) {
    this[0] -= first;
    this[1] -= second;
    return this;
}
Array.prototype.multiply = function(factor) {
    //return [this[0] * factor, this[1] * factor, (this[2] || 0) * factor];
    return [this[0] * factor, this[1] * factor];
}
Array.prototype.multiplySelf = function(factor) {
    this[0] *= factor;
    this[1] *= factor;
    return this;
}
Array.prototype.multiplyEach = function(multArray) {
    return [this[0] * multArray[0], this[1] * multArray[1]];
}
Array.prototype.multiplyEachComponents = function(first, second) {
    return [this[0] * first, this[1] * second];
}
Array.prototype.multiplyEachSelf = function(multArray) {
    this[0] *= multArray[0];
    this[1] *= multArray[1];
    return this;
}
Array.prototype.multiplyEachSelfComponents = function(first, second) {
    this[0] *= first;
    this[0] *= second;
    return this;
}
Array.prototype.dot = function(array2) {
    //return this[0]*array2[0] + this[1]*array2[1] + (this[2] || 0) * (array2[2] || 0);
    return this[0]*array2[0] + this[1]*array2[1];
}
Array.prototype.dotSelf = function() {
    return this[0]*this[0] + this[1]*this[1];
}
Array.prototype.distanceFrom = function(destArray) {
    //return Math.sqrt(Math.pow(this[0] - destArray[0], 2) + Math.pow(this[1] - destArray[1], 2) + Math.pow((this[2] || 0) - (destArray[2] || 0), 2));
    return Math.sqrt(Math.pow(this[0] - destArray[0], 2) + Math.pow(this[1] - destArray[1], 2));
}
Array.prototype.toUnitVector = function() {
    //var mag = Math.sqrt((this[0] * this[0]) + (this[1] * this[1]) + ((this[2] * this[2]) || 0));
    //return [this[0] / mag, this[1] / mag, (this[2] || 0) / mag];
    var mag = Math.sqrt((this[0] * this[0]) + (this[1] * this[1]));
    return [this[0] / mag, this[1] / mag];
}
Array.prototype.toUnitVectorSelf = function() {
    var mag = Math.sqrt((this[0] * this[0]) + (this[1] * this[1]));
    this[0] /= mag;
    this[1] /= mag;
    return this;
}
Array.prototype.rotate = function(iangle) {
    // only used to initialize position of new bodies, see how to adapt to 3d
    var cosangle = Math.cos(iangle);
    var sinangle = Math.sin(iangle);
    return [(cosangle * this[0]) + (-sinangle * this[1]), (sinangle * this[0]) + (cosangle * this[1])];
}
Array.prototype.rotateSelf = function(iangle) {
    var cosangle = Math.cos(iangle);
    var sinangle = Math.sin(iangle);
    var x = this[0];
    var y = this[1];
    this[0] = (cosangle*x) + (-sinangle*y);
    this[1] = (sinangle*x) + (cosangle*y);
    return this;
}
/*
 * Drawing Functions
 */
function drawBody(x, y, r, color, paper) {
    paper.beginPath();
    paper.arc(x, y, r, 0, Math.PI * 2, 1);
    paper.closePath();
    paper.fillStyle = color;
    paper.fill();
}

function drawLine(x, y, oldx, oldy, radius, color, paper) {
    paper.lineWidth = .2*radius;
    paper.lineCap = 'round';
    paper.beginPath();
    paper.moveTo(oldx, oldy);
    paper.lineTo(x, y);
    paper.strokeStyle = color;
    paper.stroke();
}
/*
 * Some Javascript event functions
 */
function addBodyClick(ev) {
    var x = 0;
    var y = 0;
    if (typeof(ev.layerX) == 'undefined') {
        x = ev.offsetX;
        y = ev.offsetY;
    } else {
        x = ev.layerX;
        y = ev.layerY;
    }
    var randomOrientation = false;
    if (!!ev.shiftKey) {
        randomOrientation = true;
    }
    var pos = [(x * (rectDimensions[2] / windowWidth)) - rectDimensions[0], (y * (rectDimensions[3] / windowHeight)) - rectDimensions[1]];
    var global = globalOrigin.add([rectDimensions[0], rectDimensions[1]]);
    var thisAngle = isRotating ? angle : 0;
    pos = pos.subtract(globalOrigin).rotate(-thisAngle).add(globalOrigin);
    addBody(pos[0], pos[1], +document.getElementById('newmass').value, randomOrientation);
}

function handleArrowEvents(ev) {
    var ek = ev.which;
}

function pageEvents(ev) {
    var ek = ev.which;
    debug(ek);
    var willReset = false;
    var oldRect = rectDimensions.slice();
    // transform the canvas based on movement/zoom
    rectDimensions[0] += rectDimensions[2] * ((-(ek == 105) * (45 / 990)) || (+(ek == 111) * (45 / 900)) || ((-(ek == 100) || (+(ek == 97))) * (1 / 30)));
    rectDimensions[1] += rectDimensions[3] * (((-(ek == 105) || +(ek == 111)) * (45 / 990)) || ((-(ek == 115) || (+(ek == 119))) * (1 / 30)));
    rectDimensions[2] *= (+(ek == 111) * 1.10) || (+(ek == 105) * (90 / 99)) || 1;
    rectDimensions[3] *= (+(ek == 111) * 1.10) || (+(ek == 105) * (90 / 99)) || 1;
    willReset = ek == 111 || ek == 105 || ek == 115 || ek == 100 || ek == 119 || ek == 97 || ek == 107 || ek == 117 || ek == 106 || ek == 105;

    var scale = rectDimensions[2] / windowWidth;
    // increase/decrease trace length
    alpha *= (.5 * +(ek == 109)) || (2 * +(ek == 108)) || 1;
    if (alpha > 1) {
        alpha = 1
    }
    if (alpha < 0.001) {
        alpha = 0.001
    }
    // toggle trace
    if (ek == 116) {
        if (alpha < 1) {
            alpha = 1;
        } else {
            alpha = .05
        }
    }
    // pause
    if (ek == 112) {
        isPaused = !isPaused;
        if (!isPaused) {
            calculateOrbit();
        }
    }
    // hide instructions
    if (ek == 113) {
        document.getElementById('instructions').style.display = (document.getElementById('instructions').style.display == 'none' ? 'block' : 'none');
    }
    // toggle flicker
    if (ek == 102) {
        antiFlicker = !antiFlicker;
        document.getElementById('flicker').innerHTML = (antiFlicker && 'Off') || 'On';
    }
    // toggle bounce
    if (ek == 98) {
        isBounce = !isBounce;
        document.getElementById('bounce').innerHTML = (isBounce && 'On') || 'Off';
    }
    // toggle rotating reference frame
    if (ek == 114) {
	isRotating = !isRotating;
	document.getElementById('rotating').innerHTML = (isRotating && 'On') || 'Off';
    }
    resetCanvas(oldRect, willReset);
}

function resizeWindow() {
    var scaleWidth = rectDimensions[2] / windowWidth;
    var scaleHeight = rectDimensions[3] / windowHeight;
    windowWidth = getWidth();
    windowHeight = getHeight();
    var oldRect = rectDimensions.slice();
    paper.canvas.width = windowWidth;
    paper.canvas.height = windowHeight;
    var transition = document.getElementById('transition');
    transition.width = windowWidth;
    transition.height = windowHeight;
    rectDimensions[2] = scaleWidth * windowWidth;
    rectDimensions[3] = scaleHeight * windowHeight;
    resetCanvas(oldRect, true);
}

function resetCanvas(oldRect, willReset) {
    document.getElementById('viewx').innerHTML = 'X: ' + parseInt(rectDimensions[0], 10);
    document.getElementById('viewy').innerHTML = 'Y: ' + parseInt(rectDimensions[1], 10);
    document.getElementById('viewidth').innerHTML = 'Width: ' + parseInt(rectDimensions[2], 10);
    document.getElementById('viewheight').innerHTML = 'Height: ' + parseInt(rectDimensions[3], 10);
}

function changeBody(ev) {
    loadBodies(+ev.target.value);
    this.blur();
}

function getUrl() {
    window.location.hash = JSON.stringify(bodies);
}

function handleScroll(e) {
    e = e ? e : window.event;
    var wheelData = e.detail ? e.detail * -1 : e.wheelDelta / 40;
    if (wheelData < 0) {
        pageEvents({which:111});
    } else {
        pageEvents({which:105});
    }
    return cancelEvent(e);
}

function cancelEvent(e)
{
    e = e ? e : window.event;
    if(e.stopPropagation) {
        e.stopPropagation();
    }
    if(e.preventDefault) {
        e.preventDefault();
    }
    e.cancelBubble = true;
    e.cancel = true;
    e.returnValue = false;
    return false;
}

/*
 * Physics functions
 */
var gravConstant = 8.14496e-18; // Calculated so that an Earth at 1e-5 times its actual distance (with 1px = 1m) 
                               // has an orbital velocity such at its period is 60s (so G is in pks units) (with no trace).
                               // The "Sun" has its normal mass in kg.


function derivatives(state, derivative, getEnergy, colliders1, colliders2) {
    getEnergy = !!getEnergy;
    var getColliders = !!colliders1;
    var colliders = {};
    var contact = false;
    var totalEnergy = 0;
    // takes a state array, gets the derivatives of the state and stores in derivative
    var bodiesLength = state.length;
    for (var i = bodiesLength; i--;) {
        //derivative[i].position = state[i].velocity;
        derivative[i].position.copy(state[i].velocity);
    }
    for (var i = bodiesLength; i--;) {
        for (var j = i; j--;) {
            //var diff = state[i].position.subtract(state[j].position);
            derivativesDiff.copy(state[i].position.subtractSelf(state[j].position));
            state[i].position.addSelf(state[j].position);
	    if (getColliders) {
		var radii = bodies[i].radius + bodies[j].radius;
		if (derivativesDiff.dotSelf() <= (radii*radii)) {
		    // bodies are touching
                    if (!colliders[i]) {
                        colliders[i] = [];
                    }
                    if (!colliders[j]) {
                        colliders[j] = [];
                    }

                    if (!(colliders[i].indexOf(j) > 0 || colliders[j].indexOf(i) > 0)) {
                        // if the colliders have not been registered yet, use the most massive as the index
                        if (bodies[i].mass > bodies[j].mass) {
                            colliders[i][colliders[i].length] = j;
                        } else {
                            colliders[j][colliders[j].length] = i;
                        }
                        contact = true;
                    }
		}
	    }
            var dist = state[i].position.distanceFrom(state[j].position)
            var mult = gravConstant / (dist * dist * dist);
            var multi = -mult * bodies[j].mass;
            var multj = mult * bodies[i].mass;
            //derivative[i].velocity = derivative[i].velocity.add(diff.multiply(multi));
            derivativesDiff.multiplySelf(multi);
            derivative[i].velocity.addSelf(derivativesDiff);
            //derivative[j].velocity = derivative[j].velocity.add(diff.multiply(multj));
            derivativesDiff.multiplySelf(multj/multi);
            derivative[j].velocity.addSelf(derivativesDiff);
            //derivativesDiff.multiply(1/multj); not used anymore
            if (getEnergy) {
                totalEnergy -= (gravConstant * bodies[j].mass * bodies[i].mass) / dist;
            }
        }
    }
    if (contact) {
	for (var first in colliders) {
            colliders1[colliders1.length] = +first;
            colliders2[colliders2.length] = colliders[first];
	}
    }
    return totalEnergy;
}

function calculateOrbit() {
    var bodiesLength = bodies.length;
    // RK4 derivatives and intermediate
    // This RK4 method adapted from the program Planets by Yaron Minsky (planets.homedns.org)
    var oldLength = derivative1.length;
    derivative1.length = bodiesLength;
    derivative2.length = bodiesLength;
    derivative3.length = bodiesLength;
    derivative4.length = bodiesLength;
    yt.length = bodiesLength;
    for (var i = bodiesLength; i--;) {
        if (i < oldLength) {
            //elements already exist, just reset them (to avoid garbage collection)
            derivative1[i].position.zeroSelf();
            derivative1[i].velocity.zeroSelf();
            derivative2[i].position.zeroSelf();
            derivative2[i].velocity.zeroSelf();
            derivative3[i].position.zeroSelf();
            derivative3[i].velocity.zeroSelf();
            derivative4[i].position.zeroSelf();
            derivative4[i].velocity.zeroSelf();
            yt[i].position.zeroSelf();
            yt[i].velocity.zeroSelf();
        } else {
            //this should be the only place in the calculateOrbit loop function that actually creates objects/arrays
            derivative1[i] = {position:[0,0], velocity:[0,0]};
            derivative2[i] = {position:[0,0], velocity:[0,0]};
            derivative3[i] = {position:[0,0], velocity:[0,0]};
            derivative4[i] = {position:[0,0], velocity:[0,0]};
            yt[i] = {position:[0,0], velocity:[0,0]};
        }
    }
    massiveColliders.length = 0;
    smallColliders.length = 0;
    var energy;
    if (isBounce) {
        energy = derivatives(bodies, derivative1, true, massiveColliders, smallColliders); // compute the first derivative for rk4, stored into derivative1, get the gravitational energy
    } else {
        energy = derivatives(bodies, derivative1, true);
    }
    for (var i = bodiesLength; i--;) {
        //yt[i].position = bodies[i].position.add(derivative1[i].position.multiply(hh));
        yt[i].position.copy(bodies[i].position.addSelf(derivative1[i].position.multiplySelf(hh)));
        bodies[i].position.subtractSelf(derivative1[i].position);
        derivative1[i].position.multiplySelf(1/hh);
        //yt[i].velocity = bodies[i].velocity.add(derivative1[i].velocity.multiply(hh));
        yt[i].velocity.copy(bodies[i].velocity.addSelf(derivative1[i].velocity.multiplySelf(hh)));
        bodies[i].velocity.subtractSelf(derivative1[i].velocity);
        derivative1[i].velocity.multiplySelf(1/hh)
    }
    derivatives(yt, derivative2); // compute the second derivative for rk4 using the position and velocity updated from first derivative
    for (var i = bodiesLength; i--;) {
        //yt[i].position = bodies[i].position.add(derivative2[i].position.multiply(hh));
        yt[i].position.copy(bodies[i].position.addSelf(derivative2[i].position.multiplySelf(hh)));
        bodies[i].position.subtractSelf(derivative2[i].position);
        derivative2[i].position.multiplySelf(1/hh)
        //yt[i].velocity = bodies[i].velocity.add(derivative2[i].velocity.multiply(hh));
        yt[i].velocity.copy(bodies[i].velocity.addSelf(derivative2[i].velocity.multiplySelf(hh)));
        bodies[i].velocity.subtractSelf(derivative2[i].velocity);
        derivative2[i].velocity.multiplySelf(1/hh)
    }
    derivatives(yt, derivative3);
    for (var i = bodiesLength; i--;) {
        //yt[i].position = bodies[i].position.add(derivative3[i].position);
        yt[i].position.copy(bodies[i].position.addSelf(derivative3[i].position));
        bodies[i].position.subtractSelf(derivative3[i].position);
        //yt[i].velocity = bodies[i].velocity.add(derivative3[i].velocity);
        yt[i].velocity.copy(bodies[i].velocity.addSelf(derivative3[i].velocity));
        bodies[i].velocity.subtractSelf(derivative3[i].velocity);
        //derivative3[i].position = derivative3[i].position.add(derivative2[i].position);
        //derivative3[i].position.addSelf(derivative2[i].position);
        derivative3[i].position.addSelfComponents(derivative2[i].position[0], derivative2[i].position[1]);
        //derivative3[i].velocity = derivative3[i].velocity.add(derivative2[i].velocity);
        //derivative3[i].velocity.addSelf(derivative2[i].velocity;
        derivative3[i].velocity.addSelfComponents(derivative2[i].velocity[0], derivative2[i].velocity[1]);
    }
    derivatives(yt, derivative4);

    if (alpha >= 0.001) {
        paper.fillStyle = 'rgba(0,0,0,' + alpha + ')';
        //paper.fillRect(-rectDimensions[0], -rectDimensions[1], rectDimensions[2], rectDimensions[3]);
	paper.fillRect(0, 0, windowWidth, windowHeight);
    }
    if (massiveColliders.length > 0) {
	// get the new momentum for the massive body, and the new mass
        // for colliding
        // adapted from http://www.gamasutra.com/view/feature/3015/pool_hall_lessons_fast_accurate_.php?print=1
        // and
        // http://stackoverflow.com/questions/345838/ball-to-ball-collision-detection-and-handling
        for (var i = massiveColliders.length; i--;) {
            var body1 = bodies[massiveColliders[i]];
            for (var j = smallColliders[i].length; j--;) {
                var body2 = bodies[smallColliders[i][j]];
                //var diff = body1.position.subtract(body2.position);
                collidingDiff.copy(body1.position.subtractSelf(body2.position));
                body1.position.addSelf(body2.position);
                var mag = Math.sqrt(collidingDiff.dotSelf());
                // minimum translation distance to push bodies apart after intersecting
                var absFactor = (body1.radius+body2.radius-mag)/mag;
                //var move = diff.multiply((body1.radius+body2.radius-mag)/mag);
                collidingDiff.multiplySelf(absFactor);
                //inverse mass quantities
                var im1 = 1 / body1.mass;
                var im2 = 1 / body2.mass;
                // push-pull them apart based off their mass
                var firstFactor = im1/(im1+im2);
                var secondFactor = im2/(im1+im2);
                //body1.position = body1.position.add(move.multiply(im1/(im1+im2)));
                collidingDiff.multiplySelf(firstFactor);
                body1.position.addSelf(collidingDiff);
                //body2.position = body2.position.subtract(move.multiply(im2/(im1+im2)));
                collidingDiff.multiplySelf(secondFactor/firstFactor);
                body2.position.addSelf(collidingDiff);
                //diff.multiplySelf(1/(secondFactor*absFactor)); //don't need to do this, will unit vector self
                // impact speed
                //var n = diff.toUnitVector();
                collidingDiff.toUnitVectorSelf();
                var vn = body1.velocity.dot(collidingDiff) - body2.velocity.dot(collidingDiff);
                if (vn <= 0) {
                    // collision impulse
                    //var impulse = diff.multiply((-2 * vn) / (im1 + im2));
                    collidingDiff.multiplySelf((-2 * vn) / (im1 + im2));
                    // change in momentum
                    //body1.velocity = body1.velocity.add(impulse.multiply(im1));
                    body1.velocity.addSelf(collidingDiff.multiplySelf(im1));
                    //body2.velocity = body2.velocity.subtract(impulse.multiply(im2));
                    body2.velocity.addSelf(collidingDiff.multiplySelf(im2/im1));
                }
            }
        }
    }
    bodiesLength = bodies.length;
    var scale = rectDimensions[2] / windowWidth;
    //var com = [0, 0];
    globalCom.zeroSelf();
    var totalMass = 0;
    globalFunc();
    angle += angularVelocity;
    angle %= 2*Math.PI;
    var locangle = angle;
    //var global = globalOrigin.add([rectDimensions[0], rectDimensions[1]]);
    globalOrigin.addSelf(rectDimensions);
    //since derivatives are no longer used after this, can use the self versions of vector functions
    for (var i = bodiesLength; i--;) {
        var firstPosition = bodies[i].position;
        //bodies[i].position = bodies[i].position.add((derivative1[i].position.add(derivative4[i].position).add(derivative3[i].position.multiply(2))).multiply(h6));
        bodies[i].position.addSelf((derivative1[i].position.addSelf(derivative4[i].position).addSelf(derivative3[i].position.multiplySelf(2))).multiplySelf(h6));
        //bodies[i].velocity = bodies[i].velocity.add((derivative1[i].velocity.add(derivative4[i].velocity).add(derivative3[i].velocity.multiply(2))).multiply(h6));
        bodies[i].velocity.addSelf((derivative1[i].velocity.addSelf(derivative4[i].velocity).addSelf(derivative3[i].velocity.multiplySelf(2))).multiplySelf(h6));
        energy += .5 * bodies[i].mass * bodies[i].velocity.dotSelf();
        var radius = bodies[i].radius / scale;
        if (radius < 2) {
            radius = 2;
        }
        //var position = bodies[i].position.add([rectDimensions[0], rectDimensions[1]]);
        bodies[i].position.addSelf(rectDimensions); //1
	if (isRotating) {
	    //position = position.subtract(global).rotate(angle).add(global);
            bodies[i].position.subtractSelf(globalOrigin).rotateSelf(locangle).addSelf(globalOrigin); //1a
	}
	//position = position.multiply(1/scale);
        bodies[i].position.multiplySelf(1/scale); //2
        //com = com.add(position.multiply(bodies[i].mass));
        globalCom.addSelf(bodies[i].position.multiplySelf(bodies[i].mass)); //3
        bodies[i].position.multiplySelf(1/bodies[i].mass); //3
        totalMass += bodies[i].mass;
        drawBody(bodies[i].position[0], bodies[i].position[1], radius, bodies[i].color, paper);
        //reverse previous actions
        bodies[i].position.multiplySelf(scale); //2
        if (isRotating) {
            bodies[i].position.subtractSelf(globalOrigin).rotateSelf(-locangle).addSelf(globalOrigin); //1a
        }
        bodies[i].position.subtractSelf(rectDimensions); //1
        if (alpha < 1) {
            drawLine(bodies[i].position[0], bodies[i].position[1], firstPosition[0], firstPosition[1], bodies[i].radius, bodies[i].color, paper);
        }
    }
    globalOrigin.subtractSelf(rectDimensions);
    //com = com.multiply(1/totalMass);
    globalCom.multiplySelf(1/totalMass);
    drawBody(globalCom[0], globalCom[1], 3, '#fff', paper);
    paper.strokeStyle = '#f77';
    paper.stroke();
    energy = '' + energy;
    var exponent = energy.split('e');
    energy = exponent[0];
    exponent = exponent[1];
    if (!exponent) {exponent = '+0';}
    energy = energy.slice(0, 15);
    document.getElementById('energy').innerHTML = 'E: ' + energy + 'e' + exponent;
    counts++;
    if (bodyCount != bodies.length) {
        bodyCount = bodies.length;
        document.getElementById('bodyCount').innerHTML = 'There are ' + bodyCount + ' bodies.';
    }
    if (!isPaused) {
        setTimeout(calculateOrbit, 16);
    }
}

function addBody(x, y, newMass, randomOrientation) {
    var newRadius = Math.pow((newMass) / 2.50596227828973444312e19, 1/2); // using average density of all planets of 3.1251e3 kg / m
    //newRadius /= 1e5; // 1px = 1e-5 m
    /*
    if (newRadius < 6000) {
	newRadius = 6000;
    }
    */
    var newPosition = [x, y];
    var velocity = 0;
    var bodiesLength = bodies.length;
    if (bodiesLength > 0) {
        // just using the most massive body (body exerting greatest force), instead of COM, for simplicity
        var mostMassiveBody = bodies[bodies.length - 1];
        var massiveIndex = 0;
        var delp = mostMassiveBody.position.subtract(newPosition);
        var massDistance = mostMassiveBody.mass / delp.dotSelf();
        for (var i = bodiesLength - 1; i--;) {
            var delp = bodies[i].position.subtract(newPosition);
            var newMassDistance = bodies[i].mass / delp.dotSelf();
            if (newMassDistance > massDistance) {
                mostMassiveBody = bodies[i];
                massiveIndex = i;
                massDistance = newMassDistance;
            }
        }
        // Get the unit vector from the new body to the most massive body (COM), rotate it 90 degrees (either left or right),
        // multiply the unit vector by the velocity (sqrt(GM / R)) to get the velocity vector, then add the velocity vector
        // from the most massive body to get an orbital velocity vector relative to COM
        velocity = mostMassiveBody.position.subtract(newPosition).toUnitVector().rotate(Math.PI / 2).multiply(Math.sqrt((gravConstant * mostMassiveBody.mass) / mostMassiveBody.position.distanceFrom(newPosition))).add(mostMassiveBody.velocity);
        /*
        var com = [0, 0];
        var vel = [0, 0];
        var totalMass = 0;
        for (var i = 0; i < bodiesLength; i++) {
            var mass = this.bodies[i].mass;
            vel = vel.add(this.bodies[i].velocity.multiply(mass));
            com = com.add(this.bodies[i].position.multiply(mass));
            totalMass += mass;
        }
        com = com.multiply(1/totalMass);
        vel = vel.multiply(1/totalMass);
        velocity = com.subtract(newPosition).toUnitVector().rotate(-Math.PI / 2).multiply(Math.sqrt((this.gravConstant * totalMass) / com.distanceFrom(newPosition))).add(vel);
        */
	randomOrientation = false;
    } else {
        velocity = [0,0];
    }
    if (typeof(randomOrientation) != 'undefined' && randomOrientation == true) {
        velocity = velocity.rotate(2*Math.PI*Math.random());
    }
    var color = 'rgb(' + (127 + randInt(127)) + ',' + (127 + randInt(127)) + ',' + (127 + randInt(127)) + ')';
    bodies[bodies.length] = {mass: newMass, velocity: velocity, radius: newRadius, position: newPosition, color:color};
    if (isPaused) {
        drawBody(x, y, newRadius, color, paper);
    }
}

function addRings(dist, center, interval, mass) {
    var deg = Math.PI / 180;
    var max = Math.floor(360/interval);
    for (var i = max; i--;) {
        var newdist = dist.rotate(deg * (interval*i)).add(center);
	addBody(newdist[0], newdist[1], mass);
    }
}

function loadBodies(id) {
    paper.fillStyle = 'rgb(0,0,0)';
    paper.fillRect(-rectDimensions[0], -rectDimensions[1], rectDimensions[2], rectDimensions[3]);
    angle = 0;
    //angularVelocity = 2 * Math.PI / 1245.40435371695954330138;
    angularVelocity = 0;
    //globalOrigin = [700000,300000];
    globalOrigin = [0, 0];
    counts = 0;
    globalFunc = function() {};
    switch (id) {
        case 0:
            // Solar System
            // Most planets/moons have radius 3000 so they can be seen
            // Moons have to be given retrograde orbits for stability
            // Moons that are interesting but unstable: Io, Titania
            bodies = [
                 {velocity: [0, 0], // Sun
                 position: [500000, 300000],
                 radius:6960,
                 mass:1.9889e30,
                 color:'#ff0'},

                 {velocity: [0, 5289.007336], // Mercury
                 position: [1079100, 300000],
                 radius: 3000,
                 mass: 3.3022e23,
                 color:'#ddd'},
                 
                 {velocity: [0, 3869.165024], // Venus
                 position: [1582100, 300000],
                 radius: 3000,
                 mass: 4.8685e24,
                 color:'#aac'},

                 {velocity: [0, 3290.6762], // Earth
                 position: [1996000, 300000],
                 radius: 3000,
                 mass: 5.9736e24,
                 color:'#99f'},

                 {velocity: [0, 3178.17145], // Moon
                 position: [1999844, 300000],
                 radius: 3000,
                 mass: 7.3477e22,
                 color:'#ddd'},

                 {velocity: [0, 2665.880512], // Mars
                 position: [2779400, 300000],
                 radius: 3000,
                 mass: 6.4185e23,
                 color:'#f99'},

                 {velocity: [0, 1442.473015], // Jupiter
                 position: [8285500, 300000],
                 radius: 3000,
                 mass: 1.896e27,
                 color:'#99f'},

                 {velocity: [0, -74.69873852], // Europa
                 position: [8292209, 300000],
                 radius: 3000,
                 mass: 4.8e22,
                 color:'#fff'},

                 {velocity: [0, 241.341411], // Ganymede
                 position: [8296204, 300000],
                 radius: 3000,
                 mass: 1.4819e23,
                 color:'#ddd'},

                 {velocity: [0, 536.868698], // Callisto
                 position: [8304430, 300000],
                 radius: 3000,
                 mass: 1.0759e23,
                 color:'#eee'},

/*
                 {velocity: [0, 1189.322762], // Radius of Jupiter's SOI
                 position: [14025961, 3000000],
                 radius: 3000,
                 mass: 1.53576e25,
                 color:'#fff'},

                 {velocity: [0, 1096.884782], // Radius of previous's SOI
                 position: [14040600, 3000000],
                 radius: 3000,
                 mass: 3.894e22,
                 color:'#fff'},
*/
                 {velocity: [0, 1063.083192], // Saturn
                 position: [14834000, 300000],
                 radius: 3000,
                 mass: 5.6846e26,
                 color:'#99f'},

                 {velocity: [0, 155.8494292], // Rhea
                 position: [14839271, 300000],
                 radius: 3000,
                 mass: 2.306e21,
                 color:'#ddd'},

                 {velocity: [0, 447.539578], // Titan
                 position: [14846220, 300000],
                 radius: 3000,
                 mass: 1.3452e23,
                 color:'#88f'},

/*
                 {velocity: [0, 924.848284], // Radius of Saturn's SOI
                 position: [20576300, 3000000],
                 radius: 3000,
                 mass: 4.3221e22
                 color:'#fff'},
*/
                 {velocity: [0, 750.4187296], // Uranus
                 position: [29267000, 300000],
                 radius: 3000,
                 mass: 8.6810e25,
                 color:'#9f9'},

                 {velocity: [0, 347.6683842], // Titania
                 position: [29271359, 300000],
                 radius: 3000,
                 mass: 3.527e21,
                 color:'#ddd'},

                 {velocity: [0, 402.4638492], // Oberon
                 position: [29272840, 300000],
                 radius: 3000,
                 mass: 3.014e21,
                 color:'#ddd'},

/*
                 {velocity: [0, 689.4155384], // Radius of Uranus's SOI
                 position: [34957000, 3000000],
                 radius: 3000,
                 mass: 1.0022e19
                 color:'#fff'},
*/
                 {velocity: [0, 599.7644084], // Neptune
                 position: [45534000, 300000],
                 radius: 3000,
                 mass: 1.0243e26,
                 color:'#bbf'},

                 {velocity: [0, 114.7803426], // Triton
                 position: [45537547, 300000],
                 radius: 3000,
                 mass:2.14e22,
                 color:'#eee'},

                 {velocity: [0, 476.7555188], // Nereid
                 position: [45589137, 300000],
                 radius: 3000,
                 mass: 3.1e19,
                 color:'#ddd'},

/*
                 {velocity: [0, 548.9496828], // Radius of Neptune's SOI
                 position: [51357100, 3000000],
                 radius: 3000,
                 mass: 8.29683e25,
                 color:'#fff'}
*/
             ];
             break;
        case 1:
            // two-body system
            angle = 0;
            angularVelocity = 2 * Math.PI / 1245.40435371695954330138;
            globalOrigin = [700000,300000];
            bodies = [{
                velocity: [0, 1009.01932588033218502780],
                position: [500000, 300000],
                radius: 10000,
                mass: 1e29,
                color: '#ff0'},
            {
                velocity: [0, -1009.01932588033218502780],
                position: [900000, 300000],
                radius: 10000,
                mass: 1e29,
                color: '#ff0'}, 
            ];
            break;
        case 21:
            // two-body system Sun-Jupiter
            angle = 0;
            angularVelocity = 2 * Math.PI / 139.56194206293700933434;
            globalOrigin = [500000,300000];
            bodies = [{
                velocity: [0, 8.5753931246],
                position: [499809.3418472522, 300000],
                radius: 10000,
                mass: 1.9889e30,
                color: '#ff0'},
            {
                velocity: [0, -8995.5692961461],
                position: [699809.341847252, 300000],
                radius: 5000,
                mass: 1.896e27,
                color: '#ff0'}, 
            {
                velocity: [0, 8879.6940],
                position: [294700.658152748, 300000],
                radius: 1,
                mass: 1e-30,
                color: '#ff0'}, 
                /*
            {
                //region of influence for jupiter-mass object
                velocity: [0, -7752.88506496842478129311],
                position: [709809.225, 300000],
                radius: 1,
                mass: 1e-30,
                color: '#00f'}, 
                */
                /*
            {
                velocity: [0, 9115.46636979720637338004],
                position: [304664, 300000],
                radius: 1,
                mass: 1e-30,
                color: '#f00'}, 
                */
/*
            {
                velocity: [0, 8995.57747099656173765584],
                //position: [281726, 300000],
                position: [299809.225, 300000],
                //position: [294809.225, 300000],
                //velocity: [0, 9995.57747099656173765584],
                //position: [319809.225, 300000],
                radius: 1,
                mass: 1e-30,
                color: '#f00'}, 
*/
/*
            {
                //velocity: [0, 9995.57747099656173765584],
                velocity: [0, 10195.57747099656173765584],
                position: [319809.225, 300000],
                radius: 1,
                mass: 1e-30,
                color: '#ff0'}, 
*/
            ];
            break;
        case 2:
            // A four-body system with all bodies orbiting the common center of mass, not stable
            angle = 0;
            angularVelocity = 2 * Math.PI / 1169.38970105645338634783;
            globalOrigin = [600000,300000];
            bodies = [{
                //velocity: [0, 1922.34193589967716713965],
                velocity: [0, 1611.913967132568359375],
                position: [300000, 300000],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'},
            {
                //velocity: [0, -1922.34193589967716713965],
                velocity: [0, -1611.913967132568359375],
                position: [900000, 300000],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'},
            {
                //velocity: [1922.34193589967716713965, 0],
                velocity: [1611.913967132568359375, 0],
                position: [600000, 600000],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'},
            {
                //velocity: [-1922.34193589967716713965, 0],
                velocity: [-1611.913967132568359375, 0],
                position: [600000, 0],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'}, ];
            break;
        case 3:
            // Gliese 876 System
            // Gliese 876d is unstable, system exhibits large movement from massive planets close to star
            bodies = [
                 {velocity: [0, 0], //Gliese 876
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:6.642926e29,
                 color:'#ff0'},

                 {velocity: [0, 5234.45442451708230028402], //Gliese 876b
                 position: [6197472, 3000000],
                 radius: 3000,
                 mass:1.57368e27,
                 color:'#f0f'},

                 {velocity: [0, 4140.16034], // Gliese 876c
                 position: [6315656, 3000000],
                 radius: 3000,
                 mass:5.0054e27,
                 color:'#0ff'}
             ];
             break;
        case 4:
            // 55 Cancri System
            // 55 Cancri A e is unstable, 55 Cancri B may or may not be gravitationally bound to 55 Cancri A in this simulation
            bodies = [
                 {velocity: [0, 0], // 55 Cancri A
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:1.8895e30,
                 color: '#ff0'},

                 {velocity: [0, 9458.08492], // 55 Cancri Ab
                 position: [6172040, 3000000],
                 radius:3000,
                 mass:1.5623e27,
                 color: '#f0f'},

                 {velocity: [0, 6547.062824], // 55 Cancri Ac
                 position: [6359040, 3000000],
                 radius:3000,
                 mass:3.2042e26,
                 color: '#0ff'},

                 {velocity: [0, 3629.3312848], // 55 Cancri Af
                 position: [7168376, 3000000],
                 radius:3000,
                 mass:2.7302e26,
                 color: '#ff0'},

                 {velocity: [0, 1335.25503], // 55 Cancri Ad
                 position: [14631920, 3000000],
                 radius:3000,
                 mass:7.2712e27,
                 color: '#f0f'},

                 {velocity: [0, 98.2827558], 
                 position: [1599240000, 3000000], // 55 Cancri B
                 radius:3000,
                 mass:2.58557e29,
                 color: '#ff0'}
             ];
             break;
        case 5:
            // 51 Pegasi System
            // Only included because it was the first extrasolar planetary system discovered
            // The planet spirals into the star
            bodies = [
                 {velocity: [0, 0], // 51 Pegasi
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:2.1082e30,
                 color: '#ff0'},

                 {velocity: [0, 14758.078936], // 51 Pegasi a
                 position: [6078839, 3000000],
                 radius:3000,
                 mass:8.9491e26,
                 color: '#f00'}
             ];
             break;
        case 6:
            // 47 Ursae Majoris System
            bodies = [
                 {velocity: [0, 0], // 47 Ursae Majoris
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:2.148e30,
                 color: '#ff0'},

                 {velocity: [0, 2359.8596376], // 47 Ursae Majoris b
                 position: [9141600, 3000000],
                 radius:3000,
                 mass:4.79688e27,
                 color: '#f0f'},

                 {velocity: [0, 1802.37257], // 47 Ursae Majoris c
                 position: [11385600, 3000000],
                 radius:3000,
                 mass:1.02384e27,
                 color: '#0ff'},

                 {velocity: [0, 1004.0765516], // 47 Ursae Majoris d
                 position: [23353600, 3000000],
                 radius:3000,
                 mass:3.10944e27,
                 color: '#f00'}
             ];
             break;
        case 7:
            // Upsilon Andromidae System
            // Upsilon Andromidae b is unstable
            bodies = [
                 {velocity: [0, 0], // Upsilon Andromidae
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:2.5468e30,
                 color: '#ff0'},

                 {velocity: [0, 4082.38952], // Upsilon Andromidae c
                 position: [7244672, 3000000],
                 radius:3000,
                 mass:3.6453e27,
                 color: '#f0f'},

                 {velocity: [0, 2341.07776], // Upsilon Andromidae d
                 position: [9784880, 3000000],
                 radius:3000,
                 mass:7.8412e27,
                 color: '#0ff'}
             ];
             break;
        case 8:
            bodies = [
// A "static" pyramid as defined by the following bodies will eventually acquire angular momentum
// showing how errors in the integrator can build up to allow non-physical behavior
// Eventually the angular momentum will increase to the point that outer bodies will be flung out
// Pyramid constructed by setting a bottom row of bodies aligned on the x-axis,
// rotating a radius vector [0, r] for bodies of radius r by -Math.PI / 6, multiplying 2,
// then adding the new vector to the position vector of a body, stacking bodies as appropriate
                 {velocity: [0, 0],
                 position: [200000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [254000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [4555000, 0],
                 position: [-9000000000, 450000],
                 radius:506400000,
                 mass:9.6e38,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [308000, 393530.7436087194],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [254000, 393530.7436087194],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [362000, 393530.7436087194],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [416000, 393530.7436087194],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [227000, 346765.3718043597],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [281000, 346765.3718043597],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [335000, 440296.1154130791],
                 radius:27000,
                 mass:3e28,
                 color: '#0ff'},

                 {velocity: [0, 0],
                 position: [389000, 440296.1154130791],
                 radius:27000,
                 mass:3e28,
                 color: '#0ff'},

                 {velocity: [0, 0],
                 position: [281000, 440296.1154130791],
                 radius:27000,
                 mass:3e28,
                 color: '#0ff'},

                 {velocity: [0, 0],
                 position: [308000, 487061.4872174388],
                 radius:27000,
                 mass:3e28,
                 color: '#0ff'},

                 {velocity: [0, 0],
                 position: [362000, 487061.4872174388],
                 radius:27000,
                 mass:3e28,
                 color: '#0ff'},

                 {velocity: [0, 0],
                 position: [335000, 533826.8590217985],
                 radius:27000,
                 mass:3e28,
                 color: '#0ff'},

                 {velocity: [0, 0],
                 position: [335000, 346765.3718043597],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [389000, 346765.3718043597],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [443000, 346765.3718043597],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [308000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [362000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [416000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [470000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},
            ];
            break;
        case 10:
            bodies = [
                 {velocity: [0, 0],
                 position: [0, 300000], // try at 11
                 radius:80000,
                 mass:1e28,
                 color: '#f0f'},

                 {velocity: [-10000, 0],
                 position: [800000, 300000], // try at 11
                 radius:50000,
                 mass:5e20,
                 color: '#ff0'},

                 {velocity: [-10000, 0],
                 position: [890000, 300000], // try at 11
                 radius:40000,
                 mass:4e20,
                 color: '#ff0'},

                 {velocity: [-10000, 0],
                 position: [960000, 300000], // try at 11
                 radius:30000,
                 mass:3e20,
                 color: '#ff0'},

                 {velocity: [-10000, 0],
                 position: [1010000, 300000], // try at 11
                 radius:20000,
                 mass:2e20,
                 color: '#ff0'},

                 {velocity: [-10000, 0],
                 position: [1040000, 300000], // try at 11
                 radius:10000,
                 mass:1e20,
                 color: '#ff0'},
            ];
            break;
        case 11:
            bodies = [
                 {velocity: [0, 0],
                 position: [100000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},
                 /*

                 {velocity: [0, 0],
                 position: [154000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},


                 {velocity: [0, 0],
                 position: [208000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},
                 */

                 {velocity: [0, 0],
                 position: [1000000, 300000], // try at 11
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},
            ];
            break;
        case 9:
            //kepler 16 system
            angle = 0;
            console.log("setting angular velocity");
            angularVelocity = 2 * Math.PI / -335.20038425056584893598;
            globalFunc = function() {
                var v = bodies[0].velocity;
                var p = bodies[0].position.subtract(globalOrigin);
                var velocity = Math.sqrt(v.dotSelf());
                var dist = Math.sqrt(p.dotSelf())
                angularVelocity = -velocity / dist;
            };
            globalOrigin = [500000,300000];
            //NOTE: sqrt(GM[other]/2R) will get you a circular orbit around the common COM, but the COM will have some linear motion. Will have to compensate by
            //      subtracting the velocity of the COM from the two bodies
            //      The third body shouldn't need adjusting since it's orbital velocity was calculated in reference to the COM, which should then be stationary.
             bodies = [
                {velocity: [0, -1427.52795303998368297237],
                position: [423913.45703234486238017826, 300000],
                radius: 6000,
                mass: 1.37174433e30,
                color: '#ff0'},

                {velocity: [0, 4862.24823832120908357513],
                position: [759465.45703234486238017826, 300000],
                radius: 2000,
                mass: 4.02255025e29,
                color: '#ff0'},

                {velocity: [0, 3701.88107120123905059218],
                position: [1554380, 300000],
                radius: 500,
                mass: 6.3199999999999368e26,
                color: '#fff'}
            ];
        break;





        case 12:
        default:
            bodies = [];
            break;
    }
    for (var i = bodies.length; i--;) {
        drawBody(bodies[i].position[0], bodies[i].position[1], bodies[i].radius, bodies[i].color, paper);
    }
}

window.onload = function() {
    /*
    var energyText = document.createElementNS(svgns, 'text');
    energyText.setAttribute('x', 0);
    energyText.setAttribute('y', 100000);
    energyText.setAttribute('fill', 'white');
    energyText.setAttribute('font-size', '100000px'); // textContent
    energyText.setAttribute('font-family', 'Verdana');
    energyText.appendChild(document.createTextNode('U: 0'));
    paper.appendChild(energyText);
    */
    isBounce = true;
    isPaused = false;
    antiFlicker = false;
    isRotating = false;
    bodyCount = 0;
    alpha = 1;
    counts = 0;
    angle = 0;
    //angularVelocity = 2 * Math.PI / 1245.40435371695954330138;
    angularVelocity = 0;
    //globalOrigin = [700000,300000];
    globalOrigin = [0, 0];
    var canvas = document.getElementById('canvas');
    windowWidth = getWidth();
    windowHeight = getHeight();
    canvas.width = windowWidth;
    canvas.height = windowHeight;
    var transition = document.getElementById('transition');
    transition.width = windowWidth;
    transition.height = windowHeight;
    paper = canvas.getContext('2d');
    rectDimensions = [0, 0, windowWidth * 1000, windowHeight * 1000];
    resetCanvas(rectDimensions, true);
    document.getElementById('canvas').onclick = addBodyClick;
    document.getElementById('geturl').onclick = getUrl;
    document.getElementById('choosebody').onchange = changeBody;
    document.onkeypress = pageEvents;
    document.onkeydown = handleArrowEvents;
    var canvas = document.getElementById('canvas');
    if (canvas.addEventListener) {
        canvas.addEventListener('DOMMouseScroll', handleScroll, false);
        canvas.addEventListener('mousewheel', handleScroll, false);
    } else if (canvas.attachEvent) {
        canvas.attachEvent('onmousewheel', handleScroll); 
    }
    window.onresize = resizeWindow;
    if (!!window.location.hash) {
        var bodiestring = window.location.hash.substring(1);
        bodies = JSON.parse(bodiestring)
    } else {
        loadBodies(1);
    }
    calculateOrbit();
};
