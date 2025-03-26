# SMASH
*A different type of terminal*

⚠️ SMASH is currently Pre-Alpha and does not implement some features that are required for many workflows.

## Goals and promises

### Why a new terminal
There is no shortage of terminal emulators. In addition to well established players, there's a new generation of terminal emulators which have been created in the last 10 years. Coincidentally, there is also no shortage of shells to use in your terminal emulator, both old and new.

However, zooming out, those terminals are all providing the same basic interface: a grid of cells and a cursor which is constrained to that grid. And every shell option you could use is constrained by having to fit in a basic terminal. Many features that would be desirable to implement in the terminal or the shell are impossible to implement without rich integration with the other.

SMASH is an experiment. It smashes the terminal-shell dichotomy and implements both. Instead of a grid-of-cells, it directly implements the GUI elements that a terminal and shell need.

It feels very familiar. You write commands at the prompt, and hit enter to run them. The programs write to standard-out, and that text shows up on your screen. The difference is that, at no point is your input and the programs' output squished into a fixed-size text grid.

Some features that SMASH can offer because of its design:
* Natural text editing, like any other text box (for example, selecting text with the mouse and cutting with command+x)
* Ability to handle input and output streams without collision ever leading to messed up output
* Natural scrolling and a floating prompt
* Pop-up (IDE-style) auto-completion suggestions and fast syntax highlighting at the prompt
* GUI shell configuration and shell settings taking effect without restarting your session

While many features that are required for SMASH to be usable every-day are not yet implemented, you can try out the basic interface paradigm already, and decide if natural editing at the terminal is something you're interested in.

### Things that make the terminal appealing (SMASH will maintain all of these)

1. Dark themed by default
2. Assumed to not be maximized—content is constrained to a short horizontal line length
3. Predictable content displaying mechanisms
4. Displayed content is non-interactive
5. Prompt is always focused
6. Lightweight and fast

### Things SMASH isn't interested in supporting
I don't want to promise to never support these things. It's possible that they will be included temporarily or included as a fallback in order to ensure that the terminal is usable.
* POSIX-compatible or Turning-complete shell script at the prompt. SMASH is focused on better UX for every-day terminal use. 
* Less, Ncurses, VI, Emacs, Tmux, or other TUI-style applications.
* VI keybindings at the prompt

## Why is this made with web-tech. Browsers are slow
SMASH does not have speed as a primary objective (like some GPU-based terminals). However, SMASH should always feel lightweight and fast. If you have a benchmark identifying a performance bottleneck in SMASH, file a bug. Components can be incrementally moved to the Rust backend for speed. If it becomes evident that it is not possible to design a responsive application with web tech, I am not opposed to replacing the frontend.

## Milestones

Current milestone: Pre-Alpha

### Alpha
After these features are implemented I and other early adopters will be able to use SMASH (with another Terminal open for interactive apps).
In this phase, we're only doing automated nightly releases

 - [   ] Ability to type in commands
 - [ X ] Natural editing
 - [ X ] Sick appearance
 - [ X ] Ability to run commands on Enter
 - [   ] Ability to kill commands with control+c
 - [   ] Ability to cd
 - [   ] Nightly CI releases

### Beta
After these features are implemented, I expect to be able to leave my terminal emulator closed, and only open it for specific TUI apps (`screen /dev/tty.usbserial-0001 115200` anyone?).
Releases here will be 0.xx series.

 - [   ] Multiple tabs
 - [   ] SSH
 - [   ] Visual indicator for still-running processes
 - [   ] Basic autocomplete
 - [   ] The prompt appearance changes when it's not at the bottom of the screen
 - [   ] Settings saved to a toml file
 - [   ] Aliases
 - [   ] Preferences/settings GUI
 - [   ] GUI $PATH manipulation
 - [   ] Ability to set environment variables in a session
 - [   ] GUI environment variable manipulation
 - [   ] Forwarding key strokes to the process (exact behavior TBD)
 - [ X ] Smart prompt scrolling (exact behavior TBD)
 - [   ] ANSI color code support
 - [   ] Shims/detection and forwarding to get common interactive programs working
 - [   ] Detection and special handling for some readline-like prompts
 - [   ] Basic syntax highlighting
 - [   ] Theming support

### 1.0
The goal will be to replace shimming, forwarding, and other Beta-hacks (which will be necessary to allow the terminal to be usable), with an official "API" (of some sort) that allows other applications (think of the Python REPL) to define autocomplete, syntax highlighting, etc. This will allow SMASH to become a target for the next generation of terminal-like programs (including things that will never be supported by SMASH natively, like traditional shell scripting languages).
1.0 represents when we start working on these features. Once we hit 1.0 we're just getting starting.
We'll figure it out when we get there. 

## Building locally
```
npm i
npm run tauri dev
```

## Terminology
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

## Copyright
SMASH is GPLv3.
Future versions of SMASH may be licensed differently and you may be asked to transfer copyright ownership of contributions to allow this.

SMASH makes use of code from tauri, tauri-actions, serde, and resolve-path, all of which are licensed under the MIT license.
