describe.only("template",function() {
  var components = []
  before(function() {
    Cute.registerComponents(components,{})
    Cute.components.add(components,"[templated-component]",{
      template: "<p templated-content></p>"
    })
    Cute.components.add(components,"[templated-component-replace]",{
      replace: true,
      template: "<p templated-content></p>"
    })
  })
  it("inserts template inside element",function() {
    var tpl = join(
      "<div templated-component></div>"
    )
    var el = compileLink(tpl,new Cute.Scope,components)
    assert.equal(el.querySelectorAll("[templated-component] [templated-content]").length,1)
  })
  it("replaces element with template is replace: true is passed",function() {
    var tpl = join(
      "<div templated-component-replace></div>"
    )
    var el = compileLink(tpl,new Cute.Scope,components)
    assert(el.hasAttribute("templated-content"),"content wasn't replaced")
  })

})
