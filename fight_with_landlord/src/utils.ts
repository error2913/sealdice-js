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

function checkStraight(cards: string[]): [string, number] {

}

function checkPlaner(cards: string[]): [string, number] {

}

export function getType(cards: string[]): [string, number] {
    if (cards.length == 0) {
        return ['', 0];
    }

    if (cards.length > 5) {
        checkPlaner(cards);///////////////
    }

    //              0    1    2    3    4    5    6    7     8    9   10    11   12    13     14
    const rank = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '小王', '大王'];

    //单张
    if (cards.length == 1) {
        const index = rank.indexOf(cards[0]);
        return ['单', index];
    }

    //王炸
    if (cards.length == 2 && cards.includes('小王') && cards.includes('大王')) {
        return ['炸弹', 13];
    }

    // 排序
    cards.sort((a, b) => {
        const indexA = rank.indexOf(a);
        const indexB = rank.indexOf(b);
        return indexA - indexB;
    });

    //先建立一个牌到数字的映射表
    const map: { [key: string]: number } = {};
    cards.forEach(card => {
        map[card] = map[card] + 1 || 1;
    })

    //检查大小王数量
    if (
        (map['小王'] && map['小王'] > 1) ||
        (map['大王'] && map['大王'] > 1)
    ) {
        return ['', 0];
    }

    //再建立一个数字到牌的映射表
    //                       1    2   3   4
    const arr: string[][] = [[], [], [], []];
    
    for (let card in map) {
        if (map[card] > 4) {
            return ['', 0];
        }

        arr[map[card] - 1].push(card);
    }

    //对arr的元素进行排序
    arr.forEach(item => {
        item.sort((a, b) => {
            const indexA = rank.indexOf(a);
            const indexB = rank.indexOf(b);
            return indexA - indexB;
        })
    })

    //1
    if (arr[0].length > 0) {
        //1和2
        if (arr[1].length > 0) {
            return ['', 0];
        }

        //1和3
        if (arr[2].length > 0 && arr[3].length == 0) {
        
        }

        //1和4
        if (arr[2].length == 0 && arr[3].length > 0) {
        
        }

        //纯1，顺子

    }

    if (arr[1].length > 0) {
        //2和3
        if (arr[2].length > 0) {
        
        }
    
        //2和4
        if (arr[3].length > 0) {
            
        }

        //纯2，对子，连对

        //对子
        if (arr[1].length == 1) {
            const index = rank.indexOf(arr[1][0]);
            return ['对', index];
        }

        //连对
        
    }

    if (arr[2].length > 0) {
        //纯3，三张
        if (arr[2].length == 1) {
            const index = rank.indexOf(arr[2][0]);
            return ['三张', index];
        }
        
    }

    if (arr[3].length > 0) {
        //纯4，炸弹
        if (arr[3].length == 1) {
            const index = rank.indexOf(arr[3][0]);
            return ['炸弹', index];
        }
    }

    return ['', 0];
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

我草不想写了
*/