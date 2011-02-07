/*
%html
  %head
  %body
    #header Hello World
    %ul#nav
      @nav
        %li.nav= $_
      ^nav
        %li.nav Home
    > content
    @#footer
      = copyright
    ^#footer
      Copyright 2011
*/

start
  = lines

lines
  = intermediate:intermediate_lines* last:line { return intermediate.concat(last); }

intermediate_lines
  = line:line "\n" { return line; }

line
  = indent:indent line:bare_line {
    line.indent = indent.length;
    return line;
  }
  / indent:indent
  /

bare_line
  = tag_line
  / referencing
  / dereferencing
  / view_partial_line
  / replacement
  / text

tag_line
  = tag_labels:tag_labels predicate:tag_line_predicate {
    var result = {};

    result.tag = tag_labels.tag;
    if (typeof tag_labels.id != "undefined") result.id = tag_labels.id;
    if (typeof tag_labels.referencing != "undefined") result.referencing = tag_labels.referencing;
    if (typeof tag_labels.dereferencing != "undefined") result.dereferencing = tag_labels.dereferencing;
    if (typeof tag_labels.classes != "undefined") result.classes = tag_labels.classes;
    if (typeof predicate != "undefined" && typeof predicate.replacement != "undefined") { result.replacement = predicate.replacement; }
    if (typeof predicate != "undefined" && typeof predicate.text != "undefined") { result.text = predicate.text; }

    return result;
  }

tag_line_predicate
  = replacement
  / referencing
  / dereferencing
  / spaced_text
  /

tag_labels
  = tag_labels:tag_label+  {
    var result = {tag: "div"};

    for(var i=0; i<tag_labels.length; i++) {
      switch(tag_labels[i].type) {
      case 'tag':
        result.tag = tag_labels[i].label;
        break;
      case 'id':
        result.id = tag_labels[i].label;
        break;
      case 'class':
        if (typeof result.classes == "undefined") result.classes = [];
        result.classes.push(tag_labels[i].label);
        break;
      case 'referencing-with-id':
        result.id = tag_labels[i].label;
        result.referencing = tag_labels[i].label;
        break;
      case 'dereferencing-with-id':
        result.id = tag_labels[i].label;
        result.dereferencing = tag_labels[i].label;
        break;
      default:
        throw "Can't be";
        break;
      }
    }

    return result;
  }

tag_label
  = '%'  token:token { return {type: 'tag',                   label: token}; }
  / '@#' token:token { return {type: 'referencing-with-id',   label: token}; }
  / '^#' token:token { return {type: 'dereferencing-with-id', label: token}; }
  / '#'  token:token { return {type: 'id',                    label: token}; }
  / '.'  token:token { return {type: 'class',                 label: token}; }

spaced_text
  = " "+ text:text { return text; }

replacement
  = '=' spaces token:token { return {replacement: token}; }

referencing
  = '@' spaces token:token { return {referencing: token}; }

dereferencing
  = '^' spaces token:token { return {dereferencing: token}; }

view_partial_line
  = '>' spaces token:token { return {partial: token}; }

text
  = text:[^\n]+ { return {text: text.join('')}; }

indent
  = spaces

spaces
  = [ ]*

token
  = token_head:[a-zA-Z] token_rest:[a-zA-Z0-9:_-]* { return token_head + token_rest.join(''); }
  / '_' { return '_'; }
