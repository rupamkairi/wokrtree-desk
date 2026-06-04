import { Electroview } from "electrobun/view";

import type { DesktopBridge } from "../../platform/contracts/desktopBridge";
import type { DesktopElectrobunRpcSchema } from "../../platform/contracts/electrobunRpc";
import {
  operationDetailsNullableSchema,
  projectSnapshotNullableSchema,
  projectSnapshotSchema,
  refreshRepositoryRequestSchema,
  registerRepositoryRequestSchema,
  repositorySelectionResultSchema,
} from "../../platform/contracts/schemas";

const rpc = Electroview.defineRPC<DesktopElectrobunRpcSchema>({
  handlers: {
    requests: {},
  },
});

new Electroview({ rpc });

export const desktopBridge: DesktopBridge = {
  async chooseRepositoryDirectory() {
    const result = repositorySelectionResultSchema.parse(
      await rpc.request.chooseRepositoryDirectory(),
    );
    return result.selectedPath;
  },

  async registerRepository(input) {
    const request = registerRepositoryRequestSchema.parse(input);
    return projectSnapshotSchema.parse(await rpc.request.registerRepository(request));
  },

  async refreshRepository(input) {
    const request = refreshRepositoryRequestSchema.parse(input);
    return projectSnapshotSchema.parse(await rpc.request.refreshRepository(request));
  },

  async getRegisteredProject() {
    return projectSnapshotNullableSchema.parse(
      await rpc.request.getRegisteredProject(),
    );
  },

  async getLastOperation() {
    return operationDetailsNullableSchema.parse(await rpc.request.getLastOperation());
  },
};
