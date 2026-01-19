/**
 * 优化版 Duolingo Max/Super 解锁脚本
 * 适用工具：Quantumult X, Surge, Loon
 */

try {
    let obj = JSON.parse($response.body);
    
    // 检查响应结构是否为多邻国 App 的标准批量返回格式
    if (obj.responses && obj.responses.length > 0 && obj.responses[0].body) {
        const now = Math.floor(Date.now() / 1000);
        let userdata = JSON.parse(obj.responses[0].body);

        // --- 1. 基础权限全局开启 ---
        userdata.hasPlus = true;
        userdata.isPlus = true;
        userdata.subscriberLevel = 'MAX'; // 权限等级设为最高级 MAX
        userdata.canUsePlusHearts = true;
        userdata.hasUsePlusHearts = true;

        // --- 2. 注入订阅对象 (Super & Max) ---
        if (!userdata.shopItems) userdata.shopItems = [];
        
        // 清空现有订阅，防止冲突并注入新的
        userdata.shopItems = userdata.shopItems.filter(item => !item.id.includes('subscription'));
        
        const subscriptionTemplate = {
            purchaseDate: now - 172800,
            purchasePrice: 0,
            subscriptionInfo: {
                expectedExpiration: now + 31536000, // 设为一年后过期
                renewer: 'APPLE',
                renewing: true,
                tier: 'twelve_month'
            }
        };

        // 注入 Gold (Super) 订阅
        userdata.shopItems.push({
            ...subscriptionTemplate,
            id: 'gold_subscription',
            subscriptionInfo: {
                ...subscriptionTemplate.subscriptionInfo,
                productId: "com.duolingo.DuolingoMobile.subscription.Gold.TwelveMonth",
                type: 'gold'
            }
        });

        // 注入 Max 订阅
        userdata.shopItems.push({
            ...subscriptionTemplate,
            id: 'max_subscription',
            subscriptionInfo: {
                ...subscriptionTemplate.subscriptionInfo,
                productId: "com.duolingo.DuolingoMobile.subscription.Max.TwelveMonth",
                type: 'max'
            }
        });

        // --- 3. 追踪属性补全 ---
        if (!userdata.trackingProperties) userdata.trackingProperties = {};
        const props = [
            "has_item_gold_subscription",
            "has_item_max_subscription",
            "has_item_premium_subscription",
            "has_item_immersive_subscription",
            "has_item_live_subscription"
        ];
        props.forEach(p => userdata.trackingProperties[p] = true);

        // --- 4. 强制开启 A/B 测试实验组 (关键：解锁 AI 功能入口) ---
        if (userdata.experiments) {
            const forceEnableKeys = [
                "max_subscription",
                "roleplay",
                "explain_my_answer",
                "ai_service",
                "plus_heart",
                "premium_learning"
            ];
            
            Object.keys(userdata.experiments).forEach(key => {
                const lowerKey = key.toLowerCase();
                if (forceEnableKeys.some(k => lowerKey.includes(k))) {
                    userdata.experiments[key] = {
                        eligible: true,
                        treated: true,
                        params: {
                            "is_enabled": "true",
                            "should_show_entry": "true",
                            "is_in_treatment": "true"
                        }
                    };
                }
            });
        }

        // 回填修改后的数据
        obj.responses[0].body = JSON.stringify(userdata);
    }
    
    $done({ body: JSON.stringify(obj) });
} catch (e) {
    console.log("Duolingo Max Script Error: " + e);
    $done({});
}
