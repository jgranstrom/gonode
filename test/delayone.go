// Testcode for gonode dev
package main

import "gonode"
import "time"

func main() {
	gonode.Start(process)
}

type MyCommand struct {
	Test string
}

func process(cmd gonode.CommandData) (resp gonode.CommandData) {
	if(cmd["test"] == "a") { // Delay some command
		time.Sleep(time.Second)
	}
	return cmd
}