if (typeof console == "undefined" && typeof Ruby != "undefined") {
  var console = {
    log: function() {
      Ruby.puts(JSON.stringify(arguments.length > 1 ? 
                               //Convert arguments into an Array
                               Array.prototype.slice.call(arguments) :
                               arguments[0]));
    }
  }
} else if (typeof console == "undefined") {
  var console = {
    log: function() {}
  }
}
