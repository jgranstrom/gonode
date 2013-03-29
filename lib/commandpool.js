var misc = require('./misc'),
	Queue = require('./queue').Queue,	
	Command = require('./command').Command;

exports.CommandPool = CommandPool;
function CommandPool(go) {
	this.go = go;
	this.commandMap = {},
	this.nextCommandId = 0; // TODO: Contain the ID from growing out of hand
	this.runningCommands = 0;
	this.hasCommandsRunning = false;
	
	this.commandQueue = new Queue();
}

/* Plan the execution of a command and set execution options.
 * None prioritized commands may be queued instead of directly executed if exceeding command limit. */
CommandPool.prototype.planExecution = function(cmd, prioritized, options) {
	cmd.setOptions(this, options);
	// If command not prioritized make sure it does not exceed command limit
	//console.log(this.go.options.maxCommandsRunning)	
	executeCommand(this, cmd, prioritized);
}

/* Handle JSON response and process command callback and end of execution 
 * Also manage the queue if required. 
 */
CommandPool.prototype.handleResponse = function(response) {
	// TODO: Handle none existing ids
	var respCmd = this.commandMap[response.id]
	if(respCmd !== undefined) {
		respCmd.response(this, response.data);	
	} else {
		// Command may have timed out or otherwise aborted so we throw the response away
	}	
}

/* Create a command with specified data and callback with new ID */
CommandPool.prototype.createCommand = function(data, callback) {
	return new Command(this.nextCommandId++, data, callback)
}

// Check if commands are queued, and if so execute them on next event loop
CommandPool.prototype.workQueue = function() {
	if(!this.commandQueue.isEmpty()) { // Check if queue is empty first
		var pool = this;
		process.nextTick(function() { // Execute next commands on next tick
			executeCommand(pool, pool.commandQueue.dequeue(), false);
		});
	}
}

/* Execute a command if does not exceed command count limit and command queue is empty
 * otherwise queue command for later execution. */
function executeCommand(pool, cmd, prioritized) {
	if(!prioritized && (pool.runningCommands >= pool.go.options.maxCommandsRunning)) {
		// Exceeds limit, queue command instead of running
		pool.commandQueue.enqueue(cmd);
	} else {
		// Execute command	
		cmd.execute(pool);	
	}
}