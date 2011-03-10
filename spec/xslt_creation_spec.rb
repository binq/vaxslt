%w(rubygems johnson yaml json).each { |i| require i }

describe "XSLT Creation" do
  #This parser can parse VanStash scripts
  parser = lambda do
    root = Pathname(__FILE__).realpath.dirname + ".."
    template = [(root + "vendor/pegjs/lib/compiler.js").read,
                (root + "vendor/pegjs/lib/metagrammar.js").read,
                (root + "lib/compiler.js").read,
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
      <?xml version="1.0" encoding="ISO-8859-1"?>
      <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
      <xsl:template match="/data">
      <html>
        <head>
        </head>
        <body>
          <div>
            Hello World
          </div>
        </body>
      </html>
      </xsl:template>
      </xsl:stylesheet>
    EOM

    parser.call(src).should == result
  end

  it "should compile when a tag indented three up finishes" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          #one
            #two
              #three
          #four
    EOM

    result = YAML::load(<<-EOM)
    |
      <?xml version="1.0" encoding="ISO-8859-1"?>
      <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
      <xsl:template match="/data">
      <html>
        <head>
        </head>
        <body>
          <div id="one">
            <div id="two">
              <div id="three">
              </div>
            </div>
          </div>
          <div id="four">
          </div>
        </body>
      </html>
      </xsl:template>
      </xsl:stylesheet>
    EOM

    parser.call(src).should == result
  end

  it "should compile when a tag is defined using the shortcut with id" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          #header Hello World
    EOM

    result = YAML::load(<<-EOM)
    |
      <?xml version="1.0" encoding="ISO-8859-1"?>
      <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
      <xsl:template match="/data">
      <html>
        <head>
        </head>
        <body>
          <div id="header">
            Hello World
          </div>
        </body>
      </html>
      </xsl:template>
      </xsl:stylesheet>
    EOM

    parser.call(src).should == result
  end

  it "should compile when a tag is defined using the shortcut with class" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          .header-one.header-two Hello World
    EOM

    result = YAML::load(<<-EOM)
    |
      <?xml version="1.0" encoding="ISO-8859-1"?>
      <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
      <xsl:template match="/data">
      <html>
        <head>
        </head>
        <body>
          <div class="header-one header-two">
            Hello World
          </div>
        </body>
      </html>
      </xsl:template>
      </xsl:stylesheet>
    EOM

    parser.call(src).should == result
  end

  it "should compile when there is a call to a selection" do
    src = YAML::load(<<-EOM)
    |-
      %html
        %head
        %body
          @header
            #header=_
    EOM

    result = YAML::load(<<-EOM)
    |
      <?xml version="1.0" encoding="ISO-8859-1"?>
      <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
      <xsl:template match="/data">
      <html>
        <head>
        </head>
        <body>
          <xsl:for-each select="header">
            <div id="header">
              <xsl:value-of select="." />
            </div>
          </xsl:for-each>
        </body>
      </html>
      </xsl:template>
      </xsl:stylesheet>
    EOM

    parser.call(src).should == result
  end

  it "should compile when there is a call to a selection inline" do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          @#header= _
    EOM

    result = YAML::load(<<-EOM)
    |
      <?xml version="1.0" encoding="ISO-8859-1"?>
      <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
      <xsl:template match="/data">
      <html>
        <head>
        </head>
        <body>
          <xsl:for-each select="header">
          <div id="header">
            <xsl:value-of select="." />
          </div>
          </xsl:for-each>
        </body>
      </html>
      </xsl:template>
      </xsl:stylesheet>
    EOM

    parser.call(src).should == result
  end

  it "should compile when there is a call to handle a deselection"; lambda do
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

  it "should compile when there is a call to handle a deselection inline"; lambda do
    src = YAML::load(<<-EOM)
    |
      %html
        %head
        %body
          ^#header=@_
    EOM

    src.should == src
  end

  it "should compile everything"; lambda do
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
