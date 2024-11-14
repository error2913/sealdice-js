import { Goods } from "./shop";

export class ConfigManager {
    private static ext: seal.ExtInfo;

    static register(ext: seal.ExtInfo) {
        ConfigManager.ext = ext;

        seal.ext.registerTemplateConfig(ext, '变量名', ['$m好感', '$m金币'], '');
        seal.ext.registerTemplateConfig(ext, '商店货品', ['炸弹///100///99///炸弹爆炸了，好感度-1={$m好感=$m好感-1}///1'], '货物名称///价格///数量///使用回执///可使用次数，-1为无限次');
        seal.ext.registerTemplateConfig(ext, '变量同步正则表达式', ['^晚安$'], '变量可能产生变化时，需要对插件内部数据进行同步，以便实现排行榜等功能');
        seal.ext.registerTemplateConfig(ext, '变量同步指令名', ['jrrp'], '变量可能产生变化时，需要对插件内部数据进行同步，以便实现排行榜等功能');
    }

    static getGoods(): Goods {
        const template = seal.ext.getTemplateConfig(ConfigManager.ext, '商店货品');

        try {
            const goods: Goods = {};
            for (let i = 0; i < template.length; i++) {
                const info = template[i].split('///');
                if (info.length!= 5) {
                    throw new Error(`商品信息格式错误:${template[i]}`);
                }

                const name = info[0];
                const price = parseInt(info[1]);
                const count = parseInt(info[2]);
                const receipt = info[3];
                const usage = parseInt(info[4]);

                if (!name) {
                    throw new Error('商品名称不能为空');
                }

                if (isNaN(price) || isNaN(count) || isNaN(usage)) {
                    throw new Error('价格和数量必须是数字');
                }

                if (price <= 0 || count <= 0 || usage < -1) {
                    throw new Error('价格和数量必须大于0');
                }

                if (name.length > 10) {
                    throw new Error('商品名称长度不能超过10');
                }

                goods[name] = {
                    price,
                    count,
                    receipt,
                    usage
                }
            }

            return goods;
        } catch (err) {
            console.error(`在解析商店货品时出现错误：${err}`);
            return {};
        }
    }

    static getVarName(n: number): string {
        const varNames = seal.ext.getTemplateConfig(ConfigManager.ext, '变量名');

        if (n >= varNames.length || n < 0) {
            return '';
        }

        return varNames[n];
    }
}