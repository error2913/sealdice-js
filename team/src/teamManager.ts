import { ConfigManager } from './configManager';
import { Team, member } from './team'
import { getCtx, getMsg } from "./utils";

export class TeamManager {
    private team: Team;
    private teamList: Team[];
    private cache: {
        [key: string]: Team[];
    };
    private ext: seal.ExtInfo;

    constructor(ext: seal.ExtInfo) {
        this.team = {
            name: '默认队伍',
            members: []
        };
        this.teamList = [{ name: '默认队伍', members: [] }];
        this.cache = {};
        this.ext = ext;
    }

    private saveTeamList(id: string, teamList: Team[]) {
        this.cache[id] = teamList;
        this.ext.storageSet(`${id}_teamList`, JSON.stringify(teamList));
    }

    private saveCallList(id: string, callList: string[]) {
        this.ext.storageSet(`${id}_callList`, JSON.stringify(callList));
    }

    /**
     * 获取队伍列表
     * @param {string} id QQ群号，groupId
     * @returns {Team[]} 队伍列表
     */
    public getTeamList(id: string): Team[] {
        if (!this.cache.hasOwnProperty(id)) {
            let teamList = this.teamList;

            try {
                const data: Team[] = JSON.parse(this.ext.storageGet(`${id}_teamList`) || '[]');

                if (data && Array.isArray(data) && data.length !== 0) {
                    teamList = data.map(item => {
                        return {
                            name: item.name || '默认队伍',
                            members: item.members || []
                        }
                    })
                }
            } catch (err) {
                console.error(`在获取${id}_teamList时发生错误：${err}`)
            }

            this.cache[id] = teamList;
        }

        return this.cache[id];
    }

    /**
     * 获取呼叫列表
     * @param {string} id QQ群号，groupId
     * @returns {string[]} 呼叫成员userId列表
     */
    public getCallList(id: string): string[] {
        let callList = [];

        try {
            const data: string[] = JSON.parse(this.ext.storageGet(`${id}_callList`) || '[]');

            if (data && Array.isArray(data)) {
                callList = data;
            }
        } catch (err) {
            console.error(`在获取${id}_callList时发生错误：${err}`)
        }

        return callList;
    }

    /**
     * 绑定或新建队伍，新建时清除没有成员的默认队伍
     * @param {string} id QQ群号，groupId
     * @param {string} name 队伍名字
     * @returns 若绑定队伍则返回true，新建队伍则返回false
     */
    public bind(id: string, name: string): boolean {
        let teamList = this.getTeamList(id);
        let team = teamList[0];

        //绑定或新建队伍
        var index = teamList.findIndex(item => item.name === name);
        if (index !== -1) {
            team = teamList[index];

            teamList.splice(index, 1);
            teamList.unshift(team);

            this.saveTeamList(id, teamList);

            return true;
        }
        else {
            //清理默认队伍
            teamList = teamList.filter(item => item.name !== '默认队伍' || item.members.length !== 0)

            team = {
                name: name,
                members: []
            }

            teamList.unshift(team);

            this.saveTeamList(id, teamList);

            return false;
        }
    }

    /**
     * 删除队伍
     * @param {string} id QQ群号，groupId
     * @param {string} name 队伍名字
     * @param {seal.Kwarg[]} kwargs 关键字参数，可包含now，all
     * @returns {string[]} 删除成功返回队伍名字列表，否则返回空列表，意味着队伍不存在
     */
    public delete(id: string, name: string, kwargs: seal.Kwarg[]): string[] {
        let teamList = this.getTeamList(id);
        let team = teamList[0];
        const keys = kwargs.map(item => { return item.name });

        //删除所有队伍
        if (keys.includes('all')) {
            const nameList = teamList.map(team => team.name);
            teamList = this.teamList;

            this.saveTeamList(id, teamList);
            return nameList;
        }

        //处理队伍名字
        if (keys.includes('now')) {
            name = team.name;
        } else if (!teamList.some(item => item.name === name)) {
            return [];
        }

        teamList = teamList.filter(item => item.name !== name);

        if (teamList.length == 0) {
            teamList.unshift(this.team);
        }

        this.saveTeamList(id, teamList);
        return [name];
    }

    /**
     * 添加成员到当前队伍
     * @param {seal.MsgContext} ctx 
     * @param {string[]} atList at的用户id列表
     * @returns {string[]} 成员userId列表
     */
    public add(ctx: seal.MsgContext, atList: string[]): string[] {
        const id = ctx.group.groupId;
        let teamList = this.getTeamList(id);
        let team = teamList[0];

        atList.forEach(userId => {
            if (!team.members.includes(userId)) {
                team.members.push(userId);
            }
        })

        teamList[0] = team;

        this.saveTeamList(id, teamList);
        return team.members;
    }

    /**
     * 从当前队伍删除成员
     * @param {seal.MsgContext} ctx
     * @param {string[]} atList at的用户id列表
     * @param {seal.Kwarg[]} kwargs 关键字参数，可包含all
     * @returns {string[]} 成员userId列表
     */
    public remove(ctx: seal.MsgContext, atList: string[], kwargs: seal.Kwarg[]): string[] {
        const id = ctx.group.groupId;
        let teamList = this.getTeamList(id);
        let team = teamList[0];
        const keys = kwargs.map(item => { return item.name });

        if (keys.includes('all')) {
            team.members = [];
        } else {
            team.members = team.members.filter(userId => !atList.includes(userId));
        }

        teamList[0] = team;

        this.saveTeamList(id, teamList);
        return team.members;
    }

