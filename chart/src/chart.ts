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

    async showChart(name: string): Promise<string> {
        if (!this.data.hasOwnProperty(name)) {
            this.data[name] = new Chart(name, []);
        }

        return await this.data[name].showChart();
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

    async showChart(): Promise<string> {
        if (this.data.length === 0) {
            return '暂无数据';
        }

        const url = 'http://chart.error2913.com';

        const response = await fetch(`${url}/chart`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    title: `${this.name}排行榜`,
                    data: this.data
                })
            }
        );

        const text = await response.text();

        if (!response.ok) {
            return `请求失败! 状态码: ${response.status}\n响应体: ${text}`;
        }
        if (!text) {
            return "响应体为空";
        }

        try {
            const data = JSON.parse(text);
            const imageUrl = data.image_url;
            if (!imageUrl) {
                return "响应体中缺少 image_url"; 
            }
            return `[CQ:image,file=${imageUrl}]`;
        } catch (e) {
            return `解析响应体时出错:${e}\n响应体:${text}`;
        }
    }
}