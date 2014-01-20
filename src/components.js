(function() {

Cute.components = {
  add: function(set,sel,fn) {
    set.push(Cute.components.setup(sel,fn))
  },
  setup: function(sel,fn) {
    var setup = typeof fn === "function" ? {link: fn} : fn
    setup.selector = sel.toUpperCase()
    setup.priorty = setup.priorty || 0
    if(setup.stopCompilation && setup.priority == null) throw new Error("Need priority to stop compilation")
    return setup
  }
}

})()
