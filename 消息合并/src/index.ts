function main() {
  // 注册扩展
  let ext = seal.ext.find('消息合并');
  if (!ext) {
    ext = seal.ext.new('消息合并', '错误', '1.0.0');
    seal.ext.register(ext);

    const data = {};

    const cmd = seal.ext.newCmdItemInfo();
    cmd.name = '合'; // 指令名字，可用中文
    cmd.help = '使用 .合 数字，就可以将后面指定条消息合成一条！\n使用 .合停，就可以暂停！';
    cmd.solve = (ctx, msg, cmdArgs) => {
      const userId = ctx.player.userId
      const groupId = ctx.group.groupId
      const id = ctx.isPrivate ? userId : groupId;

      let val = cmdArgs.getArgN(1);
      switch (val) {
        case '':
        case 'help': {
          const ret = seal.ext.newCmdExecuteResult(true);
          ret.showHelp = true;
          return ret;
        }
        case '停': {
          seal.replyToSender(ctx, msg, data[id].text.join(''));
          delete data[id];
          seal.replyToSender(ctx, msg, '合并已暂停！');
          return seal.ext.newCmdExecuteResult(true)
        }
        default: {
          const num = parseInt(val)
          if (isNaN(num) || num < 2) {
            seal.replyToSender(ctx, msg, '请输入大于一的数字！');
            return seal.ext.newCmdExecuteResult(true)
          }

          data[id] = {
            num: num,
            text: []
          }

          seal.replyToSender(ctx, msg, `合并已开启！目标，${num}条！`);
          return seal.ext.newCmdExecuteResult(true);
        }
      }
    };
    ext.cmdMap['合'] = cmd;

    ext.onNotCommandReceived = (ctx, msg) => {
      const userId = ctx.player.userId
      const groupId = ctx.group.groupId
      const id = ctx.isPrivate ? userId : groupId;

      if (!data[id]) {
        return;
      }

      data[id].text.push(msg.message);
      seal.replyToSender(ctx, msg, `已收到${data[id].text.length}条！目标，${data[id].num}条！`);

      if (data[id].text.length >= data[id].num) {
        seal.replyToSender(ctx, msg, data[id].text.join(''));
        delete data[id];
      }

      return;
    }
  }
}

main();
