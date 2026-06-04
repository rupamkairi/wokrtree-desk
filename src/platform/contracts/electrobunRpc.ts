import type { RPCSchema } from "electrobun/bun";

import type {
  OperationDetails,
  ProjectSnapshot,
  RepositorySelectionResult,
} from "../../core/domain/types";

type BunRequests = {
  chooseRepositoryDirectory: {
    params: undefined;
    response: RepositorySelectionResult;
  };
  registerRepository: {
    params: { selectedPath: string };
    response: ProjectSnapshot;
  };
  refreshRepository: {
    params: { projectId: string };
    response: ProjectSnapshot;
  };
  getRegisteredProject: {
    params: undefined;
    response: ProjectSnapshot | null;
  };
  getLastOperation: {
    params: undefined;
    response: OperationDetails | null;
  };
};

export type DesktopElectrobunRpcSchema = {
  bun: {
    requests: RPCSchema<{ requests: BunRequests }>["requests"];
    messages: RPCSchema["messages"];
  };
  webview: {
    requests: RPCSchema["requests"];
    messages: RPCSchema["messages"];
  };
};
