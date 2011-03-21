//The object that handles indentation for the compiler
var Indent = function () {
  this.currentLevel;         //- The length of the current indentation
  this.previousLevel;        //- The length of the previous indentation
  this.unit;                 //- The base indentation string
  this.current="";           //- The current indentation string
  this.multiLineLevels = []; //- Everytime a indentation counts for multiple target lines it is unshifted into this array
                             //- It will be shifted out after the tag has been closed.
}

//Updates the indent object with the currentLevel
Indent.prototype.update = function(currentLevel) {
  currentLevel = typeof currentLevel == "number" ? currentLevel : 0;

  this.previousLevel = this.currentLevel;
  this.currentLevel = currentLevel;
  this.setUnit();
  this.adjustCurrent();
}

Indent.prototype.increase = function() {
  this.multiLineLevels.unshift(this.currentLevel);
}

/*
 * Private functions
 */

//Won't do anything if this.unit has already been set to something besides "", otherwise will set it based on currentLevel
Indent.prototype.setUnit = function(currentLevel) {
  //Nothing to do if this.unit has already been set or if there is no currentLevel
  if (typeof this.unit == "string" || this.currentLevel == 0) return;

  this.unit = "";
  for(var i=0; i<this.currentLevel; i++) this.unit += " ";
}

//Returns decreased indent level, from previous.  Decreasing indentation should be in multiples of a unit
Indent.prototype.decreaseCurrent = function() {
  var previous = this.current;

  if ((this.previousLevel - this.currentLevel) % this.unit.length != 0) {
    //console.log({problem: "Misaligned indentation.", functionName: "decreaseCurrent", unitLength: this.unit.length, currentLevel: this.currentLevel, previousLevel: this.previousLevel})
    throw "Unrecoverable: 406ef688-eaa7-4728-8f7b-85e765ee02fd";
  }
  return previous.substr(0, this.currentLevel);
}

//Returns increased indent level, from previous.  Increaasing indentation should only be one unit
Indent.prototype.increaseCurrent = function() {
  var previous = this.current;

  if ((this.currentLevel - this.previousLevel) != this.unit.length) {
    //console.log({problem: "Misaligned indentation.", functionName: "increaseCurrent", unitLength: this.unit.length, currentLevel: this.currentLevel, previousLevel: this.previousLevel})
    throw "Unrecoverable: 8e5125ac-9544-43ff-8a2f-baaba5c4cfa2";
  }
  return previous + this.unit;
}

//Sets the value for current based on currentLevel
Indent.prototype.adjustCurrent = function() {
  this.current =
    this.previousLevel > this.currentLevel ? this.decreaseCurrent() :
    this.previousLevel < this.currentLevel ? this.increaseCurrent() :
    this.current; // this.previousLevel can only be the same as this.currentLevel
}
