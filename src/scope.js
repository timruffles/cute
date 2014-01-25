;(function() {

function Scope(attrs) {
  this._watchers = []
  this._children = []
  this._queue = []
  this._tree = {root: this}
  if(attrs) _.extend(this,attrs)
}
Scope.MAX_ITERATIONS_EXCEEDED = "Max iterations exceeded"
var UNCHANGED = function() {}
Scope.find = function(el) {
  do {
    if(el.scope) return el.scope
  } while(el = el.parentNode)
}
Scope.prototype = {
  $child: function(attrs) {
    var child = Object.create(this)
    Scope.call(child,attrs)
    child.parent = this
    child._tree = this._tree
    this._children.push(child)
    return child
  },
  $destroy: function() {
  },
  $watch: function(watch,handler) {
    var setup = {$watch:watch,handler:handler,previous:UNCHANGED};
    this._watchers.push(setup)
  },
  $digest: function() {
    var changed = false
    var iterations = 20
    do {
      if(!iterations) throw new Error(Scope.MAX_ITERATIONS_EXCEEDED)
      iterations -= 1
      var watcherChanged = this._watchers.reduce(function(anyChanged,watcher) {
        var watcherChanged = this._digestOne(watcher)
        return anyChanged || watcherChanged
      }.bind(this),false)
      var childrenChanged = this._children.reduce(function(anyChanged,child) {
        var childChanged = child.$digest()
        return anyChanged || childChanged
      },false)
      changed = watcherChanged || childrenChanged
    } while(changed)
  },
  _digestOne: function(setup) {
    var val = this.$eval(setup.$watch)
    if(val === setup.previous || this._equal(val,setup.previous)) return
    var previous = setup.previous
    setup.previous = val
    setup.handler(val,previous === UNCHANGED ? undefined : previous)
    // shallow clone
    setup.previous = this._clone(val)
    return true
  },
  _clone: function(x) {
    if(typeof x != "object") return x
    return _.clone(x)
  },
  // customised version of underscore's isEqual
  _equal: function equal(a,b,noRecurse) {
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
    if(a && b) {
      if(a.isEqual) return a.isEqual(b)
      if(b.isEqual) return b.isEqual(a)
    }
    // if we're here, we've got two objects that aren't === and we're starting a deep compare, so bail
    if(noRecurse) return false
    // limited to shallow equality comparison
    if(_.size(a) !== _.size(b)) return false
    return _.every(a,function(v,k) {
      return equal(b[k],v,true)
    },this)
  },
  _findRoot: function() {
    return this._tree.root
  },
  $apply: function(fn) {
    var val
    if(fn) val = this.$eval(fn)
    this._findRoot().$digest()
    return val
  },
  $eval: function(src) {
    var fn = typeof src === "function" ? src : new Function("scope","s",addImplicitReturn(src))
    return fn(this,this)
  },
}

function addImplicitReturn(expression) {
  if(/\breturn\b/.test(expression)) {
    return expression
  }
  return 'return (' + expression + ')'
}

Cute.Scope = Scope

})()
