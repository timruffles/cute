(function() {

function compile(nodes,components,maxPriorty,transcludeFn) {

  if(typeof nodes === "string") nodes = Cute.htmlToDom(nodes)
  if(nodes instanceof Element) nodes = [nodes]

  components = _.sortBy(components,function(c) {
    return -c.priority
  })
  var componentsToApply = components.slice()

  if(maxPriorty) {
    componentsToApply = componentsToApply.filter(function(c) {
      return (c.priority || 0) < maxPriorty
    })
  }

  var nodeSetups = _.map(nodes,function(node) {
    return compileNode(node,componentsToApply,components,transcludeFn)
  })

  return passScopeToComponents
  
  function passScopeToComponents(scope,attachFn) {
    var nodesToLink = nodeSetups.map(function(setup,index) {
      var node = attachFn ? setup.node.cloneNode(true) : setup.node
      setup.link(scope,node)
      return node
    })
    if(attachFn) attachFn(nodesToLink,scope)

    return nodesToLink
  } 
}

function tap(x) {
  console.log(x); return x
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
function compileNode(node,componentsForNode,components,transcludeFn) {

  var childLinkFn

  var matched = findComponents(node,componentsForNode)

  var compilationStopped = false

  var links = matched.map(function(component) {
    var step = applyComponent(node,component,componentsForNode,components,transcludeFn)
    node = step.node || node
    if(!compilationStopped) compilationStopped = step.stopCompilation
    return step.link
  })

  if(!compilationStopped && node.children && node.children.length > 0) {
    childLinkFn = compile(node.children,components)
  }

  return {node: node, link: nodeLinkFn}

  function nodeLinkFn(scope,node) {
    links.forEach(function(linkFn) {
      linkFn(scope,node)
    })
    if(childLinkFn) childLinkFn(scope)
  } 
}
function noop() {}
function applyComponent(node,component,componentsForNode,components,transcludeFn) {
  var linkFn
  var transcludeFn
  var stopCompilation

  if(component.transclude) {
    var clone = node.cloneNode(true)
    if(component.transclude === "element") {
      var placeholder = document.createComment(component.selector)
      node.parentElement.replaceChild(placeholder,node)
      transcludeFn = compile([clone],components,component.priority)
      node = placeholder
    } else {
      node.innerHTML = ""
      transcludeFn = compile(clone.children,components)
    }
  }

  if(component.compile) {
    // should this be original node, or that via transclude
    // - or is normalising attributes way to go
    linkFn = component.compile(node,transcludeFn)
  } else {
    linkFn = component.link
  }

  return {node: node, link: linkFn}
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
  
  if(stopPriority > -Number.MAX_VALUE) {
    present = present.filter(function(component) {
      return component.priority >= stopPriority
    })
  }

  return present
}


function matchComponent(node,component) {
  if(component.matchElement) return component.selector === node.tagName
  return node.hasAttribute(component.selector)
}

function formatComponentsForError(components) {
  return " caused by components:" + names.join(", ")
}
function has(k,o) {
  return k in o
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
