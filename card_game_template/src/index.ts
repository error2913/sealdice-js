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
  cmdGame.name = 'game'; // 指令名字，可用中文
  cmdGame.help = `帮助：TODO`;
  cmdGame.disabledInPrivate = true;// 不允许私聊
  cmdGame.solve = (ctx, msg, cmdArgs) => {
    const val = cmdArgs.getArgN(1);
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
      case 'check': {
        const game = Game.getData(ext, id);
        game.check(ctx, msg);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'play': {
        const game = Game.getData(ext, id);
        const name = cmdArgs.getArgN(2);
        game.play(ctx, msg, name);
        Game.saveData(ext, id);
        return seal.ext.newCmdExecuteResult(true);
      }
      case 'help':
      default: {
        const ret = seal.ext.newCmdExecuteResult(true);
        ret.showHelp = true;
        return ret;
      }
    }
  };
  ext.cmdMap['game'] = cmdGame;
}

main();
