package main

import gonode "github.com/jgranstrom/gonodepkg"

func main() {
	gonode.Start(process)
}

type MyCommand struct {
	Test string
}

func process(cmd gonode.CommandData) (resp gonode.CommandData) {
	return cmd
}