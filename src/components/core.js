(function() {


Cute.registerComponents = function(components,controllers) {

  var add = _.partial(Cute.components.add,components)

  add("te-controller",function(el,scope,source) {
    var name = el.getAttribute("te-controller")
    var controller = source.controllers[name]
    if(!controller) throw new Error("Missing controller " + name)
    var child = scope.$child()
    el.scope = child
    new controller(el,child)
  })
  add("a",{
    matchElement: true,
    link: function(el,scope) {
      el.addEventListener("click",function(evt) {
        if(el.getAttribute("href") === "") evt.preventDefault()
      })
    }
  })
  add("te-init",function(el,scope) {
    var src = el.getAttribute("te-init")
    scope.$apply(function() {
      scope.$eval(src)
    })
  })
  add("te-click",function(el,scope) {
    var expression = el.getAttribute("te-click")
    el.addEventListener("click",function() {
      scope.$apply(function() {
        scope.$eval(expression)
      })
    })
  })
  add("te-bind",function(el,scope) {
    var expression = el.getAttribute("te-bind")
    scope.$watch(expression,function(val) {
      el.innerHTML = val
    })
  })
  add("te-submit",function(el,scope) {
    var expression = el.getAttribute("te-click")
    el.addEventListener("submit",function(event) {
      event.preventDefault()
      scope.$apply(function() {
        scope.$eval(expression)
      })
    })
  })
  add("te-transclude",{
    stopCompilation: true,
    priority: 1000,
    transclude: "element",
    compile: function(el,transcludeFn) {
      return function(el,scope) {

      }
    }
  })
  add("te-repeat",{
    stopCompilation: true,
    priority: 1000,
    transclude: "element",
    compile: function(containerEl,transcludeFn) {
      return function(scope,el) {
        var firstEl = containerEl
        var expr = el.getAttribute("te-repeat")
        var hasher = el.hasAttribute("hash-by") ? scope.$eval(el.getAttribute("hash-by")) : mutatingHashFn
        var elements = {}
        scope.$watch(expr,function(now,was) {
          return placeholderHandler(now)
          var els = _.clone(elements)
          if(!now || now.length === 0) {
            removed(was || [])
          } else if (!was || was.length === 0) {
            add(now || [])
          } else {
            var results = difference(now,was,hasher)
            _.each(results.removed,function(s,k) {
              Cute.animate("te-repeat-remove",els[k],function() {
                var el = els[k]
                el.$scope.$destroy()
                el.parentElement.removeChild(el)
              })
            })
            var prevEl
            results.newOrder.forEach(function(setup) {
              var hash = setup.hash
              var el = els[hash]
              if(el) {
                containerEl.children[0].insertBefore
              } else {
              }
            })
          }

        })

        function placeholderHandler(xs) {
          // TODO insert before repeatedly, or sth
          containerEl.innerHTML = ""
          xs.forEach(function(x) {
            containerEl.append(add(x,index))
          })
        }

        function add(item,index) {
          var elScope = scope.$child()
          elScope.item = item
          elScope.$index = index
          var newEl
          transcludeFn(elScope,function(el) {
            newEl = el
          })
          return newEl
        }
      }
    }
  })
  Cute.animate = function animate(name,node,cb) {
    setTimeout(cb)
  }
}

var difference = function(a,b,hasher) {
  var added = {}
  var moved = {}
  var newOrder = []

  var as = state(a,function(hash,v) {
    newOrder.push({hash:hash,value:v})
  })
  var bs = state(b)

  _.each(as,function(s,k) {
    var inB = bs[k]
    if(inB) return added[k] = s
    if(inB.i !== s.i) moved[k] = s
    delete bs[k]
  })
  removed = bs

  return {
    newOrder: newOrder,
    added: added,
    moved: moved,
    removed: removed
  }

  function state(xs,cb) {
    cb = cb || Cute.identityFunction
    return xs.reduce(function(vals,x,i) {
      var hash = hasher(x,i)
      vals[hash] = {v: v, i: i}
      cb(hash,x,i)
      return vals
    },{})
  }
}


var id = 0;
function mutatingHashFn(v) {
  if(!v) return false
  if(v.$$id) return v.$$id
  v.$$id = "hash-" + id++
}
function takeKey(v,k) { return k }

function HashFnMap(fn) {
  this._byHash = {}
  this._hashFn = fn
}
HashFnMap.prototype.get = function(k) {
  this._byHash[k]
}
HashFnMap.prototype.add = function(v) {
  this._byHash[this._hashFn(v)] = v
}

})()
