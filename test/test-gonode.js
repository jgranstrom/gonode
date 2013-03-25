var Go = require('../lib/gonode.js').Go;

exports.testInit = function(test) {
	// Fail constructor if no path given
	test.throws(function(){new Go();});

	// Fail init if file does not exists
	go = new Go('./thisfiledoesnotexist123.go');
	go.init(function(err){
		test.ok(err); // Make sure error is not null when there should be an error

		// Does not fail init if file exists
		go = new Go('./test/plaintest.go');
		go.init(function(err) {
			test.ifError(err);

			test.expect(3);
			test.done();

			go.close();
		});
	});	
}

exports.testJSONEcho = function(test) {
	var jsonData = {test: 'stuff', array: [1, 2, 3]};

	go = new Go('./test/plaintest.go', true, function(err) {
		go.on('data', function(json) {
			test.equal(json.test, 'stuff');
			test.equal(JSON.stringify(json.array), JSON.stringify([1, 2, 3]));

			test.expect(2);
			test.done();

			go.close();
		});
		
		go.send(jsonData);
	});
}

/* Test that a sequence of commands executed in order gets callback in sequential order 
 * This requirement may change when command execution has been further developed
 */

exports.testSequentialCmds = function(test) {
	var json1 = {test: 'stuff1', array: [1, 2, 3]};
	var json2 = {test: 'stuff2', array: [4, 5, 6]};
	var json3 = {test: 'stuff3', array: [7, 8, 9]};
	var json4 = {test: 'stuff4', array: [10, 11, 12]};

	var recievedIndex = 0;
	go = new Go('./test/multitest.go', true, function(err) {
		go.on('data', function(json) {
			if(recievedIndex == 0) {
				test.equal(json.test, 'stuff1');
				test.equal(JSON.stringify(json.array), JSON.stringify([1, 2, 3]));
			} else if(recievedIndex == 1) {
				test.equal(json.test, 'stuff2');
				test.equal(JSON.stringify(json.array), JSON.stringify([4, 5, 6]));
			} else if(recievedIndex == 2) {
				test.equal(json.test, 'stuff3');
				test.equal(JSON.stringify(json.array), JSON.stringify([7, 8, 9]));
			} else if(recievedIndex == 3) {
				test.equal(json.test, 'stuff4');
				test.equal(JSON.stringify(json.array), JSON.stringify([10, 11, 12]));

				test.expect(8);
				test.done();

				go.close();
			}

			recievedIndex++;			
		});
		
		go.send(json1);
		go.send(json2);
		go.send(json3);
		go.send(json4);
	});
}