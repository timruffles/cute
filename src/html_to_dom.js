(function() {

Cute.htmlToDom = function(str) {
  var container = document.createElement("div")
  container.innerHTML = str
  return container.children
}

})()
