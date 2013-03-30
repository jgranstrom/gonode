gonode - Go for node.js
===

## What is gonode?

**gonode** act as a bridge between Go and node.js. It introduces a way to combine the asynchronous nature of node with the simplicity of concurrency in Go. **gonode** will in a non-blocking fashion run Go code directly from within your node modules, and asynchronously return results from Go. You can code anything you wish as long as the required communication between Go and node.js can be represented with JSON.

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

As you can see `close()` should be called when you no longer need the Go object and will gracefully end the Go process and all communication with node.

###### Initialization options
* `path`: The path of the go-file to execute. (Required)
* `initAtOnce`: Will initialize Go at once when object created if `true`, and allows initialization callback to be provided in constructor. (Default: `false`)
* `maxCommandsRunning`: Specifies the maximum number of commands allowed to be running simultaneously, may impact performance differently depending on Go implementation. (Default: `10`)
* `defaultCommandTimeoutSec`: Specifies the default command timeout in seconds to be used when not specified in command options. (Default: `5`)
* `cwd`: The working directory of the Go process. (Default: Current working directory of the node process)

## Executing commands

Running commands with gonode is really simple, the following is an example presuming go is an initialized Go object:

```js
go.execute({text: 'Hello world from gonode!'}, function(timeout, response) {
	if(timeout) {
		console.log('Command timed out!');
	} else {
		console.log('Go responded: ' + response.text);
	}	
});
```

`execute()` accepts a JSON object to be sent to the Go process, and a callback which will be called when Go returns with a result or when the command reaches a timeout limit. 
`timeout` is true if the command for some reason timed out before a response was returned. 
`response` will contain a JSON object with the result of the response.

Note that the JSON object to send can contain anything containable in JSON and in arbitrary structure, and the JSON object returned does not have to obey to any structure of the sent object as they are completely independent. The structure of the returned object is decided in Go.

Processing the command in Go is possibly even simpler:

```go
func process(cmd gonode.CommandData) (response gonode.CommandData) {	
	response = make(gonode.CommandData)

	if(cmd["test"] == "Hello") {
		response["text"] = "Well hello there!"
	} else {
		response["text"] = "What?"
	}

	return
}
```

Each command sent to Go will be sent to the provided `process()` and `cmd` will contain a `CommandData` object (a wrapper for `map[string]interface{}`) which will be a representation of the JSON object received from node.
Each `process()` call should return a `CommandData` object containing any data to be part of the response back to node. The response object will also be transmitted as JSON.

###### Command options
* `commandTimeoutSec`: Setting this will override the `defaultCommandTimeoutSec` set for the Go object for a specific command. (Default: `defaultCommandTimeoutSec` of the Go object)

Command options can be provided in any call to `execute()` as such:
```js
go.execute({text: 'Hello world from gonode!'}, function(timeout, response) {
	if(timeout) {
		console.log('Command timed out!');
	} else {
		console.log('Go responded: ' + response.text);
	}	
}, {commandTimeoutSec: 60}); // This command will execute for up to one minute before timing out
```

[gonodepkg]: https://github.com/jgranstrom/gonodepkg
[Go]: http://golang.org/doc/install#install
[GOPATH]: http://golang.org/doc/code.html#tmp_2