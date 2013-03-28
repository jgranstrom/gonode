
/* Create a command object */
exports.Command = Command;
function Command(id, cmd, callback) {
	// Contain common data to be shared with go-module in .common
	this.common = {
		id: id,
		cmd: cmd,
	}
	// Contain internal data not to be sent over the interface in .internal
	this.internal = {
		callback: callback,
		executionStarted: false,
		executionEnded: false,
	}	
}

/* Execute command by sending it to go-module */
Command.prototype.execute = function(go) {
	this.internal.executionStarted = true;	
	// Send common data to go-module
	go.proc.stdin.write(JSON.stringify(this.common) + '\n'); // Write \n to flush write buffer

	// TODO: Implement timeout support
}

/* Handle command response and invoke callback */
Command.prototype.response = function(go, responseData) {
	this.internal.executionEnded = true;

	if(this.internal.callback !== undefined) {
		this.internal.callback(responseData);
	}	
}