// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::process::{Stdio,Child};
use std::collections::HashMap;


// Traits can only be used if they're in scope ;)
use std::io::Read;

use std::sync::{Mutex, Arc};

use std::cell::Cell;

// use std::thread;

use tauri::{Manager, State, Window};

use std::thread::JoinHandle;



// TODO: We need to be able to support multiple processes at a time. This is going to be ugly! Woohoo!
// // One "pane" is a scrollback + prompt.
// // Each pane can only have one process running at a time.
// #[tarui::command]
// fn create_pane() -> String {

// }


// Something like
// std::sync::RwLock<Vec<RunningProcess>>
// where Command has an owned pointer to the Child process and to the Thread monitoring that child process and it can kill both of them

// I can't kill the child process because the thread and the main thread would both need a mutable reference to the child. The thread need a mutable reference to read, the main thread needs a mutable reference to kill. (Unless it's possible for one thread to have a mutable reference to child.stdout while another thread has a mutable reference to child.) So I'm going to try out select.

// All I want to do is have a child process, and I want to read data from stdout, and also be able to kill the child process. I can't do this without an async runtime because `read` blocks, and if `read` blocks with a mutable reference to the child, I can't kill the child.
// It might be possible with a thread if you send the thread an OS-signal

// Read and kill the child both require a mutable reference and Rust is designed to prevent me from getting two mutable references at the same time, so I can't kill it while reading.


// Written by ChatGTP so it can't be wrong

// Since this is a Tauri state global, we, can only have interior mutability
struct RunningProcess {
    child: Child,
    monitor_thread: JoinHandle<()>,
}

impl RunningProcess {
    // fn new(child: Child, monitor_thread: JoinHandle<()>) -> Self {
    //     RunningProcess {
    //         child,
    //         monitor_thread,
    //     }
    // }

    fn kill(mut self) -> std::io::Result<()> {
        // Kill both the child process and the monitor thread
        // TODO: I'd rather return an error (since we're already returning a result) instead of panicking here
        // self.child.lock().unwrap().kill()?;
        // lock().unwrap() handles getting the lock, then we have an optional
        // self.child.lock().unwrap().as_mut().unwrap().kill()?;
        self.child.kill()?;
        // This lock shouldn't be a problem since this should only be called from the main thread
        // works
        // self.monitor_thread.lock().unwrap().take().unwrap().join().expect("Failed to join monitor thread");
        self.monitor_thread.join().expect("Failed to join monitor thread");

        Ok(())
    }
}

struct RunningProcesses {
    map: Mutex<HashMap<String, RunningProcess>>
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn execute(window: Window, command: &str, id: &str, running_processes: State<RunningProcesses>) -> String {
    let mut parts = command.trim().split_whitespace();
    let exe = parts.next().unwrap();

    let mut child = Command::new(exe)
        .args(parts)
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();

    let mut child_stdout = child.stdout.take().unwrap();

    // There's an asterisk here, help!
    // *running_process.child.lock().unwrap() = Some(child);


    // The thread and the main thread need a reference to the child

    // let child_arc = Arc::new(child);
    // let child_thread_copy = Arc::clone(&child_arc);
    // child_thread_copy.stdout.unwrap();

    // Need to copy this so that we can use it in the thread
    // We can't copy it in the thread because we can't use `id` in the thread (or `id` gets moved into the thread)
    let id_copy = id.to_string();

    // Need to spawn a thread in order to poll the child io and dispatch events to JS
    let thread_handle = std::thread::spawn(move || {
        loop {
            let mut byte: [u8; 1] = [0];
            // child_stdout.read(&buf);

            // Ideally I want to read as much data is available into a Vec,
            //  then iterate it for EOF, if that's really necessary, instead of reading and
            //  sending one byte at a time like this is doing.
            // Of course, JS needs to be able to handle 1 byte at a time in case the underlying
            //  command outputs one byte at a time, so it's not a big deal

            // The semantics I really want is "read as much as is ready if it's ready—do not block"
            // Then I can "poll" on my own time and still accept other signals

            // But this blocks
            println!("Reading a byte");
            match child_stdout.read(&mut byte) {
                Ok(0) => {
                    // Read EOF
                    // We read EOF at the end of the process's output, or when the process has been killed
                    let _ = window.emit("eof", id_copy.clone());

                    // Ends the loop and the thread
                    break;
                }
                Ok(_) => {
                    println!("Read a byte, sending data");

                    // LF
                    // if byte[0] == 0x0A {}


                    //     tx.send(match String::from_utf8(buf.clone()) {
                    //           Ok(line) => Ok(PipedLine::Line(line)),
                    //           Err(err) => Err(PipeError::NotUtf8(err)),
                    //       })
                    //       .unwrap();
                    //     buf.clear()
                    // } else {
                    //     buf.push(byte[0])
                    // }

                    // Pass tuple with both ID and data
                    let _ = window.emit("data", (id_copy.clone(), byte));
                }
                Err(_error) => {
                    println!("Errored?");
                    // In what world would this error?
                    // "any form of I/O or other error"
                    // I haven't encountered any errors here yet
                    // tx.send(Err(PipeError::IO(error))).unwrap();
                }
            }

            // window.emit("stdout", Payload { message: "Tauri is awesome!".into() }).unwrap();
        }
    });

    // *running_process.monitor_thread.lock().unwrap() = Some(thread_handle);

    // child.stdout.unwrap().

    // running_processes.map.lock().unwrap().insert(id.to_string(), RunningProcess { child: child_arc, monitor_thread: thread_handle });


    // We take a lock on the whole running_processes map here, which feels weird, but I think is needed.
    // And it's totally fine since this lock isn't used in the thread, so it's only locked for the fraction of a second that it takes to start the process and put it in the map
    running_processes.map.lock().unwrap().insert(
       id.to_string(),
       RunningProcess {
            child: child, // move ownership of the child into the HashMap
            monitor_thread: thread_handle
       }
    );

    "executing".to_string()
}

#[tauri::command]
fn kill(target: &str, running_processes: State<RunningProcesses>) {
    // Just send control-C to the target
    // running_process.inner().kill();

    // If we aren't running a process, this panics, woohoo.
    // Should fix that.

    // running_process.child
    //     .lock().unwrap() // .lock() locks the mutex but returns an optional in case it fails, so we have to unwrap that
    //     .take() // Takes ownership of the optional, leaving None
    //     .unwrap() // Unwraps the optional, giving us the ChildProcess
    //     .kill().unwrap();

    //     //.as_mut().unwrap().kill()?;
    //     // This lock shouldn't be a problem since this should only be called from the main thread
    //     // works
    //     // self.monitor_thread.lock().unwrap().take().unwrap().join().expect("Failed to join monitor thread");
    // running_process.monitor_thread
    //     .lock().unwrap()
    //     .take()
    //     .unwrap()
    //     .join().expect("Failed to join monitor thread");

    // Move the running process out of the HashMap, so we own it
    let process = running_processes.map.lock().unwrap().remove(target);
    // Would love to do error handling and propagate this error but I don't know how to write the type signatures for this function
    // I also don't understand the difference between a Result and Error and Option and panicking.
    let _ = process.unwrap().kill();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // .manage(RunningProcess { child: Default::default(), monitor_thread: Default::default() })
        .manage(RunningProcesses { map: Default::default() })
        .invoke_handler(tauri::generate_handler![execute, kill])
        // .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    println!("Hello world");
}
