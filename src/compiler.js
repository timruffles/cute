(function() {

function compile(nodes,components,maxPriorty,transcludeFn,attachFn) {

  if(typeof nodes === "string") nodes = Cute.htmlToDom(nodes)
  if(nodes instanceof Element) nodes = [Element]

  var components = components.slice().filter(function(c) { return c.priority || 0 < maxPriorty })

  var nodeLinkFns = _.map(nodes,function(node) {
    return compileNode(node,components,transcludeFn)
  })

  if(attachFn) attachFn(nodes)

  return compositeLinkFn
  
  function compositeLinkFn(scope) {
    nodeLinkFns.forEach(function(linkFn,index) {
      linkFn(scope,nodes[index])
    })
  } 
}

/* metadoc:
 * compile needs:
 * - to stop compiling when certain nodes modify DOM before other stuff is applied (repeating etc)
 * - have a way not to double compile in those cases
 * -- e.g ng repeat wants a node with just lower priority directives left
 * - compile/link switch is for 
 * -- performance: we do stuff once for all directives (prob feature sniff)
 * -- transclusion: we need an original linking fn to reapply directives to fresh el
 *
 * - priority 1000 - limited to ngCsp (which sits at root), ngRepeat, and ngIf - ngIf + ngRepeat both transclude so can't be on same ele
 *
 * ngRepeat
 * - makes linkFn for itself, stopping comp there
 * - its transclude fn is element itself, all directive prior < 1000
 * - it uses transclude fn to link new copies of self
 * - it recurses with maxPriority to create the linker for transcludeFn
 *
 * */
function compileNode(node,components,transcludeFn) {

  var matched = findComponents(node,components)

  var links = matched.map(function(component) {
    return applyComponent(node,component,components,transcludeFn) 
  })

  return nodeLinkFn

  function nodeLinkFn(scope) {
    links.forEach(function(linkFn) {
      linkFn(scope)
    })
  } 
}
function findComponents(node,components) {
  var present = components.filter(function(component) {
    return matchComponent(node,component)
  })

  var stopPriority = -Number.MAX_VALUE
  var hasStop = present.filter(_.partial(has,"stopCompilation"))
  if(hasStop.length > 0) {
    if(hasStop.length > 1) throw new Error("duplicate stopCompilation present," + formatComponentsForError(hasStop))
    stopPriority = hasStop[0].priority
  }

  present = present.filter(function(component) {
    return component.priority >= stopPriority
  })

  return present
}
function formatComponentsForError(components) {
  return " caused by components:" + names.join(", ")
}
function has(k,o) {
  return k in o
}
function matchComponent(node,component) {
  if(component.matchElement) return component.selector === node.tagName
  return node.hasAttribute(component.selector)
}
function applyComponent(node,component,components,transcludeFn) {
  var linkFn = false
  var childrenLinkFn = false

  if(node.transclude) {
    var clone = node.cloneNode(true)
    if(node.transclude == "element") {
      childrenLinkFn = Compiler.compileNode([clone],components,node.priority)
    } else {
      childrenLinkFn = Compiler.compileNode(node.children,components)
    }
  }

  if(node.compile) {
    linkFn = node.compile(node,childrenLinkFn || transcludeFn)
  } else {
    linkFn = component.link

  }

  return {
    link: linkFn
  }
}

var flatmap = _.compose(_.flatten,_.map)
var byPriority = function(a,b) {
  return b.priority - a.priority
}

Cute.compile = compile
Cute._dbg.compiler = {
  findComponents: findComponents
}

})()
