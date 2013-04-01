gonode - Go for node.js
===

<img src="http://i49.tinypic.com/345zgbd.png">

## What is gonode?

**gonode** acts as a bridge between Go and node.js. It introduces a way to combine the asynchronous nature of node with the simplicity of concurrency in Go. gonode will in a non-blocking fashion run Go code directly from within your node modules, and asynchronously return results from Go. You can code anything you wish as long as the required communication between Go and node.js can be represented with JSON.

## Install

First make sure that you have installed [Go][] and set up your [GOPATH][] as [gonodepkg][] and [go-simplejson][] will be automatically installed to the first path specified in your GOPATH.

Then install gonode by running:

```bash
npm install gonode
```

**You should now be all set up and no more commands are required.**

*Note:* Even though the required Go packages are installed automatically with gonode you may find yourself in need of installing or updating them explicitly. In that case do so by running:

```bash
go get github.com/jgranstrom/gonodepkg github.com/jgranstrom/go-simplejson
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

import (
	gonode "github.com/jgranstrom/gonodepkg"
	json "github.com/jgranstrom/go-simplejson"
)

func main() {	
	gonode.Start(process)
}

func process(cmd *json.Json) (response *json.Json) {
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
go.execute({commandText: 'Hello world from gonode!'}, function(result, response) {
	if(result.ok) {
		console.log('Go responded: ' + response.responseText);
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

Note that the JSON object to send can contain anything containable in JSON and in arbitrary structure, and the JSON object returned does not have to obey to any structure of the sent object as they are completely independent. The structure of the returned object depends on the Go implementation responding it.

**Processing the command in Go** is possibly even simpler:

```go
func process(cmd *json.Json) (response *json.Json) {	
	response, m := json.MakeMap()

	if(cmd.Get("commandText").MustString() == "Hello") {
		m["responseText"] = "Well hello there!"
	} else {
		m["responseText"] = "What?"
	}

	return
}
```

Each command sent to Go will be delegated to the provided `process()` on a new go-routine and `cmd` will be a pointer to a `Json` object which is a representation of the JSON object received from node.
Each `process()` call must return a pointer to a `Json` object containing any data to be part of the response back to node.

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

## Interacting with JSON

Since gonode supports arbitrary JSON data between Go and node.js you must be able to interact with the data communicated. The following are methods provided to get the JSON data in usable Go types and can be called on `Json` objects:
* `Get(key string)`: Get the pointer to a `Json` object for a specific key. You can recursively `Get()` through the JSON structure to get to any required data.
* `GetIndex(index int)`: Get the pointer to a `Json` object for a index within a JSON array.
* `CheckGet(key string)`: Get the pointer to a `Json` object for a specific key together with a possible error.
* `Map()`: Assert the `Json` object to `map[string]interface{}`, also returns a possible error.
* `Array()`: Assert the `Json` object to `[]interface{}`, also returns a possible error.
* `Bool()`: Assert the `Json` object to `bool`, also returns a possible error.
* `String()`: Assert the `Json` object to `string`, also returns a possible error.
* `Float64()`: Assert the `Json` object to `float64`, also returns a possible error.
* `Int()`: Assert the `Json` object to `int`, also returns a possible error.
* `Int64()`: Assert the `Json` object to `int64`, also returns a possible error.
* `Bytes()`: Assert the `Json` object to `[]byte`, also returns a possible error.
* `StringArray()`: Assert the `Json` object to `[]string`, also returns a possible error.
* `IntArray()`: Assert the `Json` object to `[]int`, also returns a possible error.
* `MustString(args ...string)`: Assert the `Json` object to `string`, a default value can optionally be provided as an argument to be returned if the assertion fails.
* `MustInt(args ...int)`: Assert the `Json` object to `int`, a default value can optionally be provided as an argument to be returned if the assertion fails.
* `MustFloat64(args ...float64)`: Assert the `Json` object to `float64`, a default value can optionally be provided as an argument to be returned if the assertion fails.

To create a `Json` object from Go types some additional methods are provided:
* `Create(data interface{})`: Create a `Json` object with arbitrary data. This can be used to take advantage of a `struct` or for example creating a `Json` object containing a single `int` or array etc.
* `MakeMap()`: Make a `Json` object containing a `map[string]interface{}` and return a pointer to the `Json` object and the created `map`.

**Example of getting JSON data from a `Json` object:**

Provided JSON data:
```json
{
	"data": {
		"array": ["abc", "efg", "klm"],
		"number": 716
	},
	"otherdata": "hello"
}
```
Assuming we have a `Json` object called `json` of the above JSON we can get each data as such:
```go
firstString, err := json.Get("data").Get("array").GetIndex(0).String() 	// "abc"
entireArray, err := json.Get("data").Get("array").StringArray()			// ["abc" "efg" "klm"]
number, err := json.Get("data").Get("number").Int()						// 716
otherdata := json.Get("otherdata").MustString()							// "hello"
```
**Example of creating a `Json` object from Go types:**

The following code:
```go
arr := []int{1, 3, 7}
numberJson := simplejson.Create(arr)
```

Would simply generate the following JSON:
```json
[1, 3, 7]
```

While to code:
```go
json, m := simplejson.MakeMap(arr)
m["array"] = []int{1, 3, 7}
```

Would become:
```json
{
	"array": [1, 3, 7]
}
```

This enables you to construct any complex JSON structures needed for communication between Go and node.js. However of course it is recommended to keep the actual communication and complexity of the structures as low as possible to improve performance.

## Closing gonode

There are two ways of closing gonode:

* `close()`: Go will be closed when all running commands has finished. No more calls to `execute()` will be allowed after this call, but callbacks for already running commands may still be called. When the callback of the last running command has been returned, Go will close gracefully. Calls to this return `true` if a close has been scheduled, or `false` if either Go is not initialized or if a close/termination is already pending. Calling `close()` more than once has no significant meaning.
* `terminate()`: Go will be terminated immediately. No more calls to `execute()` will be allowed after this call, and callbacks for already running commands will be called immediately with `result.terminated` set to `true`. Calls to this return `true` if a termination has been scheduled, or `false` if either Go is not initialized or if a termination is already pending. Calling `terminate()` more than once has no significant meaning.

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

*Important:* Always close gonode when you no longer need it, otherwise you will leave Go hanging while waiting for more command to execute. It would waste precious resources and also keep your node process from exiting when you would expect it to.
```

## Error handling

gonode comes with some error handling concerning the Go process as well as JSON parsing errors. On all errors, except for initialization, gonode will emit the `error` event with information regarding the event. Such events are raised for example when a panic occurs within Go or when there are errors parsing JSON. The error object has two properties;
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

*Important:* An external error causing the error event to emit with `parser` set to `false` will also cause gonode to terminate. That means such errors are fatal and would require gonode to be reinitialized. Also it will cause all running commands to be immediately terminated, i.e. their callbacks will be invoked with `result.terminated` set to `true`.

*Note:* a big error output like a stack trace caused by a panic may be split up into several error events containing parts of the total output.

## Todo

* Improved error handling

[gonodepkg]: https://github.com/jgranstrom/gonodepkg
[go-simplejson]: https://github.com/jgranstrom/go-simplejson
[Go]: http://golang.org/doc/install#install
[GOPATH]: http://golang.org/doc/code.html#tmp_2