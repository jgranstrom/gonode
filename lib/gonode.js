/*
 * gonode dev
 *
 * TODO (as of now):
 * 		- eventloop
 * 		- termination signal
 *      - go module integration
 *      - command timeout
 *      - command callbacks
 *      - command identifiers
 */
var spawn = require('child_process').spawn,
	util = require('util'),
	fs = require('fs'),	
	EventEmitter = require('events').EventEmitter,
	Queue = require('./queue').Queue;

function raiseError(error) {
	throw getError(error);
}

function getError(error) {
	return new Error('gonode: ' + error);
}

/* Create a new Go-object for the specified .go-file.
 * Will also intialize Go-object if second parameter is true.
 *
 * Throws error if no path provided to .go-file.
 */
util.inherits(Go, EventEmitter);
exports.Go = Go;
function Go(path, initAtOnce, callback) {
	if(path == undefined || path == null) {
		raiseError('No path provided to .go-file.');
	}

	this.goFile = path;
	this.proc = null;
	this.initialized = false;	
	this.commandQueue = new Queue();
	this.isWorking = false;
	this.aborted = false;

	if(initAtOnce) {
		this.init(callback);
	}
}

/* Initialize by launching go process and prepare for commands.
 * Do as early as possible to avoid delay when executing first command.
 *
 * callback has parameters (err)
 */
Go.prototype.init = function(callback) {		
	self = this;
	fs.exists(this.goFile, function(exists) {
		if(!exists) {	
			callbackIfAvailable(callback, getError('.go-file not found for given path.'));
			return;
		}
		// Spawn go process within current working directory
		// TODO: Make cwd an option
		self.proc = spawn('go', ['run', self.goFile], { cwd: process.cwd(), env: process.env });

		// Setup handlers
		self.proc.stdout.on('data', function(data){
			handleStdout(self, data);
		});
		self.proc.stderr.on('data', function(data){
			handleStdout(self, data);
		});
		self.proc.on('close', function(){
			handleClose(self);
		});

		// Init complete
		self.initialized = true;
		callbackIfAvailable(callback, null);
	});
}

Go.prototype.send = function(data) {	
	if(this.initialized && this.proc != null) {
		if(!this.isBusy()) {			
			sendJSON(this, data);
		} else {			
			this.commandQueue.enqueue(data);
		}
	} else {
		raiseError('tried to send JSON on uninitialized go object');
	}
}

/* Check if instance is busy executing command or has commands in queue */
Go.prototype.isBusy = function() {	
	return this.isWorking || !this.commandQueue.isEmpty();
}

/* Immediately close the go processing by killing it 
 * Call to make sure child process is not hanging around waiting for input
 *
 * TODO: Send some kind of termination signal to give a process to ability
 * to end gracefully. Also specify a timeout to kill process if termination takes too long.
 */
Go.prototype.close = function() {
	this.aborted = true;
	if(this.initialized && this.proc != null) {		
		// TODO: Close in a more elegant way.. (will fix when adding termination signal)
		this.proc.stdout.removeAllListeners();
		this.proc.stderr.removeAllListeners();
		this.proc.removeAllListeners();
		this.proc.stdout.end();
		this.proc.kill();
	}	
}

/* Send JSON data to go process
 */
function sendJSON(go, data) {
	go.isWorking = true; // Make sure instance is set to working
	go.proc.stdin.write(JSON.stringify(data) + '\n'); // Write \n to flush write buffer
}

/* Emit data event on go instance. Parse data into JSON object and pass through */
function handleStdout(go, data) {		
	var parsed;
	try {
		parsed = JSON.parse(data);
		go.emit('data', parsed);
		handleCommandResponse(go);
	} catch(e) { // If parsing failed, redirect response to error
		// This may be caused by error output from go-routine
		handleStderr(go, data);
	}	
}

/* Emit error event on go instance, pass through raw error data */
function handleStderr(go, data) {	
	go.emit('error', data);
	handleCommandResponse(go);
}

/* Call when response returned from go and processing can continue */
function handleCommandResponse(go) {
	// Check if there's more work to do
	if(go.commandQueue.isEmpty() || go.aborted) {
		go.isWorking = false;
	} else {
		// If there is, do it after next event loop
		process.nextTick(function() {
			sendJSON(go, go.commandQueue.dequeue())
		});
	}
}

/* Emit close event on go instance */
function handleClose(go) {	
	go.emit('close');
}

/* Invoke callback if not undefined with provided parameter */
function callbackIfAvailable(callback, param) {
	if(typeof callback != undefined) {
		callback(param);
	}
}