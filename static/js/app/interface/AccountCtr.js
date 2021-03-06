define([
    'app/controller/base',
    'app/util/ajax'
], function(base, Ajax) {
    return {
        // 获取账户
        getAccount(refresh) {
            return Ajax.get("802503", {
                userId: base.getUserId()
            }, refresh);
        },
        /**
         * 分页查询流水
         * @param config: {start, limit, accountNumber}
         */
        getPageFlow(config) {
            return Ajax.get("802524", config);
        },
        /**
         * 账户余额微信充值
         * @param config: {amount, openId}
         */
        recharge(config) {
            return Ajax.post("802710", {
                applyUser: base.getUserId(),
                channelType: 35,
                ...config
            });
        },
        /*
         * 取现
         * config: {accountNumber,payCardNo,remainAmount,amount,applyUser,applyNote,tradePwd,payCardInfo}
         */
        withDraw(config) {
            return Ajax.post("802750", {
                applyUser: base.getUserId(),
                ...config
            });
        },
        // 获取银行数据字典列表
        getBankCodeList(refresh) {
            return Ajax.get("802116", refresh);
        },
        // 根据code获取银行卡详情
        getBankCard(code, refresh) {
            return Ajax.get("802017", {code}, refresh);
        },
        /**
         * 添加银行卡
         * @param config {}
         */
        addBankCard(config) {
            return Ajax.post("802010", config);
        },
        /**
         * 修改银行卡
         * @param config {}
         */
        editBankCard(config) {
            return Ajax.post("802012", {
                status: 1,
                ...config
            });
        },
        // 获取银行卡列表
        getBankCardList() {
            return Ajax.get("802016", {
                userId: base.getUserId(),
                status: "1"
            });
        },
        // 积分转为小金库
        JFTransferXJK(amount){
            return Ajax.post("802413", {
            	fromUserId: base.getUserId(),
            	toUserId: base.getUserId(),
            	fromCurrency: 'JF',
            	toCurrency: 'XJK',
            	amount
            });
        }
    };
})
