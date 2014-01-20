(function() {

function Components() {
  this.library = []
}
Components.prototype = {
  register: function(sel,fn) {
    var setup = typeof fn === "function" ? {link: fn} : fn
    setup.selector = sel.toUpperCase()
    setup.priorty = setup.priorty || 0
    if(setup.stopCompilation && setup.priority == null) throw new Error("Need priorty to stop compilation")
    this.library.push(setup)
  }
}

var flatmap = _.compose(_.flatten,_.map)
var byPriority = function(a,b) {
  return b.priority - a.priority
}

function Compiler(components,controllers) {
  this.components = components
  this.controllers = controllers
}

Compiler.compile = function(nodes,components,maxPriorty,transcludeFn) {
  var components = components.slice().filter(function(c) { return c.priority || 0 < maxPriorty })

  var nodeLinkFns = _.map(nodes,function(node) {
    return Compiler.compileNode(node,components)
  })

  return compositeLinkFn
  
  function compositeLinkFn(scope) {
  } 
}
/* metadoc:
 * compile needs:
 * - to stop compiling when certain nodes modify DOM before other stuff is applied (repeating etc)
 * - have a way not to double compile in those cases
 * -- e.g ng repeat wants a node with just lower priority directives left
 * - compile/link switch is for 
 * -- performance: we do stuff once for all directives (prob feature sniff)
 * -- transclusion: we need an original linking fn to reapply directives to fresh el
 *
 * - priority 1000 - limited to ngCsp (which sits at root), ngRepeat, and ngIf - ngIf + ngRepeat both transclude so can't be on same ele
 *
 * ngRepeat
 * - makes linkFn for itself, stopping comp there
 * - its transclude fn is element itself, all directive prior < 1000
 * - it uses transclude fn to link new copies of self
 * - it recurses with maxPriority to create the linker for transcludeFn
 *
 * */
Compiler.compileNode = function(node,components,transcludeFn) {

  var hasStop = components.filter(_.partial(has,"stopCompilation"))
  assertComponents(hasStop.length === 0,"duplicate stopCompilation components",hasStop)
  var stopPriority = hasStop[0].priority

  var matched = components.filter(function(component) {
    return component.priority >= stopPriority && matchComponent(node,component)
  })

  var links = matched.map(function(component) {
    return applyComponent(node,component,components,transcludeFn) 
  })

  return nodeLinkFn

  function nodeLinkFn(scope) {
    links.forEach(function(linkFn) {
      linkFn(scope)
    })
  } 
}
function assertComponents(t,msg,components) {
  if(t) return
  var names = components.map(_.getter("selector"))
  throw new Error(msg + " caused by components:" + names.join(", "))
}
function assert(t,msg) {
  if(!t) throw new Error(msg)
}
function has(k,o) {
  return k in o
}
function matchComponent(node,component) {
  return component.matchElement && component.selector === node.tagName ||
    node.hasAttribute(component.selector)
}
function applyComponent(node,component,components,transcludeFn) {
  var linkFn = false
  var childrenLinkFn = false

  if(node.transclude) {
    var clone = node.cloneNode(true)
    if(node.transclude == "element") {
      childrenLinkFn = Compiler.compileNode([clone],components,node.priority)
    } else {
      childrenLinkFn = Compiler.compileNode(node.children,components)
    }
  }

  if(node.compile) {
    linkFn = node.compile(node,childrenLinkFn || transcludeFn)
  } else {
    linkFn = component.link

  }

  return {
    link: linkFn
  }
}
Compiler.prototype = {
  document: document,
  run: function(el) {


  }
}


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
    this._enqueue(setup)
  },
  _enqueue: function(watcher) {
    this._queue.push(watcher)
    if(this._queuePrimed) return
    this._queuePrimed = setTimeout(this._runQueue.bind(this))
  },
  _runQueue: function() {
    var queue = this._queue.slice()
    this._queue = []
    queue.forEach(this._digestOne,this)
    this._queuePrimed = false
  },
  $digest: function() {
    this._runQueue()
    this._watchers.forEach(this._digestOne,this)
    this._children.forEach(function(c) { c.$digest() })
  },
  _digestOne: function(setup) {
    var val = this.$eval(setup.$watch)
    console.log(val)
    if(this._equal(val,setup.previous === UNCHANGED ? undefined : setup.previous)) return
    setup.previous = val;
    setup.handler(val)
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

function Cute() {
}
Cute.Scope = Scope
Cute.Compiler = Compiler
Cute.registerComponents = function(components,controllers) {
  components.register("te-controller",function(el,scope,source) {
    var name = el.getAttribute("te-controller")
    var controller = source.controllers[name]
    if(!controller) throw new Error("Missing controller " + name)
    var child = scope.$child()
    el.scope = child
    new controller(el,child)
  })
  components.register("a",{
    matchElement: true,
    link: function(el,scope) {
      el.addEventListener("click",function(evt) {
        if(el.getAttribute("href") === "") evt.preventDefault()
      })
    }
  })
  components.register("te-init",function(el,scope) {
    var src = el.getAttribute("te-init")
    scope.$apply(function() {
      scope.$eval(src)
    })
  })
  components.register("te-click",function(el,scope) {
    var expression = el.getAttribute("te-click")
    el.addEventListener("click",function() {
      scope.$apply(function() {
        scope.$eval(expression)
      })
    })
  })
  components.register("te-bind",function(el,scope) {
    var expression = el.getAttribute("te-bind")
    scope.$watch(expression,function(val) {
      el.innerHTML = val
    })
  })
  components.register("te-submit",function(el,scope) {
    var expression = el.getAttribute("te-click")
    el.addEventListener("submit",function(event) {
      event.preventDefault()
      scope.$apply(function() {
        scope.$eval(expression)
      })
    })
  })
  components.register("te-transclude",{
    stopCompilation: true,
    priority: 1000,
    transclude: "element",
    compile: function(el,transcludeFn) {
      return function(el,scope) {

      }
    }
  })
  components.register("te-repeat",{
    compile: function(el,transcludeFn) {
      return function(el,scope) {
        transcludeFn(function(els) {
          $(el).append(els)
        })
      }
    }
  })
}

window.Cute = Cute

})()
