;(function() {

function compile(nodes,components,maxPriorty,transcludeFn) {

  if(typeof nodes === "string") nodes = Cute.htmlToDom(nodes)
  if(nodes instanceof Element) nodes = [nodes]

  components = components.sort(function(a,b) {
    return b.priority - a.priority
  })
  var componentsToApply = components.slice()

  if(maxPriorty) {
    componentsToApply = componentsToApply.filter(function(c) {
      return (c.priority || 0) < maxPriorty
    })
  }

  var nodeSetups = [].map.call(nodes,function(node) {
    var attrs = readAttributes(node)
    return compileNode(node,attrs,componentsToApply,components,transcludeFn)
  })

  return passScopeToComponents
  
  function passScopeToComponents(scope,attachFn) {
    var nodesToLink = nodeSetups.map(function(setup,index) {
      var node = attachFn ? setup.node.cloneNode(true) : setup.node
      var attrs = readAttributes(node)
      setup.link(scope,node,attrs)
      return node
    })
    if(attachFn) attachFn(nodesToLink,scope)

    return nodesToLink
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
function compileNode(node,attrs,componentsForNode,components,transcludeFn) {

  var componentState = findComponents(node,componentsForNode)
  var matched = componentState.components
  var newScope = componentState.scope

  var compilationStopped = false

  var links = matched.map(function(component) {
    var step = applyComponent(node,attrs,component,componentsForNode,components,transcludeFn)
    node = step.node || node
    if(!compilationStopped) compilationStopped = step.stopCompilation
    return step.link || noop
  })

  return {node: node, link: nodeLinkFn}

  function nodeLinkFn(scope,node,attrs) {
    if(newScope) {
      scope = Cute.isObject(newScope) ? isolateScope(newScope,scope,attrs) : scope.$child()
    }
    node.scope = scope
    links.forEach(function(linkFn) {
      linkFn(scope,node,attrs)
    })
    if(!compilationStopped && node.children && node.children.length > 0) {
      var childLinkFn = compile(node.children,components)
      childLinkFn(scope)
    }
  } 
}
/*
 * local: { from: teScope, type: attribute },
 * prop: { from: someProp, type: binding },
 * someAccesor: { from: someAttr, type: evaluator },
 * */
function isolateScope(attrs,parent,elAttrs) {
  var child = parent.$child()
  _.each(attrs,function(setup,k) {
    if(!_.isObject(setup) || !(setup.from && setup.type)) {
      child[k] = setup
      return
    }
    var create = ISOLATE_TYPES[setup.type]
    if(!create) throw new Error("Unknown strategy for isolate scope property: " + k)
    create(k,setup.from,child,parent,elAttrs)
  })
  return child
}
var ISOLATE_TYPES = {
  attribute: attributeIsolate,
  binding: bindingIsolate,
  evaluator: evaluatorIsolate
}
function attributeIsolate(localKey,attrKey,child,parent,attrs) {
  child.$watchOther(parent,attrs[attrKey],function(now) {
    child[localKey] = now
  })
}
function bindingIsolate(localKey,parentKey,child,parent) {
  child.$watch("s." + localKey,function(now) {
    parent[parentKey] = now
  })
  child.$watchOther(parent,"s." + parentKey,function(now) {
    child[localKey] = now
  })
}
function evaluatorIsolate(localKey,attrKey,child,parent,attrs) {
  child[localKey] = function() {
    return parent.$eval(attrs[attrKey])
  }
}
function noop() {}
function applyComponent(node,attrs,component,componentsForNode,components,transcludeFn) {
  var linkFn
  var transcludeFn
  var stopCompilation

  if(component.transclude) {
    stopCompilation = true
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

  if(component.template) {
    var el = compile(component.template,components)
    if(component.replace) {
      node.parentElement.replaceChild(el,node)
      node = el
    } else {
      node.innerHTML = ""
      node.appendChild(el)
    }
  }

  if(component.compile) {
    // should this be original node, or that via transclude
    // - or is normalising attributes way to go
    linkFn = component.compile(node,attrs,transcludeFn)
  } else {
    linkFn = component.link
  }

  return {node: node, link: linkFn, stopCompilation: stopCompilation}

}
function findComponents(node,components) {

  var scope
  var template

  var present = components.filter(function(component) {
    return matchComponent(node,component)
  })

  var hasStop = fetchAndvalidateUnique(present,"stopCompilation")
  if(hasStop) {
    present = present.filter(function(component) {
      return component.priority >= hasStop.priority
    })
  }

  var hasScope = fetchAndvalidateUnique(present,"scope")
  if(hasScope) scope = hasScope.scope

  fetchAndvalidateUnique(present,"template")

  return {components: present, scope: scope}
}

function fetchAndvalidateUnique(components,property) {
  var withProperty = components.filter(Cute.partial(has,property))
  if(withProperty.length > 1) throw new Error("only one component with '" + property + "' can be present on a node:" + formatComponentsForError(hasScope))
  if(withProperty.length === 1) return withProperty[0]
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

function readAttributes(node) {
  if(node.nodeType !== Node.ELEMENT_NODE) return {}
  var attrs = {}
  for(var i = 0, len = node.attributes.length; i < len; i++) {
    var attr = node.attributes[i]
    attrs[normaliseKeyToCamelCase(attr.name)] = attr.value
  }
  return attrs
}

function normaliseKeyToCamelCase(str) {
  // research with: var as = $x("//@*").reduce(function(counts,c) { counts[c.name] = (counts[c.name] || 0) + 1; return counts},{}); Object.keys(as).sort(function(a,b) { return as[b] - as[a] }) - looks like class + href are most common
  if(str === "class" || str === "href" || str === "id" || str === "name" || str === "style" || str === "type" || str === "value") {
    return str
  }
  if(str.indexOf("-") !== -1) {
    return hyphenToCamel(str,"-")
  }
  return str 
}
var hyphenRe = new RegExp("-(\\w)","g")
function hyphenToCamel(str) {
  return str.replace(hyphenRe,function(x,after) {
    return after.toUpperCase()
  })
}

Cute.compile = compile
Cute._dbg.compiler = {
  findComponents: findComponents,
  readAttributes: readAttributes
}

})()
