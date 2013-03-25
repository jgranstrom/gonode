/*
 * gonode dev
 *
 * TODO (as of now):
 * 		- eventloop
 * 		- termination signal
 *  	- command queue
 *      - go module integration
 *      - command timeout
 *      - command callbacks
 *      - command identifiers
 */
var spawn = require('child_process').spawn,
	util = require('util'),
	fs = require('fs'),
	EventEmitter = require('events').EventEmitter;

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

/* Send JSON data to go process
 * Will throw error if called on unitialized go object
 */
Go.prototype.sendJSON = function(data) {
	if(this.initialized && this.proc != null) {
		this.proc.stdin.write(JSON.stringify(data) + '\n'); // Write \n to flush write buffer
	}
	else
		raiseError('tried to send JSON on uninitialized go object');
}

/* Immediately close the go processing by killing it 
 * Call to make sure child process is not hanging around waiting for input
 *
 * TODO: Send some kind of termination signal to give a process to ability
 * to end gracefully. Also specify a timeout to kill process if termination takes too long.
 */
Go.prototype.close = function() {
	if(this.initialized && this.proc != null) {
		this.proc.kill();
	}	
}

/* Emit data event on go instance. Parse data into JSON object and pass through */
function handleStdout(go, data) {		
	var parsed;
	try {
		parsed = JSON.parse(data);
		go.emit('data', parsed);
	} catch(e) { // If parsing failed, redirect response to error
		// This may be caused by error output from go-routine
		console.log(e);
		handleStderr(go, data);
	}	
}

/* Emit error event on go instance, pass through raw error data */
function handleStderr(go, data) {
	go.emit('error', data);
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