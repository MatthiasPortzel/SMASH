// Please?
// import { invoke } from "@tauri-apps/api/app"
// import { listen } from "@tauri-apps/api/event"

const { invoke } = window.__TAURI__.core;
const { listen, emit } = window.__TAURI__.event;

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

const commandInput = document.querySelector("#command");

const runningCommands = {};

function executeCommand (command, id) {
  invoke("execute", { command: command, id: id });
  const element = document.createElement("pre");
  scrollback.appendChild(element);
  runningCommands[id] = {
    id: id,
    command: command,
    element: element,
  }
}

function killCommand (id) {
  invoke("kill", { target: id} );
}

// We can only have one process running at a time, so we just need one event listener for buffering stdin messages
listen("data", function (event) {
  console.log("got data", event);
  const [target_id, data] = event.payload;
  runningCommands[target_id].element.textContent += data.map(b => String.fromCharCode(b)).join("")
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
