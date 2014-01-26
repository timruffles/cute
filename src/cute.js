;(function() {

function Cute() {
}

Cute.isObject = function(x) {
  return x && (typeof x === "function" || typeof x === "object")
}

Cute.slice = slice

function slice(xs,n,m) {
  return [].slice.call(xs,n,m)
}

Cute.partial = function(fn) {
  var args = slice(arguments,1)
  return function() {
    return fn.apply(null,args.concat(slice(arguments)))
  }
}

Cute._dbg = {}

window.Cute = Cute

})()
