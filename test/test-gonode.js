// Copyright (C) 2013 John Granström
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
	go.init(function(err){
		test.ok(err); // Make sure error is not null when there should be an error

		// Does not fail init if file exists
		// Also setup the test instance to use for further tests
		goInstance = new Go({path: './test/echo.go'});
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

	goInstance.execute(jsonData, function(timeout, response) {
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
		goInstance.execute(json[j], function(timeout, response) {
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
		for (j in json) {
			goLimited.execute(json[j], function(timeout, response) 
			{				
				// 'a' is the first test that should respod even though it is the only command
				// that has a delay since we have a maximum command limit of 1. The other commands
				// should start only when a is done.

				// Even though the other commands are faster, they should not respond
				test.ok(response.test !== 'b' && response.test  !== 'c');

				if(response.test === 'a') {
					// We close go here and hence should not get a response from any of the other commands
					// which should still be in queue
					goLimited.close();

					test.expect(1);
					test.done();
				}
			});
		}
	});
}


// Add more test cases here

// Close go instance - Leave this as last case!
exports.closeGo = function(test) {
	goInstance.close();
	test.done();
}