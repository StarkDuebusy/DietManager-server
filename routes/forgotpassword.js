var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');

router.get('/', function(req, res, next) {
    var params = {
      userName : (req.session == undefined)? null:req.session.userName,
      targetWeight : (req.session == undefined)? null:req.session.targetWeight,
      profileIMG : (req.session == undefined)? null:req.session.profileIMG,
    };
    res.sendDate(params);
  
  });

  
  module.exports = router;