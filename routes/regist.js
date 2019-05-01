var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');


router.get('/', function(req, res, next) {
  res.render('regist', { userName: '손님', targetWeight: '0kg' });
});

router.get('/checkEmail', function(req, res, next) {
	sqlManager(function(err, con) {
		var IDCheckQuery = 'SELECT COUNT(*) AS isExist, REGIST_TYPE FROM DIET_MANAGER.USER WHERE EMAIL = ?';
		con.query(IDCheckQuery, req.query.email, function(err, result){
      con.release();
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
			}
			
			result = result[0];
			
			var resultParams = {
					isDuplicate : false
			};
			if(result.isExist != '0'){
				resultParams.isDuplicate = true;
				resultParams.registedType = result.REGIST_TYPE;
			}
			
			res.send(resultParams);
		});
	});
});

var multer  = require('multer');
var upload = multer();
router.post('/', upload.array('profileIMG',1),function(req, res, next) {
  sqlManager(function(err, con) {
    var query = 'SELECT COUNT(*) AS isExist FROM DIET_MANAGER.USER WHERE EMAIL = ?';
    con.query(query, req.body.email, function(err, result){
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