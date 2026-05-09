
# this file contains extensions to core ruby classes

class String
  def chop_to_lines(max_width = 70)
    words = self.split(/ +/)
    arr = []

    str = ""
    words.each do |word|
      if (str.size >= max_width)
        arr << str
        str = ""
      end

      str += " #{word}"
    end

    arr << str unless str.empty?

    arr.collect { |line| line.lstrip }.join("\n")
  end
end
