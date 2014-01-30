describe("compiler",function() {

  var baseComponents
  beforeEach(function() {
    baseComponents = []
    Cute.registerComponents(baseComponents)
  })

  describe("attr normalisation",function() {
    var attrs
    before(function() {
      var el = toDom("<a href='foo' some-component='bar' something_else='baz'></a>")
      attrs = Cute._dbg.compiler.readAttributes(el)
    })
    it("normalises hypen-case",function() {
      assert.equal(attrs.someComponent,"bar")
    })
    it("exposes snake_case unormalised",function() {
      assert.equal(attrs.something_else,"baz")
    })
    it("exposes normal attrs",function() {
      assert.equal(attrs.href,"foo")
    })
  })
  
  describe("public API",function() {
    xit("accepts strings",function() {
    })
    xit("accepts node lists",function() {
    })
    xit("accepts node",function() {
    })

    it("compiles whole tree of nodes",function() {

      var testComponent = {
        selector: "FOO",
        transclude: true,
        link: function(scope,el) {
          el.classList.add("applied")
        }
      }

      var el = toDom('<div><span><span foo></span></span></div>')
      var linkFn = Cute.compile(el,[testComponent])
      var compiledEl = linkFn({})

      assert(compiledEl[0].querySelector(".applied"),"expected compilation to recurse")
    })

    describe("transclude",function() {

      var _transcludeFn

      var testComponent = {
        selector: "test-transclude",
        transclude: true,
        compile: function(el,attrs,transcludeFn) {
          _transcludeFn = transcludeFn
          return function link() {
            _.range(4).forEach(function() {
              transcludeFn(new Cute.Scope,function(els) {
                $(el).append(els)
              })
            })
          }
        }
      }

      var compiledEl
      before(function() {
        var el = toDom('<div test-transclude><span class=inside te-bind="s.name"></span></div>')
        var withTestComponent = baseComponents.slice().concat(testComponent)
        var linkFn = Cute.compile(el,withTestComponent)
        compiledEl = linkFn(new Cute.Scope)
      })

      it("creates a transcludeFn that passes clones to a callback",function() {
        _transcludeFn(new Cute.Scope,function(els) {
          var el = els[0]
          assert.equal(el.tagName,"SPAN")
          assert(el.hasAttribute("te-bind"))
        })
      })

      it("transcluded nodes are applied to a scope",function() {
        var scope = new Cute.Scope({name: "hello"})
        _transcludeFn(scope,function(els) {
          var el = els[0]
          scope.$digest()
          assert.equal(el.innerText,"hello")
        })
      })

      it("passes through transclude to compile fn - allowing new versions of transcluded elements to be created",function() {
        var el = compiledEl[0]
        assert.equal(el.children.length,4)
        // make the (n-1)! comparisons to ensure no two are equal
        _.range(el.children.length,1,-1).forEach(function(comparisons,index) {
          _.range(1,comparisons).forEach(function(offset) {
            assert.notEqual(el.children[index + offset],el.children[index],"child " + index + " and " + index + offset + " were unexpectedly equal")
          })
        })
      })

      describe("element",function() {

        var _transcludeFn
        var testComponent = {
          selector: "transclude-element",
          transclude: "element",
          priority: 1000,
          compile: function(el,attrs,transcludeFn) {
            _transcludeFn = transcludeFn
          }
        }

        var compiledEl
        before(function() {
          var el = toDom('<div><div transclude-element te-bind="s.name"></div></div>')
          var withTestComponent = baseComponents.slice().concat(testComponent)
          var linkFn = Cute.compile(el,withTestComponent)
          var scope = new Cute.Scope({name: "incorrect scope"})
          compiledEl = linkFn(scope)
        })

        it("clones the original element",function() {
          _transcludeFn(new Cute.Scope,function(els) {
            var el = els[0]
            assert.notEqual(el,compiledEl[0])
          })
        })

        it("applies other directives with correct scope",function() {
          var scope = new Cute.Scope({name: "hi there"})
          _transcludeFn(scope,function(els) {
            var el = els[0]
            scope.$digest()
            assert.equal(el.innerText,"hi there")
          })
        })

      })


    })
  })

  describe("scope",function() {
    it("creates a child scope when passed true",function() {
      var hasScope = {
        selector: "FOO",
        scope: true
      }
      var el = toDom('<div FOO></div>')
      var linkFn = Cute.compile(el,[hasScope])
      var scope = new Cute.Scope
      linkFn(scope)
      assert.equal(scope,el.scope.parent)
    })
    it("creates an isolated scope if passed an object",function() {
      var hasScope = {
        selector: "FOO",
        scope: {
          override: true
        }
      }
      var el = toDom('<div FOO></div>')
      var linkFn = Cute.compile(el,[hasScope])
      var scope = new Cute.Scope({override: function() {}})
      linkFn(scope)
      assert.notEqual(scope.override,el.scope.override)
    })
    it("evaluator properties allow access to an expression evaluated in parent scope",function() {
      var hasScope = {
        selector: "FOO",
        scope: {
          someProp: "on child",
          localFoo: {
            from: "foo",
            type: "evaluator"
          }
        }
      }
      var el = toDom('<div foo="\'something \' + s.someProp + \' ok\'"></div>')
      var linkFn = Cute.compile(el,[hasScope])
      var scope = new Cute.Scope({
        someProp: "from parent"
      })
      linkFn(scope)
      assert.equal("something from parent ok",el.scope.localFoo())
      scope.someProp = "changed from parent"
      scope.$digest()
      assert.equal("something changed from parent ok",el.scope.localFoo())
    })
    it("binding isolate allows two way binding between parent and child scopes",function() {
      var hasScope = {
        selector: "FOO",
        scope: {
          localFoo: {
            from: "parentFoo",
            type: "binding"
          }
        }
      }
      var el = toDom('<div FOO></div>')
      var linkFn = Cute.compile(el,[hasScope])
      var scope = new Cute.Scope({
        parentFoo: "parent original",
      })
      linkFn(scope)
      scope.parentFoo = "parent changed"
      scope.$digest()
      assert.equal(el.scope.localFoo,"parent changed")
      el.scope.localFoo = "child changed"
      scope.$digest()
      assert.equal(scope.parentFoo,"child changed")
    })
    it("attribute isolate allows a property to reflect evaluated value of attribute",function() {
      var hasScope = {
        selector: "FOO",
        scope: {
          prop: "not ok",
          localFoo: {
            from: "foo",
            type: "attribute"
          }
        }
      }
      var el = toDom('<div FOO=\'"something from parent " + s.prop\'></div>')
      var linkFn = Cute.compile(el,[hasScope])
      var scope = new Cute.Scope({
        prop: "ok",
      })
      linkFn(scope)
      scope.$digest()
      assert.equal(el.scope.localFoo,"something from parent ok")
      scope.prop = "still ok"
      scope.$digest()
      assert.equal(el.scope.localFoo,"something from parent still ok")
    })

  })

  describe("internal",function() {
    it("components found in simple case",function() {
      var el = toDom("<div te-repeat></div>")
      var components = Cute._dbg.compiler.findComponents(el,baseComponents).components
      assert.equal("TE-REPEAT",_.pluck(components,"selector").join(","))
    })
    it("components with lower priority are not matched",function() {
      var el = toDom("<div te-repeat te-show></div>")
      var components = Cute._dbg.compiler.findComponents(el,baseComponents).components
      assert.equal("TE-REPEAT",_.pluck(components,"selector").join(","))
    })
    it("multiple components can be matched",function() {
      var el = toDom("<div te-submit te-init></div>")
      var components = Cute._dbg.compiler.findComponents(el,baseComponents).components
      assert.sameMembers(["TE-SUBMIT","TE-INIT"],_.pluck(components,"selector"))
    })
  })

  
})
