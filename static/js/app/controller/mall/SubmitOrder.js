define([
    'app/controller/base',
    'app/module/foot',
    'app/interface/MallCtr',
    'app/interface/UserCtr',
    'app/module/AddressList',
    'app/module/expressList',
    'app/module/bindMobile',
], function(base, Foot, MallCtr, UserCtr, AddressList, ExpressList, BindMobile) {
	var code = base.getUrlParam("code")||'';
	var gCode = base.getUrlParam("gCode")||'';
	var spec = base.getUrlParam("spec")||'';
	var sLRfee = base.getUrlParam("sLRfee") || ''; // 推客推荐
	var quantity = base.getUrlParam("quantity")||'';
	var submitType = base.getUrlParam("s");//1为购物车，2为立即下单
	var isBindMobile = false;//是否绑定手机号
	var totalAmount = {
		amount1:0,//人民币总价
		amount2:0,//积分总价
		expressFee: 0 // 运费
	};
	var config = {
		productSpecsCode: spec,
		quantity: quantity,
		toUser:'',
		pojo:{
	    	receiver: "",
	        reMobile: "",
	        reAddress: "",
			applyNote: '',
	        applyUser: base.getUserId(),
	        companyCode: SYSTEM_CODE,
	        systemCode: SYSTEM_CODE
		},
		groupCode: gCode,
		saleUserId: sLRfee
	},
		configYunFei = {
			productList: [],
			address: ""
		},
		configYunFeiProductList = [];
	var cartCodeList =[];
	
	//团购价格
	var gPrice = 0;
	
	// 是否是团购
	var isGP = false;
	if(gCode){
		isGP = true;
	}
	
    if(base.getUserId()){
    	
    	init();
    }else{
    	base.showMsg('登录失效')
    	setTimeout(function(){
    		base.clearSessionUser();
    		base.goLogin()
    	},800)
    }

	function init(){
        base.showLoading(code);
        
        if(submitType==1){
        	$.when(
	        	getProductList(),
	        	isDefaultAddress(),
	        	getUserInfo()
	        )
        }else{
        	if(isGP){
		        $.when(
	        		getGroupPurchaseDetail(gCode),
		        	isDefaultAddress(),
		        	getUserInfo()
		        )
			} else {
				
	        	$.when(
		        	getProductDetail(code),
		        	isDefaultAddress(),
		        	getUserInfo()
		        )
			}
        }
        
    	$("#toUser").attr('data-toUser',SYS_USER)
    	$("#toUser .toUserName samp").html(SYS_USERNAME)
        base.hideLoading();
        addListener()
	}
	
	// 获取团购详情
	function getGroupPurchaseDetail(c){
		return MallCtr.getGroupPurchaseDetail(c).then((data)=>{
			
			gPrice = data.price;
			
        	getProductDetail(code);
		},()=>{})
	}
	
	//获取用户详情 查看是否绑定手机号
	function getUserInfo() {
		return UserCtr.getUser().then(function(data) {
			if(data.mobile){
				isBindMobile = true;
			}else{
				isBindMobile = false
			}
		});
	}
	
	//购物车下单
	function getProductList(){
		/**
		 * carProList={
		 *	code: '',//购物车编号
		 *	productCode: '',//商品编号
		 *	advPic: '',//商品图片
		 *	name: '',//商品名
		 *	specsName: '',//规格名称
		 *	price: '',//价格
		 *	quantity: '',//数量
		 *	type: '',//商品类型
		 *}
		 * */
		
		var carSubProInfo = JSON.parse(sessionStorage.getItem('carSubProInfo'));
		var html = '';
		
		carSubProInfo.forEach(function(d, i){
			html += `<a class="mall-item" href="./mallDetail.html?code=${d.productCode}">
    		<div class="mall-item-img fl" style="background-image: url('${base.getImg(d.advPic)}');"></div>
    		<div class="mall-item-con fr">
    			<p class="name">${d.name}</p>
    			<samp class="slogan">${d.specsName}</samp>
    			<div class="price wp100">
    				<samp class="samp1 fl">${d.type=='JF' ? base.formatMoney(d.price)+'积分' : '￥'+base.formatMoney(d.price)}</samp>
    				<samp class="samp2 fr">x${d.quantity}</samp>
    			</div></div></a>`;
    		
    		if(d.type=='JF'){
    			totalAmount.amount2+=d.price*d.quantity;
    		}else{
    			totalAmount.amount1+=d.price*d.quantity;
    		}
    		cartCodeList.push(d.code);
    		configYunFeiProductList.push({
    			productSpecsCode: d.productSpecsCode,
	            quantity: d.quantity
    		})
		})
    			
		$(".orderPro-list").html(html);
		
		$("#totalAmount").html( totalAmount.amount2&&totalAmount.amount2!=0 ? '￥'+base.formatMoney(totalAmount.amount1)+'+'+base.formatMoney(totalAmount.amount2)+'积分': '￥'+base.formatMoney(totalAmount.amount1))
		
	}
	
	//立即下单时获取详情
	function getProductDetail(c){
		MallCtr.getProductDetail(c).then((data)=>{
			
			var html = '';
			var specName,price;
			var type = data.category
			
			data.productSpecsList.forEach(function(d, i){
				if(d.code==spec){
					if(data.specsName2){
						specName = d.specsVal1+" "+d.specsVal2;
					}else{
						specName = d.specsVal1;
					}
					if(isGP){
						d.price1 = gPrice;
					}
					
					price = type==JFPRODUCTTYPE ? base.formatMoney(d.price2)+'积分' : '￥'+base.formatMoney(d.price1)
					totalAmount.amount1 = d.price1 || 0;
					totalAmount.amount2 = d.price2 || 0;
				}
			})
			html = `<a class="mall-item" href="./mallDetail.html?code=${data.code}&gCode=${gCode}">
    		<div class="mall-item-img fl" style="background-image: url('${base.getImg(data.advPic)}');"></div>
    		<div class="mall-item-con fr">
    			<p class="name">${data.name}</p>
    			<samp class="slogan">${specName}</samp>
    			<div class="price wp100">
    				<samp class="samp1 fl">${price}</samp>
    				<samp class="samp2 fr">x${quantity}</samp>
    			</div></div></a>`;
    			
			$(".orderPro-list").html(html);
			$("#totalAmount").html(type==JFPRODUCTTYPE ? base.formatMoney(totalAmount.amount2*quantity)+'积分' : '￥'+base.formatMoney(totalAmount.amount1*quantity + totalAmount.expressFee))
			
		},()=>{})
	}
	
	//获取默认地址
	function isDefaultAddress(){
		UserCtr.getAddressList(true,{isDefault:1}).then((data)=>{
			var html = '';
			
			if(data.length){
				html = `<div class="icon icon-dz"></div>
				<div class="wp100 over-hide"><samp class="fl addressee">收货人：${data[0].addressee}</samp><samp class="fr mobile">${data[0].mobile}</samp></div>
				<div class="detailAddress">收货地址： ${data[0].province}  ${data[0].city}  ${data[0].district}  ${data[0].detailAddress}</div>
				<div class="icon icon-more"></div>`
				
				$("#orderAddress").html(html).attr('data-code',data[0].code)
				config.pojo ={
			    	receiver: data[0].addressee,
			        reMobile: data[0].mobile,
			        reAddress: data[0].province+' '+data[0].city+' '+data[0].district+' '+data[0].detailAddress,
			        applyUser: base.getUserId(),
			        companyCode: SYSTEM_CODE,
			        systemCode: SYSTEM_CODE
			    }
				if(submitType==2){
					configYunFei = {
						productList: [{
				            productSpecsCode: spec,
				            quantity: quantity
				    	}],
						address:config.pojo.reAddress
					};
				}else{
					configYunFei = {
						productList: configYunFeiProductList,
						address:config.pojo.reAddress
					};
				}
				
				getYunFei(configYunFei);
			}else{
				$('.no-address').removeClass('hidden')
			}
		},()=>{})
		
	}
	
	//提交订单-立即下单
	function submitOrder1(param){
		base.showLoading()
		MallCtr.placeOrder(param,true).then((data)=>{
			base.hideLoading();
			$("#mask").removeClass('hidden');
			base.showMsg('下单成功！',1200)
			
			setTimeout(function(){
				location.href = '../pay/pay.html?code='+data+'&type=mall';
			},800)
		},()=>{})
	}
	
	//提交订单-购物车订单
	function submitOrder2(param){
		base.showLoading()
		MallCtr.carPlaceOrder(param,true).then((data)=>{
			base.hideLoading();
			$("#mask").removeClass('hidden');
			base.showMsg('下单成功！',1200)
			
			setTimeout(function(){
				location.href = '../pay/pay.html?code='+data+'&type=mall';
			},800)
		},()=>{})
	}
	
	
	//地址列表module
	function addressListAddCont(c){
		AddressList.addCont({
            userId: base.getUserId(),
            success: function(res,dCode) {
            	if(res.receiver){
            		config.pojo.receiver = res.receiver;
				    config.pojo.reMobile = res.reMobile;
				    config.pojo.reAddress = res.reAddress;
				    
					var html = `<div class="icon icon-dz"></div>
					<div class="wp100 over-hide"><samp class="fl addressee">收货人：${config.pojo.receiver}</samp><samp class="fr mobile">${config.pojo.reMobile}</samp></div>
					<div class="detailAddress">收货地址： ${config.pojo.reAddress}</div>
					<div class="icon icon-more"></div>`
					
					if(submitType==2){
						configYunFei = {
							productList: [{
					            productSpecsCode: spec,
					            quantity: quantity
					    	}],
							address:config.pojo.reAddress
						};
					}else{
						configYunFei = {
							productList: configYunFeiProductList,
							address:config.pojo.reAddress
						};
					}
					getYunFei(configYunFei);
					
					$("#orderAddress").html(html).attr('data-code',dCode);
				    $("#orderAddress").removeClass('hidden');
	            	$('.no-address').addClass('hidden');
	            	
            	}else{
            		config.pojo.receiver = '';
				    config.pojo.reMobile = '';
				    config.pojo.reAddress = '';
				    
				    $("#orderAddress").addClass('hidden');
	            	$('.no-address').removeClass('hidden');
            	}
            	
            }
        });
		AddressList.showCont({
			code: c
		});
	}
	
	//获取运费
	function getYunFei(params){
		if($("#toUser").attr('data-toUser')!=SYS_USER){
			$('.yunfeiWrap').addClass('hidden')
			if(submitType == 2){
				$("#totalAmount").html( totalAmount.amount2&&totalAmount.amount2!=0 ? base.formatMoney(totalAmount.amount2*quantity)+'积分': '￥'+base.formatMoney(totalAmount.amount1*quantity))
			}else{
				$("#totalAmount").html( totalAmount.amount2&&totalAmount.amount2!=0 ? '￥'+base.formatMoney(totalAmount.amount1)+'+'+base.formatMoney(totalAmount.amount2)+'积分': '￥'+base.formatMoney(totalAmount.amount1))
			}
		}else{
			MallCtr.getYunfei(params).then((data)=>{
				
				$('.yunfeiWrap').removeClass('hidden')
				$("#yunfei samp").html('￥'+base.formatMoney(data.expressFee));
				totalAmount.expressFee = data.expressFee;
				if(submitType == 2){
					$("#totalAmount").html( totalAmount.amount2&&totalAmount.amount2!=0 ? '￥'+base.formatMoney(totalAmount.amount1*quantity+data.expressFee)+'+'+base.formatMoney(totalAmount.amount2*quantity)+'积分': '￥'+base.formatMoney(totalAmount.amount1*quantity+data.expressFee))
				}else{
					$("#totalAmount").html( totalAmount.amount2&&totalAmount.amount2!=0 ? '￥'+base.formatMoney(totalAmount.amount1+data.expressFee)+'+'+base.formatMoney(totalAmount.amount2)+'积分': '￥'+base.formatMoney(totalAmount.amount1+data.expressFee))
				}
			},()=>{})
		}
	}
	
	function addListener(){
		BindMobile.addMobileCont({
        	success: function() {
        		isBindMobile = true;
        		$("#subBtn").click()
        	},
        	error: function(msg) {
        		isBindMobile = false;
        		base.showMsg(msg);
        	},
        	hideBack: 1
        });
       
		//地址
		$("#orderAddress").click(function(){
			addressListAddCont($(this).attr('data-code'))
		})
		
		//未添加地址
		$('.no-address').click(function(){
			addressListAddCont($(this).attr('data-code'))
		})
		
		//提交
		$("#subBtn").click(function(){
			if(!isBindMobile){
				BindMobile.showMobileCont();
			}else{
				config.pojo.applyNote = $("#applyNote").val();
				config.toUser = $("#toUser").attr('data-toUser')
				var param={}
				if(submitType=='1'){
					
					param.pojo = config.pojo;
					
	        		if($("#toUser").attr('data-toUser')!=SYS_USER){
						param.pojo.receiver = '';
						param.pojo.reMobile = '';
						param.pojo.reAddress = '';
	        		};
					
					param.toUser = config.toUser;
					param.cartCodeList=cartCodeList
					
					submitOrder2(param)
				}else {
					
					if(config.pojo.receiver){
						param=config
					
						submitOrder1(param)
					}else if($("#toUser").attr('data-toUser')==SYS_USER){
						base.showMsg('请选择地址')
					}else{
						param=config;
						
						param.pojo.receiver = '';
						param.pojo.reMobile = '';
						param.pojo.reAddress = '';
						
						submitOrder1(param)
					}
					
				}
			
			}
		})
		
		ExpressList.addCont({
            success: function(res) {
				base.showLoading()
            	if(res.toUser){
            		$("#toUser").attr('data-toUser',res.toUser)
            		
            		//快递
            		if(res.toUser==SYS_USER){
            			
            			$("#toUser").find('.toUserName').children('samp').html(res.toUserName)
            			$('#toStoreAddress').addClass('hidden').html('')
            			$('#orderAddress').removeClass('hidden')
            			
            			if($('#orderAddress').html()){
							$('.no-address').addClass('hidden');
            			}else{
							$('.no-address').removeClass('hidden');
            			}
            			if($("#toUser").attr('data-toUser')==SYS_USER && !config.pojo.reAddress){
							base.hideLoading()
							base.showMsg('请选择地址')
						}else{
							if(submitType==2){
								configYunFei.productList.productSpecsCode= spec,
							    configYunFei.productList.quantity = quantity;
							}else{
								configYunFei.productList = configYunFeiProductList
							}
							getYunFei(configYunFei);
							base.hideLoading()
						}
            		//自提
            		}else{
            			
						var html = `<div class="icon icon-dz"></div>
						<div class="wp100 over-hide"><samp class="fl addressee">提货点：${res.toUserName}</samp></div>
						<div class="detailAddress">提货点地址： ${res.toUserAddress}</div>`
						
            			$("#toUser").find('.toUserName').children('samp').html("自提")
            			
						$('.no-address').addClass('hidden');
						$("#toStoreAddress").html(html).removeClass('hidden')
            			$('#orderAddress').addClass('hidden')
            			
						getYunFei(configYunFei);
						base.hideLoading()
            		}
            		
            	}else{
            		
					base.hideLoading();
            	}
            }
        });
		
		//配送方式
		$("#toUser").click(function(){
			
			ExpressList.showCont();
		})
		
	}
	
})
