//Compiles the intermediate result from PEG.js into XSLT
var Compiler = function () {
  this.lineNumber = 0;
  this.resultHead = [];
  this.resultTail = [];
  this.indent = new Indent();
  this.textTag = null;
}

Compiler.prototype.closePreviouslyCompletedTags = function() {
  while (this.indent.previousLevel >= this.indent.currentLevel && this.resultTail.length > 0) {
    this.resultHead.push(this.resultTail.pop());
    this.indent.previousLevel -= this.indent.unit.length;
  }
}

Compiler.prototype.flushTextTag = function() {
  if (!this.textTag) return;
  if (this.previousLevel < this.currentLevel) throw "Can not have children and text";

  this.resultHead.push(this.textTag);
  this.textTag = null;
}

Compiler.prototype.storePredicateTag = function(tagOpen, text, tagClose) {
  this.textTag = [tagOpen, this.indent.current + this.indent.unit + text, tagClose].join("\n")
}

Compiler.prototype.evalScoped = function(statement) {
  if (typeof statement.scoped == "undefined") return;

  var tagOpen = this.indent.current + '<xsl:for-each select="' + statement.scoped + '">';
  var tagClose = this.indent.current + '</xsl:for-each>';
  this.resultHead.push(tagOpen);
  this.resultTail.push(tagClose);
  this.indent.increase();

  return true
}

Compiler.prototype.evalTag = function(statement) {
  if (typeof statement.tag == "undefined") return;

  var class_part = statement.classes ? ' class="' + statement.classes.join(' ') + '"' : "";
  var id_part = statement.id ? ' id="' + statement.id + '"' : "";
  var tagOpen = this.indent.current + "<" + statement.tag + id_part + class_part + ">";
  var tagClose = this.indent.current + "</" + statement.tag + ">";

  if (typeof statement.text == "string") {
    this.storePredicateTag(tagOpen, statement.text, tagClose);
  } else if ( statement.replacement == "_") {
    this.storePredicateTag(tagOpen, '<xsl:value-of select="." />', tagClose);
  } else {
    this.resultHead.push(tagOpen);
    this.resultTail.push(tagClose);
  }
}

Compiler.prototype.eval = function(statement) {
  this.indent.update(statement.indent);
  this.flushTextTag();
  this.closePreviouslyCompletedTags();

  this.evalScoped(statement);
  this.evalTag(statement);
}

Compiler.prototype.cleanup = function() {
  if(this.resultTail.length != 0) this.eval({indent: 0});
}

Compiler.prototype.result = function() {
  var wrapHead = ['<?xml version="1.0" encoding="ISO-8859-1"?>',
                  '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
                  '<xsl:template match="/data">']
  var wrapTail = ['</xsl:template>', 
                  '</xsl:stylesheet>']

  this.cleanup();
  return [wrapHead.join("\n"), this.resultHead.join("\n"), wrapTail.join("\n")].join("\n") + "\n";
}
