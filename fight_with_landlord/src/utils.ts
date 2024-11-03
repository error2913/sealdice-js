export function getMsg(messageType: "group" | "private", senderId: string, groupId: string = ''): seal.Message {
    let msg = seal.newMessage();

    if (messageType == 'group') {
        msg.groupId = groupId;
        msg.guildId = '';
    }

    msg.messageType = messageType;
    msg.sender.userId = senderId;
    return msg;
}

export function getCtx(epId: string, msg: seal.Message): seal.MsgContext | undefined {
    const eps = seal.getEndPoints();

    for (let i = 0; i < eps.length; i++) {
        if (eps[i].userId === epId) {
            return seal.createTempCtx(eps[i], msg);
        }
    }

    return undefined;
}

export function getName(ctx: seal.MsgContext, id: string): string {
    const mmsg = getMsg('group', id, ctx.group.groupId);
    const mctx = getCtx(ctx.endPoint.userId, mmsg);
    return mctx.player.name;
}

/** 回复私聊消息*/
export function replyPrivate(ctx: seal.MsgContext, s: string, id: string = ''): void {
    const mmsg = getMsg('private', id || ctx.player.userId, ctx.group.groupId);
    const mctx = getCtx(ctx.endPoint.userId, mmsg);
    seal.replyToSender(mctx, mmsg, s);
}

export function parseCards(s: string): string[] {
    const cards = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '小王', '大王'];
    const pattern = new RegExp(`^${cards.join('|^')}`);
    const result = [];

    while (true) {
        const match = s.match(pattern);

        if (match) {
            result.push(match[0]);
            s = s.slice(match[0].length).trim();
        } else {
            break;
        }
    }

    result.sort((a, b) => {
        const indexA = cards.indexOf(a);
        const indexB = cards.indexOf(b);
        return indexA - indexB;
    });

    return result;
}

