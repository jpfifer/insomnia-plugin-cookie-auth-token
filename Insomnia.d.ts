declare module Insomnia {

  interface BaseTemplateArgument {
    displayName: string;
    description?: string;
    defaultValue?: string | number | boolean | null;
    type: 'string' | 'number' | 'enum' | 'model';
  }

  interface StringTemplateArgument extends BaseTemplateArgument {
    type: 'string';
    placeholder?: string;
  }

  interface ModelTemplateArgument extends BaseTemplateArgument {
    type: 'model';
    model: string;
  }

  interface EnumArgument {
    displayName: string;
    value: string;
    description?: string;
    placeholder?: string;
  }

  interface EnumTemplateArgument extends BaseTemplateArgument {
    type: 'enum';
    options: EnumArgument[]
  }

  type TemplateArgument =
    BaseTemplateArgument
    & (StringTemplateArgument | ModelTemplateArgument | EnumTemplateArgument);

  interface TemplateTag {
    name: string;
    displayName: string;
    disablePreview?: () => boolean;
    description?: string;
    deprecated?: boolean;
    liveDisplayName?: (args) => string | null;
    validate?: (value: any) => string | null;
    priority?: number;
    args: TemplateArgument[];

    run(...any): any
  }

  interface Store {
    hasItem(key: string): Promise<boolean>;
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    all(): Promise<{ key: string, value: string }[]>;
  }

  interface BaseModel {
    _id: string;
    type: string;
    parentId: string;
    modified: number;
    created: number;
  }

  interface Network {
    sendRequest(request: Models.Request.Request): Promise<Models.Response.Response>
  }

  interface Context {
    app: App.App;
    meta: Meta;
    network: Network;
    store: Store;
    util: Util.Util;
  }

  interface Meta {
    requestId: string;
    workspaceId: string;
  }
}

declare module Insomnia.App {

  interface SaveOptions {
    defaultPath?: string
  }

  interface App {
    alert(title: string, message?: string): Promise<void>
    prompt(title: string, options?: {
      label?: string,
      defaultValue?: string,
      submitName?: string,
      cancelable?: boolean,
    }): Promise<string>
    getPath(name: 'desktop'): string
    showSaveDialog(options: SaveOptions): Promise<string | null>
  }
}

declare module Insomnia.Util {

  interface Util {
    models: {
      cookieJar: CookieJar;
      response: Response;
      request: Request;
      workspace: Workspace;
    }
  }

  interface CookieJar {
    getOrCreateForWorkspace(workspace: Models.Workspace): Promise<Models.Cookies.CookieJar>;
  }

  interface Response {
    getLatestForRequestId: (id: string) => Promise<Models.Response.Response | null>,
    getBodyBuffer: (response: Response, fallback?: any) => Promise<Buffer | null>,
  }

  interface Request {
    getById(id: string): Promise<Models.Request.Request | null>
  }

  interface Workspace {
    getById(id: string): Promise<Models.Workspace>
  }
}

declare module Insomnia.Models {
  interface Workspace {
    name: string;
    description: string;
    scope: 'spec' | 'debug' | null;
  }
  interface CookieJar {
    getOrCreateForWorkspace(workspaceId: string): Promise<any>
  }
}

declare module Insomnia.Models.Request {

  interface RequestHeader {
    name: string,
    value: string,
    disabled?: boolean,
  }

  interface RequestParameter {
    name: string,
    value: string,
    disabled?: boolean,
    id?: string,
    fileName?: string,
  }

  interface RequestBodyParameter {
    name: string,
    value: string,
    disabled?: boolean,
    multiline?: string,
    id?: string,
    fileName?: string,
    type?: string,
  }

  interface RequestBody {
    mimeType?: string | null,
    text?: string,
    fileName?: string,
    params?: RequestBodyParameter[],
  }

  type RequestAuthentication = any;

  interface Request extends BaseModel {
    url: string,
    name: string,
    description: string,
    method: string,
    body: RequestBody,
    parameters: Array<RequestParameter>,
    headers: Array<RequestHeader>,
    authentication: RequestAuthentication,
    metaSortKey: number,
    isPrivate: boolean,

    // Settings
    settingStoreCookies: boolean,
    settingSendCookies: boolean,
    settingDisableRenderRequestBody: boolean,
    settingEncodeUrl: boolean,
    settingRebuildPath: boolean,
    settingMaxTimelineDataSize: number,
  }
}

declare module Insomnia.Models.Response {

  interface ResponseHeader {
    name: string,
    value: string,
  }

  interface ResponseTimelineEntry {
    name: string,
    value: string,
  }

  interface Response extends BaseModel {
    statusCode: number,
    statusMessage: string,
    httpVersion: string,
    contentType: string,
    url: string,
    bytesRead: number,
    bytesContent: number,
    elapsedTime: number,
    headers: ResponseHeader[],
    timeline: ResponseTimelineEntry[],
    bodyPath: string, // Actual bodies are stored on the filesystem
    bodyCompression: 'zip' | null | '__NEEDS_MIGRATION__',
    error: string,
    requestVersionId: string | null,

    // Things from the request
    settingStoreCookies: boolean | null,
    settingSendCookies: boolean | null,
  }
}

declare module Insomnia.Models.Cookies {
  interface Cookie {
    creation: string;
    domain: string;
    expires: string;
    hostOnly: boolean;
    id: string;
    key: string;
    lastAccessed: string;
    path: string;
    value: string;
  }

  interface CookieJar {
    cookies: Cookie[];
  }
}
