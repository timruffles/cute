describe("compiler",function() {

  var baseComponents
  beforeEach(function() {
    baseComponents = []
    Cute.registerComponents(baseComponents)
  })
  
  describe("public API",function() {
    xit("accepts strings",function() {
    })
    xit("accepts node lists",function() {
    })
    xit("accepts node",function() {
    })

    describe("transclude",function() {

      var testComponent = {
        selector: "FOO",
        transclude: true,
        compile: function(el,transcludeFn) {
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
