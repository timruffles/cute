function toDom(str) {
  return $(str)[0]
}
function join() {
  return [].join.call(arguments,"")
}
function compileLink(tpl,scope,components) {
  var link = Cute.compile(tpl,components,null,null)
  return link(scope)[0]
}
sinon.assert.expose(assert,{prefix: ""})
