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
  it("doesn't require return for simple statements",function() {
    var scope = new Cute.Scope({
      $foo: "ok",
      $foo_b2323Z: "ok",
      foo: {
        bar: "ok",
        bux: {
          baz: "ok"
        },
        baz: _.constant("ok")
      },
      qux: _.constant({foo: "ok"}),
      buz: _.constant("ok")
    })
    ;[
      "s.$foo",
      " s.$foo",
      "s.$foo   ",
      "s.$foo",
      "s.foo.bar",
      "s.foo.bux.baz",
      "  s.qux().foo",
      "s.foo.baz() ",
      "s.buz()"
    ].forEach(function(str) {
      assert.equal("ok",scope.$eval(str),"expected to add implicit return to '" + str + "'")
    })
  })
  it("keeps digesting until all watchers have settled",function() {
    var s1 = new Cute.Scope
    var s2 = s1.$child()
    s2.foo = 1

    var times = 5
    s2.$watch("return s.foo",function(val) {
      if(--times) s2.foo += 1
    })
    s1.$digest()

    assert.equal(0,times)
  })
  it("throws if maxIterations are exceeded",function() {
    var s1 = new Cute.Scope
    var s2 = s1.$child()
    s2.foo = 1

    assert.throws(function() {
      var times = 200
      s2.$watch("return s.foo",function() {
        if(--times) s2.foo += 1
      })
      s1.$digest()
    },Cute.Scope.MAX_ITERATIONS_EXCEEDED)
  })
  it("watch works on arrays",function() {
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
  it("watch works on objects",function() {
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
  describe("internal",function() {
    describe("equality algorithm",function() {
      var eq = Cute.Scope.prototype._equal
      var a = {}
      var b = {}
      it("shallow compares arrays",function() {
        assert(eq([a,b],[a,b]))
        assert.notOk(eq([{},b],[a,b]))
      })
      it("respects array order",function() {
        assert.notOk(eq([b,a],[a,b]))
      })
      it("shallow compares objects",function() {
        assert(eq({a:a,b:b},{a:a,b:b}))
        assert.notOk(eq({a:{},b:b},{a:a,b:b}))
      })
    })
  })
})
