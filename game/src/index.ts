import { GameManager } from "./game/gameManager";
import { VarsManager } from "./vars/varsManager";

function main() {
  // 注册扩展
  let ext = seal.ext.find('game依赖');
  if (!ext) {
    ext = seal.ext.new('game依赖', '错误', '1.0.0');
    seal.ext.register(ext);
  }

  const data = {};

  function getGameManager(ext: seal.ExtInfo): GameManager {
    return data.hasOwnProperty(ext.name) ? data[ext.name] : new GameManager(ext);
  }

  function registerGameManager(gm: GameManager) {
    data[gm.ext.name] = gm;
  }

  globalThis.getGameManager = getGameManager;
  globalThis.registerGameManager = registerGameManager;
  globalThis.varsManager = new VarsManager();
}

main();
