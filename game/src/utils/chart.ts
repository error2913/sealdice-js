export class Chart {
    name: string;
    gameKey: string;
    list: {
        uid: string,
        var: [string, number]
    }[]

    constructor(name: string, gk: string) {
        this.name = name;
        this.gameKey = gk;
        this.list = [];
    }

    updateChart() {

    }
}

export class ChartManager {
    ext: seal.ExtInfo;
    gameKey: string;
    map: {
        [key: string]: Chart
    }

    constructor(ext: seal.ExtInfo, gk: string) {
        this.ext = ext;
        this.gameKey = gk;
        this.map = {};
    }

    parse() {

    }

    updateCharts() {
        
    }

}