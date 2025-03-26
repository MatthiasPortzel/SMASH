import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

import { render, h } from "nano-jsx/esm/core.js";
import { Component } from "nano-jsx/esm/component.js";

// https://tauri.app/reference/javascript/shell/#methods
// The main API is .spawn, .kill, and .write which forward to
// https://docs.rs/shared_child/latest/shared_child/struct.SharedChild.html
// It doesn't include support for signals, but signals are not a very nice interface so I'll pull in support for them on an ad-hoc basis
import { Command } from '@tauri-apps/plugin-shell';

import { assert } from "./util";

// The class-names helper
function c (...classNames) {
  return classNames.filter(v => v).join(" ")
};

// Initialized to the absolute path to the resolved home directory on start
// This could be robust against changing home directory while still being sync to access
//  by having a "getHomeDir" that sent a request for the current home dir, but returned
//  the last value in the meantime. Idk.
// This also will need to be per-session to support ssh
let HOME_DIR = null;
invoke("resolve_path", { path: "~", cwd: "/" }).then((v) => {
  HOME_DIR = v;
  // Any activeSessions created before this promise resolved will have a null cwd (since they would have been initialized to the null HOME_DIR), so we update them
  Array.from(activeSessions.values()).forEach(session => session.cwd = session.cwd || HOME_DIR);
}).catch(console.error);

let commandCount = 0;
class CommandInstance {
  constructor(prompt, commandText) {
    this.prompt = prompt;
    this.commandText = commandText;
    this.processOutput = "";
    this.outputEl = undefined;
    this.id = commandCount++;
    this.running = false;
  }

  // TODO: CSS
  getJSX () {
    return (
      <div class="command">
        <div class="prompt-line">
          <Prompt isActive={false} promptText={this.prompt} />
          <span class="command-text">{this.commandText}</span>
        </div>
        <pre class="process-output" ref={el => (this.outputEl = el)}>{this.processOutput}</pre>
      </div>
    );
  }

  appendOutput (text) {
    this.processOutput += text;
    this.outputEl.textContent += text;

    queueScrollUpdate();
  }
}

class Session {
  constructor (cwd) {
    this.runningCommand = null; // ?CommandInstance
    this.cwd = HOME_DIR;
  }

