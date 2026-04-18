export interface ParamConfig {
  name: string;
  type: "string" | "number" | "boolean" | "enum";
  description: string;
  required: boolean;
  default?: unknown;
  enumValues?: string[];
  isPath?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface ToolConfig {
  name: string;
  description: string;
  params: ParamConfig[];
  command: string;
  args: string[];
  isApiCall?: boolean;
  httpMethod?: string;
  httpPath?: string;
}

export interface ForgeConfig {
  projectName: string;
  serverName: string;
  cliName: string;
  cliDescription: string;
  sourceType: "cli" | "api" | "hybrid";
  tools: ToolConfig[];
  options: {
    docker: boolean;
    systemd: boolean;
    port: number;
    workingDirectory?: string;
    allowedCommands: string[];
    apkPackages?: string[];
    baseUrl?: string;
  };
}
