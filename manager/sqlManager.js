var mysql = require('mysql');
var config = require('./../config.json');

var pool  = mysql.createPool({
  connectionLimit : 150,
  host            : config.DBinfo.host,
  user            : config.DBinfo.user,
  password        : config.DBinfo.password,
  database        : config.DBinfo.database,
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