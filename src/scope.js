(function() {

function Scope() {
  this._watchers = []
  this._children = []
  this._queue = []
}
var UNCHANGED = function() {}
Scope.find = function(el) {
  do {
    if(el.scope) return el.scope
  } while(el = el.parentNode)
}
Scope.prototype = {
  $child: function() {
    var child = Object.create(this)
    Scope.call(child)
    child.parent = this
    this._children.push(child)
    return child
  },
  $watch: function(watch,handler) {
    var setup = {$watch:watch,handler:handler,previous:UNCHANGED};
    this._watchers.push(setup)
  },
  $digest: function() {
    this._watchers.forEach(this._digestOne,this)
    this._children.forEach(function(c) { c.$digest() })
  },
  _digestOne: function(setup) {
    var val = this.$eval(setup.$watch)
    if(this._equal(val,setup.previous)) return
    setup.previous = val;
    setup.handler(val,setup.previous === UNCHANGED ? undefined : setup.previous)
  },
  _equal: function(a,b) {
    return a === b
  },
  _findRoot: function() {
    var scope = this
    while(scope.parent) {
      scope = scope.parent
    }
    return scope
  },
  $apply: (function() {
    var queued = false;
    return function(fn) {
      fn()
      if(queued) return
      queued = true
      setTimeout(function() {
        queued = false
        this._apply()
      }.bind(this))
    }
  }),
  _apply: function() {
    this._findRoot().$digest()
  },
  $eval: function(src) {
    var fn = new Function("scope","s",src)
    return fn(this,this)
  },
}

Cute.Scope = Scope

})()
