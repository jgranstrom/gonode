package main

import "gonode"

func main() {
	gonode.Start(process)
}

type MyCommand struct {
	Test string
}

func process(cmd gonode.CommandData) (resp gonode.CommandData) {
	return cmd
}