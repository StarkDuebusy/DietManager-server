var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');


router.get('/', function(req, res, next) {
  var params = {
    userName : (req.session == undefined)? null:req.session.userName,
    targetWeight : (req.session == undefined)? null:req.session.targetWeight,
    profileIMG : (req.session == undefined)? null:req.session.profileIMG,
    email : (req.session == undefined)? null:req.session.email,
    birth : '',
    weight : '',
    height : '',
    gender : ''
  };

  if(req.session.session == undefined){
    res.render('profile', params);
    return;
  }

  sqlManager(function(err, con) {
    var queryUser = 'SELECT * FROM USER WHERE EMAIL = ?;';
    con.query(queryUser, req.session.email, function(err, result){
      con.release();
      if(err){
        con.release();
        next(new Error('ERR006|' + req.countryCode));
        return;
      }
      
      if(result.length != 0){
        params.gender = result[0].GENDER; 
        var birth = new Date(result[0].BIRTH_YMD);
        birth.setDate(birth.getDate() +1);
        params.birth = birth;
        params.weight = result[0].WEIGHT;
        params.height = result[0].HEIGHT;
      }

      res.render('profile', params);  
    });
  });
});


module.exports = router;