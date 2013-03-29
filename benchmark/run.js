// Copyright (c) 2013 John Granström
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// Run benchmarks with 'node run.js' from the /benchmark/ dir

Go = require('../lib/gonode.js').Go;

var go = new Go({path: 'bench.go', initAtOnce: true}, function(err) {	
	go.on('error', function(err) {
		console.log('error: ' + err.parser + ' ' + err.data);
	})		

	setTimeout(function(go) { // Wait for process to establish itself first
		benchMany(go);
	}, 1000, go);
});

// Smash gonode with a lot of commands
function benchMany(go) {
	var limit = 9999;
	
	bef = new Date();
	for(var i = 0; i <= limit; i++) {
		var f = function(i) {
			go.execute({test: 'b'}, function(timeout, response) {
				if(i >= limit) {
					console.log((limit + 1) + ' commands in ' + (new Date() - bef) + 'ms');;	
					go.close();
				}					
			});			
		};
		f(i);
	}
}