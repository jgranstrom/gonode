Go = require('./lib/gonode.js').Go;

// Dev stuff below
go = new Go('devtest.go', true, function(err) {
	go.on('data', function(json) {
		console.log(json);
	});
	go.on('error', function(err) {
		console.log('error: ' + err);
	})		
	go.sendJSON({test: 'hej'});	
	go.sendJSON({test: 'hej'});	
});