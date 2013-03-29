var Queue = require('./queue').Queue,
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

/* Execute a created command either prioritized or not.
 * None prioritized commands may be queued instead of directly executed if exceeding command limit. */
CommandPool.prototype.executeCommand = function(cmd, prioritized) {
	// If command not prioritized make sure it does not exceed command limit
	if(!prioritized && this.runningCommands >= this.go.options.maxCommandsRunning) {
		// Exceeds limit, queue command instead of running
		this.commandQueue.enqueue(cmd);
	} else {
		// Execute command	
		cmd.execute(this);	
	}
}

/* Handle JSON response and process command callback and end of execution 
 * Also manage the queue if required. 
 */
CommandPool.prototype.handleResponse = function(response) {
	// TODO: Handle none existing ids
	var respCmd = this.commandMap[response.id]
	if(respCmd !== undefined) {
		respCmd.response(this, response.data);	
		workQueue(this);
	} else {
		// Command may have timed out or otherwise aborted so we throw the response away
	}	
}

/* Create a command with specified data and callback with new ID */
CommandPool.prototype.createCommand = function(data, callback) {
	return new Command(this.nextCommandId++, data, callback)
}

// Check if commands are queued, and if so execute them on next event loop
function workQueue(pool) {
	if(!pool.commandQueue.isEmpty()) { // Check if queue is empty first
		process.nextTick(function() { // Execute next commands on next tick
			pool.executeCommand(pool.commandQueue.dequeue(), false);
		});
	}
}