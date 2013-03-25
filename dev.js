Go = require('./lib/gonode.js').Go;

// Dev stuff below
go = new Go('devtest.go', true, function(err) {
	go.on('data', function(json) {
		console.log(json);

		if(json.test === 'slut') {
			go.close();
			console.log('a');
		}
	});
	go.on('error', function(err) {
		console.log('error: ' + err);
	})		
	go.send({test: 'hej'});	
	go.send({test: 'hej'});	
	go.send({test: 'hej'});	
	go.send({test: 'hej'});	
	go.send({test: 'hej'});	
	go.send({test: 'hej'});	
	go.send({test: 'hej'});	
	go.send({test: 'hej'});	
	go.send({test: 'slut'});		
});