package main

import (
	gonode "github.com/jgranstrom/gonodepkg"
	json "github.com/jgranstrom/go-simplejson"
)

func main() {
	gonode.Start(process)
}

func process(cmd *json.Json) (resp *json.Json) {
	return cmd
}