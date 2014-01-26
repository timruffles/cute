;(function() {

Cute.registerComponents = function(components,controllers,getTemplate) {

  getTemplate = getTemplate || function() { throw new Error("No template loader") }

  var add = _.partial(Cute.components.add,components)

  add("te-controller",{
    scope: true,
    link: function(scope,el) {
      var name = el.getAttribute("te-controller")
      var controller = controllers[name]
      if(!controller) throw new Error("Missing controller " + name)
      new controller(scope)
    }
  })
  add("a",{
    matchElement: true,
    link: function(scope,el) {
      el.addEventListener("click",function(evt) {
        if(el.getAttribute("href") === "") evt.preventDefault()
      })
    }
  })
  add("te-init",function(scope,el) {
    var src = el.getAttribute("te-init")
    scope.$apply(function() {
      scope.$eval(src)
    })
  })
  add("te-click",function(scope,el) {
    var expression = el.getAttribute("te-click")
    el.addEventListener("click",function() {
      scope.$apply(function() {
        scope.$eval(expression)
      })
    })
  })
  add("te-bind",function(scope,el) {
    var expression = el.getAttribute("te-bind")
    scope.$watch(expression,function(val) {
      el.innerHTML = val
    })
  })
  add("te-submit",function(scope,el) {
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
      return function(scope,el) {
        
      }
    }
  })
  add("te-include",{
    stopCompilation: true,
    priority: 1000,
    compile: function(el,transcludeFn) {
      return function(scope,el,attrs) {
        // FIXME
        el.classList.add("te-include-loading")
        getTemplate(scope.$eval(attrs.teInclude),function(template) {
          var templated = Cute.compile(template,components)(scope)
          el.parentElement.replaceChild(templated[0],el)
        })
      }
    }
  })
  add("te-style",{
    link: function(scope,el,attrs) {
      scope.$watch(attrs.teStyle,function(now) {
        _.each(now,function(val,key) {
          el.style[key] = val
        })
      })
    }
  })
  add("te-repeat",{
    stopCompilation: true,
    priority: 1000,
    transclude: "element",
    compile: function(containerEl,attrs,transcludeFn) {

      var id = 1

      return link
      
      function link(scope,el) {
        var expr = attrs.teRepeat
        var keyer = attrs.keyBy ? scope.$eval(attrs.keyBy) : mutatingKeyFn
        
        var byKey = {}
        var tailEl
        
        scope.$watch(expr,function(now,was) {
          var remove = _.clone(byKey)
          var newByKey = {}
          tailEl = containerEl
          now.map(function(item,index) {
            var key = keyer(item)
            var existing = byKey[key]
            var el
            if(existing) {
              existing.scope.item = item
              existing.scope.index = index
              el = existing
              delete remove[key]
            } else {
              el = add(item,index)
            }
            newByKey[key] = el
            prepend(el)
          })
          _.each(remove,function(el) {
            el.scope.$destroy()
            el.parentElement.removeChild(el)
          })
          byKey = newByKey
        })
        
        function prepend(el) {
          insertAfter(el,tailEl)
          tailEl = el
        }

        function insertAfter(el,target) {
          if(target.nextElementSibling) {
            return target.parentElement.insertBefore(el,target.nextElementSibling)
          }
          return target.parentElement.appendChild(el)
        }

        function add(item,index) {
          var elScope = scope.$child()
          elScope.item = item
          elScope.index = index
          var newEl
          transcludeFn(elScope,function(el) {
            newEl = el[0]
          })
          return newEl
        }
      }

      function mutatingKeyFn(x) {
        if(x.$id) return x.$id
        return x.$id = id++
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
