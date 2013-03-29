// Test code for gonode dev
Go = require('./lib/gonode.js').Go;

// Dev stuff below
var go = new Go({path: 'dev.go', initAtOnce: true, maxCommandsRunning: 10}, function(err) {
	go.on('error', function(err) {
		console.log('error: ' + err.parser + ' ' + err.data);
	})		

	/*setInterval(function() {
		smash();	
	}, 3000);*/

	

	/*go.execute({test: 'a'}, response, {commandTimeoutSec: 2});
	go.execute({test: 'b'}, response);
	go.execute({test: 'c'}, response);
	go.execute({test: 'd'}, response);
	go.execute({test: 'e'}, response);*/
});

var totals = 0;
function smash() {
	setTimeout(function(go) {
		for(var i = 0; i < 10000; i++) {
				bef = new Date();
				go.execute({test: 'b'}, function(timeout, response) {
					totals++;
					if(totals >= 10000) {
						console.log(totals + ' commands in ' + (new Date() - bef) + 'ms');;	
						go.close();
					}					
				});			
		}
	}, 1000, go);
}
smash();

function response(timeout, r) {
	if(!timeout) {
		console.log(r);

		// Close on "last" response
		if(r.test === "a") {
			go.close();
		}	
	}
	else {
		console.log("timeout");
		go.close();
	}	
}