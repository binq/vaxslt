var Compiler = (function() {
  if (typeof console == "undefined" && typeof Ruby != "undefined") {
    var console = {
      log: function() {
        Ruby.puts(JSON.stringify(arguments.length > 1 ? Array.prototype.slice.call(arguments) : arguments[0]));
      }
    }
  } else if (typeof console == "undefined") {
    var console = {
      log: function() {}
    }
  }

  //The object that handles indentation for Parser
  var Indent = function () {
    this.unit = "";
    this.current = "";
    this.currentLevel = null;
    this.previousLevel = null;
  }

  //Compiles the intermediate result from PEG.js into XSLT
  var Compiler = function () {
    this.lineNumber = 0;
    this.resultHead = [];
    this.resultTail = [];
    this.indent = new Indent();
    this.textTag = null;
  }

  //Won't do anything if this.unit has already been set to something besides "", otherwise will set it based on currentLevel
  Indent.prototype.setUnit = function(currentLevel) {
    //Nothing to do if this.unit has already been set or if there is no currentLevel
    if (this.unit != "" || this.currentLevel == 0) return;

    this.unit = "";
    for(var i=0; i<this.currentLevel; i++) this.unit += " ";
  }

  //Sets the value for current based on currentLevel
  Indent.prototype.adjustCurrent = function() {
    //Returns decreased indent level, from previous.  Decreasing indentation should be in multiples of a unit
    decreaseCurrent = function(previous) {
      if ((this.previousLevel - this.currentLevel) % this.unit.length != 0) {
        //console.log({problem: "Misaligned indentation.", functionName: "decreaseCurrent", unitLength: this.unit.length, currentLevel: this.currentLevel, previousLevel: this.previousLevel})
        throw "Unrecoverable: 406ef688-eaa7-4728-8f7b-85e765ee02fd";
      }
      return previous.substr(0, this.currentLevel);
    }

    //Returns increased indent level, from previous.  Increaasing indentation should only be one unit
    increaseCurrent = function(previous) {
      if ((this.currentLevel - this.previousLevel) != this.unit.length) {
        //console.log({problem: "Misaligned indentation.", functionName: "increaseCurrent", unitLength: this.unit.length, currentLevel: this.currentLevel, previousLevel: this.previousLevel})
        throw "Unrecoverable: 8e5125ac-9544-43ff-8a2f-baaba5c4cfa2";
      }
      return previous + this.unit;
    }

    this.current =
      this.previousLevel > this.currentLevel ? decreaseCurrent.call(this, this.current) :
      this.previousLevel < this.currentLevel ? increaseCurrent.call(this, this.current) :
      this.current; // Assuming this.previousLevel == this.currentLevel
  }

  //Updates the indent object with the currentLevel
  Compiler.prototype.setIndent = function(currentLevel) {
    var indent = this.indent;
    currentLevel = typeof currentLevel == "number" ? currentLevel : 0;

    indent.previousLevel = indent.currentLevel;
    indent.currentLevel = currentLevel;
    indent.setUnit();
    indent.adjustCurrent();
  }

  Compiler.prototype.closePreviouslyCompletedTags = function() {
    while (this.indent.previousLevel >= this.indent.currentLevel && this.resultTail.length > 0) {
      this.resultHead.push(this.resultTail.pop());
      this.indent.previousLevel -= this.indent.unit.length;
      console.log(this.indent, "closePreviouslyCompletedTags81", this.resultTail);
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

  Compiler.prototype.eval = function(statement) {
    console.log(this.indent, "begin", statement);

    this.setIndent(statement.indent);
    console.log(this.indent, "eval101");
    this.flushTextTag();
    console.log(this.indent, "eval103");
    this.closePreviouslyCompletedTags();

    if (typeof statement.scoped == "string") {
      var tagOpen = this.indent.current + '<xsl:for-each select="' + statement.scoped + '">';
      var tagClose = this.indent.current + '</xsl:for-each>';
      this.resultHead.push(tagOpen);
      this.resultTail.push(tagClose);
    }

    if (typeof statement.tag == "string") {
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
  }

  Compiler.prototype.isIncomplete = function() {
    return this.resultTail.length > 0 ? true : false;
  }

  Compiler.prototype.result = function() {
    wrapHead = ['<?xml version="1.0" encoding="ISO-8859-1"?>',
                '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
                '<xsl:template match="/data">']
    wrapTail = ["</xsl:template>", "</xsl:stylesheet>"]

    if (this.isIncomplete()) this.eval({indent: 0});

    return [wrapHead.join("\n"), this.resultHead.join("\n"), wrapTail.join("\n")].join("\n") + "\n";
  }

  return Compiler;
})();