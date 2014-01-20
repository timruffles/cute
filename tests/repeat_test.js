describe("repeat test",function() {
  var components = []
  before(function() {
    Cute.registerComponents(components,{})
  })
  var tpl = join(
    "<ul>",
    "  <li te-repeat=rows>",
    "    <span class=fromItem te-bind=item.name></span>",
    "    <span class=fromParent te-bind=fromParent></span>",
    "  </li>",
    "</ul>"
  )
  it("removes node if source is empty",function() {
    var el = compileLink(tpl,{
      rows: []
    })
    assert.equal(el.childNodes.length,0)
  })
  describe("property access",function() {
    var el
    before(function() {
      el = compileLink(tpl,{
        rows: [
          {name: "a"},
          {name: "b"},
          {name: "c"},
        ]
      })
    })
    it("sets scope correctly for items",function() {
      assert.equal(el[0].querySelector(".fromItem").innerText,"a")
      assert.equal(el[2].querySelector(".fromItem").innerText,"c")
    })
    it("can access properties in parent",function() {
      assert.equal(el[0].querySelector(".fromParent").innerText,"fromParent")
      assert.equal(el[2].querySelector(".fromParent").innerText,"fromParent")
    })
  })

  function compileLink(tpl,scope) {
    var el
    var link = Cute.compile(tpl,components,null,null,function(_el) {
      el = _el
    })
    link(scope)
    return el
  }
})

function join() {
  return [].join.call(arguments,"")
}

