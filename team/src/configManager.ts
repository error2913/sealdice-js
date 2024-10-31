import { member, Team } from "./team";

export class ConfigManager {
    private ext: seal.ExtInfo;

    constructor(ext: seal.ExtInfo) {
        this.ext = ext;
    }

    public registerConfig(): void {
        seal.ext.registerTemplateConfig(this.ext, '新建队伍', ['新建<{{队伍名字}}>成功'])
        seal.ext.registerTemplateConfig(this.ext, '绑定队伍', ['绑定<{{队伍名字}}>成功'])
        seal.ext.registerTemplateConfig(this.ext, '删除队伍', ['删除队伍成功：\n{{队伍列表}}'])
        seal.ext.registerTemplateConfig(this.ext, '队伍列表', ['队伍如下：\n{{队伍列表}}'])

        seal.ext.registerTemplateConfig(this.ext, '添加成员', ['成功添加{{@的人数}}位成员，当前队伍人数{{队伍人数}}人'])
        seal.ext.registerTemplateConfig(this.ext, '移除成员', ['成功移除{{@的人数}}位成员，当前队伍人数{{队伍人数}}人'])
        seal.ext.registerTemplateConfig(this.ext, '抽取成员', ['抽到了：\n{{成员列表}}'])

        seal.ext.registerTemplateConfig(this.ext, '呼叫成员', ['请在限定时间60s内回复“到”：\n{{成员列表}}'])
        seal.ext.registerTemplateConfig(this.ext, '呼叫结束', ['应到{{队伍人数}}人，实到{{签到人数}}人，未到{{咕咕人数}}人。未到如下：\n{{成员列表}}'])
        seal.ext.registerIntConfig(this.ext, '呼叫时间限制/s', 60)

        seal.ext.registerTemplateConfig(this.ext, '展示属性', ['属性如下：\n{{成员属性列表}}'])
        seal.ext.registerTemplateConfig(this.ext, '设置属性', ['修改如下：\n{{修改操作}}\n{{成员属性列表}}'])
        seal.ext.registerTemplateConfig(this.ext, '排序属性', ['排序如下：\n{{成员属性列表}}'])

        seal.ext.registerTemplateConfig(this.ext, '提示队伍为空', ['队伍里没有成员。'])
        seal.ext.registerTemplateConfig(this.ext, '提示队伍不存在', ['队伍不存在。'])
        seal.ext.registerTemplateConfig(this.ext, '提示正在呼叫', ['当前正在呼叫中。'])

        seal.ext.registerTemplateConfig(this.ext, '战斗轮排序关键词', ['（战斗轮开始）'])
        seal.ext.registerTemplateConfig(this.ext, '签到关键词', ['到'])

        seal.ext.registerStringConfig(this.ext, '分隔符', '\n', '队伍列表，成员列表等的分割符')
    }

    private getRandomTemplate(key: string): string {
        const templates = seal.ext.getTemplateConfig(this.ext, key);
        return templates[Math.floor(Math.random() * templates.length)];
    }

    public createText(name: string): string {
        const text = this.getRandomTemplate('新建队伍')
            .replace('{{队伍名字}}', name);

        return text;
    }

    public bindText(name: string): string {
        const text = this.getRandomTemplate('绑定队伍')
            .replace('{{队伍名字}}', name);

        return text;
    }

    public delText(nameList: string[]): string {
        const sperator = seal.ext.getStringConfig(this.ext, '分隔符');

        const listText = nameList
            .map(name => `<${name}>`)
            .join(sperator)

        const text = this.getRandomTemplate('删除队伍')
            .replace('{{队伍列表}}', listText);

        return text;
    }

    public getListText(teamList: Team[]): string {
        const sperator = seal.ext.getStringConfig(this.ext, '分隔符');

        const listText = teamList
            .map((team, index) => {
                if (index == 0) {
                    return `<${team.name}> ${team.members.length}人◎`
                }

                return `<${team.name}> ${team.members.length}人`
            })
            .join(sperator)

        const text = this.getRandomTemplate('队伍列表')
            .replace('{{队伍列表}}', listText);

        return text;
    }

