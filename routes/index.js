var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');

router.get('/', function(req, res, next) {
  var params = {
    userName : (req.session == undefined)? null:req.session.userName,
    targetWeight : (req.session == undefined)? null:req.session.targetWeight,
    profileIMG : (req.session == undefined)? null:req.session.profileIMG,
    needDailyReport : false,
    nutritionInfo : {
      protein : 0,
      proteinDiff : 0,
      carbo : 0,
      carboDiff : 0,
      weight : 0,
      weightDiff : 0
    }
  };

  if(req.session.session == undefined){
    res.render('index', params);
  }else{
    sqlManager(function(err, con) {
      var checkQuery = 'SELECT CARBO_RATE, PROTEIN_RATE, CURRENT_WEIGHT, TARGET_WEIGHT, MEAL_FREQUENCY, date_format(RECORD_YMD, "%Y-%m-%d") as RECORD_YMD FROM DIET_MANAGER.DAILY_SURVEY WHERE USER_ID = (SELECT USER_ID FROM USER WHERE EMAIL = ?) ORDER BY RECORD_YMD DESC  LIMIT 2;';
      con.query(checkQuery, req.session.email, function(err, result){
        
        if(err){
          con.release();
          next(new Error('ERR006|' + req.countryCode));
          return;
        }
        con.release();
        
        if(result.length == 2){
          for(var recordIndex = 0; recordIndex < result.length; recordIndex++){
            var targetWeight = result[recordIndex].TARGET_WEIGHT;
            var proteinRate = result[recordIndex].PROTEIN_RATE;
            var proteinTotalWeight = targetWeight * proteinRate;
            var mealFrequency = result[recordIndex].MEAL_FREQUENCY;
            result[recordIndex].PROTEIN = Math.round((proteinTotalWeight/0.2955)/mealFrequency);

            var carboRate = result[recordIndex].CARBO_RATE;
            var carboTotalWeight =  targetWeight * carboRate;
            result[recordIndex].CARBO = Math.round((carboTotalWeight/0.4585)/mealFrequency);
          }

          params.nutritionInfo = {
            protein : result[0].PROTEIN,
            proteinDiff : Math.round(((result[0].PROTEIN - result[1].PROTEIN)*100))/100,
            carbo : result[0].CARBO,
            carboDiff : Math.round(((result[0].CARBO - result[1].CARBO)*100))/100,
            weight : result[0].CURRENT_WEIGHT,
            weightDiff : Math.round(((result[0].CURRENT_WEIGHT - result[1].CURRENT_WEIGHT)*100))/100
          };
          res.render('index', params);  
        }else if(result.length == 1){
          var targetWeight = result[0].TARGET_WEIGHT;
          var proteinRate = result[0].PROTEIN_RATE;
          var proteinTotalWeight = targetWeight * proteinRate;
          var mealFrequency = result[0].MEAL_FREQUENCY;
          result[0].PROTEIN = Math.round((proteinTotalWeight/0.2955)/mealFrequency);

          var carboRate = result[0].CARBO_RATE;
          var carboTotalWeight =  targetWeight * carboRate;
          result[0].CARBO = Math.round((carboTotalWeight/0.4585)/mealFrequency);
          params.nutritionInfo = {
            protein : result[0].PROTEIN,
            proteinDiff : 0,
            carbo : result[0].CARBO,
            weightDiff : 0,
            weight : result[0].CURRENT_WEIGHT
          };
          res.render('index', params);  
        }else{
          params.needDailyReport = true;
          res.render('index', params);  
        }
      });
    });
  }
});

router.get('/weight', function(req, res, next) {
  if(req.session.session == undefined){
    var resultParams = {
      isSuccess : false,
      needLogin : true
    };
    res.send(resultParams);
    return;
  }

  sqlManager(function(err, con) {
    var queryUser = 'SELECT CURRENT_WEIGHT, RECORD_YMD FROM DIET_MANAGER.DAILY_SURVEY WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) AND YEAR(RECORD_YMD) = ? AND MONTH(RECORD_YMD) = ? ORDER BY RECORD_YMD ASC;';
    var params = [
      req.session.email,
      req.query.year,
      req.query.month
    ];
    con.query(queryUser, params, function(err, result){
      
      if(err){
        con.release();
        next(new Error('ERR006|' + req.countryCode));
        return;
      }
      con.release();
      
      var resultParams = {
        isSuccess : true,
        weightList : []
      };

      var strDate = req.query.year+'-'+req.query.month+'-01';
      var date = new Date(strDate), y = date.getFullYear();
      var lastDay = new Date(y, req.query.month, 0);
      lastDay = lastDay.getDate();

      var weightInfo = result.shift();
      for(var day = 1; day <= lastDay; day++){
        if(weightInfo != undefined){
          var recordDate = new Date(weightInfo.RECORD_YMD).getTime();
          var dataDate = new Date(req.query.year+'-'+req.query.month+'-'+day).getTime();
          if(recordDate == dataDate){
            resultParams.weightList.push(weightInfo.CURRENT_WEIGHT);
            weightInfo = result.shift();
          }else{
            resultParams.weightList.push(0);
          }
        }else{
          resultParams.weightList.push(0);
        }
      }

      res.send(resultParams);
    });
  });
});

