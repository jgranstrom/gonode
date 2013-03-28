package main

import g "gonode"

func main() {	
	g.Start(func(cmd g.CommandData) (resp g.CommandData) {
		return cmd
	})
}