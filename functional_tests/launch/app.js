// user space
function main() {
  var components = new Components()
  var controllers = {
    items: function(el,scope) {
      scope.items = []
      scope.addItem = function(item) {
        scope.items.push(item)
        scope.item = {title: ""}
      }
      scope.item = {title: ""}
    },
    alerty: function(el,scope) {
      scope.sayHi = function() {
        alert("hi from a controller")
      }
    }
  }
  Cute.registerComponents(components)
  var root = new Scope
  var compiler = new Compiler(components,controllers)
  compiler.run(document.body)(root)
}

