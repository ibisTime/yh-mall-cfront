define([
  'app/controller/base',
  'app/module/validate',
  'app/module/smsCaptcha',
  'app/interface/UserCtr'
], function(base, Validate, smsCaptcha, UserCtr) {
	var tradePwd = 0;
	
  init();

  function init() {
    base.showLoading();
    UserCtr.getUser()
      .then((data) => {
        base.hideLoading();
        $("#mobile").val(data.mobile);
        $("#modelMobile").val(data.mobile);
        tradePwd = data.tradePwdStrength;
        
        addListeners();
      });
  }

  function addListeners() {
    var _formWrapper = $("#formWrapper");
    _formWrapper.validate({
      'rules': {
        "smsCaptcha": {
          sms: true,
          required: true
        },
        "tradePwd": {
          required: true,
          maxlength: 16,
          minlength: 6,
          isNotFace: true
        },
        "reTradePwd": {
          required: true,
          equalTo: "#tradePwd"
        },
        "mobile": {
          required: true,
          mobile: true
        }
      },
      onkeyup: false
    });
    smsCaptcha.init({
      bizType: tradePwd?"805067":"805066"
    });
    
    $("#setTradePwd").on("click", function() {
      if (_formWrapper.valid()) {
      	
      	if(tradePwd){
      		changeTradePwd();
      	}else{
        	setTradePwd();
      	}
      }
    });
  }
	
	function changeTradePwd() {
    base.showLoading("设置中...");
    UserCtr.changeTradePwd($("#tradePwd").val(), $("#smsCaptcha").val())
      .then(function() {
        base.hideLoading();
        base.showMsg("支付密码设置成功！");
        setTimeout(function() {
          location.replace("./set.html")
        }, 500);
      });
  }
	
  function setTradePwd() {
    base.showLoading("设置中...");
    UserCtr.setTradePwd($("#tradePwd").val(), $("#smsCaptcha").val())
      .then(function() {
        base.hideLoading();
        base.showMsg("支付密码设置成功！");
        setTimeout(function() {
          location.replace("./set.html")
        }, 500);
      });
  }
});
