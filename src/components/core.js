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
    compile: function(el,transcludeFn) {
      return function(el,scope) {
        transcludeFn(function(els) {
          $(el).append(els)
        })
      }
    }
  })
}

})()
