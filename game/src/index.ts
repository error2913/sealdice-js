import { GameManager } from "./game";

function main() {
  // 注册扩展
  let ext = seal.ext.find('game依赖');
  if (!ext) {
    ext = seal.ext.new('game依赖', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  globalThis.game = new GameManager();
}

main();
