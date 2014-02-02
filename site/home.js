var components = []
Cute.components.add(components,"code-example",{
  priority: 10,
  compile: function(el,attrs) {
    console.log("hello")
    var src = formatCode(el.innerHTML)
    return function(scope,el) {
      var code = document.createElement("code")
      code.classList.add("code-example")
      code.innerText = src
      el.parentNode.replaceChild(code,el)
    }
    function formatCode(src) {
      var lines = src.split("\n").filter(function(l) {
        return !/^\s*$/.test(l)
      })
      var min = lines.reduce(function(min,s) {
        var match = /^\s+/.exec(s)
        return match ? Math.min(min,match[0].length) : min
      },Infinity)
      if(min == Infinity) return lines.join("\n")
      return lines.map(function(line) {
        return line.slice(min)
      }).join("\n")
    }
  }
})
Cute.quickboot({
  el: document.body,
  components: components,
  getTemplate: function(id,fn) {
    fn(document.getElementById(id).innerHTML)
  },
  controllers: {
    counter: function(scope) {
      scope.counter = {value: 0}
    },
    alerty: function(scope) {
      scope.sayHi = function() {
        alert("Hi - you've clicked " + scope.counter.value + " times")
      }
    },
    items: function(scope) {
      scope.item = {}
      scope.items = [
        {title:"backbone.js"},
        {title: "angular.js"}
      ]
      scope.addItem = function(item) {
        scope.items.push(item)
        scope.item = {}
      }
      scope.buttonLabel = function(item) {
        if(!item.title) return 'Add item'
        return "Add item titled " + item.title
      }
      scope.removeItem = function(item) {
        scope.items.splice(scope.items.indexOf(item),1)
      }
    },
  }
})
function join() {
  return [].join.call(arguments,"")
}

