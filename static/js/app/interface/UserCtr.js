define([
    'app/controller/base',
    'app/util/ajax'
], function(base, Ajax) {
    return {
        /**
         * 微信登录
         * @param config: {code,mobile?,smsCaptcha?,userReferee?}
         */
        wxLogin(config) {
            return Ajax.post("805170", config);
        },
        // 获取用户详情
        getUser(refresh) {
            return Ajax.get("805121", {
                "userId": base.getUserId()
            }, refresh);
        },
        /**
         * 分页查询获客
         * @param config: {code,mobile?,smsCaptcha?,userReferee}
         */
        getPageChildren(config, refresh) {
            return Ajax.get("805120", { 
                userReferee: base.getUserId(),
                ...config
            }, refresh);
        },
        // 绑定手机号
        bindMobile(mobile, smsCaptcha) {
            return Ajax.post("805151", {
                mobile,
                smsCaptcha,
                userId: base.getUserId()
            });
        },
        // 设置支付密码
        setTradePwd(tradePwd, smsCaptcha) {
            return Ajax.post('805066', {
                tradePwd,
                smsCaptcha,
                tradePwdStrength: base.calculateSecurityLevel(tradePwd),
                userId: base.getUserId()
            });
        },
        // 重置支付密码
        changeTradePwd(newTradePwd, smsCaptcha) {
            return Ajax.post("805067", {
                newTradePwd,
                smsCaptcha,
                userId: base.getUserId()
            });
        },
        // 修改手机号
        changeMobile(newMobile, smsCaptcha) {
            return Ajax.post("805061", {
                newMobile,
                smsCaptcha,
                userId: base.getUserId()
            });
        },
        // 修改头像
        changePhoto(photo) {
            return Ajax.post("805080", {
                photo,
                userId: base.getUserId()
            });
        },
        // 详情查询银行卡
        getBankCard(code) {
            return Ajax.get("802017", {code});
        },
        // 列表查询银行的数据字典
        getBankList(){
            return Ajax.get("802116");
        },
        // 新增或修改银行卡
        addOrEditBankCard(config) {
            return config.code ? this.editBankCard(config) : this.addBankCard(config);
        },
        // 修改银行卡
        editBankCard(config) {
            return Ajax.post("802012", {
                userId: base.getUserId(),
                ...config
            });
        },
        // 新增银行卡
        addBankCard(config) {
            return Ajax.post("802010", {
                userId: base.getUserId(),
                ...config
            });
        },
        // 列表查询银行卡
        getBankCardList(refresh) {
            return Ajax.get("802016", {
                userId: base.getUserId(),
                status: "1"
            }, refresh);
        },
        /**
         * 分页查询银行卡
         * @param config: {start, limit}
         */
        getPageBankCard(config, refresh) {
            return Ajax.get("802015", {
                userId: base.getUserId(),
                status: "1",
                ...config
            }, refresh);
        },
        // 获取未完成的订单数量
        getUnfinishedOrders() {
            return Ajax.get("622920", {
                applyUser: base.getUserId()
            });
        },
        // 列表查询收货地址
        getAddressList(){
            return Ajax.get("805165",{userId: base.getUserId()},true);
        },
        // 详情收货地址
        getAddressDetail(code){
            return Ajax.get("805166",{code},true);
        },
        // 详情收货地址
        addAddress(code) {
            return Ajax.post("805160", {
                userId: base.getUserId(),
                ...config
            });
        },
    };
})
