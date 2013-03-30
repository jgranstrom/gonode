package main

import (
	gonode "github.com/jgranstrom/gonodepkg"
	"time"
)

func main() {	
	gonode.Start(process)
}

func process(cmd gonode.CommandData) (response gonode.CommandData) {
	// Each command property can easily be accessed as shown below
	if cmd["text"] == "delay me" {
		time.Sleep(time.Second * 2) // Delay this command beyond the timout
	} else if cmd["text"] == "crash me" {
		time.Sleep(time.Second) // Wait a while to let command #3 execute successfully before panicing
		panic(1) // Cause a panic!
	}
	return cmd
}