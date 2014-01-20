(function() {

function Cute() {
}

Cute._dbg = {}

Cute.assert = function assert(t,msg) {
  if(!t) throw new Error(msg)
}

window.Cute = Cute

})()
