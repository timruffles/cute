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
