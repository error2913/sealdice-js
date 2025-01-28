export class ChartManager {
    data: {
        [key: string]: Chart
    }

    constructor(data: {
        [key: string]: Chart
    }) {
        this.data = data;
    }

    static getData(ext: seal.ExtInfo): ChartManager {
        let data: {
            [key: string]: Chart
        } = {};

        try {
            data = JSON.parse(ext.storageGet('data') || '{}');

            for (const key in data) {
                data[key] = new Chart(key, data[key].data);
            }
        } catch (error) {
            console.error('从数据库中获取chart失败:', error);
            data = {};
        }

        return new ChartManager(data);
    }

    saveData(ext: seal.ExtInfo): void {
        ext.storageSet('data', JSON.stringify(this.data));
    }

    updateVars(ext: seal.ExtInfo, ctx: seal.MsgContext) {
        const uid = ctx.player.userId;
        const varNames = seal.ext.getTemplateConfig(ext, '变量名');
        const names = seal.ext.getTemplateConfig(ext, '变量对应名称');

        for (let i = 0; i < names.length; i++) {
            const name = names[i];

            if (i >= varNames.length) {
                console.error(`在getVarName中出错:${name}(${i})找不到对应变量名`);
                continue;
            }

            const varName = varNames[i];

            const [val, exist] = seal.vars.intGet(ctx, varName);

            if (exist) {
                if (!this.data.hasOwnProperty(name)) {
                    this.data[name] = new Chart(name, []);
                }

                const chart = this.data[name].data;

                const index = chart.findIndex(item => item.uid === uid);

                if (index === -1) {
                    chart.push({
                        uid: uid,
                        un: ctx.player.name,
                        value: val
                    });

                    chart.sort((a, b) => b.value - a.value);

                    chart.splice(10);
                } else {
                    chart[index].un = ctx.player.name;
                    chart[index].value = val;

                    chart.sort((a, b) => b.value - a.value);
                }
            }
        }

        this.saveData(ext);
    }

    showChart(name: string): string {
        if (!this.data.hasOwnProperty(name)) {
            this.data[name] = new Chart(name, []);
        }

        return this.data[name].showChart();
    }
}

export class Chart {
    name: string;
    data: {
        uid: string,
        un: string,
        value: number
    }[]

    constructor(name: string, data: {
        uid: string,
        un: string,
        value: number
    }[]) {
        this.name = name;
        this.data = data;
    }

    showChart(): string {
        if (this.data.length === 0) {
            return '暂无数据';
        }

        const url = 'http://42.193.236.17:3003';
        const title = `${this.name}排行榜`;
        const file = `${url}/chart?title=${title}&data=${JSON.stringify(this.data)}`;
        return `[CQ:image,file=${file.replace(/\]/g, '%5D').replace(/,/g, '%2C')}]`;
    }
}