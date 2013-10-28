

function Components() {
  this.library = {}
}
Components.prototype = {
  register: function(sel,fn) {
    this.library[sel] = fn
  }
}


function Compiler(components,controllers,root) {
  this.components = components
  this.controllers = controllers
  this.root = root
}
Compiler.prototype = {
  Scope: Scope,
  _: _,
  run: function(el) {
    this._.each(this.components.library,function(component,sel) {
      this._.each(el.querySelectorAll(sel),function(componentEl) {
        var scope = Scope.find(componentEl) || this.root
        component(componentEl,scope,this)
      },this)
    },this)
  },
}


function Scope() {
  this._watchers = []
  this._notChanged = function() {}
  this._children = []
}
Scope.find = function(el) {
  do {
    if(el.scope) return el.scope
  } while(el = el.parentNode)
}
Scope.prototype = {
  child: function() {
    var child = Object.create(this)
    Scope.call(child)
    child.parent = this
    this._children.push(child)
    return child
  },
  watch: function(watch,handler) {
    var setup = {watch:watch,handler:handler,previous:this.notChanged};
    this._watchers.push(setup)
    this.digestOne(setup)
  },
  digest: function() {
    this._watchers.forEach(this.digestOne,this)
    this._children.forEach(function(c) { c.digest() })
  },
  digestOne: function(setup) {
    var val = this.eval(setup.watch)
    if(this.equal(val,setup.previous)) return
    setup.previous = val;
    setup.handler(val)
  },
  equal: function(a,b) {
    return false
  },
  findRoot: function() {
    var scope = this
    while(scope.parent) {
      scope = scope.parent
    }
    return scope
  },
  apply: function(fn) {
    fn()
    this.findRoot().digest()
  },
  eval: function(src) {
    var fn = new Function("scope","s",src)
    return fn(this,this)
  },
}

function Cute() {
}
Cute.registerComponents = function(components,controllers) {
  components.register("[te-controller]",function(el,scope,source) {
    var name = el.getAttribute("te-controller")
    var controller = source.controllers[name]
    if(!controller) throw new Error("Missing controller " + name)
    var child = scope.child()
    el.scope = child
    new controller(el,child)
  })
  components.register("a",function(el,scope) {
    el.addEventListener("click",function(evt) {
      if(el.getAttribute("href") === "") evt.preventDefault()
    })
  })
  components.register("[te-init]",function(el,scope) {
    var src = el.getAttribute("te-init")
    scope.apply(function() {
      scope.eval(src)
    })
  })
  components.register("[te-click]",function(el,scope) {
    var expression = el.getAttribute("te-click")
    el.addEventListener("click",function() {
      scope.apply(function() {
        scope.eval(expression)
      })
    })
  })
  components.register("[te-bind]",function(el,scope) {
    var expression = el.getAttribute("te-bind")
    scope.watch(expression,function(val) {
      el.innerHTML = val
    })
  })
}


// user space
function main() {
  var components = new Components()
  var controllers = {
    alerty: function(el,scope) {
      scope.sayHi = function() {
        alert("hi from a controller")
      }
    }
  }
  Cute.registerComponents(components)
  var root = new Scope
  var compiler = new Compiler(components,controllers,root)
  compiler.run(document.body)
}

main()