router.get('/bodycomposition', function(req, res, next) {
  if(req.session.session == undefined){
    var resultParams = {
      isSuccess : false,
      needLogin : true
    };
    res.send(resultParams);
    return;
  }

  sqlManager(function(err, con) {
    var queryUser = 'SELECT BODY_MUSCLE, BODY_FAT, BODY_WEIGHT,  RECORD_YMD FROM DIET_MANAGER.BODYCOMPOSITION WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) AND YEAR(RECORD_YMD) = ? ORDER BY RECORD_YMD ASC;';
    var params = [
      req.session.email,
      req.query.year
    ];
    con.query(queryUser, params, function(err, result){
      
      if(err){
        con.release();
        next(new Error('ERR006|' + req.countryCode));
        return;
      }
      con.release();
      
      var resultParams = {
        isSuccess : true,
        bodycompositionList : []
      };

      for(var month = 0; month < 12; month++){
        resultParams.bodycompositionList[month] = {
          weight : 0,
          muscle : 0,
          fat : 0
        };
      }

      for(var index = 0; index < result.length; index++){
        var month = new Date(result[index].RECORD_YMD).getMonth();
        resultParams.bodycompositionList[month] = {
          weight : result[index].BODY_WEIGHT,
          muscle : result[index].BODY_MUSCLE,
          fat : result[index].BODY_FAT
        };
      }

      res.send(resultParams);
    });
  });
});

router.get('/ffmi', function(req, res, next) {
  if(req.session.session == undefined){
    var resultParams = {
      isSuccess : false,
      needLogin : true
    };
    res.send(resultParams);
    return;
  }

  sqlManager(function(err, con) {
    var queryUser = 'SELECT * FROM USER WHERE EMAIL = ?;';
    con.query(queryUser, req.session.email, function(err, result){
      if(err){
        con.release();
        next(new Error('ERR006|' + req.countryCode));
        return;
      }

      var resultParams = {
        isSuccess : false,
        ffmiList : []
      };

      for(var month = 0; month < 12; month++){
        resultParams.ffmiList[month] = {
          ffmi : 0
        };
      }
      if(result.length != 0){
        var height = result[0].HEIGHT/100;
        sqlManager(function(err, con) {
          var queryUser = 'SELECT BODY_MUSCLE, BODY_FAT, BODY_WEIGHT,  RECORD_YMD FROM DIET_MANAGER.BODYCOMPOSITION WHERE USER_ID = (SELECT USER_ID FROM DIET_MANAGER.USER WHERE EMAIL = ?) AND YEAR(RECORD_YMD) = ? ORDER BY RECORD_YMD ASC;';
          var params = [
            req.session.email,
            req.query.year
          ];
          con.query(queryUser, params, function(err, result){
            
            if(err){
              con.release();
              next(new Error('ERR006|' + req.countryCode));
              return;
            }
            con.release();

            for(var index = 0; index < result.length; index++){
              var bodyFatPercentage = (result[index].BODY_FAT/result[index].BODY_WEIGHT);
              var ffm = result[index].BODY_WEIGHT * (1 - (bodyFatPercentage));
              var originFFMI = ffm / Math.pow(height,2);
              var ffmi = ffm/Math.pow(height,2) + 6.1*(1.8 - height);
              var month = new Date(result[index].RECORD_YMD).getMonth();
              resultParams.ffmiList[month] = {
                ffmi : Math.round(ffmi*1000)/1000
              };
            }
            
            resultParams.isSuccess = true;
            res.send(resultParams);
          });
        });
      }else{
        res.send(resultParams);
      }
    });
  });
});



module.exports = router;