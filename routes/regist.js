var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');


router.get('/', function(req, res, next) {
  res.render('regist');
});

var multer  = require('multer');
var upload = multer();
router.post('/', upload.array('profileIMG',1),function(req, res, next) {
  sqlManager(function(err, con) {
    var query = 'SELECT COUNT(*) AS isExist FROM DIET_MANAGER.USER WHERE EMAIL = ?';
    con.query(query, req.body.email, function(err, result){
      con.release();
      if(err){
        next(new Error('ERR006'));
        return;
      }

      var resultParams = {
        isSuccess : true
      };
     
      res.send(resultParams);
    });
  });
});

module.exports = router;