export function getCards(s: string): [string[], string, number] {
    //              0    1    2    3    4    5    6    7     8    9   10    11   12    13     14
    const rank = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '小王', '大王'];

    //王炸
    if (s == '王炸') {
        return [['小王', '大王'], '炸弹', 13];
    }

    //单张
    if (rank.includes(s)) {
        const index = rank.indexOf(s);
        return [[s], '单', index];
    }

    //对子
    var match = s.match(/^对(3|4|5|6|7|8|9|10|J|Q|K|A|2)$/);
    if (match) {
        const index = rank.indexOf(match[1]);
        return [[match[1], match[1]], '对', index];
    }

    //三张
    match = s.match(/^三(3|4|5|6|7|8|9|10|J|Q|K|A|2)$/);
    if (match) {
        const index = rank.indexOf(match[1]);
        return [[match[1], match[1], match[1]], '三', index];
    }

    //炸弹
    match = s.match(/^炸弹(3|4|5|6|7|8|9|10|J|Q|K|A|2)$/);
    if (match) {
        const index = rank.indexOf(match[1]);
        return [[match[1], match[1], match[1], match[1]], '炸弹', index];
    }

    //三带一
    match = s.match(/^三(3|4|5|6|7|8|9|10|J|Q|K|A|2)带(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
        const index = rank.indexOf(match[1]);
        return [[match[1], match[1], match[1], match[2]], '三带一', index];
    }

    //三带二
    match = s.match(/^三(3|4|5|6|7|8|9|10|J|Q|K|A|2)带对(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
        const index = rank.indexOf(match[1]);
        return [[match[1], match[1], match[1], match[2], match[2]], '三带对', index];
    }

    //四带一
    match = s.match(/^四(3|4|5|6|7|8|9|10|J|Q|K|A|2)带(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
        const index = rank.indexOf(match[1]);
        return [[match[1], match[1], match[1], match[1], match[2], match[3]], '四带一', index];
    }

    //四带对
    match = s.match(/^四(3|4|5|6|7|8|9|10|J|Q|K|A|2)带对(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)(3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王)$/);
    if (match) {
        const index = rank.indexOf(match[1]);
        return [[match[1], match[1], match[1], match[1], match[2], match[2], match[3], match[3]], '四带对', index];
    }

    //顺子
    match = s.match(/^(\d+)顺(3|4|5|6|7|8|9|10)$/);
    if (match) {
        const n = parseInt(match[1]);
        if (n >= 5 && n <= 12) {
            const index = rank.indexOf(match[2]);
            if (index + n < 13) {
                const cards = [];
                for (let i = 0; i < n; i++) {
                    cards.push(rank[index + i]);
                }
                return [cards, '顺', index];

            }
        }
    }

    //连对
    match = s.match(/^(\d+)连对(3|4|5|6|7|8|9|10|J|Q)$/);
    if (match) {
        const n = parseInt(match[1]);
        if (n >= 3 && n <= 10) {
            const index = rank.indexOf(match[2]);
            if (index + n < 13) {
                const cards = [];
                for (let i = 0; i < n; i++) {
                    cards.push(rank[index + i], rank[index + i]);
                }
                return [cards, '连对', index];
            }
        }
    }

    //飞机
    match = s.match(/^(\d+)飞机(3|4|5|6|7|8|9|10|J|Q|K)$/);
    if (match) {
        const n = parseInt(match[1]);
        if (n >= 2 && n <= 5) {
            const index = rank.indexOf(match[2]);
            if (index + n < 13) {
                const cards = [];
                for (let i = 0; i < n; i++) {
                    cards.push(rank[index + i], rank[index + i], rank[index + i]);
                }
                return [cards, '飞机', index];
            }
        }
    }

    //飞机带单张
    match = s.match(/^(\d+)飞机(3|4|5|6|7|8|9|10|J|Q|K)带(.+)$/);
    if (match) {
        const n = parseInt(match[1]);
        if (n >= 2 && n <= 5) {
            const match2 = match[3].match(/3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王/g);
            if (match2 && match2.length == n) {
                const index = rank.indexOf(match[2]);
                if (index + n < 13) {
                    const cards = [];
                    for (let i = 0; i < n; i++) {
                        cards.push(rank[index + i], rank[index + i], rank[index + i]);
                    }
                    cards.push(...match2);
                    return [cards, '飞机带单张', index];
                }
            }
        }
    }
    
    //飞机带对子
    match = s.match(/^(\d+)飞机(3|4|5|6|7|8|9|10|J|Q|K)带对(.+)$/);
    if (match) {
        const n = parseInt(match[1]);
        if (n >= 2 && n <= 5) {
            const match2 = match[3].match(/3|4|5|6|7|8|9|10|J|Q|K|A|2|小王|大王/g);
            if (match2 && match2.length == n) {
                const index = rank.indexOf(match[2]);
                if (index + n < 13) {
                    const cards = [];
                    for (let i = 0; i < n; i++) {
                        cards.push(rank[index + i], rank[index + i], rank[index + i]);
                    }
                    cards.push(...match2,...match2);
                    return [cards, '飞机带对子', index];
                }
            }
        }
    }
    
    return [[], '', 0];
}

/*
王炸
单张
对子：两张牌，相同
三张：三张牌，相同
炸弹：四张牌，相同
三带一：三张牌相同，一张随便
三带二：三张牌相同，一个对子
四带一：四张牌相同，两张随便
四带二：四张牌相同，两个对子
顺子：5-12个单张
连对：3-10个对子

飞机：2-5个三张
飞机带单张：2-5张单张
飞机带对子：2-5个对子

飞机另外解析
数字类型有：
1：单张，顺子，王炸
2：对子，连对
3：三张
4：炸弹，四带两相同的对子
1和3：三带一
2和3：三带对子
1和4：四带两个单张
2和4：四带两个对子，四带两个相同的单张

飞机：
取出大于三的牌检查顺序

我草不想写了。。。

突然想到可以改输入而不用费力解析：
王炸
x
对x
三x
炸弹x
三x带y
三x带对y
四x带yz
四x带对yz

//连续的牌型，x作为起头，n作为长度
n顺x
n连对x
n飞机x
n飞机x带yz...
n飞机x带对yz...

*/