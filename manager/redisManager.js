var Redis = require('ioredis');
var redis = new Redis({
	retryStrategy: function (times) {
		var delay = Math.min(times * 2, 2000);
		return delay;
	},
	reconnectOnError: function (err) {
	  var targetError = 'READONLY';
	  if (err.message.slice(0, targetError.length) === targetError) {
	    // Only reconnect when the error starts with "READONLY"
	    return true; // or `return 1;`
	  }
	}
});

module.exports = redis;