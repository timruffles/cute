describe("karma testing",function() {

  it("is clearly in the browser, I'm parsing URLs with an anchor tag",function() {
    var urlStr = "http://example.com"
    var url = parseUrl(urlStr) 
    assert.equal(url.hostname,"example.com")
  })

})

function parseUrl(str) {
  parseUrl.parser = parseUrl.parser || document.createElement("a")
  parseUrl.parser.href = str
  return ["hostname","protocol","path"].reduce(function(h,k) {
    h[k] = parseUrl.parser[k]
    return h
  },{})
}
