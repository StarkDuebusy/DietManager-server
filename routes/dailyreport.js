var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');


router.get('/', function(req, res, next) {
  sqlManager(function(err, con) {
		var checkQuery = 'SELECT * FROM DIET_MANAGER.NUTRITION;';
		con.query(checkQuery, null, function(err, result){
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
      }
      
      var params = {
        userName : (req.session == undefined)? null:req.session.userName,
        targetWeight : (req.session == undefined)? null:req.session.targetWeight,
        profileIMG : (req.session == undefined)? null:req.session.profileIMG,
        currentWeight : '',
        dietProcess : 0,
        workoutProcess : 0
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
      
      if(req.session.session == undefined){
        con.release();
        res.render('dailyreport', params);
        return;
      }

      var query = 'SELECT CURRENT_WEIGHT, WORKOUT_PROCESS, DIET_PROCESS FROM DIET_MANAGER.DAILY_SURVEY WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) ORDER BY RECORD_YMD DESC LIMIT 1;';
      con.query(query, req.session.email, function(err, result){
        if(err){
          con.release();
          next(new Error('ERR006|' + req.countryCode));
          return;
        }
        con.release();

        if(result.length == 1){
          result = result[0];
          params.currentWeight = result.CURRENT_WEIGHT;
          params.dietProcess = result.DIET_PROCESS;
          params.workoutProcess = result.WORKOUT_PROCESS;
        }

        res.render('dailyreport', params);
      });
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
		var checkQuery = 'SELECT TARGET_WEIGHT, WORKOUT_FREQUENCY, MEAL_FREQUENCY, CURRENT_WEIGHT, RECORD_YMD=CURDATE() as updated FROM DIET_MANAGER.DIET_SURVEY WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?);';
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
        var dietMode = (result[0].CURRENT_WEIGHT-targetWeight >= 0)? true : false;
        var updated = result[0].updated;

          var checkQuery = 'SELECT CURRENT_WEIGHT, PROTEIN_RATE, CARBO_RATE, WORKOUT_PROCESS, DIET_PROCESS, RECORD_YMD FROM DIET_MANAGER.DAILY_SURVEY WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) ORDER BY RECORD_YMD DESC LIMIT 3';
          con.query(checkQuery, req.session.email, function(err, result){
            if(err){
              con.release();
              next(new Error('ERR006|' + req.countryCode));
              return;
            }

            var nutritionInfo = {
              proteinRate : 0.0,
              carboRate : 0.0
            }

            if(result.length != 0){
              var lastRecDate = new Date(result[0].RECORD_YMD);
              lastRecDate.setHours(0,0,0,0);
              var newRecDate = new Date(req.body.recordDate);
              newRecDate.setHours(0,0,0,0);
              var alreadyAdded = false;
              if(lastRecDate.getTime() == newRecDate.getTime()){
                alreadyAdded = true;
                result.shift();
              }
            }

            result.unshift({ 
              RECORD_YMD : req.body.recordDate,
              CURRENT_WEIGHT : parseFloat(req.body.currentWeight),
              WORKOUT_PROCESS : parseInt(req.body.workoutProcess),
              DIET_PROCESS : parseInt(req.body.dietProcess)
            });

            
            judgeNutritionRate(result, dietMode, updated, workoutFrequncy, nutritionInfo);

            var insertParams = [
              req.session.email,
              req.body.dietProcess,
              req.body.didWorkout,
              req.body.workoutProcess,
              req.body.currentWeight,
              targetWeight,
              mealFrequency,
              nutritionInfo.proteinRate,
              nutritionInfo.carboRate,
              req.body.recordDate
            ];
            
            if(alreadyAdded){
              var updateParams = [
                req.body.dietProcess,
                req.body.didWorkout,
                req.body.workoutProcess,
                req.body.currentWeight,
                targetWeight,
                mealFrequency,
                nutritionInfo.proteinRate,
                nutritionInfo.carboRate,
                req.session.email,
                req.body.recordDate
              ];
              updateDailySurvey(con, res, updateParams);
            }else{
              insertDailySurvey(con, res, insertParams);
            }
          });
       }
    });
  });
});

