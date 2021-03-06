define([
    'jquery',
    'app/controller/base',
    'app/util/handlebarsHelpers',
    'app/interface/MallCtr',
    'app/module/scroll',
], function ($, base, Handlebars, MallCtr, scroll) {
    var tmpl = __inline("index.html");
    var _mallTmpl = __inline('../../ui/mall-list-activity.handlebars');
    var defaultOpt = {};
    var firstAdd = true;
    var nDivHight = 0;
    var myScroll,
    	lType;
    var start = 1,
        limit = 10,
        isEnd = false,
        canScrolling = false;
    var l_code, category;
    var proList = [];
    
    var sizeArray = MALLSIZE;//尺码排序
    
	//为商品规格点击事件搭建关系
	var specsArray1 ={};//规格2['规格2':{['规格1'：'规格1']},'规格2':{['规格1'：'规格1']}]
	var specsArray2 ={};//规格1['规格1':{['规格2'：'code']},'规格1':{['规格2'：'code']}]
	var productSpecsListArray={}

    function initData(){
        base.showLoading();
        start = 1;
        getBigCategoryList();
    }
    
    // 获取商品大类
    function getBigCategoryList(){
        MallCtr.getBigCategoryList(true)
            .then(function(data) {
                var html = '<li l_type="" class="allCategory">全部分类</li>', html1 = '<li l_type="" class="wp33 tc fl allCategory">全部分类</li>';
                for (var i = 0; i < data.length; i++) {
                    var d = data[i];
                    if(d.code!=JFPRODUCTTYPE){
                    	html += `<li l_type="${d.code}">${d.name}</li>`;
                    	html1 += `<li l_type="${d.code}" class="wp33 tc fl">${d.name}</li>`;
                    }
                }
                var scroller = $("#scroller");
                scroller.find("ul").html(html);
                $("#allItem").find("ul").html(html1);
            	addCategory();
                scroller.find("ul li")[0].click();
            });
    }
    // 添加大类
    function addCategory() {
    	scroll.getInstance().refresh();
        var scroller = $("#scroller");
        var lis = scroller.find("ul li");
        var width = 0;
        for (var i = 0; i < lis.length; i++) {
            width += $(lis[i]).outerWidth(true)+0.5;
        }
        $("#scroller").css("width", width);
        myScroll = scroll.getInstance().getScrollByParam({
            id: 'mallWrapper',
            param: {
                scrollX: true,
                scrollY: false,
                eventPassthrough: true,
                snap: true,
                hideScrollbar: true,
                hScrollbar: false,
                vScrollbar: false
            }
        });
    }
    //根据大类查询小类
    function getProduces(c,flag) {
        $("#mlTable ul").empty();
        MallCtr.getSmallCategoryList(c).then(function(data) {
            base.hideLoading();
            if(data.length){
            	$("#mlTable").show()
            }else{
            	$("#mlTable").hide()
            }
            $.each(data, function(i, val) {
                var name = val.name;
                var vcode = val.code;
                var active = vcode?'active':''
                var html1 = "<li l_code=" + vcode + " class='wp20 tc " + active + "'>" + name + "</li>";
                html1 = $(html1);
                html1.on("click", function() {
                    start = 1;
                    isEnd = false;
                    base.showLoading();
                    $("#content").empty();
                    l_code = $(this).attr("l_code");
                    $(this).addClass("active").siblings().removeClass("active");
                    
                    getPageProduct(l_code, c).then(base.hideLoading);
                });
                //清空小类后再添加，否则会直接添加进去，原来的依旧在
                $("#mlTable ul").append(html1);
            });
            if(flag){
            	$("#mlTableHeight").css({"height":$(".mall_list_top").height()+$(".mall_list_table").height()})
            }
            //默认选中第一个
            var smallEle = $("#mlTable ul li:eq(0)");
                category = c, l_code = smallEle.attr("l_code");
            if (l_code) {
                smallEle.click();
            }else{
                base.showLoading();
                $("#content").empty();
                getPageProduct("", c).then(base.hideLoading);
            }
        }, base.hideLoading);
    }
    
    // 分页查询商品
    function getPageProduct(l_c, c) {
        return MallCtr.getPageProduct({
            start,
            limit,
            category: c,
            type: l_c,
	        orderColumn: 'order_no',
	        orderDir: 'asc',
        }).then(function(data) {
            var lists = data.list;
            var totalCount = +data.totalCount;
            if (totalCount <= limit || lists.length < limit) {
                isEnd = true;
            }
            var html = "";
            if(lists.length){
                $("#MallListContainer .chooseMallList-wrap")[start == 1 ? "html" : "append"](_mallTmpl({items: lists}));
                isEnd && $("#loadAll").removeClass("hidden");
                start++;
			} else if(start == 1) {
                $("#MallListContainer .chooseMallList-wrap").html('<div class="no-data-img"><img src="/static/images/no-data.png"/><p>暂无相关商品</p></div>').removeClass('bg_fff')
            } else {
                $("#loadAll").removeClass("hidden");
            }
            canScrolling = true;
        }).always(base.hideLoading)
    }
    
	//获取商品详情
	function getProductDetail(c){
		base.showLoading();
		MallCtr.getProductDetail(c).then((data)=>{
			
			var type = data.category;
			
			$("#specsName1").html(data.specsName1)
			$("#specsName2").html(data.specsName2)
			
			if(data.specsName2){
				$("#specs2").removeClass("hidden")
				$("#specs2").addClass("productSpecs-wrap")
				$("#specs1").removeClass("productSpecs-wrap")
			}else{
				$("#specs2").addClass("hidden")
				$("#specs1").addClass("productSpecs-wrap")
				$("#specs2").removeClass("productSpecs-wrap")
			}
			
			$("#productSpecs .productSpecs-img").css('background-image','url("'+base.getImg(data.advPic)+'")')
			$("#productSpecs .price").html(type==JFPRODUCTTYPE ? base.formatMoney(data.productSpecsList[0].price2)+'积分' : '￥'+base.formatMoney(data.productSpecsList[0].price1))
			$("#productSpecs .quantity").html('库存 ' + data.productSpecsList[0].quantity).attr('data-quantity',data.productSpecsList[0].quantity)
			$("#productSpecs .choice i").html(data.productSpecsList[0].name)
			
			//规格
			var specHtml1 = "";
			var specHtml2 = "";
			var specsName1List =[];
			var specsName2List =[];
			
			specsArray1 ={};//规格1['规格1':{['规格2'：'code']},'规格1':{['规格2'：'code']}]
			specsArray2 ={};//规格2['规格2':{['规格1'：'规格1']},'规格2':{['规格1'：'规格1']}]
			productSpecsListArray={}
			
			// 如果有规格二(尺码)时  为规格排序
			if(data.specsName2){
				//判断尺码是否为数字
				if(!isNaN(data.productSpecsList[0].specsVal2)){
		            var sortSpecsList = data.productSpecsList.sort(function(a, b){
		                    return (a.specsVal2 - b.specsVal2);
		            });
				}else if(sizeArray[data.productSpecsList[0].specsVal2]){
					var sortSpecsList = data.productSpecsList.sort(function(a, b){
		                    return (sizeArray[a.specsVal2] - sizeArray[b.specsVal2]);
		            });
				}else{
					var sortSpecsList = data.productSpecsList;
				}
			}else{
				//判断尺码是否为数字
				if(!isNaN(data.productSpecsList[0].specsVal1)){
		            var sortSpecsList = data.productSpecsList.sort(function(a, b){
		                    return (a.specsVal1 - b.specsVal1);
		            });
				}else if(sizeArray[data.productSpecsList[0].specsVal1]){
					var sortSpecsList = data.productSpecsList.sort(function(a, b){
		                    return (sizeArray[a.specsVal1] - sizeArray[b.specsVal1]);
		            });
				}else{
					var sortSpecsList = data.productSpecsList;
				}
			}
			
			
			sortSpecsList.forEach(function(d, i){
				
				productSpecsListArray[d.code]=d;
				
				if(data.specsName2){
					if(!specsName1List[d.specsVal1]){
						specHtml1+=`<p class='inStock'  
							data-pic="${d.pic}" >${d.specsVal1}</p>`;
						specsName1List[d.specsVal1]=d.specsVal1;
						
					}
					//为点击事件搭建关系
					var tmpl1 = {};
					tmpl1[d.specsVal2]=d.specsVal1;
					$.extend(tmpl1, specsArray1[d.specsVal1])
					specsArray1[d.specsVal1]=tmpl1
					
					var tmpl2 = {};
					tmpl2[d.specsVal1]=d.code;
					$.extend(tmpl2, specsArray2[d.specsVal2])
					specsArray2[d.specsVal2]=tmpl2
					
				}else{
					specHtml1+=`<p class='${d.quantity=="0"?"":"inStock"}' 
						data-code='${d.code}'
						data-price='${type==JFPRODUCTTYPE ? d.price2 : d.price1}' 
						data-quantity="${d.quantity}" 
						data-name="${d.specsVal1}" 
						data-pic="${d.pic}" >${d.specsVal1}</p>`;
					
					specsName1List[d.specsVal1]=d.specsVal1;
				}
				if(data.specsName2&&!specsName2List[d.specsVal2]){
					var inStock = '';
					if(d.quantity!='0'){
						inStock = "inStock";
					}else{
						inStock = ""
					}
					
					specHtml2+=`<p class='${inStock}' 
						data-name="${d.specsVal2}" >${d.specsVal2}</p>`;
					
					specsName2List[d.specsVal2]=d.specsVal2;
				}
			})
			$("#specs1 .spec").html(specHtml1);
			$("#specs2 .spec").html(specHtml2);
			
			if(data.specsName2){
				//有规格2时为规格1绑定点击事件
				$("#specs1 .spec").off('click').on('click','p.inStock',function(){
					var _specPInStock = $(this);
					
					//如果规格1 已选中 移除选中
					if(_specPInStock.hasClass('active')){
						_specPInStock.removeClass("active")
						
					//如果规格1没有选中	添加选中
					}else{
						_specPInStock.addClass('active').siblings().removeClass('active');
					}
					
					//规格2
					$("#specs2 .spec p").removeClass("inStock");
					//遍历规格2 为属于当前点击规格的规格2 添加inStock
					
					$("#specs2 .spec p").each(function(i, d){
						var _specP = $(this);
						
						//如果规格1已选中 
						if(!_specPInStock.hasClass('active')){
							if(_specP.attr("data-quantity")!='0'){//显示 有库存的 规格
								_specP.addClass("inStock");
							}
						
						//如果规格1 没有选中
						}else{
							//遍历出当前点击规格1 关联的规格2
							Object.keys(specsArray1[_specPInStock.text()]).forEach(function(v, j){
								if(_specP.attr("data-name")==v &&_specP.attr("data-quantity")!='0'){//显示 规格1的 规格
									_specP.addClass("inStock");
								}
							})
						}
					})
					var _specPChoice1 = $("#specs1 .spec p.active").length?$("#specs1 .spec p.active").text():'';
					var _specPChoice2 = $("#specs2 .spec p.active").length?$("#specs2 .spec p.active").attr("data-name"):'';
					
					$("#productSpecs .choice i").html(_specPChoice1+' '+_specPChoice2)
					$("#productSpecs .productSpecs-img").css('background-image','url("'+base.getImg(_specPInStock.attr("data-pic"))+'")')
					
					if(_specPChoice1&&_specPChoice2){
						var specsCode = specsArray2[_specPChoice2][_specPChoice1]
						var specsData = productSpecsListArray[specsCode];
						
						$("#productSpecs .price").html('￥'+base.formatMoney(specsData.price1))
						$("#productSpecs .price").attr("data-price",specsData.price1)
						$("#productSpecs .quantity").html('库存 ' + specsData.quantity).attr('data-quantity',specsData.quantity)
					}
				})
				
				//有规格2时为规格2绑定点击事件
				$("#specs2 .spec").off('click').on('click','p.inStock',function(){
					var _specP = $(this);
					
					//如果规格2 已选中 移除选中
					if(_specP.hasClass('active')){
						_specP.removeClass("active")
						
					//如果规格2 没有选中	添加选中
					}else{
					
						_specP.addClass('active').siblings().removeClass('active');
					}
					
					$("#specs1 .spec p").removeClass("inStock");
					
					//遍历规格1  为当前点击规格属于的规格1 添加inStock
					$("#specs1 .spec p").each(function(i, d){
						var _specs_specP= $(this);
						
						//如果规格1已 
						if(!_specP.hasClass('active')){
							if(_specP.attr("data-quantity")!='0'){//显示 规格1的 规格
								_specs_specP.addClass("inStock");
							}
							
						//如果规格2 没有选中	
						}else{
							//遍历出当前点击规格2 关联的规格1
							Object.keys(specsArray2[_specP.attr("data-name")]).forEach(function(v, j){
								if(_specs_specP.text()==v &&_specP.attr("data-quantity")!='0'){//显示 规格1的 规格
									_specs_specP.addClass("inStock");
								}
							})
						}
					})
					
					var _specPChoice1 = $("#specs1 .spec p.active").length?$("#specs1 .spec p.active").text():'';
					var _specPChoice2 = $("#specs2 .spec p.active").length?$("#specs2 .spec p.active").attr("data-name"):'';
					
					$("#productSpecs .choice i").html(_specPChoice1+' '+_specPChoice2)
						
					if(_specPChoice1&&_specPChoice2){
						var specsCode = specsArray2[_specPChoice2][_specPChoice1]
						var specsData = productSpecsListArray[specsCode];
						
						$("#productSpecs .price").html('￥'+base.formatMoney(specsData.price1))
						$("#productSpecs .price").attr("data-price",specsData.price1)
						$("#productSpecs .quantity").html('库存 ' + specsData.quantity).attr('data-quantity',specsData.quantity)
					}
					$('#productSpecs .productSpecs-number .sum').html(1)
					
				})
				
			}else{
				//没有规格2时为规格1绑定点击事件
				$("#specs1 .spec").off('click').on('click','p.inStock', function(){
					var _specP = $(this);
					
					_specP.addClass('active').siblings().removeClass('active');
					$("#productSpecs .price").html(type==JFPRODUCTTYPE ? base.formatMoney(_specP.attr("data-price"))+'积分' : '￥'+base.formatMoney(_specP.attr("data-price")))
					$("#productSpecs .price").attr("data-price",_specP.attr("data-price"))
					$("#productSpecs .quantity").html('库存 ' + _specP.attr("data-quantity")).attr('data-quantity',_specP.attr("data-quantity"))
					$("#productSpecs .choice i").html(_specP.attr("data-name"))
					$("#productSpecs .productSpecs-img").css('background-image','url("'+base.getImg(_specP.attr("data-pic"))+'")')
					$('#productSpecs .productSpecs-number .sum').html(1)
					
				})
			}
			
			
			base.hideLoading();
    		//显示面板
    		showProductSpecs();
    		
		},()=>{})
	}
	
    function addListener(){
    	
    	/**大类start */
        $("#down").on("click", function() {
            var me = $(this);
            if (me.hasClass("down-arrow")) {
                $("#allCont").removeClass("hidden");
                me.removeClass("down-arrow").addClass("up-arrow");
            } else {
                $("#allCont").addClass("hidden");
                me.removeClass("up-arrow").addClass("down-arrow");
            }
        });
        $("#mall-mask").on("click", function() {
            $("#down").click();
        });
        $("#allItem").on("click", "li", function() {
            var lType = $(this).attr("l_type");
            $("#scroller").find("li[l_type='" + lType + "']").click();
            $("#down").click();
        });
        $("#scroller").on("click", "li", function() {
            var me = $(this);
            $("#mallWrapper").find(".current").removeClass("current");
            me.addClass("current");
            if(lType!=me.attr("l_type")){
            	myScroll.myScroll.scrollToElement(this);
            	lType = me.attr("l_type");
	            start = 1;
	            isEnd = false;
	            base.showLoading();
	            $("#loadAll").addClass("hidden");
	            if(me.hasClass('allCategory')){
	            	l_code = '';
	            	category = 'NJ01';
	            	$("#mlTable").addClass('hidden')
	                getPageProduct(l_code, category);
	            	$("#mlTableHeight").css({"height":$(".mall_list_top").height()})
	            }else{
	            	$("#mlTable").removeClass('hidden')
	            	getProduces(lType,1);
	            }
	            var allItem = $("#allItem");
	            allItem.find("li.current").removeClass("current");
	            allItem.find("li[l_type='" + lType + "']").addClass("current");
            }
        });
        /**大类end */
        
        //重新选择
        $("#MallListContainer").on("click", ".right-left-btn .resetBtn", function(){
        	proList=[];
        	$("#MallListContainer .chooseMallList-wrap .mall-item").removeClass("active")
        });
        
        var _activeMall; //当前点击的商品
        
        //商品选择
        $("#MallListContainer .chooseMallList-wrap").on("click",".mall-item", function(){
        	
        	if($(this).hasClass("active")){
        		$(this).removeClass("active")
        	}else{
        		_activeMall= $(this);
        		//查询商品详情
        		getProductDetail($(this).attr("data-code"));
        	}
        })
        
        //规格面板-确定按钮点击
        $("#productSpecs .productSpecs-btn .subBtn").click(function(){
        	var productSpecs = '';
        	var flag = false;
        	
        	if($("#specs2").hasClass('hidden')&&$("#specs1 .spec p.active").text()){//只有规格1
				productSpecs=$("#specs1 .spec p.active").text();
				productSpecs?flag=true:flag=false;
				
				_activeMall.attr("data-specCode",$("#specs1 .spec p.active").attr('data-code'))
				
			}else if($("#specs1 .spec p.active").text()&&$("#specs2 .spec p.active").attr('data-name')){
				$("#specs1 .spec p.active").text()?flag=true:flag=false;
				productSpecs=$("#specs1 .spec p.active").text()+" "+$("#specs2 .spec p.active").text();
				_activeMall.attr("data-specCode",specsArray2[$("#specs2 .spec p.active").attr('data-name')][$("#specs1 .spec p.active").text()])
				
			}else{
				flag=false;
				base.showMsg('请选择商品规格')
			}
			if(flag){
				_activeMall.find(".price .samp1").text($("#productSpecs .price").text())
				_activeMall.find(".price .samp1").attr("data-price",$("#productSpecs .price").attr("data-price"))
				_activeMall.find(".price .samp2").text("X"+$("#productSpecs .productSpecs-number .sum").text())
				_activeMall.find(".price .samp2").attr("data-quantity",$("#productSpecs .productSpecs-number .sum").text())
	        	_activeMall.find(".slogan").text(productSpecs)
	        	_activeMall.addClass("active");
	        	
        		closeProductSpecs();
			}
        	
        })
        
        //关闭商品规格
		$("#productSpecs .close").click(function(){
			closeProductSpecs();
		})
		
		//购买数量 减
		$('.productSpecs-number .subt').click(function(){
			var sum = +$('#productSpecs .productSpecs-number .sum').html()
			if(sum>1){
				sum--
			}
			$('#productSpecs .productSpecs-number .sum').html(sum)
		})
		
		//购买数量 加
		$('.productSpecs-number .add').click(function(){
			var sum = +$('#productSpecs .productSpecs-number .sum').html()
			if(sum<$("#productSpecs .quantity").attr('data-quantity')){
				sum++
			}
			$('#productSpecs .productSpecs-number .sum').html(sum)
		})
        
	}
    
    //显示商品规格面板
	function showProductSpecs(t){
		$("#mask").removeClass('hidden');
		$("#productSpecs").addClass('active');
	}
	
	//关闭商品规格面板
	function closeProductSpecs(){
		$("#mask").addClass('hidden');
		$("#productSpecs").removeClass('active');
		
		//还原选中数据
		var _specP1 = $("#specs1 .spec p").eq(0);
		var _specP2 = $("#specs2 .spec p").eq(0);
		var type = 1;
		
		$("#specs1 .spec p").removeClass("inStock").addClass("inStock").removeClass("active");
		$("#specs2 .spec p").removeClass("inStock").addClass("inStock").removeClass("active");
		
		if($("#specs2").hasClass('hidden')){//只有规格1
			$("#productSpecs .price").html(type==JFPRODUCTTYPE ? base.formatMoney(_specP1.attr("data-price"))+'积分' : '￥'+base.formatMoney(_specP1.attr("data-price")))
			$("#productSpecs .price").attr("data-price",_specP1.attr("data-price"))
			$("#productSpecs .quantity").html('库存 ' + _specP1.attr("data-quantity")).attr('data-quantity',_specP1.attr("data-quantity"))
			$("#productSpecs .choice i").html(_specP1.attr("data-name"))
			$("#productSpecs .productSpecs-img").css('background-image','url("'+base.getImg(_specP1.attr("data-pic"))+'")')
			$('#productSpecs .productSpecs-number .sum').html(1)
		}else{
			$("#productSpecs .price").html(type==JFPRODUCTTYPE ? base.formatMoney(_specP2.attr("data-price"))+'积分' : '￥'+base.formatMoney(_specP2.attr("data-price")))
			$("#productSpecs .price").attr("data-price",_specP2.attr("data-price"))
			$("#productSpecs .quantity").html('库存 ' + _specP2.attr("data-quantity")).attr('data-quantity',_specP2.attr("data-quantity"))
			$("#productSpecs .choice i").html(_specP2.attr("data-name"))
			$("#productSpecs .productSpecs-img").css('background-image','url("'+base.getImg(_specP2.attr("data-pic"))+'")')
			$('#productSpecs .productSpecs-number .sum').html(1)
		}
		
	}
	
    function doError(cc) {
        $(cc).html('<div style="text-align: center;line-height: 3;">暂无数据</div>');
    }

    var ModuleObj = {
        addCont: function (option) {
            option = option || {};
            defaultOpt = $.extend(defaultOpt, option);
            if(!this.hasCont()){
                var temp = $(tmpl);
                $("body").append(tmpl);
            }
            var wrap = $("#MallListContainer");
            defaultOpt.title && wrap.find(".right-left-cont-title-name").text(defaultOpt.title);
            var that = this;
            if(firstAdd){
            	
        		addListener();
        		
                wrap.on("click", ".right-left-cont-back", function(){
                	proList=[];
                    ModuleObj.hideCont(defaultOpt.success);
                });
                
                wrap.on("click", ".right-left-btn .subBtn", function(){
                	proList=[];
					$("#MallListContainer .chooseMallList-wrap .mall-item").each(function(){
						if($(this).hasClass("active")){
							var pro = {
								code: $(this).attr("data-code"),
								speccode: $(this).attr("data-speccode"),
								name: $(this).find(".name").text(),
								advPic: $(this).find(".mall-item-img").attr("data-advPic"),
								price: $(this).find(".price .samp1").attr("data-price"),
								quantity: $(this).find(".price .samp2").attr("data-quantity"),
								productSpecs: $(this).find(".slogan").text()
							}
							
							proList.push(pro)
						}
					})
                    ModuleObj.hideCont(defaultOpt.success);
                });
                
            }

            firstAdd = false;
            return this;
        },
        hasCont: function(){
            return !!$("#MallListContainer").length;
        },
        showCont: function (option = {}){
            if(this.hasCont()){
            	if(option.code) {
                    defaultOpt.code = option.code;
                } else {
                    defaultOpt.code = "";
                }
                initData();
                ModuleObj._showCont();
            }
            return this;
        },
        _showCont: function(){
            var wrap = $("#MallListContainer");
            wrap.show().animate({
                left: 0
            }, 200, function(){
                defaultOpt.showFun && defaultOpt.showFun();
            });
            
            var topWrap = wrap.find(".right-left-cont-title");
            topWrap.show().animate({
                left: 0
            }, 200, function () {
            });
            
            var navWrap1 = wrap.find(".mall_list_top")
            navWrap1.show().animate({
                left: 0
            }, 200, function () {
            });
            
            var navWrap2 = wrap.find(".mall_list_table")
            navWrap2.show().animate({
                left: 0
            }, 200, function () {
            });
            
            var btnWrap =  wrap.find(".right-left-btn");
            btnWrap.show().animate({
                left: 0
            }, 200, function () {
            });
            //下拉加载
            wrap.off("scroll").on("scroll", function() {
                if (canScrolling && !isEnd && (wrap.scrollTop()>=wrap.find(".right-left-content").height()-wrap.height()-20)) {
                	
                    canScrolling = false;
                    base.showLoading();
                    getPageProduct(l_code, category);
                }
            });
        },
        hideCont: function (func){
            if(this.hasCont()){
				
                var wrap = $("#MallListContainer");
                
            	var topWrap =  wrap.find(".right-left-cont-title");
                topWrap.animate({
                    left: "100%"
                }, 200, function () {
                    topWrap.hide();
                });
                
	            var navWrap1 = wrap.find(".mall_list_top")
	            navWrap1.animate({
                    left: "100%"
                }, 200, function () {
                });
	            
	            var navWrap2 = wrap.find(".mall_list_table")
	            navWrap2.animate({
                    left: "100%"
                }, 200, function () {
                });
            	
                var btnWrap =  wrap.find(".right-left-btn");
                btnWrap.animate({
                    left: "100%"
                }, 200, function () {
                    btnWrap.hide();
                });
                
                wrap.animate({
                    left: "100%"
                }, 200, function () {
                    wrap.hide();
                    func && func(proList);
                    wrap.find("label.error").remove();
                });
                
            }
            return this;
        }
    }
    return ModuleObj;
});
