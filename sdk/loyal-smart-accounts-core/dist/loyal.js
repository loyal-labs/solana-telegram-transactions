var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/loyal.ts
import {
  createLoyalSmartAccountsClient
} from "@loyal-labs/loyal-smart-accounts";
import { Connection } from "@solana/web3.js";
import { getSolanaEndpoints } from "@loyal-labs/solana-rpc";
var connectionCache = new Map;
var DEFAULT_COMMITMENT = "confirmed";
function getCacheKey(rpcEndpoint, websocketEndpoint, commitment) {
  return `${rpcEndpoint}::${websocketEndpoint}::${commitment}`;
}
function getOrCreateConnection(env, commitment, createConnection) {
  const { rpcEndpoint, websocketEndpoint } = getSolanaEndpoints(env);
  const cacheKey = getCacheKey(rpcEndpoint, websocketEndpoint, commitment);
  const cached = connectionCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const connection = createConnection ? createConnection(rpcEndpoint, websocketEndpoint, commitment) : new Connection(rpcEndpoint, {
    commitment,
    wsEndpoint: websocketEndpoint
  });
  connectionCache.set(cacheKey, connection);
  return connection;
}
function createLoyalSmartAccountsClientFromEnv(config) {
  const commitment = config.commitment ?? DEFAULT_COMMITMENT;
  const connection = config.connection ?? getOrCreateConnection(config.env, commitment, config.createConnection);
  return createLoyalSmartAccountsClient({
    connection,
    programId: config.programId,
    defaultCommitment: commitment,
    sendPrepared: config.sendPrepared,
    confirm: config.confirm
  });
}
export {
  createLoyalSmartAccountsClientFromEnv
};
