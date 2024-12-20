import { deckMap, load } from "./deck";
import { Game } from "./game";
import { getCards } from "./utils";

function main() {
  // 注册扩展
  let ext = seal.ext.find('FightWithLandlord2');
  if (!ext) {
    ext = seal.ext.new('FightWithLandlord2', '错误', '2.0.0');
    seal.ext.register(ext);
  }

  const cmdPlay = seal.ext.newCmdItemInfo();
  cmdPlay.name = 'ddz'; // 指令名字，可用中文
  cmdPlay.help = `帮助：
【.ddz start】使用team里的成员创建游戏
【.ddz end】
【.ddz check】查看手牌
【.ddz test 牌型名称】测试牌型是否存在
【.ddz 牌型名称】出牌
【.ddz 不要】跳过
出牌教程：x、y、z都为牌名
王炸、x、对x、三x、炸弹x
三x带y、三x带对y
四x带yz、四x带对yz

牌型连续时，n作为连续部分的长度，x作为起头：
n顺x、n连对x、n飞机x
n飞机x带yz...、n飞机x带对yz...
如：5飞机3带8910AJ就是
3334445556667778910AJ`;
  cmdPlay.disabledInPrivate = true;// 不允许私聊
  cmdPlay.solve = (ctx, msg, cmdArgs) => {
    if (Object.keys(deckMap).length === 0) {
      console.log('开始加载牌组');
      load();
    }

    let val = cmdArgs.getArgN(1);
    const id = ctx.group.groupId;

    switch (val) {
      case 'start': {
        const game = Game.getData(ext, id);
        game.start(ctx, msg);
        Game.saveData(ext, id);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'end': {
        const game = Game.getData(ext, id);
        game.end(ctx, msg);
        Game.saveData(ext, id);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'test': {
        const s = cmdArgs.getRestArgsFrom(2);
        const [cards, type, value] = getCards(s);

        if (type) {
          seal.replyToSender(ctx, msg, `${cards.join('')}存在${type}:${value}`);
          return seal.ext.newCmdExecuteResult(true);
        }

        seal.replyToSender(ctx, msg, '不存在');
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'check': {
        const game = Game.getData(ext, id);
        game.check(ctx, msg);
        return seal.ext.newCmdExecuteResult(true);
      }
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
      default: {
        const game = Game.getData(ext, id);
        game.play(ctx, msg, cmdArgs);
        Game.saveData(ext, id);
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };
  ext.cmdMap['ddz'] = cmdPlay;
  ext.cmdMap['斗地主'] = cmdPlay;
}

main();
