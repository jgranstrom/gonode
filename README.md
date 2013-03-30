gonode - Go for node.js
===

## What is gonode?

**gonode** act as a bridge between Go and node.js. It introduces a way to combine the asynchronous nature of node with the simplicity of concurrency in Go. gonode will in a non-blocking fashion run Go code directly from within your node modules, and asynchronously return results from Go. You can code anything you wish as long as the required communication between Go and node.js can be represented with JSON.

## Install

First make sure that you have installed [Go][] and set up your [GOPATH][] as the [gonodepkg][] will be automatically installed to the first path specified in your GOPATH.

Then install gonode by running:

```bash
npm install gonode
```

You should now be all set up and no more commands are required.

*Note:* Even though gonodepkg is installed automatically with gonode you may find yourself in need of installing it explicitly. Install gonodepkg by itself by running:

```bash
go get github.com/jgranstrom/gonodepkg
```

## Introduction

To set up communications you need to initiate the gonode module in node and also start the gonodepkg in Go.

Basic requirements in node.js:

```js
var Go = require('gonode').Go;
var go = new Go({
	path	: 'gofile.go',
});

go.init(function(err) {
	if (err) throw err;

	// TODO: Add code to execute commands

	go.close();
});
```

Basic requirements in Go (gofile.go):

```go
package main

import gonode "github.com/jgranstrom/gonodepkg"

func main() {	
	gonode.Start(process)
}

func process(cmd gonode.CommandData) (response gonode.CommandData) {
	// TODO: Add code for processing commands from node
	return cmd
}
```

## Initializing gonode

You can initialize gonode either by explicitly calling `init()` or by settings the option `initAtOnce` to `true` and optionally provide the initialization callback directly in to Go constructor.

```js
var Go = require('gonode').Go;

var options = {
	path		: 'gofile.go',
	initAtOnce	: true,	
}
var go = new Go(options, function(err) {
	if (err) throw err;

	// TODO: Add code to execute commands

	go.close();
});
```

As you can see `close()` should be called when you no longer need the Go object and will gracefully end the Go process when all executing commands has finished.

###### Initialization options
* `path`: The path of the go-file to execute. *(Required)*
* `initAtOnce`: Will initialize Go at once when object created if `true`, and allows initialization callback to be provided in constructor. *(Default: `false`)*
* `maxCommandsRunning`: Specifies the maximum number of commands allowed to be running simultaneously, may impact performance differently depending on Go implementation. *(Default: `10`)*
* `defaultCommandTimeoutSec`: Specifies the default command timeout in seconds to be used when not specified in command options. *(Default: `5`)*
* `cwd`: The working directory of the Go process. *(Default: Current working directory of the node process)*

## Executing commands

**Running commands with gonode** is really simple, the following is an example presuming go is an initialized Go object:

```js
go.execute({text: 'Hello world from gonode!'}, function(result, response) {
	if(result.ok) {
		console.log('Go responded: ' + response.text);
	}
});
```

`execute()` accepts a JSON object to be sent to the Go process, and a callback which will be called when Go returns with a result or when the command reaches a timeout limit or is terminated. 
`result` represents the result of the execution of this command.
`response` will contain a JSON object with the result of the response only if `result.ok` is set to `true`.

`result` may have one and only one of the following set to `true`:
* `ok`: The command has executed and responded as expected, response data are in `response`.
* `timeout`: The command reached a timeout by exceeding the set execution time limit.
* `terminated`: The command has been internally terminated prior to responding. This is set when external errors are raised, such as Go panic.

`execute()` returns `true` if the command has been registered and eventually will be executed, or `false` if the command was ignored either because gonode hasn't been initialized yet, or because gonode is in the process of closing or terminating.

Note that the JSON object to send can contain anything containable in JSON and in arbitrary structure, and the JSON object returned does not have to obey to any structure of the sent object as they are completely independent. The structure of the returned object is decided in Go.

