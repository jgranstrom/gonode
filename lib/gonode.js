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
	Queue = require('./queue').Queue,
	Command = require('./command').Command;

var commandMap = {},
	nextCommandId = 0; // TODO: Contain the ID from growing out of hand

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

	// TODO: Implement queue functionality for max commands
	this.commandQueue = new Queue();
	this.hasCommandsRunning = false;

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
	var self = this;
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
			handleErr(self, data, false);
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
 */
Go.prototype.execute = function(data, callback) {
	var cmd = new Command(nextCommandId++, data, callback);
	commandMap[cmd.common.id] = cmd;
	cmd.execute(this);
}

/* Receive data from go-module */
function handleStdout(go, data) {	
	data = data.toString();
	// Response may be several command responses separated by new lines
	data.split("\n").forEach(function(resp) {
		// Discard empty lines
		if(resp.length > 0) {
			// Parse each command response with a event-loop in between to avoid blocking
			process.nextTick(function(){parseResponse(go, resp)});
		}		
	});
}

/* Parse a _single_ command response as JSON and handle it
 * If parsing fails a internal error event will be emitted with the response data
 */
function parseResponse(go, resp) {
	var parsed;
	try {
		parsed = JSON.parse(resp);
	} catch (e) {		
		handleErr(go, resp, true);
		return;
	}
	handleResponse(go, parsed)	
}

/* Handle JSON response and process command callback */
function handleResponse(go, response) {
	// TODO: Handle none existing ids
	var respCmd = commandMap[response.id]
	if(respCmd !== undefined) {
		respCmd.response(go, response.data);	
		// Since command is now done we delete it from the commandMap
		delete commandMap[response.id];	
	} else {
		// TODO: Emit error event
	}
	
}

/* Emit error event on go instance, pass through raw error data
 * Errors may either be internal parser errors or external errors received from stderr
 */
function handleErr(go, data, parser) {	
	go.emit('error', {parser: parser, data: data});
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