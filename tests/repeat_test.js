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
    var scope = new Cute.Scope({
      rows: []
    })   
    var el = compileLink(tpl,scope,components)
    scope.$apply()
    assert.equal(el.querySelectorAll("li").length,0)
  })
  describe("property access",function() {
    var el
    var scope
    before(function(done) {
      var parent = new Cute.Scope({fromParent:"fromParent"})
      scope = parent.$child()
      scope.rows = [
        {name: "a"},
        {name: "b"},
        {name: "c"},
      ]
      el = compileLink(tpl,scope,components)
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

})
