var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');


router.get('/', function(req, res, next) {
  sqlManager(function(err, con) {
		var checkQuery = 'SELECT * FROM DIET_MANAGER.NUTRITION;';
		con.query(checkQuery, null, function(err, result){
      con.release();
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
      }
      
      var params = {
        userName : (req.session == undefined)? null:req.session.userName,
        targetWeight : (req.session == undefined)? null:req.session.targetWeight,
        profileIMG : (req.session == undefined)? null:req.session.profileIMG
      };
      
      params.proteinList = [];
      params.carboList = [];
      for(var index = 0; index < result.length; index++){
        if(result[index].TARGET == 'c'){
          params.carboList.push(result[index].NAME);
        }else if(result[index].TARGET == 'p'){
          params.proteinList.push(result[index].NAME);
        }
      }

      res.render('dailyreport', params);	
    });		
  });
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
		var checkQuery = 'SELECT TARGET_WEIGHT, WORKOUT_FREQUENCY, MEAL_FREQUENCY FROM DIET_MANAGER.DIET_SURVEY WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?);';
		con.query(checkQuery, req.session.email, function(err, result){
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
			}
			
			if(result.length == 0){
        con.release();
        var resultParams = {
          isSuccess : false,
          needLogin : false,
          needDietPlan : true
        };

        res.send(resultParams);
      }else{
        var targetWeight = result[0].TARGET_WEIGHT;
        var workoutFrequncy = result[0].WORKOUT_FREQUENCY;
        var mealFrequency = result[0].MEAL_FREQUENCY;

        sqlManager(function(err, con) {
          var checkQuery = 'SELECT count(*) as isExist FROM DIET_MANAGER.DAILY_SURVEY WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) AND RECORD_YMD = CURDATE()';
          con.query(checkQuery, req.session.email, function(err, result){
            if(err){
              con.release();
              next(new Error('ERR006|' + req.countryCode));
              return;
            }
            result = result[0];

            //TODO 최근3일 체중 감소폭이 1kg이상이면 탄수화물 단백질 소폭감소
            //TODO 몸무게 증량일 경우 최근 3일 체중의 1kg 이상이면 식단 소폭감소, 체중이 감소할경우 소폭 증가
            var proteinRate;
            var caboRate;
            if(workoutFrequncy == 2){
              proteinRate = 1.7;
              caboRate = 1.9;
            }else if(workoutFrequncy == 1){
              proteinRate = 1.4;
              caboRate = 1.6;
            }else{
              proteinRate = 2;
              caboRate = 2.2;
            }

            if(result.isExist == '0'){
              var params = [
                req.session.email,
                req.body.dietProcess,
                req.body.didWorkout,
                req.body.workoutProcess,
                req.body.currentWeight,
                targetWeight,
                mealFrequency,
                proteinRate,
                caboRate
              ];
              var query = 'INSERT INTO `DIET_MANAGER`.`DAILY_SURVEY` (`USER_ID`, `DIET_PROCESS`, `DID_WORKOUT`, `WORKOUT_PROCESS`, `CURRENT_WEIGHT`, `TARGET_WEIGHT`, `MEAL_FREQUENCY`, `PROTEIN_RATE`, `CABO_RATE`, `RECORD_YMD`) VALUES ((SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?), ?, ?, ?, ?, ?, ?, ?, ?, CURDATE());';
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
                }
                
                res.send(resultParams);
              });
            }else{
              var params = [
                req.body.dietProcess,
                req.body.didWorkout,
                req.body.workoutProcess,
                req.body.currentWeight,
                targetWeight,
                mealFrequency,
                proteinRate,
                caboRate,
                req.session.email
              ];
              var query = 'UPDATE `DIET_MANAGER`.`DAILY_SURVEY` SET `DIET_PROCESS` = ?, `DID_WORKOUT` = ?, `WORKOUT_PROCESS` = ?, `CURRENT_WEIGHT` = ?,`TARGET_WEIGHT` = ?, `MEAL_FREQUENCY` = ?, `PROTEIN_RATE` = ?, `CABO_RATE` = ?, `RECORD_YMD` = CURDATE() WHERE (`USER_ID` = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?));';
              con.query(query, params, function(err, result){
                con.release();
                if(err){
                  con.release();
                  next(new Error('ERR006|' + req.countryCode));
                  return;
                }1
      
                var resultParams = {
                  'isSuccess' : false
                };
                if(result.affectedRows == '1'){
                  resultParams.isSuccess = true;
                }
                
                res.send(resultParams);
              });
            }
          });
        });
      }
    });
  });
});

router.get('/nutrition', function(req, res, next) {
  sqlManager(function(err, con) {
		var checkQuery = 'SELECT * FROM DIET_MANAGER.NUTRITION;';
		con.query(checkQuery, null, function(err, result){
      con.release();
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
			}
			
    });		
  });
});


module.exports = router;