function insertDailySurvey(con, res, params){
  var query = 'INSERT INTO `DIET_MANAGER`.`DAILY_SURVEY` (`USER_ID`, `DIET_PROCESS`, `DID_WORKOUT`, `WORKOUT_PROCESS`, `CURRENT_WEIGHT`, `TARGET_WEIGHT`, `MEAL_FREQUENCY`, `PROTEIN_RATE`, `carbo_RATE`, `RECORD_YMD`) VALUES ((SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?);';
  con.query(query, params, function(err, result){
    if(err){
      con.release();
      next(new Error('ERR006|' + req.countryCode));
      return;
    }
    con.release();

    var resultParams = {
      'isSuccess' : false
    };
    if(result.affectedRows == '1'){
      resultParams.isSuccess = true;
    }
    
    res.send(resultParams);
  });
}

function updateDailySurvey(con, res, params){
  var query = 'UPDATE `DIET_MANAGER`.`DAILY_SURVEY` SET `DIET_PROCESS` = ?, `DID_WORKOUT` = ?, `WORKOUT_PROCESS` = ?, `CURRENT_WEIGHT` = ?,`TARGET_WEIGHT` = ?, `MEAL_FREQUENCY` = ?, `PROTEIN_RATE` = ?, `CARBO_RATE` = ?  WHERE `USER_ID` = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) AND `RECORD_YMD` = ?;';
  con.query(query, params, function(err, result){
    if(err){
      con.release();
      next(new Error('ERR006|' + req.countryCode));
      return;
    }

    con.release();

    var resultParams = {
      'isSuccess' : false
    };
    if(result.affectedRows == '1'){
      resultParams.isSuccess = true;
    }
    
    res.send(resultParams);
  });
}

function judgeNutritionRate(weightRecord, dietMode, updated, workoutFrequncy, nutritionInfo){
  if(weightRecord.length <= 1){
    initNutritionRate(workoutFrequncy, nutritionInfo);
    return;
  }else if(weightRecord.length < 3){
    if(!updated){
      nutritionInfo.proteinRate = weightRecord[1].PROTEIN_RATE;
      nutritionInfo.carboRate = weightRecord[1].CARBO_RATE; 
    }else{
      initNutritionRate(workoutFrequncy, nutritionInfo)
    }
    return;
  }

  if(updated){
    initNutritionRate(workoutFrequncy, nutritionInfo)
  }else{
    nutritionInfo.proteinRate = weightRecord[1].PROTEIN_RATE;
    nutritionInfo.carboRate = weightRecord[1].CARBO_RATE;

    const recordDate1 = new Date(weightRecord[0].RECORD_YMD);
    const recordDate2 = new Date(weightRecord[2].RECORD_YMD);
    const diffTime = Math.abs(recordDate1.getTime() - recordDate2.getTime());
    const period = Math.ceil(diffTime / 86400000); 
    const weightDiff = weightRecord[0].CURRENT_WEIGHT - weightRecord[2].CURRENT_WEIGHT;
    const workoutProcess = (weightRecord[0].WORKOUT_PROCESS+weightRecord[1].WORKOUT_PROCESS+weightRecord[2].WORKOUT_PROCESS)/3;
    const dietProcess = (weightRecord[0].DIET_PROCESS+weightRecord[1].DIET_PROCESS+weightRecord[2].DIET_PROCESS)/3;

    if(period < 8 && period >2){
      if(dietMode){
        if(dietProcess > 3 && workoutProcess > 3.5){
          if(weightDiff > 1){
            nutritionInfo.proteinRate -= 0.25;
            nutritionInfo.carboRate -= 0.25;
          }else if(weightDiff < -1){
            nutritionInfo.proteinRate += 0.25;
            nutritionInfo.carboRate += 0.25;
          }
        }else if(weightDiff < -3){
          nutritionInfo.proteinRate += 0.25;
          nutritionInfo.carboRate += 0.25;
        }
      }else{
        if(weightDiff < 0){
          nutritionInfo.proteinRate += 0.25;
          nutritionInfo.carboRate += 0.25;
        }else if(weightDiff >= 2 && dietProcess > 3 && workoutProcess <= 3.5){
          nutritionInfo.proteinRate -= 0.25;
          nutritionInfo.carboRate -= 0.25;
        }else if(weightDiff > 3){
          nutritionInfo.proteinRate -= 0.25;
          nutritionInfo.carboRate -= 0.25;
        }
      }
    }
  }
}

