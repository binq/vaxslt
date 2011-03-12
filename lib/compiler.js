var Compiler = (function() {

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

  //The object that handles indentation for the compiler
  var Indent = function () {
    this.unit = "";
    this.current = "";
    this.currentLevel = 0;
    this.previousLevel = 0;
    this.relativeLevel = 0;
  }

  //Compiles the intermediate result from PEG.js into XSLT
  var Compiler = function () {
    this.lineNumber = 0;
    this.resultHead = [];
    this.resultTail = [];
    this.indent = new Indent();
    this.textTag = null;
  }

  //Increases indentation when a source line does not compile to only one node
  Indent.prototype.increase = function() {
    this.relativeLevel += this.unit.length;
    this.adjustCurrent();
  }

  //Updates the indent object with the currentLevel
  Indent.prototype.update = function(currentLevel) {
    currentLevel = typeof currentLevel == "number" ? currentLevel : 0;

    this.previousLevel = this.currentLevel;
    this.currentLevel = currentLevel;
    this.setUnit();
    this.adjustCurrent();
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
      this.current; // this.previousLevel can only be the same as this.currentLevel
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
    var increaseIndent = false

    console.log(this.indent, "begin", statement);

    this.indent.update(statement.indent);
    console.log(this.indent, "eval101");
    this.flushTextTag();
    console.log(this.indent, "eval103");
    this.closePreviouslyCompletedTags();

    if (typeof statement.scoped != "undefined") {
      if (increaseIndent == true) this.indent.increase()

      var tagOpen = this.indent.current + '<xsl:for-each select="' + statement.scoped + '">';
      var tagClose = this.indent.current + '</xsl:for-each>';
      this.resultHead.push(tagOpen);
      this.resultTail.push(tagClose);

      increaseIndent = true
    }

    if (typeof statement.tag == "string") {
      if (increaseIndent == true) this.indent.increase()

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