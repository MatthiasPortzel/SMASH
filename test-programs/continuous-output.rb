loop do
    puts "Hello world"
    STDOUT.flush # TODO: flush isn't required when running this under iTerm, but is when running in SMASH. Why?
    sleep 2
end
