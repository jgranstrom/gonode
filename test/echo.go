/* Development test code for go module 
 */
package main

import (
	"fmt"
	"encoding/json"
	"time"
	//"strings"
)

type Command struct {
	Id int
	Cmd interface{}
}

type Response struct {
	Id int `json:"id"` // Make sure response is in lowercase
	Data interface{} `json:"data"` // Make sure response is in lowercase
}

func main() {	
	for {
		var s string		
		fmt.Scanf("%s", &s) // Receive data from stdin		

		if(len(s) > 0) {
			var c Command
			json.Unmarshal([]byte(s), &c)

			// Process input on separate routine
			go func(c Command) {
				// Test with some delay for one command
				m := c.Cmd.(map[string]interface{}) 
				if(m["test"] == "a") {
					time.Sleep(5 * time.Second)
				}
				// Print response to stdout
				// Each response must be separated by a new line
				var r Response
				r.Id = c.Id
				r.Data = c.Cmd  // Just echo command

				b, _ := json.Marshal(r)
				fmt.Println(string(b)) // Echo received to stdout
			}(c)
		}
	}
}