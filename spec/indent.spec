%w(rubygems johnson yaml json).each { |i| require i }

describe "Indent" do
  #loads up the indet object
  indent = lambda do
    root = Pathname(__FILE__).realpath.dirname + ".."
    template = [(root + "lib/console.js").read,
                (root + "lib/indent.js").read].join("\n\n")

    lambda do |code|
      begin
        src = template + "\n\n%s;" % [code]
        Johnson.evaluate(src)   #.tap { |r| puts r }
      rescue
        (root + "src_dump.js").open("w") { |fh| fh << src }
        raise $!
      end
    end
  end.call
end