function initNutritionRate(workoutFrequncy, nutritionInfo){
  if(workoutFrequncy == 2){
    nutritionInfo.proteinRate = 1.7;
    nutritionInfo.carboRate = 1.9;
  }else if(workoutFrequncy == 1){
    nutritionInfo.proteinRate = 1.4;
    nutritionInfo.carboRate = 1.6;
  }else{
    nutritionInfo.proteinRate = 2;
    nutritionInfo.carboRate = 2.2;
  }
}

router.get('/nutrition', function(req, res, next) {
  if(req.session.session == undefined){
    var resultParams = {
      isSuccess : false,
      needLogin : true
    };
    res.send(resultParams);
    return;
  }

  sqlManager(function(err, con) {
		var checkQuery = 'SELECT TARGET_WEIGHT, WORKOUT_FREQUENCY, MEAL_FREQUENCY, CURRENT_WEIGHT, RECORD_YMD=CURDATE() as updated FROM DIET_MANAGER.DIET_SURVEY WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?);';
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
        var dietMode = (result[0].CURRENT_WEIGHT-targetWeight >= 0)? true : false;
        var updated = result[0].updated;

        var checkQuery = 'SELECT CURRENT_WEIGHT, PROTEIN_RATE, CARBO_RATE, WORKOUT_PROCESS, DIET_PROCESS, MEAL_FREQUENCY,RECORD_YMD FROM DIET_MANAGER.DAILY_SURVEY WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) ORDER BY RECORD_YMD DESC LIMIT 3';
        con.query(checkQuery, req.session.email, function(err, result){
          if(err){
            con.release();
            next(new Error('ERR006|' + req.countryCode));
            return;
          }

          if(result.length == 0 || result.length == 1){
            if(result.length == 1){
              var lastRecDate = new Date(result[0].RECORD_YMD);
              lastRecDate.setHours(0,0,0,0);
              var newRecDate = new Date(req.query.recordDate);
              newRecDate.setHours(0,0,0,0);
              if(lastRecDate.getTime() == newRecDate.getTime()){
                singleNutritionCalc();
                return;
              }
            }else{
              singleNutritionCalc();
              return;
            }
          }

          
          function singleNutritionCalc(){
            var nutritionInfoNew = [{
              proteinRate : 0.0,
              carboRate : 0.0,
              mealFrequency : mealFrequency,
              proteinGram : 0,
              carboGram : 0
            }];
            judgeNutritionRate(result, dietMode, updated, workoutFrequncy, nutritionInfoNew[0]);
            getNutritionInfo(con, req.query.protein, req.query.carbo, nutritionInfoNew, []);
          }

          var lastRecDate = new Date(result[0].RECORD_YMD);
          lastRecDate.setHours(0,0,0,0);
          var newRecDate = new Date(req.query.recordDate);
          newRecDate.setHours(0,0,0,0);
          if(lastRecDate.getTime() == newRecDate.getTime()){
            result.shift();
          } 

          result.unshift({
            RECORD_YMD : req.query.recordDate,
            CURRENT_WEIGHT : parseFloat(req.query.currentWeight),
            WORKOUT_PROCESS : parseInt(req.query.workoutProcess),
            DIET_PROCESS : parseInt(req.query.dietProcess)
          });

          var nutritionInfoList = [{
            proteinRate : 0.0,
            carboRate : 0.0,
            mealFrequency : mealFrequency,
            proteinGram : 0,
            carboGram : 0
          },
          {
            proteinRate : result[1].PROTEIN_RATE,
            carboRate : result[1].CARBO_RATE,
            mealFrequency : result[1].MEAL_FREQUENCY,
            proteinGram : 0,
            carboGram : 0
          }];
          judgeNutritionRate(result, dietMode, updated, workoutFrequncy, nutritionInfoList[0]);
          getNutritionInfo(con, req.query.protein, req.query.carbo, nutritionInfoList, []);


          function getNutritionInfo(con, protein, carbo, nutritionInfoList, infoList){
            var checkQuery = 'SELECT * FROM DIET_MANAGER.NUTRITION WHERE NAME = ?;';
            var params;
            if(infoList.length == 0){
              params = protein;
            }else if(infoList.length == 1){
              params = carbo;
            }

            con.query(checkQuery, params, function(err, result){
              if(err){
                con.release();
                next(new Error('ERR006|' + req.countryCode));
                return;
              }
              
              if(result.length == 1){
                var nutrition = {
                  target : result[0].TARGET, 
                  carbo : result[0].CARBO,
                  protein : result[0].PROTEIN
                };
                infoList.push(nutrition);
                
                
                if(infoList.length == 1){
                  getNutritionInfo(con, protein, carbo, nutritionInfoList, infoList);
                }else{
                  for(var infoIndex = 0; infoIndex < nutritionInfoList.length; infoIndex++){
                    var proteinTotalWeight = targetWeight * nutritionInfoList[infoIndex].proteinRate;
                    var proteinGram = (proteinTotalWeight/(infoList[0].protein/100))/nutritionInfoList[infoIndex].mealFrequency;
                    var carboTotalWeight =  targetWeight * nutritionInfoList[infoIndex].carboRate;
                    var carboGram = (carboTotalWeight/(infoList[1].carbo/100))/nutritionInfoList[infoIndex].mealFrequency;
                    nutritionInfoList[infoIndex].proteinGram = proteinGram;
                    nutritionInfoList[infoIndex].carboGram = carboGram;
                  }

                  con.release();
                  var resultParams = {
                    isSuccess : true,
                    proteinGram : nutritionInfoList[0].proteinGram,
                    proteinDiff : (nutritionInfoList.length != 1)?Math.round(((nutritionInfoList[0].proteinGram - nutritionInfoList[1].proteinGram))):0,
                    carboGram : nutritionInfoList[0].carboGram,
                    carboDiff : (nutritionInfoList.length != 1)?Math.round(((nutritionInfoList[0].carboGram - nutritionInfoList[1].carboGram))):0,
                    mealFrequency : nutritionInfoList[0].mealFrequency
                  }
                  res.send(resultParams);
                }
              }else{
                //TODO 영양정보 nutrition api를 통해 영양정보 insert해야함.
                con.release();
                var resultParams = {
                  'isSuccess' : false
                };
                res.send(resultParams);
              }
            });
          }
        });
      }
    });
  });
});

router.get('/weightgap', function(req, res, next) {
  if(req.session.session == undefined){
    var resultParams = {
      isSuccess : false,
      needLogin : true
    };
    res.send(resultParams);
    return;
  }

  sqlManager(function(err, con) {
		var checkQuery = 'SELECT CURRENT_WEIGHT, RECORD_YMD FROM DIET_MANAGER.DAILY_SURVEY WHERE USER_ID = (SELECT USER_ID FROM USER WHERE EMAIL = ?) ORDER BY RECORD_YMD DESC limit 1;';
		con.query(checkQuery, req.session.email, function(err, result){
			if(err){
				con.release();
				next(new Error('ERR006|' + req.countryCode));
				return;
      }
      con.release();
      
      var resultParams = {
        isSuccess : false,
        emptyRecord : false
      };
			if(result.length != 0){
        resultParams.isSuccess = true;
        resultParams.weightGap = req.query.currentWeight - result[0].CURRENT_WEIGHT;
        resultParams.basicRecordDate = result[0].RECORD_YMD;
      }else{
        resultParams.emptyRecord = true;
      }
      res.send(resultParams);
    });
  });
});


module.exports = router;