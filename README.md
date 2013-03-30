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

Initiate in node.js:

```js
var Go = require('gonode').Go;
var go = new Go({
	path	: 'gofile.go',
});

go.init(function(err) {
	if (err) throw err;
});
```

Initiate in Go:

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

[gonodepkg]: https://github.com/jgranstrom/gonodepkg
[Go]: http://golang.org/doc/install#install
[GOPATH]: http://golang.org/doc/code.html#tmp_2