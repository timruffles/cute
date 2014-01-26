describe("te-model test",function() {
  var components = []
  before(function() {
    Cute.registerComponents(components,{})
  })
  var tpl = join(
    "<input te-model=s.value />"
  )
  it("updates input when model changes",function() {
    var scope = new Cute.Scope({value: "something"})
    var el = compileLink(tpl,scope,components)
    scope.$digest()
    assert.equal(el.value,"something")
  })
  it("updates model when input changes",function() {
    var scope = new Cute.Scope({value: "not ok"})
    var el = compileLink(tpl,scope,components)
    scope.$digest()
    el.value = "changed"
    assert.equal(el.value,"changed")
  })
})
