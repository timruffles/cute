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
    setup.handler(val,setup.previous === UNCHANGED ? undefined : setup.previous)
    // shallow clone
    setup.previous = this._clone(val);
  },
  _clone: function(x) {
    if(typeof x != "object") return x
    return _.clone(x)
  },
  // customised version of underscore's isEqual
  _equal: function(a,b,noRecurse) {
    // ===, with case for fix 0 != -0
    if (a === b) return a !== 0 || 1 / a == 1 / b
    var className = toString.call(a)
    if (className != toString.call(b)) return false
    switch (className) {
      // Strings, numbers, dates, and booles are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b)
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b)
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase
    }
    if(typeof a != 'object' || typeof b != 'object') return false
    // if we're here, we've got two objects that aren't === and we're starting a deep compare, so bail
    if(noRecurse) return false
    // limited to shallow equality comparison
    if(_.size(a) !== _.size(b)) return false
    return _.every(a,function(v,k) {
      return this._equal(b[k],v)
    },this)
  },
  _findRoot: function() {
    var scope = this
    while(scope.parent) {
      scope = scope.parent
    }
    return scope
  },
  $apply: (function() {
    var queued = false
    return function(fn) {
      if(queued) throw new Error("$digest loop already running")
      if(fn) fn()
      if(queued) return
      queued = true
      setTimeout(function() {
        queued = false
        this._apply()
      }.bind(this))
    }
  })(),
  _apply: function() {
    this._findRoot().$digest()
  },
  $eval: function(src) {
    var fn = typeof src === "function" ? fn : new Function("scope","s",src)
    return fn(this,this)
  },
}

Cute.Scope = Scope

})()
