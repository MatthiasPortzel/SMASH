import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

import { render, h } from "nano-jsx/esm/core.js";
import { Component } from "nano-jsx/esm/component.js";

// The class-names helper
const c = (...classNames) => classNames.filter(v => v).join(" ");

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

const commandInput = document.querySelector("#command-input");

const runningCommands = {};

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
  const isDocked = false;
  if (!isActive && isDocked) throw new Error("Can't dock non-active prompt.");
  return (
    <div class={c("prompt", isDocked ? "docked" : "undocked", isActive && "active")}>
      <span class="sidebar-overflow-span"></span>
      <span class="prompt-color">{promptText}</span>
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
              <path d="M0,0L500,250L0,500"></path>
            </g>
          </svg>
      }
      </span>
    </div>
  );
}

//
class CommandInstance {
  constructor(prompt, commandText, processId) {
    this.prompt = prompt;
    this.commandText = commandText;
    this.processId = processId;
    this.processOutput = "";
    this.outputEl = undefined;
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
  }
}

// TODO:
// * Standardize terminology (command / process / prompt / terminal etc) -- done
// * Create class/object, that inherits Component, for storing commands that have already been run, their prompt, and their output -- done
// * Figure out how to render part of a command. We need to be able to run command with arbitrarily long scrollback without impacting performance. Split on new line? I guess.
//      Maybe using (https://nanojsx.io/components.html#visible)
//      We really don't want scrolling to be janky at all.
//      A line is 18 pixels right now, we want to support like up to 100,000 lines, so 18,000,000px
// I need to figure out how I'm doing wrapping and paging, `less -S` should be obsolete

// We only need control+c and control+d as "native" keyboard shortcuts. Linux FB console only supports those and control+z, which is more trouble than its worth

async function executeCommand (commandText, id) {
  // This doesn't wait for the command to finish, it waits for the backend to spawn the process
  const res = await invoke("execute", { command: commandText, id: id });

  const command = new CommandInstance("<TODO: Get prompt here>", commandText, id);
  runningCommands[id] = command;

  // false for don't replace existing elements
  render(command.getJSX(), scrollback, false);

  console.log(runningCommands);

  // Now, if we failed to start the command, then we won't ever get data, so we can print an error message now
  if (res !== "executing") {
    // Print the error message
    command.appendOutput(res);
    // Remove from runningCommands?
    // I think I should rename runningCommand to commands and use it to track finished commands as well.
    // // Remove from runningCommands
    // delete runningCommands[id];
  }
}

function killCommand (id) {
  invoke("kill", { target: id} );
}

// We can only have one process running at a time, so we just need one event listener for buffering stdin messages
listen("data", function (event) {
  console.log("got data", event);
  const [target_id, data] = event.payload;
  runningCommands[target_id].appendOutput(data.map(b => String.fromCharCode(b)).join(""))
});

listen("eof", function (event) {
  console.log("got eof", event);
  // remove from runningCommands??
});


// console.log("invoking blocking function");
// invoke("execute", { command: "ruby /Users/matthias/Programs/SMASH/blocking-test.rb", id: "test-one" });

commandInput.addEventListener("keypress", function (event) {
  // console.log(event)
  if (event.key === "Enter") {
    executeCommand(commandInput.textContent, Math.random().toFixed(10));
    event.preventDefault();
    commandInput.textContent = "";
  }
});

// -- Prompt-always-focused --
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