  static generateId () {
    // Generate a unique ID for a session.
    // This will be the key in the activeSession map
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  async executeCommand (commandText) {
    assert(this.runningCommand === null, "Can't run a new command with a running command");

    const command = new CommandInstance("<TODO: Get prompt here>", commandText);
    this.runningCommand = command;

    // // This doesn't wait for the command to finish, it waits for the backend to spawn the process
    // const res = await invoke("execute", { command: commandText, sessionId: globalSessionId, commandId: command.id });
    // console.log("setting command running", command);

    const command_parts = commandText.trim().split(/\s/g);
    const exe = command_parts.shift() || "ls";

    // cd has to be a shell-builtin, so we don't need to do anything in the backend (except resolve the path)
    if (exe === "cd") {
      const arg = command_parts.shift() || HOME_DIR;

      console.log({ path: arg, cwd: this.cwd });

      const new_cwd = await invoke("resolve_path", { path: arg, cwd: this.cwd });

      console.log(new_cwd);

      // TODO: Handle error condition here as well as on backend

      self.cwd = new_cwd;
      return;

    } else {
      command.backendCommand = Command.create("echo-name", ["hello"], {
        cwd: null
      });


      command.backendCommand.stdout.on('data', line => { console.log(line); command.appendOutput(line); });
      command.backendCommand.stderr.on('data', command.appendOutput.bind(command));
      
      debugger

      // Spawn starts us in the background
      // .execute would wait until all of the output was done (sync if you will)
      const res = await command.backendCommand.spawn();
      console.log(res);
    }

    command.running = true;


    // false for don't replace existing elements
    render(command.getJSX(), scrollback, false);
    // Since the user has run the command, scroll to the bottom
    queueScrollUpdate();

    // // console.log(runningCommands);

    // // Now, if we failed to start the command, then we won't ever get data, so we can print an error message now
    // if (res !== "executing") {
    //   // Print the error message
    //   command.appendOutput(res);
    //   // Remove from runningCommands?
    //   // I think I should rename runningCommand to commands and use it to track finished commands as well.
    //   // // Remove from runningCommands
    //   // delete runningCommands[id];
    // }
  }
}

const activeSessions = new Map();
const currentSession = new Session(); // This will be tied to the current tab eventually (e.g. currentTab.session)
activeSessions.set(Session.generateId(), currentSession);


// -- UI stuff -- //

// querySelector instead of getById in case we have a more complicated selector in the future
const scrollback = document.querySelector("#scrollback");
// scrollback is going to be a wrapper around a bunch of different command outputs
// so the HTML is going to look something like
// <scrollback>
//    -- <><>prompt</> <>command</></>
//    -- <>command output<>
//    -- <><>prompt</> <>command</></>
//    -- <>command output<>
// </scrollback>
// We need to be able to CSS style the prompt in the scrollback (but maintain rule 4: non-iterative)
// We're going to have to refactor the display at some point, either to improve performance or color or wrapping

/*  TODO: Intercept paste events and make sure you can only type plaintext.
  We want to preserve the ability for there to be richtext (i.e. don't make it a textarea)
  so that we can style e.g. invalid commands or quotes or whatever   */
const commandInput = document.querySelector("#command-input");

// Has a scrollback which is a list of command instance
// Has a name
// Is a component, so it knows how to display its content (so not the tab itself, but the stuff in it)
// Has a running process, prompt, and command-input
class Tab extends Component {

}

// Functional component, no state, since it's rendered by both the prompt and historical prompts
// isActive is true if this is the active prompt
// In the future this will take more complex arguments but for now it's just text
const Prompt = ({ isActive, promptText }) => {
  const isDocked = false; // TODO: This will be passed in here, since the whole command is either docked or not
  if (!isActive && isDocked) throw new Error("Can't dock non-active prompt.");
  return (
    <div class={c("prompt", isActive && "active")}>
      <div class="prompt-text"><span>{promptText}</span></div>
      <span id="triangle">
      {
        isDocked ?
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="none">
            <g>
              <path d="M0,0L0,500L500,500L0,0Z"></path>
            </g>
          </svg>
        :
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="none">
            <g>
              {/* 450 instead of 500 here so that the corner doesn't clip */}
              {/*
                We really want this stroke to be drawn inside the path but the SVG spec people are cowards
                Right now we hack by shifting the element left 1 pixel.
                We should see about doubling the stroke and using a clipping mask to remove the outside. */}
              <path d="M0,0L450,250L0,500" vector-effect="non-scaling-stroke" stroke-linejoin="round"></path>
            </g>
          </svg>
      }
      </span>
    </div>
  );
}

// TODO:
// * Standardize terminology (command / process / prompt / terminal etc) -- done
// * Create class/object, that inherits Component, for storing commands that have already been run, their prompt, and their output -- done
// * Figure out how to render part of a command. We need to be able to run command with arbitrarily long scrollback without impacting performance. Split on new line? I guess.
//      Maybe using (https://nanojsx.io/components.html#visible)
//      We really don't want scrolling to be janky at all.
//      A line is 18 pixels right now, we want to support like up to 100,000 lines, so 18,000,000px
// I need to figure out how I'm doing wrapping and paging, `less -S` should be obsolete

// We only need control+c and control+d as "native" keyboard shortcuts. Linux FB console only supports those and control+z (backgrounding, not undo), which is more trouble than its worth

function killCommand () {
  invoke("kill", { target: globalSessionId} );
}

// We can only have one process running at a time, so we just need one event listener for buffering stdin messages
listen("data", function (event) {
  console.log("got data", event);
  const [sessionId, commandId, data] = event.payload;
  if (sessionId !== globalSessionId) {
    console.warn("Ignoring message from detached session.");
    return;
  }

  assert(runningCommand !== null, "Got data, but the frontend doesn't have a running command.");
  assert(runningCommand.running, "Running command needs to be running");
  assert(commandId === runningCommand.id, `Data received for command #{commandId} should be the running command, but the running command is #${runningCommand.id}.`);

  runningCommand.appendOutput(data.map(b => String.fromCharCode(b)).join(""));
});

listen("eof", function (event) {
  // console.log("got eof", event);
  runningCommand.running = false;
  runningCommand = null;
});


// console.log("invoking blocking function");
// invoke("execute", { command: "ruby /Users/matthias/Programs/SMASH/blocking-test.rb", id: "test-one" });

commandInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();

