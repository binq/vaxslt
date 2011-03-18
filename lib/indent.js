//The object that handles indentation for the compiler
var Indent = function () {
  this.unit = "";
  this.current = "";
  this.currentLevel = 0;
  this.previousLevel = 0;
  this.relativeLevel = 0;
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
