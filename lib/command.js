/*
 * command.js
 * Commands must be executed within a command pool to limit execution count and time.
 */

/* Create a command object with id, command, callback and optionally signal */
exports.Command = Command;
function Command(id, cmd, callback, signal) {
	// Contain common data to be shared with go-module in .common
	this.common = {
		id: id,
		cmd: cmd,
		signal: signal === undefined ? -1: signal, // -1 is no signal
	}
	// Contain internal data not to be sent over the interface in .internal
	this.internal = {
		callback: callback,
		executionStarted: false,
		executionEnded: false,
	}	
}

/* Execute command by sending it to go-module */
Command.prototype.execute = function(pool) {
	executionStarted(pool, this);

	// Send common data to go-module
	pool.go.proc.stdin.write(JSON.stringify(this.common) + '\n'); // Write \n to flush write buffer

	// TODO: Implement timeout support
}

/* Handle command response and invoke callback */
Command.prototype.response = function(pool, responseData) {
	executionStopped(pool, this);	

	if(this.internal.callback !== undefined) {
		this.internal.callback(responseData);
	}	
}

// Call each time the command is to be executed to update status
// Handles the state of the command as well as the containing pool.
function executionStarted(pool, cmd) {
	cmd.internal.executionStarted = true;	

	pool.runningCommands++;
	pool.hasCommandsRunning = true;

	// Add executing command to map
	pool.commandMap[cmd.common.id] = cmd;

	// TODO: Timeout init behavior..
}

// Call each time the command has been received/timed out/aborted (stopped execution) to update pool status
// Handles the state of the command as well as the containing pool.
function executionStopped(pool, cmd) {
	cmd.internal.executionEnded = true;

	pool.runningCommands--;
	if(pool.runningCommands <= 0) {
		pool.runningCommands = 0; // To be safe
		pool.hasCommandsRunning = false;
	}

	// TODO: Timeout abort behavior..

	// Since command is now done we delete it from the commandMap	
	delete pool.commandMap[cmd.common.id];
}

/* Common signals */
exports.Signals = {
	Termination: new Command(0, null, null, 1),
}