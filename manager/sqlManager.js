var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 150,
  host            : '관리자에게문의하세요',
  user            : '관리자에게문의하세요',
  password        : '관리자에게문의하세요',
  database        : '관리자에게문의하세요',
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