    /**
     * 随机抽取成员
     * @param {seal.MsgContext} ctx
     * @param {number} n 抽取人数
     * @returns {[string[], boolean]} 抽取的成员name列表
     */
    public draw(ctx: seal.MsgContext, n: number): string[] {
        const id = ctx.group.groupId;
        let teamList = this.getTeamList(id);
        let team = teamList[0];

        let result = [];
        let members = team.members.slice();

        while (result.length < n && members.length > 0) {
            const index = Math.floor(Math.random() * members.length);
            const userId = members.splice(index, 1)[0];

            const msg = getMsg("group", userId, id);
            const mctx = getCtx(ctx.endPoint.userId, msg);

            result.push(mctx.player.name);
        }

        return result;
    }

    /**
     * 呼叫成员
     * @param {seal.MsgContext} ctx
     * @returns {[string[], boolean]} [呼叫的成员userId列表，是否正在呼叫中]
     */
    public call(ctx: seal.MsgContext): [string[], boolean] {
        const id = ctx.group.groupId;
        let teamList = this.getTeamList(id);
        let team = teamList[0];

        let callList = this.getCallList(id);

        if (callList.length > 0) {
            return [callList, true];
        }

        callList = team.members.slice();
        this.saveCallList(id, callList);

        const timeLimit = seal.ext.getIntConfig(this.ext, '呼叫时间限制/s') * 1000

        setTimeout(() => {
            this.recall(ctx);
        }, timeLimit)

        return [callList, false];
    }

    /**
     * 签到
     * @param {seal.MsgContext} ctx
     */
    public signUp(ctx: seal.MsgContext): void {
        const id = ctx.group.groupId;
        const userId = ctx.player.userId;

        const callList = this.getCallList(id);

        if (callList.length == 0) {
            return;
        }

        const index = callList.indexOf(userId);
        if (index !== -1) {
            callList.splice(index, 1);
            this.saveCallList(id, callList);
        }
    }

    /**
     * 结束呼叫
     * @param {seal.MsgContext} ctx
     */
    private recall(ctx: seal.MsgContext): void {
        const id = ctx.group.groupId;
        let teamList = this.getTeamList(id);
        let team = teamList[0];

        let callList = this.getCallList(id);
        const configManager = new ConfigManager(this.ext)

        const memberNum = team.members.length;
        const guguNum = callList.length;
        const signNum = memberNum - guguNum;

        let reply = configManager.recallText(callList, memberNum, signNum, guguNum);
        reply = seal.format(ctx, reply);

        callList = [];
        this.saveCallList(id, callList);

        const msg = getMsg("group", ctx.player.userId, id);
        seal.replyToSender(ctx, msg, reply);
    }

    /**
     * 展示队伍
     * @param {seal.MsgContext} ctx
     * @param {string[]} keys 属性名列表
     * @returns {member[]} 成员属性列表
     */
    public show(ctx: seal.MsgContext, keys: string[]): member[] {
        const id = ctx.group.groupId;
        let teamList = this.getTeamList(id);
        let team = teamList[0];

        let members = team.members.map(userId => {
            const msg = getMsg("group", userId, id);
            const mctx = getCtx(ctx.endPoint.userId, msg);

            const attr: { [key: string]: number } = {};

            if (keys.length === 0) {
                keys = ['hp', 'con', 'siz', 'san', 'pow', 'dex'];
            }

            keys.forEach(key => {
                attr[key] = seal.vars.intGet(mctx, key)[0];

                /* 防止用户查看豹的内置变量
                if (key[0] == '$') {
                    attr[key] = NaN;
                }
                */
            })

            return {
                name: mctx.player.name,
                attr: attr
            }

        })

        return members;
    }

    /**
     * 设置属性
     * @param {seal.MsgContext} ctx 
     * @param {string} key 属性名
     * @param {string} valueText 表达式文本
     * @returns {member[]} 成员属性列表
     */
    public set(ctx: seal.MsgContext, key: string, valueText: string): member[] {
        const id = ctx.group.groupId;
        let teamList = this.getTeamList(id);
        let team = teamList[0];

        let members = team.members.map(userId => {
            const msg = getMsg("group", userId, id);
            const mctx = getCtx(ctx.endPoint.userId, msg);

            /* 防止用户修改豹的内置变量
            if (key[0] == '$') {
                return {
                    name: mctx.player.name,
                    attr: {
                        [key]: NaN
                    }
                };
            }
            */

            if (['+', '-', '*', '/'].includes(valueText[0])) {
                valueText = key + valueText;
            }

            let value = parseInt(seal.format(mctx, `{${valueText}}`));
            value = isNaN(value) ? 0 : value;

            seal.vars.intSet(mctx, key, value);

            const attr: { [key: string]: number } = {};
            attr[key] = seal.vars.intGet(mctx, key)[0];

            return {
                name: mctx.player.name,
                attr: attr
            }
        })

        return members;
    }

    /**
     * 排序属性
     * @param {seal.MsgContext} ctx 
     * @param {string} key 属性名
     * @returns {member[]} 成员属性列表
     */
    public sort(ctx: seal.MsgContext, key: string): member[] {
        let members = this.show(ctx, [key]);

        members.sort((a, b) => {
            return b.attr[key] - a.attr[key];
        })

        return members;
    }
}
