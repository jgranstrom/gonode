// Example 2 - There are a couple of possible errors coming from gonode that should be handled

var Go = require('../../lib/gonode').Go;

var go = new Go({path: 'example2.go', initAtOnce: true}, function(err) {	
	if(err) {
		// Initialization failed, possibly wrong path to go-file
		console.log(err);
		return;
	}	

	// gonode emits error events upon external (Go) or internal parser (JSON) errors
	go.on('error', function(err) {
		console.log('Error from gonode!\n'
			+ 'Is it from the internal parser? ' + (err.parser ? 'yes' : 'no')
			+ '\nActual error: \n'
			+ err.data.toString());
	});

	// Execute command #1 which we have constructed to timeout
	go.execute({text: 'delay me'}, function(result, response) {
		if(result.timeout) { 
			// Execution time may exceed the user set or default time limit for commands
			console.log('The \'delay me\' command timed out!\n\n');
		} else {
			console.log('Go responded: ' + response.text);
		}
	}, {commandTimeoutSec: 1}); // We specifically set this command to timeout after 1 seconds

	// Also execute command #2 which we have constructed to raise an error
	// Note that this will produce a lot of output!
	go.execute({text: 'crash me'}, function(result, response) {
		if(result.terminated) {
			// External errors like Go panic will terminate the command that caused the
			// error as well as any other running command at that point
			console.log('The \'crash me\' command was terminated!\n\n');
		} else {
			console.log('Go responded: ' + response.text);
		}
	});

	// To be complete we also execute a command which we expect to succeed
	go.execute({text: 'respond me'}, function(result, response) {
		if(!result.ok) { // result.ok is set iff everything went well
			console.log('Something went wrong with the \'respond me\' command!');
		} else {
			console.log('Go responded: ' + response.text + '\n\n');
		}
	});

	// Close go
	go.close();
	// Is this really needed this time?
	// Technically, no, Go has already exited by panic which is handled by gonode, but to be safe
	// we always include go.close(), calling close() more than once is not an issue, better safe than sorry.
});