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

# Terminology
SMASH is a terminal, but not a terminal emulator. It does not emulate the VT102 like other terminals.
> a device at which a user enters data or commands for a computer system and which displays the received output.
- New Oxford American English Dictionary (2023)

SMASH is also a shell because it ends in "sh", as is required.
I don't know what a console is, and I made SMASH, so SMASH cannot be a console.

"Process" has a reasonable definition brought to us by the POSIX standard. SMASH can start child processes.
The command-text is a line or multiple lines of text that you enter into the terminal to be executed.
The command-input is the area where you actually type in your command.
The prompt is the text that is in front of the command-input.
A prompt is any of the bits of texts before any of your previous commands.
Process-output is the text which the child process outputs.
Scrollback is all of the text composing your previous prompts, commands, and process-outputs. It does not include the prompt or the command-input.

A command is the "parent" which owns a process, output, prompt, command-text, etc.

Historical prompts (so not the prompt) are never docked.
The prompt is normally docked, but can also be undocked (if you're in scroll-past-end mode).
For now, and we might need to refine this, a prompt is "active" if it is the prompt or its command hasn't finished. 


I will casually use "prompt" to refer to the prompt and the corresponding command-text / command-input, since the command is entered "at the prompt".



# Timeline

## Alpha
This is the point that I and other early adopters will be able to use SMASH (with another Terminal open for interactive apps).
In this phase, we're not doing built or tagged releases.

 - [ X ] Ability to type in commands
 - [ X ] Natural editing
 - [ X ] Sick appearance
 - [ X ] Ability to run commands on Enter
 - [   ] Ability to kill commands with control+c
 - [ X ] Ability to cd
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
