%w(johnson yaml json).each { |i| require i }

describe "XSLT Creation" do
  #This parser can parse VanStash scripts
  parser = lambda do
    root = Pathname(__FILE__).realpath.dirname + ".."
    template = [(root + "lib/json2.js").read, 
                (root + "vendor/pegjs/lib/compiler.js").read, 
                (root + "vendor/pegjs/lib/metagrammar.js").read,
                "VanStash = PEG.buildParser(%s);" % [(root + "lib/grammar.peg").read.to_json]].join("\n\n")

    lambda { |van_stash|
      begin
        src = template + "\n\nVanStash.parse(%s);" % [van_stash.to_json]
        Johnson.evaluate(src)   #.tap { |r| puts r }
      rescue
        (root + "src_dump.js").open("w") { |fh| fh << src }
        raise $!
      end
    }
  end.call

  it "should compile a simple example" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          %div Hello World
    EOM

    result = YAML::load(<<-EOM)
    |
      {"tag":"html","indent":""}
      {"tag":"head","indent":"  "}
      {"tag":"body","indent":"  "}
      {"tag":"div","text":"Hello World","indent":"    "}
      ""
    EOM

    parser.call(src).should == result.strip
  end

  it "should compile when a tag is defined using the shortcut with id" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          #header Hello World
    EOM

    src.should == src
  end

  it "should compile when a tag is defined using the shortcut with class" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          .header Hello World
    EOM

    src.should == src
  end

  it "should compile when there is a call to a selection" do
    src = YAML::load(<<-EOM)
    |-
      %html
        %head
        %body
          @header
            #header=@_
    EOM

    src.should == src
  end

  it "should compile when there is a call to a selection inline" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          @#header=@_
    EOM

    src.should == src
  end

  it "should compile when there is a call to handle a deselection" do
    src = YAML::load(<<-EOM)
    |-
      %html
        %head
        %body
          ^header
            #header=@_
    EOM

    src.should == src
  end

  it "should compile when there is a call to handle a deselection inline" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          ^#header=@_
    EOM

    src.should == src
  end

  it "should compile everything" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          #header Hello World
          %ul#nav
            @nav
              %li.nav @_
            ^nav
              %li.nav Home
          > content
          @#footer
            = copyright
          ^#footer
            Copyright 2011
    EOM

    src.should == src
  end
end
