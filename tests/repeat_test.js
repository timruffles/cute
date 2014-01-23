describe("repeat test",function() {
  var components = []
  before(function() {
    Cute.registerComponents(components,{})
  })
  var tpl = join(
    "<ul>",
    "  <li te-repeat='return s.rows'>",
    "    <span class=fromItem te-bind='return s.item.name'></span>",
    "    <span class=fromParent te-bind='return s.fromParent'></span>",
    "  </li>",
    "</ul>"
  )
  it("has only placeholder node if data empty",function() {
    var scope = makeScope({
      rows: []
    })   
    var el = compileLink(tpl,scope)
    scope.$apply()
    assert.equal(el[0].querySelectorAll("li").length,0)
  })
  describe("property access",function() {
    var el
    var scope
    before(function(done) {
      var parent = makeScope({fromParent:"fromParent"})
      scope = parent.$child()
      scope.rows = [
        {name: "a"},
        {name: "b"},
        {name: "c"},
      ]
      el = compileLink(tpl,scope)[0]
      scope.$apply()
      setTimeout(done)
    })
    it("sets scope correctly for items",function() {
      assert.equal(el.children[0].querySelector(".fromItem").innerText,"a")
      assert.equal(el.children[2].querySelector(".fromItem").innerText,"c")
    })
    it("can access properties in parent",function() {
      assert.equal(el.children[0].querySelector(".fromParent").innerText,"fromParent")
      assert.equal(el.children[1].querySelector(".fromParent").innerText,"fromParent")
    })
  })

  function compileLink(tpl,scope) {
    var link = Cute.compile(tpl,components,null,null)
    return link(scope)
  }
  function makeScope(data) {
    var scope = new Cute.Scope
    _.extend(scope,data || {})
    return scope
  }
})

function join() {
  return [].join.call(arguments,"")
}

