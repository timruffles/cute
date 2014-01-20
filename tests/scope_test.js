describe("scope",function() {
  describe("$child scopes",function() {
    it("prototypally inherits from the parent",function() {
      var s1 = new Cute.Scope
      s1.foo = "bar"
      var s2 = s1.$child()
      assert.equal(s2.foo,"bar")
      s2.foo = "zzz"
      assert.equal(s1.foo,"bar")
      assert.equal(s2.foo,"zzz")
    })
  })
  it("fires watchers on change",function() {
    var s = new Cute.Scope
    var spy = sinon.spy()
    s.$watch("return s.foo",spy)
    s.$digest()
    s.foo = "value one"
    s.$digest()
    s.foo = "value two"
    s.$digest()
    spy.getCall(0).calledWithExactly(undefined,undefined)
    spy.getCall(1).calledWithExactly("value one",undefined)
    spy.getCall(2).calledWithExactly("value two","value one")
  })
  xit("can't $apply inside an $apply")
})
