# TODO 1.0

* help

* extended prompt (including switch?)

* command history (in-memory) and autocompletion

* save and load game

# FIXME 1.1

* CommandParser#ParseAmbiguity

* Deal with Player#processLine returning weird state { gameOver: false }
    should assign it instead to player instance

* fix bug: you can 'drink from jug' even when you don't carry it

# NEXT BIG THING - SAVE THE LUNCH!

next, original game ("Save the lunch!") 

- separate engine from game data (try it with grelok? publish my own engine)

- both engine and game - separate repositories, separate versions...

