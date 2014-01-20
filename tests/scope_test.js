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
  it("evalutes expression in the scope",function() {
    var s = new Cute.Scope
    s.foo = "bar"
    assert.equal(s.$eval("return s.foo"),s.foo)
    assert.equal(s.$eval("return s['foo']"),s.foo)
    assert.equal(s.$eval("return scope.foo"),s.foo)
  })
  it("uses apply to cause a digest on root of scope tree",function(done) {
    var s1 = new Cute.Scope
    var s2 = s1.$child()
    var s3 = s2.$child()

    var spy = s1.$digest = sinon.spy()
    s3.$apply()

    setTimeout(function() {
      assert.calledOnce(spy)
      done()
    })

  })
  it("rolls digest down scope tree",function(done) {
    var s1 = new Cute.Scope
    var s2 = s1.$child()
    var s3 = s2.$child()
    var s4 = s2.$child()

    s3.$digest = sinon.spy()
    s4.$digest = sinon.spy()

    s1.$digest()

    setTimeout(function() {
      assert.calledOnce(s3.$digest)
      assert.calledOnce(s4.$digest)
      done()
    })
  })
  it("watch collection works on arrays",function() {
    var s = new Cute.Scope

    var spy = sinon.spy()

    s.list = []
    s.$watch("return s.list",spy)
    s.$digest()
    s.list.push(1)
    s.$digest()
    s.list.push(2)
    s.list.push(3)
    s.$digest()
    s.list.pop()
    s.$digest()

    spy.getCall(0).calledWithMatch([],undefined)
    spy.getCall(1).calledWithMatch([1],[])
    spy.getCall(2).calledWithMatch([1,2],[1])
    spy.getCall(3).calledWithMatch([1],[1,2])
  })
  it("watch collection works on objects",function() {
    var s = new Cute.Scope

    var spy = sinon.spy()

    var expect = [
      ["{}",undefined],
      ['{"a":1}',"{}"],
      ['{"a":1,"b":2}','{"a":1}'],
      ['{"b":2}','{"a":1,"b":2}'],
    ]

    s.list = {}
    var got = []
    s.$watch("return s.list",function(now,old) {
      got.push([JSON.stringify(now),JSON.stringify(old)])
    })
    s.$digest()
    s.list.a = 1
    s.$digest()
    s.list.b = 2
    s.$digest()
    delete s.list.a
    s.$digest()

    expect.forEach(function(expectation,index) {
      var args = got[index]
      expectation.forEach(function(asJson,argIndex) {
        assert.equal(args[argIndex],asJson,"call " + index + ", arg " + argIndex)
      })
    })

  })
  xit("can't $apply inside an $apply")
})
