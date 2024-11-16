import { deckMap, load } from "./deck";
import { Game } from "./game";

function main() {
  // 注册扩展
  let ext = seal.ext.find('cardGameTemplate');
  if (!ext) {
    ext = seal.ext.new('cardGameTemplate', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  //注册指令
  const cmdGame = seal.ext.newCmdItemInfo();
  cmdGame.name = 'uno'; // 指令名字，可用中文
  cmdGame.help = `帮助：
【.uno start】
【.uno end】
【.uno check】
【.uno skip】
【.uno <牌名>】`;
  cmdGame.disabledInPrivate = true;// 不允许私聊
  cmdGame.solve = (ctx, msg, cmdArgs) => {
    if (Object.keys(deckMap).length === 0) {
      console.log('开始加载牌组');
      load();
    }
    
    const val = cmdArgs.getArgN(1);
    const id = ctx.group.groupId;

    switch (val) {
      case '':
      case 'help': {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
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
      case 'check': {
        const game = Game.getData(ext, id);
        game.check(ctx, msg);
        return seal.ext.newCmdExecuteResult(true);
      }
      default: {
        const game = Game.getData(ext, id);
        game.play(ctx, msg, cmdArgs);
        Game.saveData(ext, id);
        return seal.ext.newCmdExecuteResult(true);
      }
    }
  };
  ext.cmdMap['uno'] = cmdGame;
  ext.cmdMap['UNO'] = cmdGame;
}

main();
