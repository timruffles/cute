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

      var testComponent = {
        selector: "FOO",
        transclude: true,
        compile: function(el,attrs,transcludeFn) {
          return function link() {
            _.range(4).forEach(function() {
              transcludeFn({},function(els) {
                $(el).append(els)
              })
            })
          }
        }
      }

      var compiledEl
      before(function() {
        var el = toDom('<div FOO><span class=inside></span></div>')
        var linkFn = Cute.compile(el,[testComponent])
        compiledEl = linkFn({})
      })

      it("returns the compiled el set",function() {
        assert.equal(compiledEl.length,1)
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

    })
  })

  describe("internal",function() {
    it("components found in simple case",function() {
      var el = toDom("<div te-repeat></div>")
      var components = Cute._dbg.compiler.findComponents(el,baseComponents)
      assert.equal("TE-REPEAT",_.pluck(components,"selector").join(","))
    })
    it("components with lower priority are not matched",function() {
      var el = toDom("<div te-repeat te-show></div>")
      var components = Cute._dbg.compiler.findComponents(el,baseComponents)
      assert.equal("TE-REPEAT",_.pluck(components,"selector").join(","))
    })
    it("multiple components can be matched",function() {
      var el = toDom("<div te-submit te-init></div>")
      var components = Cute._dbg.compiler.findComponents(el,baseComponents)
      assert.sameMembers(["TE-SUBMIT","TE-INIT"],_.pluck(components,"selector"))
    })
  })

  
})
