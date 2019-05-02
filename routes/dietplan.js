var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');


router.get('/', function(req, res, next) {
  var params = {
    userName : (req.session == undefined)? null:req.session.userName,
    targetWeight : (req.session == undefined)? null:req.session.targetWeight,
    profileIMG : (req.session == undefined)? null:req.session.profileIMG
  };
  res.render('dietplan', params);
});

router.post('/', function(req, res, next) {
  if(req.session.session == undefined){
    var resultParams = {
      isSuccess : false,
      needLogin : true
    };
    res.send(resultParams);
    return;
  }

	sqlManager(function(err, con) {
		var checkQuery = 'SELECT count(*) as isExist FROM DIET_MANAGER.DIET_SURVEY WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?);';
		con.query(checkQuery, req.session.email, function(err, result){
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
			}
			result = result[0];
			
			if(result.isExist == '0'){
        var query = 'INSERT INTO `DIET_MANAGER`.`DIET_SURVEY` (`USER_ID`, `CURRENT_WEIGHT`, `TARGET_WEIGHT`, `WORKOUT_FREQUENCY`, `MEAL_FREQUENCY`, `RECORD_YMD`) VALUES ((SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?), ?, ?, ?, ?, CURDATE());';
        var params = [
          req.session.email,
          req.body.currentWeight,
          req.body.targetWeight,
          req.body.workoutFrequency,
          req.body.mealFrequency
        ];
        con.query(query, params, function(err, result){
          con.release();
          if(err){
            con.release();
            next(new Error('ERR006|' + req.countryCode));
            return;
          }

          var resultParams = {
            'isSuccess' : false
          };
          if(result.affectedRows == '1'){
            resultParams.isSuccess = true;
            req.session.targetWeight = req.body.targetWeight;
          }
          
          res.send(resultParams);
        });
			}else{
        var query = 'UPDATE `DIET_MANAGER`.`DIET_SURVEY` SET `CURRENT_WEIGHT` = ?, `TARGET_WEIGHT` = ?, `WORKOUT_FREQUENCY` = ?, `MEAL_FREQUENCY` = ?, `RECORD_YMD` = CURDATE() WHERE (`USER_ID` = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?));';
        var params = [
          req.body.currentWeight,
          req.body.targetWeight,
          req.body.workoutFrequency,
          req.body.mealFrequency,
          req.session.email
        ];
        con.query(query, params, function(err, result){
          con.release();
          if(err){
            con.release();
            next(new Error('ERR006|' + req.countryCode));
            return;
          }

          var resultParams = {
            'isSuccess' : false
          };
          if(result.affectedRows == '1'){
            resultParams.isSuccess = true;
            req.session.targetWeight = req.body.targetWeight;
          }
          
          res.send(resultParams);
        });
      }
		});
	});
});


module.exports = router;