**Processing the command in Go** is possibly even simpler:

```go
func process(cmd gonode.CommandData) (response gonode.CommandData) {	
	response = make(gonode.CommandData)

	if(cmd["text"] == "Hello") {
		response["text"] = "Well hello there!"
	} else {
		response["text"] = "What?"
	}

	return
}
```

Each command sent to Go will be delegated to the provided `process()` on a new go-routine and `cmd` will contain a `CommandData` object (a wrapper for `map[string]interface{}`) which will be a representation of the JSON object received from node.
Each `process()` call must return a `CommandData` object containing any data to be part of the response back to node. The response object will, like the command object, be transmitted in JSON.

###### Command options
* `commandTimeoutSec`: Setting this will override the `defaultCommandTimeoutSec` set for the Go object for a specific command. *(Default: `defaultCommandTimeoutSec` of the Go object)*

Command options can be provided in any call to `execute()` as such:
```js
go.execute({text: 'Hello world from gonode!'}, function(result, response) {
	if(result.ok) {
		console.log('Go responded: ' + response.text);
	} else if(result.timeout) {
		console.log('Command timed out!');
	}	
}, {commandTimeoutSec: 60}); // This command will execute for up to one minute before timing out
```

## Closing gonode

There are two ways of closing gonode which is calling one of the following:

* `close()`: Go will be closed when all running commands has finished. No more calls to `execute()` will be allowed after this call, but callbacks for already running commands may still be called. When the callback of the last running command has been returned, Go will close gracefully. Calls to this return `true` if a close has been scheduled, or `false` if either Go is not initialized or if a close/termination is already pending. Calling `close()` more than once has no significant meaning.
* `terminate()`: Go will be terminated immediately. No more calls to `execute()` will be allowed after this call, and callbacks for already running commands will be called immediately with ´result.terminated´ set to `true`. Calls to this return `true` if a termination has been scheduled, or `false` if either Go is not initialized or if a termination is already pending. Calling `terminate()` more than once has no significant meaning.

Example:

```js
// Execute some long running command
go.execute({text: 'I will run for quite a while!'}, function(result, response) {
	if(result.ok) {
		console.log('Go responded: ' + response.text);
	} else if(result.timeout) {
		console.log('Command timed out!');
	} else if(result.terminated) {
		console.log('Command was terminated!');
	}
});
//go.terminate(); // This line would most likely cause the above command to terminate
//go.close(); // This would cause gonode to close after the above command has finished
```

## Error handling

gonode comes with some error handling concerning the Go process as well as JSON parsing errors. On all errors, except for initialization, gonode will emit the `error` event with information regarding the event. Such events are raised for example when a panic occures within Go or when there are errors parsing JSON. The error object has two properties;
* `parser`: `true` if the error is caused by internal parsing errors, otherwise `false.
* `data`: Contains the actual error data which may be error output from Go possibly including stack trace

**Handling these errors** is straightforward:

```js
var Go = require('gonode').Go;

var go = new Go({
	path		: 'gofile.go',
	initAtOnce	: true,	
}, function(err) {
	if (err) throw err; // This may be a failure to locate go-file

	go.on('error', function(err) {
		if(err.parser) {
			// Error is coming from internal parser
			console.log('Parser error: ' + err.data.toString())
		} else {
			// External error possible Go panic
			console.log('Go error: ' + err.data.toString())
		}
	});

	// TODO: Add code to execute commands

	go.close();
});
```

It is important to consider that any commands in execution when an error like a panic causes the Go process to terminate will eventually time out. Take this into account when implementing things like retry for commands.

*Note:* a big error output like a stack trace caused by a panic may be split up into several error events containing parts of the total output.

## Todo

* Improved error handling

[gonodepkg]: https://github.com/jgranstrom/gonodepkg
[Go]: http://golang.org/doc/install#install
[GOPATH]: http://golang.org/doc/code.html#tmp_2