import { ConfigManager } from "./configManager";
import { Player } from "./player";

function main() {
  // 注册扩展
  let ext = seal.ext.find('骰娘好感');
  if (!ext) {
    ext = seal.ext.new('骰娘好感', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  ConfigManager.register(ext);
  Player.getChart(ext);

  ext.onCommandReceived = (ctx, _, cmdArgs) => {
    const command = cmdArgs.command;
    const id = ctx.player.userId;
    const kw = seal.ext.getTemplateConfig(ext, '变量同步指令名');

    if (kw.includes(command)) {
      const player = Player.getPlayer(id);
      player.updateVars(ctx);
      Player.savePlayer(player);
    }

  }

  ext.onNotCommandReceived = (ctx, msg) => {
    const message = msg.message;
    const id = ctx.player.userId;
    const patterns = seal.ext.getTemplateConfig(ext, '变量同步正则表达式');

    if (
      patterns.some(item => {
        try {
          return new RegExp(item).test(message)
        } catch (error) {
          console.error('Error in RegExp:', error);
          return false;
        }
      })
    ) {
      const player = Player.getPlayer(id);
      player.updateVars(ctx);
      Player.savePlayer(player);
    }
  }

}

main();
