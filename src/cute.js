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

Cute.quickboot = function(opts) {
  opts = opts || {}
  Cute.registerComponents(opts.components || [],opts.controllers || {},opts.getTemplate)
  var rootAttach = Cute.compile(opts.el || document.body,components)
  var rootScope = new Cute.Scope
  rootAttach(rootScope)
  rootScope.$apply()
  return rootScope
}

Cute._dbg = {}

window.Cute = Cute

})()
