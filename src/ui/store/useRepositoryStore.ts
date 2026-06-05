import { desktopBridge } from "../bridge/electrobunDesktopBridge";
import { createRepositoryStore } from "./repositoryStore";

export * from "./repositoryStore";

/**
 * App-wide store singleton wired to the real Electrobun desktop bridge.
 * Tests build their own store via createRepositoryStore() with a fake bridge,
 * so this module (and its Electrobun import) stays out of the test graph.
 */
export const useRepositoryStore = createRepositoryStore(desktopBridge);
