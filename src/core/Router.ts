// src/Router.ts
import fs from "fs";
import path from "path";
import { Cache } from "./Cache";
import { Request } from "./Request";

export type Middleware = (req: any, res: any, next: () => void) => void;
type ControllerAction = [new () => any, string];
type Action = ((req: any, res: any) => void) | ControllerAction;

interface Route {
  uri: string;
  action: Action;
  middleware: Middleware[];
}

interface CachedFile {
  content: Buffer;
  mtime: number;
  mime: string;
}

interface RouteGroupOptions {
  prefix?: string;
  middleware?: string[]; // names of middleware
}

interface TrieNode {
  children: Map<string, TrieNode>;
  paramChild?: TrieNode;
  paramName?: string;
  route?: Route;
}

const DEV_MODE = process.env.NODE_ENV !== "production";

export class Router {
  // ---------------- Properties ----------------
  private static trie: Record<string, TrieNode> = {};
  private static globalMiddleware: Middleware[] = [];
  private static namedMiddleware: Record<string, Middleware> = {};
  private static middlewareGroups: Record<string, string[]> = {};
  private static _currentPrefix: string = "";
  private static _currentGroupMiddleware: Middleware[] = [];
  private static fileCache: Record<string, CachedFile> = {};
  private static routeCache = new Cache<TrieNode>(DEV_MODE);

  // ---------------- Named Middleware ----------------
  static registerMiddleware(name: string, middleware: Middleware) {
    this.namedMiddleware[name] = middleware;
  }

  static getMiddleware(name: string): Middleware {
    const mw = this.namedMiddleware[name];
    if (!mw) throw new Error(`Middleware '${name}' not found`);
    return mw;
  }

  // ---------------- Middleware Groups ----------------
  static defineMiddlewareGroup(name: string, middlewareNames: string[]) {
    this.middlewareGroups[name] = middlewareNames;
  }

  static getMiddlewareGroup(name: string): Middleware[] {
    const names = this.middlewareGroups[name] || [];
    return names.map((n) => this.getMiddleware(n));
  }

  // ---------------- Global Middleware ----------------
  static use(middleware: Middleware) {
    this.globalMiddleware.push(middleware);
  }

  // ---------------- Route Group ----------------
  static group(options: RouteGroupOptions, callback: () => void) {
    const previousPrefix = this._currentPrefix;
    const previousMiddleware = this._currentGroupMiddleware;

    let prefix = options.prefix || "";
    if (prefix && !prefix.startsWith("/")) prefix = "/" + prefix;
    this._currentPrefix = previousPrefix + prefix;

    const groupMiddleware = (options.middleware || []).map((n) =>
      this.getMiddleware(n)
    );
    this._currentGroupMiddleware = [...previousMiddleware, ...groupMiddleware];

    callback();

    this._currentPrefix = previousPrefix;
    this._currentGroupMiddleware = previousMiddleware;
  }

  // ---------------- Register Route ----------------
  private static registerRoute(
    method: string,
    uri: string,
    action: Action,
    middleware: Middleware[]
  ) {
    if (!uri.startsWith("/")) uri = "/" + uri;
    let fullUri = (this._currentPrefix + uri).replace(/\/+/g, "/");
    if (fullUri !== "/" && fullUri.endsWith("/"))
      fullUri = fullUri.slice(0, -1);

    const combinedMiddleware = [...this._currentGroupMiddleware, ...middleware];
    const route: Route = {
      uri: fullUri,
      action,
      middleware: combinedMiddleware,
    };

    const segments = fullUri.split("/").filter(Boolean);
    if (!this.trie[method]) this.trie[method] = { children: new Map() };
    let node = this.trie[method];

    for (const seg of segments) {
      if (seg.startsWith(":")) {
        if (!node.paramChild)
          node.paramChild = { children: new Map(), paramName: seg.slice(1) };
        node = node.paramChild;
      } else {
        if (!node.children.has(seg))
          node.children.set(seg, { children: new Map() });
        node = node.children.get(seg)!;
      }
    }

    node.route = route;
  }

