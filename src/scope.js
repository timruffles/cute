;(function() {

/* A `$watch`able object. Place properties you wish to observe
   on properties of the scope, and `$watch` or `$eval` expressions
   against it. */
function Scope(attrs) {
  this._watchers = []
  this._children = []
  this._queue = []
  this._cleanup = []
  this._tree = {root: this}
  if(attrs) _.extend(this,attrs)
}
Scope.MAX_ITERATIONS_EXCEEDED = "Max iterations exceeded"
var UNCHANGED = function() {}
/* Find the nearest scope - start on this element, upwards */
Scope.find = function(el) {
  do {
    if(el.scope) return el.scope
  } while(el = el.parentNode)
}
/* `$destroy` all scopes in the passed DOM tree */
Scope.cleanDomStructure = function(node) {
  node.scope.$destroy()
  node.scope = null
  _.each(node.children,Scope.cleanDomStructure)
}
Scope.prototype = {
  /* Create a child scope that prototypally inherits from this scope */
  $child: function(attrs) {
    var child = Object.create(this)
    Scope.call(child,attrs)
    child.parent = this
    child._tree = this._tree
    this._children.push(child)
    return child
  },
  /* Stops this and all child scopes from firing watchers - normally prefer `Scope.cleanDomStructure` */
  $destroy: function() {
    this._children.forEach(function(c) { return c.$destroy() })
    this._children = []

    this.parent._removeChild(this)

    this._watchers = []

    this._cleanup.forEach(function(c) { return c() })
    this._cleanup = []
  },
  _removeChild: function(child) {
    this._children.splice(this._children.indexOf(child),1)
  },
  /* Watch the value of a function or string evaluated against this scope. The supplied
     handler will be fired during a `$digest` if the value has changed.
    
     Collections can only be watched shallowly. If you have objects you don't wish to be
     compared by identity, give them - or their prototype - an `.isEqual` function which'll
     be used by `$watch`'s equality algorithm. */
  $watch: function(watch,handler) {
    var setup = {$watch:this.$compile(watch),handler:handler,previous:UNCHANGED}
    this._watchers.push(setup)

    return function() {
      this._watchers.splice(this._watchers.indexOf(setup),1)
    }.bind(this)
  },
  /* Start watching another scope, and ensure the watch will be cleaned up when this scope is `$destroy`'d */
  $watchOther: function(otherScope,watch,handler) {
    this.$dependency(otherScope.$watch(watch,handler))
  },
  /* Registers a cleanup function */
  $dependency: function(fn) {
    this._cleanup.push(fn)
  },
  /* Fires watchers on this scope and its children, recursively. Will continue
     to fire until all watchers have settled: their values have stopped changing. */
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
    setup.previous = this._shallowClone(val)
    setup.handler(val,previous === UNCHANGED ? undefined : previous)

    return true
  },
  _shallowClone: function(x) {
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
  /* Returns a function that can be evaluated against a scope - faster than
     repeatedly evaluating strings */
  $compile: function(src) {
    return typeof src === "function" ? src : new Function("scope","s",addImplicitReturn(src))
  },
  /* Evaluates a function or expression against the scope. Scope will be
     available as local variables `scope` or `s` */
  $eval: function(src) {
    return this.$compile(src)(this,this)
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
