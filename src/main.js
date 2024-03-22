import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

import { render, h } from "nano-jsx/esm/core.js";
import { Component } from "nano-jsx/esm/component.js";

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
  return (
    <div class="prompt prompt-color undocked">
      <span>{promptText}</span>
      <span id="triangle">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="none">
          <g>
            <path d="M0,0L0,500L500,500L0,0Z"></path>
          </g>
        </svg>
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
        <Prompt isActive={false} promptText={this.prompt} />
        <span class="command-text">{this.commandText}</span>
        <div class="process-output" ref={el => (this.outputEl = el)}>{this.processOutput}</div>
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
// * Create class/object, that inherits Component, for storing commands that have already been run, their prompt, and their output
// * Figure out how to render part of a command. We need to be able to run command with arbitrarily long scrollback without impacting performance. Split on new line? I guess.
//      Maybe using (https://nanojsx.io/components.html#visible)
//      We really don't want scrolling to be janky at all.
//      A line is 18 pixels right now, we want to support like up to 100,000 lines, so 18,000,000px
// I need to figure out how I'm doing wrapping and paging, `less -S` should be obsolete

// We only need control+c and control+d as "native" keyboard shortcuts. Linux FB console only supports those and control+z, which is more trouble than its worth

function executeCommand (commandText, id) {
  invoke("execute", { command: commandText, id: id });



  // const element = render(<CommandDisplay command={command}/>)

  // // const element = document.createElement("pre");
  // scrollback.appendChild(element);
  // runningCommands[id] = {
  //   id: id,
  //   command: command,
  //   element: element
  // }

  const command = new CommandInstance("<TODO: Get prompt here>", commandText, id);
  runningCommands[id] = command;

  // const command = <CommandInstance ref={ref} prompt= />;
  // debugger;

  // .appendChild(render(command));
  // Don't replace existing elements
  render(command.getJSX(), scrollback, false);

  console.log(runningCommands);
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

listen("eof", function () {
  console.log("got eof");
});

// console.log("invoking blocking function");
// invoke("execute", { command: "ruby /Users/matthias/Programs/SMASH/blocking-test.rb", id: "test-one" });

// setTimeout(function () {invoke("kill", { target: "test-one" })}, 500);

commandInput.addEventListener("keypress", function (event) {
  console.log(event)
  if (event.key === "Enter") {
    executeCommand(commandInput.textContent, Math.random().toFixed(10));
    event.preventDefault();
    commandInput.textContent = "";
  }
});
