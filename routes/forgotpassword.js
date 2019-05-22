var express = require('express');
var router = express.Router();
var sqlManager = require('../manager/sqlManager');
var randomstring = require("randomstring");
var nodemailer = require("nodemailer");

router.get('/', function(req, res, next) {
    var params = {
      userName : (req.session == undefined)? null:req.session.userName,
      targetWeight : (req.session == undefined)? null:req.session.targetWeight,
      profileIMG : (req.session == undefined)? null:req.session.profileIMG,
    };
    res.render('forgotpassword',params);
  
  });
  

router.put('/',function(req,res,next){
 sqlManager(function(err, con) {
    var checkQuery = 'SELECT REGIST_TYPE,USER_NM FROM DIET_MANAGER.USER WHERE EMAIL = ?';
    con.query(checkQuery, req.body.email, function(err, result){
      if(err){
          con.release();
          next(new Error('ERR006|' + req.countryCode));
          return;
      }
      
      var resultParams = {
          isSucess : true,
          registType : ""
      };

      if(result.length != 0){
          resultParams.registType = result[0].REGIST_TYPE;
          if(resultParams.registType == "e"){
            var user = result[0].USER_NM;
            // change password
            var password = randomstring.generate(5);
            var updateQuery = 'UPDATE `DIET_MANAGER`.`USER` SET `PASSWORD` = concat("*",sha1(unhex(sha1(?)))) WHERE (`EMAIL` = ?);';
            var queryParams = [
                                password,
                                req.body.email
                              ];
            con.query(updateQuery, queryParams, function(err, result) {
              if (err) {
                con.release();
                next(new Error('ERR006|' + req.countryCode));
                return;
              }
              con.release();

              var config = require("./../config.json");
              var transpoter = nodemailer.createTransport({
                service : config.mailInfo.service,
                //TODO 추후 고객센터 계정 추가
                auth : {
                  user: config.mailInfo.user,
                  pass: config.mailInfo.pass
                }
              });

              //보낼 문서내용
              var fs =require("fs");
              fs.readFile(__dirname + '/../resource/raw/html/forgotpassword.html', function(err, html){
                if(err) {
                  connection.release();
                  next(new Error(err.message));
                  return;
                }
                html = html.toString();
                html = html.replace("xxx", user);
                html = html.replace("yyy", password);

                var mailOption = {
                  from : config.mailInfo.user ,
                  to: req.body.email,
                  subject: '[다이어트 매니저]임시비밀번호 발급 ',//String
                  html: html

                };
                transpoter.sendMail(mailOption);

                res.send(resultParams);
              });
            });
          }else{
            con.release();
            res.send(resultParams);
          }
      }else{
        resultParams.isSucess = false;
        con.release();
        res.send(resultParams);
      }
    });
  });
});

 


  module.exports = router;