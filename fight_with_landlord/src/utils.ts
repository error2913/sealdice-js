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

export function getName(ctx: seal.MsgContext, id: string) {
    const mmsg = getMsg('group', id, ctx.group.groupId);
    const mctx = getCtx(ctx.endPoint.userId, mmsg);
    return mctx.player.name;
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

export function getType(cards: string[]): [string, number] {
    //              0    1    2    3    4    5    6    7     8    9   10    11   12    13     14
    const rank = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '小王', '大王'];

    const map = {};

    cards.forEach(card => {
        map[card] = map[card] + 1 || 1;
    })

    const kinds = Object.keys(map);

    let [maxCard, maxNum] = ['', 0];
    kinds.forEach(card => {
        if (map[card] > maxNum) {
            [maxCard, maxNum] = [card, map[card]];
        }
    })

    if (
        cards.length === 0 ||
        (kinds.includes('小王') && map['小王'] > 1) ||
        (kinds.includes('大王') && map['大王'] > 1)
    ) {
        return ['', 0];
    }

    if (maxNum == 1) {
        //单张
        if (kinds.length == 1) {
            const index = rank.indexOf(cards[0]);
            return ['单', index];
        }

        //王炸
        if (kinds.includes('小王') && kinds.includes('大王')) {
            return ['炸弹', 13];
        }

        //顺子
        const index = rank.indexOf(cards[0]);
        for (let i = index + 1; i < cards.length; i++) {
            if (rank[i] !== cards[i - index]) {
                return ['', 0];
            }
        }
        return [`${cards.length}顺}`, index];
    }

    if (maxNum == 2 && kinds.length == 1) {
        //对子
        if (kinds.length == 1) {
            const index = rank.indexOf(cards[0]);
            return ['对', index];
        }

        //连对
    }

    if (maxNum == 3) {
        //三张
        if (kinds.length == 1) {
            const index = rank.indexOf(cards[0]);
            return ['三', index];
        }

        //三带一

        //三带对子

        //飞机
    }

    if (cards.length === 4) {
        if (kinds.length == 1) {
            const index = rank.indexOf(cards[0]);
            return ['炸弹', index];
        }

        //四带两张单
        
        //四带两个对子

        //飞机
    }

    return ['', 0];
}