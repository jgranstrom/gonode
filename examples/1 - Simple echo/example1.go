package main

// Import the gonode package from the default install location
// and give it a name for easy access.
// Also import the json package to handle the command data
import (
	gonode "github.com/jgranstrom/gonodepkg"
	json "github.com/jgranstrom/go-simplejson"
)

func main() {	
	// Start the gonode listener which is an infinite loop until closed
	// It takes the processor function as only argument
	gonode.Start(process)
}

// This is the processor function which will be used to process each received command
// It takes a representation of the JSON received as parameter and returns
// the same structure as a representation for the JSON to respond
// Each process will be called on its own routine and does not block the gonode command loop
// The Json objects has methods for reading and manipulating the data received and responded
func process(cmd *json.Json) (response *json.Json) {
	return cmd // We can just return the command received to create an echoing service
}