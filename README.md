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

You can either initialize gonode by explicitly calling `init()` or by settings the options `initAtOnce` to `true` and optionally provide the initialization callback directly while creating the Go-object.

```js
var Go = require('gonode').Go;

var options = {
	path	: 'gofile.go',
	initAtOnce: true,	
}
var go = new Go(options, function(err) {
	if (err) throw err;

	// TODO: Add code to execute commands

	go.close();
});
```

###### Initialization options
* `path`: The path to the go-file to execute. (required)
* `initAtOnce`: Will initialize Go at once when object created and allows initialization callback to be provided in constructor. (Default: `false`)
* `maxCommandsRunning`: Specifies the maximum number of commands allowed to be running simultaneously, may impact performance differently depending on Go implementation. (Default: `10`)
* `defaultCommandTimeoutSec`: Specifies the default command timeout in seconds to be used when not specified in command options. (Default: `5`)
* `cwd`: The working directory of the Go process. (Default: Current working directory of node process)

[gonodepkg]: https://github.com/jgranstrom/gonodepkg
[Go]: http://golang.org/doc/install#install
[GOPATH]: http://golang.org/doc/code.html#tmp_2