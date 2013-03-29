// Copyright (c) 2013 John Granström
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var spawn = require('child_process').spawn,
	util = require('util'),
	fs = require('fs'),	
	misc = require('./misc'),
	EventEmitter = require('events').EventEmitter,
	CommandPool = require('./commandpool').CommandPool	
	Signals = require('./command').Signals;

// Create a new Go-object for the specified .go-file.
// Will also intialize Go-object if second parameter is true.
//
// Throws error if no path provided to .go-file.
util.inherits(Go, EventEmitter);
exports.Go = Go;
function Go(options, callback) {
	if(options === undefined || options === null) {
		misc.raiseError('No options provided.')
	}
	if(options.path == undefined || options.path == null) {
		misc.raiseError('No path provided to .go-file.');
	}

	misc.mergeDefaultOptions(options, {
		maxCommandsRunning: 10,
		defaultCommandTimeoutSec: 5,
	});
	this.options = options;

	this.goFile = options.path;
	this.proc = null;
	this.initialized = false;
	this.commandPool = new CommandPool(this)

	if(options.initAtOnce) {
		this.init(callback);
	}
}

// Initialize by launching go process and prepare for commands.
// Do as early as possible to avoid delay when executing first command.
//
// callback has parameters (err)
Go.prototype.init = function(callback) {		
	var self = this;
	fs.exists(this.goFile, function(exists) {
		if(!exists) {	
			misc.callbackIfAvailable(callback, misc.getError('.go-file not found for given path.'));
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
		misc.callbackIfAvailable(callback, null);
	});
}

// Close go by sending termination signal
Go.prototype.close = function() {
	if(this.initialized) {
		// Send prioritized termination signal
		this.commandPool.planExecution(Signals.Termination, true);
	}	
}

// Create and execute a command of JSON data
// Takes parameters:
// 		data (required) - actual command JSON
//		callback (required) - the callback to call with possible result when execution ends
//		options (optional) - overrides default execution options
Go.prototype.execute = function(data, callback, options) {		
	// Important to not leave go in an infinite loop eatig cpu
	try { // Contain outer exceptions and close go before rethrowing exception.
		this.commandPool.planExecution(this.commandPool.createCommand(data, callback), false, options);	
	} catch (e) {
		this.close();
		throw e;
	}
}

// Receive data from go-module
function handleStdout(go, data) {	
	// Response may be several command responses separated by new lines
	data.toString().split("\n").forEach(function(resp) {
		// Discard empty lines
		if(resp.length > 0) {
			// Parse each command response with a event-loop in between to avoid blocking
			process.nextTick(function(){parseResponse(go, resp)});
		}		
	});
}

// Parse a _single_ command response as JSON and handle it
// If parsing fails a internal error event will be emitted with the response data
function parseResponse(go, resp) {
	var parsed;
	try {
		parsed = JSON.parse(resp);
	} catch (e) {		
		handleErr(go, resp, true);
		return;
	}

	// Important to not leave go in an infinite loop eatig cpu
	try { // Contain outer exceptions and close go before rethrowing exception.
		go.commandPool.handleResponse(parsed) // Handle response outside throw to avoid catching those exceptions	
	} catch (e) {
		go.close();
		throw e;
	}	
}

// Emit error event on go instance, pass through raw error data
// Errors may either be internal parser errors or external errors received from stderr
function handleErr(go, data, parser) {	
	if(go.listeners('error').length > 0) { // Only emit event if there are listeners
		go.emit('error', {parser: parser, data: data});
	}	
}

// Emit close event on go instance
function handleClose(go) {	
	if(go.listeners('close').length > 0) { // Only emit event if there are listeners
		go.emit('close');
	}		
}