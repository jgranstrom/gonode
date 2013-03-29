package main

import "gonode"

func main() {	
	// Start the gonode listener which is an infinite loop until closed
	// It takes the processor function as only argument
	gonode.Start(process)
}

// This is the processor function which will be used to process each received command
// It takes a representation of the JSON received as parameter and returns
// the same structure as a representation for the JSON to respond
// Each process will be called on its own routine and does not block the gonode command loop
func process(cmd gonode.CommandData) (response gonode.CommandData) {
	return cmd // We can just return the command received to create a echo service
}