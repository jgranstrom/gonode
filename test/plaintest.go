/* Development test code for go module 
 * No JSON-parsing, plain echoing service
 */
package main

import (
	"fmt"
)

func main() {
	var s string
	fmt.Scanf("%s", &s) // Receive data from stdin		
	fmt.Println(s) // Echo received to stdout		
}