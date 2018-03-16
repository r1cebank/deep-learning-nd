// // circuit with single gate for now
const forwardMultiplyGate = function(x, y) { return x * y; };
// let x = -2, y = 3; // some input values

// // try changing x,y randomly small amounts and keep track of what works best
// const tweak_amount = 0.01;
// let best_out = -Infinity;
// let best_x = x, best_y = y;
// for(var k = 0; k < 10000; k++) {
//   const x_try = x + tweak_amount * (Math.random() * 2 - 1); // tweak x a bit
//   const y_try = y + tweak_amount * (Math.random() * 2 - 1); // tweak y a bit
//   const out = forwardMultiplyGate(x_try, y_try);
//   if(out > best_out) {
//     // best improvement yet! Keep track of the x and y
//     best_out = out;
//     best_x = x_try, best_y = y_try;
//   }
// }

// console.log(best_x, best_y, best_out);

// derivative
var x = -2, y = 3;
var out = forwardMultiplyGate(x, y); // -6
var h = 0.0001;

// compute derivative with respect to x
var xph = x + h; // -1.9999
var out2 = forwardMultiplyGate(xph, y); // -5.9997
var x_derivative = (out2 - out) / h; // 3.0

// compute derivative with respect to y
var yph = y + h; // 3.0001
var out3 = forwardMultiplyGate(x, yph); // -6.0002
var y_derivative = (out3 - out) / h; // -2.0

var step_size = 0.01;
var out = forwardMultiplyGate(x, y); // before: -6
x = x + step_size * x_derivative; // x becomes -1.97
y = y + step_size * y_derivative; // y becomes 2.98
var out_new = forwardMultiplyGate(x, y); // -5.87! exciting.

console.log(out_new);

var forwardAddGate = function(a, b) { 
    return a + b;
};
var forwardCircuit = function(x,y,z) {
    var q = forwardAddGate(x, y);
    var f = forwardMultiplyGate(q, z);
    return f;
};

// initial conditions
x = -2, y = 5, z = -4;

// numerical gradient check
var h = 0.0001;
var x_derivative = (forwardCircuit(x+h,y,z) - forwardCircuit(x,y,z)) / h; // -4
var y_derivative = (forwardCircuit(x,y+h,z) - forwardCircuit(x,y,z)) / h; // -4
var z_derivative = (forwardCircuit(x,y,z+h) - forwardCircuit(x,y,z)) / h; // 3

console.log(x_derivative, y_derivative, z_derivative);

// every Unit corresponds to a wire in the diagrams
var Unit = function(value, grad) {
    // value computed in the forward pass
    this.value = value; 
    // the derivative of circuit output w.r.t this unit, computed in backward pass
    this.grad = grad; 
  }

var multiplyGate = function(){ };
multiplyGate.prototype = {
  forward: function(u0, u1) {
    // store pointers to input Units u0 and u1 and output unit utop
    this.u0 = u0; 
    this.u1 = u1; 
    this.utop = new Unit(u0.value * u1.value, 0.0);
    return this.utop;
  },
  backward: function() {
    // take the gradient in output unit and chain it with the
    // local gradients, which we derived for multiply gate before
    // then write those gradients to those Units.
    this.u0.grad += this.u1.value * this.utop.grad;
    this.u1.grad += this.u0.value * this.utop.grad;
  }
}
var addGate = function(){ };
addGate.prototype = {
  forward: function(u0, u1) {
    this.u0 = u0; 
    this.u1 = u1; // store pointers to input units
    this.utop = new Unit(u0.value + u1.value, 0.0);
    return this.utop;
  },
  backward: function() {
    // add gate. derivative wrt both inputs is 1
    this.u0.grad += 1 * this.utop.grad;
    this.u1.grad += 1 * this.utop.grad;
  }
}
var sigmoidGate = function() { 
    // helper function
    this.sig = function(x) { return 1 / (1 + Math.exp(-x)); };
  };
  sigmoidGate.prototype = {
    forward: function(u0) {
      this.u0 = u0;
      this.utop = new Unit(this.sig(this.u0.value), 0.0);
      return this.utop;
    },
    backward: function() {
      var s = this.sig(this.u0.value);
      this.u0.grad += (s * (1 - s)) * this.utop.grad;
    }
  }

  // create input units
var a = new Unit(1.0, 0.0);
var b = new Unit(2.0, 0.0);
var c = new Unit(-3.0, 0.0);
var x = new Unit(-1.0, 0.0);
var y = new Unit(3.0, 0.0);

// create the gates
var mulg0 = new multiplyGate();
var mulg1 = new multiplyGate();
var addg0 = new addGate();
var addg1 = new addGate();
var sg0 = new sigmoidGate();

// do the forward pass
var forwardNeuron = function() {
  ax = mulg0.forward(a, x); // a*x = -1
  by = mulg1.forward(b, y); // b*y = 6
  axpby = addg0.forward(ax, by); // a*x + b*y = 5
  axpbypc = addg1.forward(axpby, c); // a*x + b*y + c = 2
  s = sg0.forward(axpbypc); // sig(a*x + b*y + c) = 0.8808
};
forwardNeuron();

console.log('circuit output: ' + s.value); // prints 0.8808

s.grad = 1.0;
sg0.backward(); // writes gradient into axpbypc
addg1.backward(); // writes gradients into axpby and c
addg0.backward(); // writes gradients into ax and by
mulg1.backward(); // writes gradients into b and y
mulg0.backward(); // writes gradients into a and x

var step_size = 0.01;
a.value += step_size * a.grad; // a.grad is -0.105
b.value += step_size * b.grad; // b.grad is 0.315
c.value += step_size * c.grad; // c.grad is 0.105
x.value += step_size * x.grad; // x.grad is 0.105
y.value += step_size * y.grad; // y.grad is 0.210

forwardNeuron();
console.log('circuit output after one backprop: ' + s.value); // prints 0.8825
