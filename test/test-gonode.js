var Go = require('../lib/gonode.js').Go;

exports.testInit = function(test) {
	// Fail constructor if no path given
	test.throws(function(){new Go();});

	// Fail init if file does not exists
	go = new Go('./thisfiledoesnotexist123.go');
	go.init(function(err){
		test.ok(err); // Make sure error is not null when there should be an error

		// Does not fail init if file exists
		go = new Go('./test/echo.go');
		go.init(function(err) {
			test.ifError(err);

			test.expect(3);
			test.done();

			//go.close();
		});
	});	
}

exports.testJSONEcho = function(test) {
	var jsonData = {test: 'stuff', array: [1, 2, 3]};

	go = new Go('./test/echo.go', true, function(err) {
		go.execute(jsonData, function(response) {
			test.equal(response.test, 'stuff');
			test.equal(JSON.stringify(response.array), JSON.stringify([1, 2, 3]));

			test.expect(2);
			test.done();
		});
	});
}