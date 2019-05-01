var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 150,
  host            : '',
  user            : '',
  password        : '',
  database        : '',
  multipleStatements: true
});

var getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        if (err) return callback(err);
        callback(err, connection);
    });
};

pool.on('acquire', function(connection) {
    console.log('Connection %d acquired', connection.threadId);
});
module.exports = getConnection;