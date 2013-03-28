var Go = require('../lib/gonode.js').Go;

var goInstance; // Use for tests after testInit() to avoid having to start several processes

/* Test the init of Go */
exports.testInit = function(test) {
	// Fail constructor if no path given
	test.throws(function(){new Go();});

	// Fail init if file does not exists
	go = new Go('./thisfiledoesnotexist123.go');	
	go.init(function(err){
		test.ok(err); // Make sure error is not null when there should be an error

		// Does not fail init if file exists
		// Also setup the test instance to use for further tests
		goInstance = new Go('./test/echo.go');
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

exports.closeGo = function(test) {
	goInstance.close();
	test.done();
}