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

// Test cases for gonode
// Run all tests with 'nodeunit test'

var Go = require('../lib/gonode.js').Go;

var goInstance; // Use for tests after testInit() to avoid having to start several processes

// Test the init of Go
exports.testInit = function(test) {
	// Fail constructor if no path given
	test.throws(function(){new Go();});

	// Fail init if file does not exists
	go = new Go({path: './thisfiledoesnotexist123.go'});	
	go.on('error', printError);
	go.init(function(err){
		test.ok(err); // Make sure error is not null when there should be an error

		// Does not fail init if file exists
		// Also setup the test instance to use for further tests
		goInstance = new Go({path: './test/echo.go'});
		goInstance.on('error', printError);
		goInstance.on('error', function(err) {
			console.log(err.data.toString());
		});
		goInstance.init(function(err) {
			test.ifError(err);

			test.expect(3);
			test.done();
		});
	});	
}

// Test a simple JSON echo
exports.testJSONEcho = function(test) {
	var jsonData = {test: 'stuff', array: [1, 2, 3]};

	goInstance.execute(jsonData, function(result, response) {
		test.equal(response.test, 'stuff');
		test.equal(JSON.stringify(response.array), JSON.stringify([1, 2, 3]));

		test.expect(2);
		test.done();
	});
}

// Test multiple commands
exports.testMultipleCmds = function(test) {
	var json = {
		'0': {index: '0'},
		'1': {index: '1'},
		'2': {index: '2'},
		'3': {index: '3'},
		'4': {index: '4'},
		'5': {index: '5'},
	}
	var count = 6;

	// Make sure each executed command is returned, and only once
	for (j in json) {
		goInstance.execute(json[j], function(result, response) {
			test.ok(json[response.index].index === response.index);
			delete json[response.index]
			count--;
			if(count === 0) {
				test.expect(6);
				test.done();
			}			
		});
	}
}

// Test command limit queue
exports.testCommandLimit = function(test) {
	var json = {
		'a': {test: 'a'},
		'b': {test: 'b'},
		'c': {test: 'c'},
	}

	var goLimited = new Go({path: './test/delayone.go', maxCommandsRunning: 1, initAtOnce: true}, function(err) {
		goLimited.on('error', printError);
		for (j in json) {
			goLimited.execute(json[j], function(result, response) 
			{				
				// 'a' is the first test that should respod even though it is the only command
				// that has a delay since we have a maximum command limit of 1. The other commands
				// should start only when a is done.

				// Even though the other commands are faster, they should not respond
				test.ok(response.test !== 'b' && response.test  !== 'c');

				if(response.test === 'a') {
					// We close go here and hence should not get a response from any of the other commands
					// which should still be in queue					
					test.expect(1);
					test.done();
				}
			});
		}

		goLimited.close();
	});
}

// Test command timeouts
exports.testCommandTimeout = function(test) {
	var aCompleted,
		bCompleted;
	var goLimited = new Go({path: './test/delayone.go', initAtOnce: true}, function(err) {
		goLimited.on('error', printError);
		goLimited.execute({test: 'b'}, function(result, response) {
			test.ok(!result.timeout); // Should not time out
			bCompleted = true;

			if(aCompleted) {
				test.expect(2);
				test.done();
				return;
			}
		});
		goLimited.execute({test: 'a'}, function(result, response) {			
			// execution is delayed på one second in delayone.go
			test.ok(result.timeout); // It should time out
			aCompleted = true;

			if(bCompleted) {
				test.expect(2);
				test.done();
				return;
			}
		}, {commandTimeoutSec: 0.5});
		goLimited.close();
	});
}

// Test that panics are handled accordingly with error event and command termination
exports.testPanicHandling = function(test) {
	var goPanic = new Go({path: './test/panic.go', initAtOnce: true}, function(err) {
		// goPanic.on('error', printError); Will print expected panic
		var hasError,
			hasTimedout,
			assertCount = 3;

		goPanic.on('error', function(err) {			
			if(!hasError) { // Only care about one error (errors may be split up)
				hasError = true;
				test.ok(err);
				test.ok(!err.parser);
				
				if(hasTimedout) {
					test.expect(assertCount);
					test.done();					
				}
			}
		});

		goPanic.execute({test: 'a'}, function(result, response) {			
			test.ok(result.terminated); // Result should be terminated when panic happened
			hasTimedout = true;
			if(hasError) {				
				test.expect(assertCount);
				test.done();
			}			
		});

		goPanic.close();
	});
}

// Test command terminations
exports.testCommandTerminated = function(test) {
	var goLimited = new Go({path: './test/delayone.go', initAtOnce: true}, function(err) {
		goLimited.on('error', printError);
		goLimited.execute({test: 'a'}, function(result, response) {
			test.ok(result.terminated);
			test.expect(4);
			test.done();
		});

		test.ok(goLimited.terminate()); // Terminate should return true
		test.ok(!goLimited.terminate()); // Another one should return false
		test.ok(!goLimited.close()); // Close() after termination should return false
	});
}

// Add more test cases here

// Close go instance - Leave this as last case!
exports.closeGo = function(test) {
	goInstance.close();
	test.done();
}

function printError(err) {
	console.log(err.parser ? '(internal) ' : '' + err.data.toString());
}