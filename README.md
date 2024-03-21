# SMASH
*A different type of terminal*


# Why is this made with web-tech. Browsers are slow
First, keypress latency is faster in SMASH than in iTerm2 on my computer.
Second, SMASH does not have speed as a primary objective (like some GPU-based terminals). However, SMASH should always feel lightweight and fast. If you have a benchmark identifying a performance bottleneck in SMASH, file a bug. Components can be incrementally moved to the Rust backend for speed. If it becomes evident that it is not possible to design a responsive application with web tech, I am not opposed to replacing the frontend.

# Building locally
```
npm i
npm run tauri dev
```

# Timeline

## Alpha
This is the point that I and other early adopters will be able to use SMASH (with another Terminal open for interactive apps).
In this phase, we're not doing built or tagged releases.

 - [ X ] Ability to type in commands
 - [ X ] Natural editing
 - [ X ] Sick appearance
 - [ X ] Ability to run commands on Enter
 - [   ] Ability to kill commands with control+c
 - [   ] Ability to cd
 - [   ] Multiple tabs
 - [   ] SSH


## Beta
At this point, I expect to be able to leave my terminal emulator closed, and only open it for specific TUI apps (`screen /dev/tty.usbserial-0001 115200` anyone?).
Releases here will be 0.xx series.

 - [   ] Settings saved to a toml file
 - [   ] Preferences/settings GUI
 - [   ] GUI $PATH manipulation
 - [   ] GUI environment variable manipulation
 - [   ] Forwarding key strokes to the process (exact behavior TBD)
 - [   ] Smart prompt scrolling (exact behavior TBD)
 - [   ] ANSI color code support
 - [   ] Shims/detection and forwarding to get common interactive programs working
 - [   ] Detection and special handling for some readline-like prompts
 - [   ] Basic autocomplete
 - [   ] Basic syntax highlighting
 - [   ] Theming support

## 1.0
The goal will be to replace shimming, forwarding, and other Beta-hacks (which will be necessary to allow the terminal to be usable), with an official "API" (of some sort) that allows other applications (think of the Python REPL) to define autocomplete, syntax highlighting, etc. This will allow SMASH to become a target for the next generation of terminal-like programs (including things that will never be supported by SMASH natively, like traditional shell scripting languages).
1.0 represents when we start working on these features. Once we hit 1.0 we're just getting starting.
We'll figure it out when we get there. 

# Goals and promises

## 5 Things that make the terminal appealing (SMASH maintains all of these)

1. Dark themed by default
2. Assumed to not be maximized—content is constrained to a short horizontal line length
3. Predictable content displaying mechanisms
4. Displayed content is non-interactive
5. Prompt is always focused

## Things SMASH isn't currently interested in supporting
I don't want to promise to never support these things, because it's possible .
* POSIX-compatible or Turning-complete shell script at the prompt (without 3rd-party programs)
* Less, Ncurses, VI, Emacs, Tmux, or other TUI-style applications.
* VI keybindings at the prompt


# Copyright
SMASH is GPLv3.
Additionally, SMASH will revert to the public domain after a reasonable 20 years.
Future versions of SMASH may be licensed differently and you may asked to transfer copyright ownership of contributions to allow this.