    public addText(atNum: number, memberNum: number): string {
        const text = this.getRandomTemplate('添加成员')
            .replace('{{@的人数}}', atNum.toString())
            .replace('{{队伍人数}}', memberNum.toString());

        return text;
    }

    public removeText(atNum: number, memberNum: number): string {
        const text = this.getRandomTemplate('移除成员')
            .replace('{{@的人数}}', atNum.toString())
            .replace('{{队伍人数}}', memberNum.toString());

        return text;
    }

    public drawText(nameList: string[]): string {
        const sperator = seal.ext.getStringConfig(this.ext, '分隔符');

        const listText = nameList
            .join(sperator)

        const text = this.getRandomTemplate('抽取成员')
            .replace('{{成员列表}}', listText);

        return text;
    }

    public callText(callList: string[]): string {
        const sperator = seal.ext.getStringConfig(this.ext, '分隔符');

        const listText = callList
            .map(userId => `[CQ:at,qq=${userId.replace(/\D+/g, "")}]`)
            .join(sperator)

        const text = this.getRandomTemplate('呼叫成员')
            .replace('{{成员列表}}', listText);

        return text;
    }

    public recallText(callList: string[], memberNum: number, signNum: number, guguNum: number): string {
        const sperator = seal.ext.getStringConfig(this.ext, '分隔符');

        const listText = callList
            .map(userId => `[CQ:at,qq=${userId.replace(/\D+/g, "")}]`)
            .join(sperator)

        const text = this.getRandomTemplate('呼叫结束')
            .replace('{{队伍人数}}', memberNum.toString())
            .replace('{{签到人数}}', signNum.toString())
            .replace('{{咕咕人数}}', guguNum.toString())
            .replace('{{成员列表}}', listText);

        return text;
    }

    public showText(members: member[], keys: string[]): string {
        const sperator = seal.ext.getStringConfig(this.ext, '分隔符');

        const listText = members
            .map(item => {
                let text = item.name
                if (keys.length === 0) {
                    const hp = item.attr['hp'];
                    const max_hp = Math.floor((item.attr['con'] + item.attr['siz']) / 10);
                    text += ` hp${hp}/${max_hp}`;

                    const san = item.attr['san'];
                    const pow = item.attr['pow'];
                    text += ` san${san}/${pow}`;

                    const dex = item.attr['dex']
                    text += ` dex${dex}`;
                } else {
                    for (const key of keys) {
                        text += ` ${key}${item.attr[key]}`
                    }
                }

                return text;
            })
            .join(sperator)

        const text = this.getRandomTemplate('展示属性')
            .replace('{{成员属性列表}}', listText);

        return text;
    }

    public setText(members: member[], key: string, valueText: string): string {
        const sperator = seal.ext.getStringConfig(this.ext, '分隔符');

        const listText = members
            .map(item => {
                let text = item.name
                text += ` ${key}=>${item.attr[key]}`

                return text;
            })
            .join(sperator)

        const text = this.getRandomTemplate('设置属性')
            .replace('{{修改操作}}', `操作:${valueText}`)
            .replace('{{成员属性列表}}', listText);

        return text;
    }

    public sortText(members: member[], key: string): string {
        const sperator = seal.ext.getStringConfig(this.ext, '分隔符');

        const listText = members
            .map(item => {
                let text = item.name
                text += ` ${key}${item.attr[key]}`

                return text;
            })
            .join(sperator)

        const text = this.getRandomTemplate('排序属性')
            .replace('{{成员属性列表}}', listText);

        return text;
    }

    public emptyText(): string {
        return this.getRandomTemplate('提示队伍为空');
    }

    public notExistText(): string {
        return this.getRandomTemplate('提示队伍不存在');
    }

    public isCallingText(): string {
        return this.getRandomTemplate('提示正在呼叫');
    }
}