    if (currentSession.runningCommand !== null) {
      // TODO: we need to handle this by pushing to a queue, but I'm not ready for that yet
      console.warn("Ignoring enter with outstanding running command.");
    } else {
      currentSession.executeCommand(commandInput.textContent);
      commandInput.textContent = "";
    }
  }
});

// -- auto-scroll magic --

let scrollNeedsUpdate = false;

// For performance, we don't want to actually update the scroll every time we get new characters
function queueScrollUpdate () {
  scrollNeedsUpdate = true;
  window.requestAnimationFrame(updateScroll);
}

// This function is called after hitting Enter
// If we're scrolled-past-end (if the prompt isn't docked), then it does nothing
// In the normal case, (which is that we've just ran a command that's created a bunch of output,
//  so we won't be at the bottom of the scrollback anymore), this function scrolls us so that the prompt is
//  right below the bottom of the scrollback
function updateScroll () {
  if (!scrollNeedsUpdate) return;
  scrollNeedsUpdate = false;

  // The container that's scrolling
  const scrollEl = document.getElementById("content");
  // content is our scroll-container, so scrollEl.scrollHeight is the total scroll height that we're working with

  // The prompt wrapper command thing
  const commandEl = document.getElementById("command");

  // If the prompt isn't at the bottom, don't scroll at all.
  // There's an easy way and a hard way to do this, we're going to do it the easy way
  // If the top of the element on the screen is below the height of the contentEl - the element's height
  const commandAtBottom = commandEl.getClientRects()[0].top >= scrollEl.clientHeight - commandEl.clientHeight;
  if (!commandAtBottom) return;

  // scrollEl.scrollTop ranges from 0 (when we're at the top), to scrollEl.scrollHeight - scrollEl.clientHeight
  //  which makes sense: our max scroll position is when the top of the element is it's height away from the bottom
  // It's the distance above the top of the screen that the content starts

  // This is the amount of space that exists under the prompt
  const scrollPastEndHeight = parseInt(getComputedStyle(commandEl).marginBottom, 10);
  // Or equivalently, scrollEl.clientHeight - commandEl.clientHeight

  // Scrolling to this location would put the prompt at the bottom of the screen
  const newPromptLocation = scrollEl.scrollHeight - scrollEl.clientHeight - scrollPastEndHeight;
  // We want to do that if the output is less than a full screen worth
  let newScrollTop = newPromptLocation;

  const lastCommand = document.querySelector("#scrollback .command:last-of-type");
  // The current position lastCommand in the viewport is lastCommand.getClientRects()[0].top
  // It would be off of the screen if we're planning on scrolling down by more than it currently is on the screen
  const wouldBeOffScreen = (newScrollTop - scrollEl.scrollTop) > lastCommand.getClientRects()[0].top;
  // If that would put the last ran command off of the screen
  if (wouldBeOffScreen) {
    // Then we want to scroll such that that command is just barely on screen
    newScrollTop = lastCommand.getClientRects()[0].top + scrollEl.scrollTop;
  }

  // This is the new value for scrollTop, basically
  scrollEl.scrollTo({ top: newScrollTop, behavior: "smooth" });
}

// TODO: Attach an event listener to detect when the prompt has docked or undocked and update the css class accordingly.

// -- Prompt-always-focused --
// TODO: Need to save the current cursor so that we can restore it instead of sending you to the front
// TODO: Tab de-focuses the prompt
// On mouse up, if we don't have a selection, focus the prompt
window.addEventListener("mouseup", function () {
  const selection = window.getSelection();
  if (selection.toString().length === 0) {
    commandInput.focus();
  }
});

// On keypress, if it's not a command+c, focus the prompt
window.addEventListener("keypress", function (event) {
  // Most key presses happen in the prompt
  if (commandInput === document.activeElement) return;

  console.log("non-prompt seeing keypress", event.key, event);
  // TODO: platform-specific/sophisticated detection of copy events
  const isAllowedKeycombo =
    (event.key === "c" && event.metaKey) || // copy
    event.shiftKey; // Allow shift for moving selection

  if (!isAllowedKeycombo) {
    commandInput.focus();
  }
});

// Focus the prompt on page load
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded fired");
  commandInput.focus();
});
