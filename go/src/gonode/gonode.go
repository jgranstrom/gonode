// Copyright (c) 2013 John Granström
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// This package defines the basic functionality of gonode.
package gonode

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
)

// Signal constants - internal
const signal_NOSIGNAL = -1
const signal_TERMINATION = 1

// Defines a raw command object transmitted over gonode - internal type
type command struct {
	Id     int
	Cmd    CommandData
	Signal int
}

// Defines a raw response object transmitted over gonode - internal type
type response struct {
	Id   int         `json:"id"`   // Make sure response is in lowercase
	Data CommandData `json:"data"` // Make sure response is in lowercase
}

// Processor is the provided function that handles each command and provides a result
type Processor func(cmd CommandData) (resp CommandData)

// CommandData is a wrapping type for representing the JSON objects transmitted
type CommandData map[string]interface{}

// Start the gonode listener which will enter an endless loop while waiting for commands
// Each command will be delegated to new go-routines and processed by the provided Processor.
// This function will return when gonode has been terminated.
func Start(proc Processor) {
	reader := bufio.NewReader(os.Stdin)

	for { // Loop forever
		s, err := reader.ReadString('\n')

		if err != nil {
			if err == io.EOF { // Return if stream closes
				return
			} else {
				// Write back any stream errors directly to be dispatched by gonode error event
				fmt.Println(err)
				continue
			}
		}
		if len(s) < 1 { // Skip empty entries
			continue
		}

		// Parse JSON into Command struct
		var c command
		json.Unmarshal([]byte(s), &c)

		// Handle input
		switch c.Signal {
		case signal_NOSIGNAL:
			go handle(c, proc) // Handle commands on new go-routine
		case signal_TERMINATION:
			return // Abort loop on termination
		}
	}
}

// Handle a command by invoking processor and send result on stdout
func handle(c command, proc Processor) {
	// Create a response with the matching ID
	var r response
	r.Id = c.Id
	r.Data = proc(c.Cmd) // Set response data to processor result
	b, _ := json.Marshal(r)
	fmt.Println(string(b)) // Send JSON result on stdout
}
