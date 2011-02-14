importPackage(java.io);
importPackage(java.lang);

var FILE_STDIN  = "-";
var FILE_STDOUT = "-";

load(arguments[0] + "/../lib/json2.js");
load(arguments[0] + "/../lib/grammar.js");

function readFile(file) {
  var f = new BufferedReader(new InputStreamReader(
    file === FILE_STDIN ? System["in"] : new FileInputStream(file)
  ));

  var result = "";
  var line = "";
  try {
    while ((line = f.readLine()) !== null) {
      result += line + "\n";
    }
  } finally {
    f.close();
  }

  return result;
}

function writeFile(file, text) {
  var f = new BufferedWriter(new OutputStreamWriter(
    file === FILE_STDOUT ? System.out : new FileOutputStream(file)
  ));

  try {
    f.write(text);
  } finally {
    f.close();
  }
}

function exitFailure() {
  quit(1);
}

function abort(message) {
  System.out.println(message);
  exitFailure();
}

var input = readFile(FILE_STDIN);
System.out.println("Input: ");
System.out.println(input);
try {
  var output = VanStash.parse(input);
//  System.out.println("Output: ");
//  System.out.println(output);
} catch (e) {
  if (e.line !== undefined && e.column !== undefined) {
    abort(e.line + ":" + e.column + ": " + e.message);
  } else {
    abort(e.message);
  }
}
writeFile(FILE_STDOUT, output);