  // ---------------- GET/POST/PUT/DELETE ----------------
  static get(uri: string, action: Action, middleware: Middleware[] = []) {
    this.registerRoute("GET", uri, action, middleware);
  }
  static post(uri: string, action: Action, middleware: Middleware[] = []) {
    this.registerRoute("POST", uri, action, middleware);
  }
  static put(uri: string, action: Action, middleware: Middleware[] = []) {
    this.registerRoute("PUT", uri, action, middleware);
  }
  static delete(uri: string, action: Action, middleware: Middleware[] = []) {
    this.registerRoute("DELETE", uri, action, middleware);
  }

  // ---------------- Dispatch ----------------
  static dispatch(uri: string, method: string, req: any, res: any) {
    Request.run(req, res, () => {
      const methodTrie = this.trie[method.toUpperCase()];
      if (!methodTrie) {
        res.statusCode = 405;
        res.end(JSON.stringify({ message: "Method Not Allowed" }));
        return;
      }

      // Separate path and query string
      let path = uri;
      let queryString = "";
      const queryIndex = uri.indexOf("?");
      if (queryIndex !== -1) {
        path = uri.slice(0, queryIndex);
        queryString = uri.slice(queryIndex + 1);
      }

      // Normalize path (remove trailing slash except for root)
      if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);

      // Search route in trie
      const { route, params } = this.searchRoute(methodTrie, path);
      if (!route) {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: "Route not found" }));
        return;
      }

      // Attach path params
      req.params = params;

      // Parse query parameters
      req.query = {};
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        searchParams.forEach((value, key) => {
          req.query[key] = value;
        });
      }

      // Run middleware chain
      const middlewareChain = [...this.globalMiddleware, ...route.middleware];
      let i = 0;
      const next = () => {
        const mw = middlewareChain[i++];
        if (mw) mw(req, res, next);
        else this.executeAction(route.action, req, res);
      };
      next();
    });
  }

  // ---------------- Search Route in Trie ----------------
  private static searchRoute(node: TrieNode, uri: string) {
    const segments = uri.split("/").filter(Boolean);
    let current: TrieNode | undefined = node;
    const params: Record<string, string> = {};

    for (const seg of segments) {
      if (!current) return { route: undefined, params };
      if (current.children.has(seg)) current = current.children.get(seg);
      else if (current.paramChild) {
        current = current.paramChild;
        params[current.paramName!] = seg;
      } else return { route: undefined, params };
    }

    return { route: current?.route, params };
  }

  // ---------------- Execute Action ----------------
  private static executeAction(action: Action, req: any, res: any) {
    if (typeof action === "function") {
      action(req, res);
    } else if (Array.isArray(action)) {
      const [ControllerClass, methodName] = action;
      const controller = new ControllerClass();
      const method = (controller as any)[methodName];

      if (typeof method === "function") {
        // Pass route params as function arguments, followed by req and res
        // Example: update(req, res, id) -> id is last
        const paramValues = Object.values(req.params || {});
        method.call(controller, req, res, ...paramValues);
      } else {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            message: `Controller method '${methodName}' not found`,
          })
        );
      }
    }
  }

  // ---------------- File Caching ----------------
  static serveFile(filePath: string, req: any, res: any) {
    const fullPath = path.resolve(filePath);
    const stats = fs.statSync(fullPath);

    // Handle cached file
    const cached = this.fileCache[fullPath];
    if (cached && cached.mtime === stats.mtimeMs && !DEV_MODE) {
      res.statusCode = 200;
      res.setHeader("Content-Type", cached.mime);

      if (req.method === "HEAD") {
        return res.end();
      }

      return res.end(cached.content);
    }

    // Read file
    const content = fs.readFileSync(fullPath);

    // Determine MIME
    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".ogg": "video/ogg",
    };

    const mime = mimeMap[ext] || "application/octet-stream";
    res.setHeader("Content-Type", mime);

    // Save to cache
    if (!DEV_MODE) {
      this.fileCache[fullPath] = {
        content,
        mtime: stats.mtimeMs,
        mime,
      };
    }

    res.statusCode = 200;

    // HEAD request → only send headers
    if (req.method === "HEAD") {
      return res.end();
    }

    // Send file content
    res.end(content);
  }
}
