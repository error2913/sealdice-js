
export class ConfigManager {
    private ext: seal.ExtInfo;

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
    }

    register() {
        seal.ext.registerTemplateConfig(this.ext, '变量名', ['$m好感', '$m金币'], '豹语变量');
        seal.ext.registerTemplateConfig(this.ext, '变量对应名称', ['好感', '金币'], '与上边一一对应，用于查找');
        seal.ext.registerTemplateConfig(this.ext, '变量同步正则表达式', ['^晚安$'], '变量可能产生变化时，需要对插件内部数据进行同步');
        seal.ext.registerTemplateConfig(this.ext, '变量同步指令名', ['jrrp'], '变量可能产生变化时，需要对插件内部数据进行同步');
    }

    getVarName(s: string): string {
        const varNames = seal.ext.getTemplateConfig(this.ext, '变量名');
        const names = seal.ext.getTemplateConfig(this.ext, '变量对应名称');

        const index = names.indexOf(s);

        if (index == -1) {
            return '';
        }

        if (index >= varNames.length) {
            console.error(`在getVarName中出错:${s}(${index})找不到对应变量名`);
            return '';
        }

        return varNames[index];
    }
}