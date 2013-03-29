/* Test cases for gonode
 * 
 * run all tests with 'nodeunit test'
 */
var Go = require('../lib/gonode.js').Go;

var goInstance; // Use for tests after testInit() to avoid having to start several processes

/* Test the init of Go */
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

/* Test a simple JSON echo */
exports.testJSONEcho = function(test) {
	var jsonData = {test: 'stuff', array: [1, 2, 3]};

	goInstance.execute(jsonData, function(response) {
		test.equal(response.test, 'stuff');
		test.equal(JSON.stringify(response.array), JSON.stringify([1, 2, 3]));

		test.expect(2);
		test.done();
	});
}

/* Test multiple commands */
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
		goInstance.execute(json[j], function(response) {
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

/* Add more test cases here */

/* Close go instance - Leave this as last case! */
exports.closeGo = function(test) {
	goInstance.close();
	test.done();
}