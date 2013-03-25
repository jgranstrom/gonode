/* Development test code for go module 
 * No JSON-parsing, plain echoing
 */
package main

import (
	"fmt"
)

func main() {
	for {
		var s string
		fmt.Scanf("%s", &s) // Receive data from stdin
		if len(s) < 1 {
			return
		}
		fmt.Println(s) // Echo received to stdout
	}
}