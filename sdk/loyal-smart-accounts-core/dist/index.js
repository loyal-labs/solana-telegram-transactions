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

// node:util
var exports_util = {};
__export(exports_util, {
  types: () => types,
  promisify: () => promisify,
  log: () => log,
  isUndefined: () => isUndefined,
  isSymbol: () => isSymbol,
  isString: () => isString,
  isRegExp: () => isRegExp,
  isPrimitive: () => isPrimitive,
  isObject: () => isObject,
  isNumber: () => isNumber,
  isNullOrUndefined: () => isNullOrUndefined,
  isNull: () => isNull,
  isFunction: () => isFunction,
  isError: () => isError,
  isDate: () => isDate,
  isBuffer: () => isBuffer,
  isBoolean: () => isBoolean,
  isArray: () => isArray,
  inspect: () => inspect,
  inherits: () => inherits,
  format: () => format,
  deprecate: () => deprecate,
  debuglog: () => debuglog,
  callbackifyOnRejected: () => callbackifyOnRejected,
  callbackify: () => callbackify,
  _extend: () => _extend,
  TextEncoder: () => TextEncoder2,
  TextDecoder: () => TextDecoder
});
function format(f, ...args) {
  if (!isString(f)) {
    var objects = [f];
    for (var i = 0;i < args.length; i++)
      objects.push(inspect(args[i]));
    return objects.join(" ");
  }
  var i = 0, len = args.length, str = String(f).replace(formatRegExp, function(x2) {
    if (x2 === "%%")
      return "%";
    if (i >= len)
      return x2;
    switch (x2) {
      case "%s":
        return String(args[i++]);
      case "%d":
        return Number(args[i++]);
      case "%j":
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return "[Circular]";
        }
      default:
        return x2;
    }
  });
  for (var x = args[i];i < len; x = args[++i])
    if (isNull(x) || !isObject(x))
      str += " " + x;
    else
      str += " " + inspect(x);
  return str;
}
function deprecate(fn, msg) {
  if (typeof process === "undefined" || process?.noDeprecation === true)
    return fn;
  var warned = false;
  function deprecated(...args) {
    if (!warned) {
      if (process.throwDeprecation)
        throw new Error(msg);
      else if (process.traceDeprecation)
        console.trace(msg);
      else
        console.error(msg);
      warned = true;
    }
    return fn.apply(this, ...args);
  }
  return deprecated;
}
function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];
  if (style)
    return "\x1B[" + inspect.colors[style][0] + "m" + str + "\x1B[" + inspect.colors[style][1] + "m";
  else
    return str;
}
function stylizeNoColor(str, styleType) {
  return str;
}
function arrayToHash(array) {
  var hash = {};
  return array.forEach(function(val, idx) {
    hash[val] = true;
  }), hash;
}
function formatValue(ctx, value, recurseTimes) {
  if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== inspect && !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret))
      ret = formatValue(ctx, ret, recurseTimes);
    return ret;
  }
  var primitive = formatPrimitive(ctx, value);
  if (primitive)
    return primitive;
  var keys = Object.keys(value), visibleKeys = arrayToHash(keys);
  if (ctx.showHidden)
    keys = Object.getOwnPropertyNames(value);
  if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0))
    return formatError(value);
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ": " + value.name : "";
      return ctx.stylize("[Function" + name + "]", "special");
    }
    if (isRegExp(value))
      return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
    if (isDate(value))
      return ctx.stylize(Date.prototype.toString.call(value), "date");
    if (isError(value))
      return formatError(value);
  }
  var base = "", array = false, braces = ["{", "}"];
  if (isArray(value))
    array = true, braces = ["[", "]"];
  if (isFunction(value)) {
    var n = value.name ? ": " + value.name : "";
    base = " [Function" + n + "]";
  }
  if (isRegExp(value))
    base = " " + RegExp.prototype.toString.call(value);
  if (isDate(value))
    base = " " + Date.prototype.toUTCString.call(value);
  if (isError(value))
    base = " " + formatError(value);
  if (keys.length === 0 && (!array || value.length == 0))
    return braces[0] + base + braces[1];
  if (recurseTimes < 0)
    if (isRegExp(value))
      return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
    else
      return ctx.stylize("[Object]", "special");
  ctx.seen.push(value);
  var output;
  if (array)
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  else
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  return ctx.seen.pop(), reduceToSingleString(output, base, braces);
}
function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize("undefined", "undefined");
  if (isString(value)) {
    var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
    return ctx.stylize(simple, "string");
  }
  if (isNumber(value))
    return ctx.stylize("" + value, "number");
  if (isBoolean(value))
    return ctx.stylize("" + value, "boolean");
  if (isNull(value))
    return ctx.stylize("null", "null");
}
function formatError(value) {
  return "[" + Error.prototype.toString.call(value) + "]";
}
function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length;i < l; ++i)
    if (hasOwnProperty(value, String(i)))
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
    else
      output.push("");
  return keys.forEach(function(key) {
    if (!key.match(/^\d+$/))
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
  }), output;
}
function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  if (desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] }, desc.get)
    if (desc.set)
      str = ctx.stylize("[Getter/Setter]", "special");
    else
      str = ctx.stylize("[Getter]", "special");
  else if (desc.set)
    str = ctx.stylize("[Setter]", "special");
  if (!hasOwnProperty(visibleKeys, key))
    name = "[" + key + "]";
  if (!str)
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes))
        str = formatValue(ctx, desc.value, null);
      else
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      if (str.indexOf(`
`) > -1)
        if (array)
          str = str.split(`
`).map(function(line) {
            return "  " + line;
          }).join(`
`).slice(2);
        else
          str = `
` + str.split(`
`).map(function(line) {
            return "   " + line;
          }).join(`
`);
    } else
      str = ctx.stylize("[Circular]", "special");
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/))
      return str;
    if (name = JSON.stringify("" + key), name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/))
      name = name.slice(1, -1), name = ctx.stylize(name, "name");
    else
      name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), name = ctx.stylize(name, "string");
  }
  return name + ": " + str;
}
function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0, length = output.reduce(function(prev, cur) {
    if (numLinesEst++, cur.indexOf(`
`) >= 0)
      numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
  }, 0);
  if (length > 60)
    return braces[0] + (base === "" ? "" : base + `
 `) + " " + output.join(`,
  `) + " " + braces[1];
  return braces[0] + base + " " + output.join(", ") + " " + braces[1];
}
function isArray(ar) {
  return Array.isArray(ar);
}
function isBoolean(arg) {
  return typeof arg === "boolean";
}
function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return arg == null;
}
function isNumber(arg) {
  return typeof arg === "number";
}
function isString(arg) {
  return typeof arg === "string";
}
function isSymbol(arg) {
  return typeof arg === "symbol";
}
function isUndefined(arg) {
  return arg === undefined;
}
function isRegExp(re) {
  return isObject(re) && objectToString(re) === "[object RegExp]";
}
function isObject(arg) {
  return typeof arg === "object" && arg !== null;
}
function isDate(d) {
  return isObject(d) && objectToString(d) === "[object Date]";
}
function isError(e) {
  return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
}
function isFunction(arg) {
  return typeof arg === "function";
}
function isPrimitive(arg) {
  return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
}
function isBuffer(arg) {
  return arg instanceof Buffer;
}
function objectToString(o) {
  return Object.prototype.toString.call(o);
}
function pad(n) {
  return n < 10 ? "0" + n.toString(10) : n.toString(10);
}
function timestamp() {
  var d = new Date, time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(":");
  return [d.getDate(), months[d.getMonth()], time].join(" ");
}
function log(...args) {
  console.log("%s - %s", timestamp(), format.apply(null, args));
}
function inherits(ctor, superCtor) {
  if (superCtor)
    ctor.super_ = superCtor, ctor.prototype = Object.create(superCtor.prototype, { constructor: { value: ctor, enumerable: false, writable: true, configurable: true } });
}
function _extend(origin, add) {
  if (!add || !isObject(add))
    return origin;
  var keys = Object.keys(add), i = keys.length;
  while (i--)
    origin[keys[i]] = add[keys[i]];
  return origin;
}
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
function callbackifyOnRejected(reason, cb) {
  if (!reason) {
    var newReason = new Error("Promise was rejected with a falsy value");
    newReason.reason = reason, reason = newReason;
  }
  return cb(reason);
}
function callbackify(original) {
  if (typeof original !== "function")
    throw new TypeError('The "original" argument must be of type Function');
  function callbackified(...args) {
    var maybeCb = args.pop();
    if (typeof maybeCb !== "function")
      throw new TypeError("The last argument must be of type Function");
    var self = this, cb = function(...args2) {
      return maybeCb.apply(self, ...args2);
    };
    original.apply(this, args).then(function(ret) {
      process.nextTick(cb.bind(null, null, ret));
    }, function(rej) {
      process.nextTick(callbackifyOnRejected.bind(null, rej, cb));
    });
  }
  return Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original)), Object.defineProperties(callbackified, Object.getOwnPropertyDescriptors(original)), callbackified;
}
var formatRegExp, debuglog, inspect, types = () => {}, months, promisify, TextEncoder2, TextDecoder;
var init_util = __esm(() => {
  formatRegExp = /%[sdj%]/g;
  debuglog = ((debugs = {}, debugEnvRegex = {}, debugEnv) => ((debugEnv = typeof process !== "undefined" && process.env.NODE_DEBUG) && (debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^").toUpperCase()), debugEnvRegex = new RegExp("^" + debugEnv + "$", "i"), (set) => {
    if (set = set.toUpperCase(), !debugs[set])
      if (debugEnvRegex.test(set))
        debugs[set] = function(...args) {
          console.error("%s: %s", set, pid, format.apply(null, ...args));
        };
      else
        debugs[set] = function() {};
    return debugs[set];
  }))();
  inspect = ((i) => (i.colors = { bold: [1, 22], italic: [3, 23], underline: [4, 24], inverse: [7, 27], white: [37, 39], grey: [90, 39], black: [30, 39], blue: [34, 39], cyan: [36, 39], green: [32, 39], magenta: [35, 39], red: [31, 39], yellow: [33, 39] }, i.styles = { special: "cyan", number: "yellow", boolean: "yellow", undefined: "grey", null: "bold", string: "green", date: "magenta", regexp: "red" }, i.custom = Symbol.for("nodejs.util.inspect.custom"), i))(function inspect2(obj, opts, ...rest) {
    var ctx = { seen: [], stylize: stylizeNoColor };
    if (rest.length >= 1)
      ctx.depth = rest[0];
    if (rest.length >= 2)
      ctx.colors = rest[1];
    if (isBoolean(opts))
      ctx.showHidden = opts;
    else if (opts)
      _extend(ctx, opts);
    if (isUndefined(ctx.showHidden))
      ctx.showHidden = false;
    if (isUndefined(ctx.depth))
      ctx.depth = 2;
    if (isUndefined(ctx.colors))
      ctx.colors = false;
    if (ctx.colors)
      ctx.stylize = stylizeWithColor;
    return formatValue(ctx, obj, ctx.depth);
  });
  months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  promisify = ((x) => (x.custom = Symbol.for("nodejs.util.promisify.custom"), x))(function promisify2(original) {
    if (typeof original !== "function")
      throw new TypeError('The "original" argument must be of type Function');
    if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
      var fn = original[kCustomPromisifiedSymbol];
      if (typeof fn !== "function")
        throw new TypeError('The "nodejs.util.promisify.custom" argument must be of type Function');
      return Object.defineProperty(fn, kCustomPromisifiedSymbol, { value: fn, enumerable: false, writable: false, configurable: true }), fn;
    }
    function fn(...args) {
      var promiseResolve, promiseReject, promise = new Promise(function(resolve, reject) {
        promiseResolve = resolve, promiseReject = reject;
      });
      args.push(function(err, value) {
        if (err)
          promiseReject(err);
        else
          promiseResolve(value);
      });
      try {
        original.apply(this, args);
      } catch (err) {
        promiseReject(err);
      }
      return promise;
    }
    if (Object.setPrototypeOf(fn, Object.getPrototypeOf(original)), kCustomPromisifiedSymbol)
      Object.defineProperty(fn, kCustomPromisifiedSymbol, { value: fn, enumerable: false, writable: false, configurable: true });
    return Object.defineProperties(fn, Object.getOwnPropertyDescriptors(original));
  });
  ({ TextEncoder: TextEncoder2, TextDecoder } = globalThis);
});

// node:assert
var exports_assert = {};
__export(exports_assert, {
  throws: () => throws,
  strictEqual: () => strictEqual,
  strict: () => strict,
  rejects: () => rejects,
  ok: () => ok,
  notStrictEqual: () => notStrictEqual,
  notEqual: () => notEqual,
  notDeepStrictEqual: () => notDeepStrictEqual,
  notDeepEqual: () => notDeepEqual,
  match: () => match,
  ifError: () => ifError,
  fail: () => fail,
  equal: () => equal,
  doesNotThrow: () => doesNotThrow,
  doesNotReject: () => doesNotReject,
  doesNotMatch: () => doesNotMatch,
  default: () => assert_default,
  deepStrictEqual: () => deepStrictEqual,
  deepEqual: () => deepEqual,
  CallTracker: () => CallTracker,
  AssertionError: () => AssertionError
});
var __create2, __getProtoOf2, __defProp2, __getOwnPropNames2, __hasOwnProp2, __toESM2 = (mod, isNodeMode, target) => {
  target = mod != null ? __create2(__getProtoOf2(mod)) : {};
  let to = isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames2(mod))
    if (!__hasOwnProp2.call(to, key))
      __defProp2(to, key, { get: () => mod[key], enumerable: true });
  return to;
}, __commonJS2 = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports), require_shams, require_shams2, require_es_object_atoms, require_es_errors, require_eval, require_range, require_ref, require_syntax, require_type, require_uri, require_abs, require_floor, require_max, require_min, require_pow, require_round, require_isNaN, require_sign, require_gOPD, require_gopd, require_es_define_property, require_has_symbols, require_Reflect_getPrototypeOf, require_Object_getPrototypeOf, require_implementation, require_function_bind, require_functionCall, require_functionApply, require_reflectApply, require_actualApply, require_call_bind_apply_helpers, require_get, require_get_proto, require_hasown, require_get_intrinsic, require_call_bound, require_is_arguments, require_is_regex, require_safe_regex_test, require_is_generator_function, require_is_callable, require_for_each, require_possible_typed_array_names, require_available_typed_arrays, require_define_data_property, require_has_property_descriptors, require_set_function_length, require_applyBind, require_call_bind, require_which_typed_array, require_is_typed_array, require_types, require_isBuffer, require_inherits_browser, require_inherits, require_util, require_errors, require_assertion_error, require_isArguments, require_implementation2, require_object_keys, require_implementation3, require_polyfill, require_implementation4, require_polyfill2, require_callBound, require_define_properties, require_shim, require_object_is, require_implementation5, require_polyfill3, require_shim2, require_is_nan, require_comparisons, require_assert, assert, AssertionError, CallTracker, deepEqual, deepStrictEqual, doesNotMatch, doesNotReject, doesNotThrow, equal, fail, ifError, match, notDeepEqual, notDeepStrictEqual, notEqual, notStrictEqual, ok, rejects, strict, strictEqual, throws, assert_default;
var init_assert = __esm(() => {
  __create2 = Object.create;
  ({ getPrototypeOf: __getProtoOf2, defineProperty: __defProp2, getOwnPropertyNames: __getOwnPropNames2 } = Object);
  __hasOwnProp2 = Object.prototype.hasOwnProperty;
  require_shams = __commonJS2((exports, module) => {
    module.exports = function hasSymbols() {
      if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function")
        return false;
      if (typeof Symbol.iterator === "symbol")
        return true;
      var obj = {}, sym = Symbol("test"), symObj = Object(sym);
      if (typeof sym === "string")
        return false;
      if (Object.prototype.toString.call(sym) !== "[object Symbol]")
        return false;
      if (Object.prototype.toString.call(symObj) !== "[object Symbol]")
        return false;
      var symVal = 42;
      obj[sym] = symVal;
      for (var _ in obj)
        return false;
      if (typeof Object.keys === "function" && Object.keys(obj).length !== 0)
        return false;
      if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0)
        return false;
      var syms = Object.getOwnPropertySymbols(obj);
      if (syms.length !== 1 || syms[0] !== sym)
        return false;
      if (!Object.prototype.propertyIsEnumerable.call(obj, sym))
        return false;
      if (typeof Object.getOwnPropertyDescriptor === "function") {
        var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
        if (descriptor.value !== symVal || descriptor.enumerable !== true)
          return false;
      }
      return true;
    };
  });
  require_shams2 = __commonJS2((exports, module) => {
    var hasSymbols = require_shams();
    module.exports = function hasToStringTagShams() {
      return hasSymbols() && !!Symbol.toStringTag;
    };
  });
  require_es_object_atoms = __commonJS2((exports, module) => {
    module.exports = Object;
  });
  require_es_errors = __commonJS2((exports, module) => {
    module.exports = Error;
  });
  require_eval = __commonJS2((exports, module) => {
    module.exports = EvalError;
  });
  require_range = __commonJS2((exports, module) => {
    module.exports = RangeError;
  });
  require_ref = __commonJS2((exports, module) => {
    module.exports = ReferenceError;
  });
  require_syntax = __commonJS2((exports, module) => {
    module.exports = SyntaxError;
  });
  require_type = __commonJS2((exports, module) => {
    module.exports = TypeError;
  });
  require_uri = __commonJS2((exports, module) => {
    module.exports = URIError;
  });
  require_abs = __commonJS2((exports, module) => {
    module.exports = Math.abs;
  });
  require_floor = __commonJS2((exports, module) => {
    module.exports = Math.floor;
  });
  require_max = __commonJS2((exports, module) => {
    module.exports = Math.max;
  });
  require_min = __commonJS2((exports, module) => {
    module.exports = Math.min;
  });
  require_pow = __commonJS2((exports, module) => {
    module.exports = Math.pow;
  });
  require_round = __commonJS2((exports, module) => {
    module.exports = Math.round;
  });
  require_isNaN = __commonJS2((exports, module) => {
    module.exports = Number.isNaN || function isNaN(a) {
      return a !== a;
    };
  });
  require_sign = __commonJS2((exports, module) => {
    var $isNaN = require_isNaN();
    module.exports = function sign(number) {
      if ($isNaN(number) || number === 0)
        return number;
      return number < 0 ? -1 : 1;
    };
  });
  require_gOPD = __commonJS2((exports, module) => {
    module.exports = Object.getOwnPropertyDescriptor;
  });
  require_gopd = __commonJS2((exports, module) => {
    var $gOPD = require_gOPD();
    if ($gOPD)
      try {
        $gOPD([], "length");
      } catch (e) {
        $gOPD = null;
      }
    module.exports = $gOPD;
  });
  require_es_define_property = __commonJS2((exports, module) => {
    var $defineProperty = Object.defineProperty || false;
    if ($defineProperty)
      try {
        $defineProperty({}, "a", { value: 1 });
      } catch (e) {
        $defineProperty = false;
      }
    module.exports = $defineProperty;
  });
  require_has_symbols = __commonJS2((exports, module) => {
    var origSymbol = typeof Symbol !== "undefined" && Symbol, hasSymbolSham = require_shams();
    module.exports = function hasNativeSymbols() {
      if (typeof origSymbol !== "function")
        return false;
      if (typeof Symbol !== "function")
        return false;
      if (typeof origSymbol("foo") !== "symbol")
        return false;
      if (typeof Symbol("bar") !== "symbol")
        return false;
      return hasSymbolSham();
    };
  });
  require_Reflect_getPrototypeOf = __commonJS2((exports, module) => {
    module.exports = typeof Reflect !== "undefined" && Reflect.getPrototypeOf || null;
  });
  require_Object_getPrototypeOf = __commonJS2((exports, module) => {
    var $Object = require_es_object_atoms();
    module.exports = $Object.getPrototypeOf || null;
  });
  require_implementation = __commonJS2((exports, module) => {
    var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ", toStr = Object.prototype.toString, max = Math.max, funcType = "[object Function]", concatty = function concatty(a, b) {
      var arr = [];
      for (var i = 0;i < a.length; i += 1)
        arr[i] = a[i];
      for (var j = 0;j < b.length; j += 1)
        arr[j + a.length] = b[j];
      return arr;
    }, slicy = function slicy(arrLike, offset) {
      var arr = [];
      for (var i = offset || 0, j = 0;i < arrLike.length; i += 1, j += 1)
        arr[j] = arrLike[i];
      return arr;
    }, joiny = function(arr, joiner) {
      var str = "";
      for (var i = 0;i < arr.length; i += 1)
        if (str += arr[i], i + 1 < arr.length)
          str += joiner;
      return str;
    };
    module.exports = function bind(that) {
      var target = this;
      if (typeof target !== "function" || toStr.apply(target) !== funcType)
        throw new TypeError(ERROR_MESSAGE + target);
      var args = slicy(arguments, 1), bound, binder = function() {
        if (this instanceof bound) {
          var result = target.apply(this, concatty(args, arguments));
          if (Object(result) === result)
            return result;
          return this;
        }
        return target.apply(that, concatty(args, arguments));
      }, boundLength = max(0, target.length - args.length), boundArgs = [];
      for (var i = 0;i < boundLength; i++)
        boundArgs[i] = "$" + i;
      if (bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder), target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype, bound.prototype = new Empty, Empty.prototype = null;
      }
      return bound;
    };
  });
  require_function_bind = __commonJS2((exports, module) => {
    var implementation = require_implementation();
    module.exports = Function.prototype.bind || implementation;
  });
  require_functionCall = __commonJS2((exports, module) => {
    module.exports = Function.prototype.call;
  });
  require_functionApply = __commonJS2((exports, module) => {
    module.exports = Function.prototype.apply;
  });
  require_reflectApply = __commonJS2((exports, module) => {
    module.exports = typeof Reflect !== "undefined" && Reflect && Reflect.apply;
  });
  require_actualApply = __commonJS2((exports, module) => {
    var bind = require_function_bind(), $apply = require_functionApply(), $call = require_functionCall(), $reflectApply = require_reflectApply();
    module.exports = $reflectApply || bind.call($call, $apply);
  });
  require_call_bind_apply_helpers = __commonJS2((exports, module) => {
    var bind = require_function_bind(), $TypeError = require_type(), $call = require_functionCall(), $actualApply = require_actualApply();
    module.exports = function callBindBasic(args) {
      if (args.length < 1 || typeof args[0] !== "function")
        throw new $TypeError("a function is required");
      return $actualApply(bind, $call, args);
    };
  });
  require_get = __commonJS2((exports, module) => {
    var callBind = require_call_bind_apply_helpers(), gOPD = require_gopd(), hasProtoAccessor;
    try {
      hasProtoAccessor = [].__proto__ === Array.prototype;
    } catch (e) {
      if (!e || typeof e !== "object" || !("code" in e) || e.code !== "ERR_PROTO_ACCESS")
        throw e;
    }
    var desc = !!hasProtoAccessor && gOPD && gOPD(Object.prototype, "__proto__"), $Object = Object, $getPrototypeOf = $Object.getPrototypeOf;
    module.exports = desc && typeof desc.get === "function" ? callBind([desc.get]) : typeof $getPrototypeOf === "function" ? function getDunder(value) {
      return $getPrototypeOf(value == null ? value : $Object(value));
    } : false;
  });
  require_get_proto = __commonJS2((exports, module) => {
    var reflectGetProto = require_Reflect_getPrototypeOf(), originalGetProto = require_Object_getPrototypeOf(), getDunderProto = require_get();
    module.exports = reflectGetProto ? function getProto(O) {
      return reflectGetProto(O);
    } : originalGetProto ? function getProto(O) {
      if (!O || typeof O !== "object" && typeof O !== "function")
        throw new TypeError("getProto: not an object");
      return originalGetProto(O);
    } : getDunderProto ? function getProto(O) {
      return getDunderProto(O);
    } : null;
  });
  require_hasown = __commonJS2((exports, module) => {
    var call = Function.prototype.call, $hasOwn = Object.prototype.hasOwnProperty, bind = require_function_bind();
    module.exports = bind.call(call, $hasOwn);
  });
  require_get_intrinsic = __commonJS2((exports, module) => {
    var undefined2, $Object = require_es_object_atoms(), $Error = require_es_errors(), $EvalError = require_eval(), $RangeError = require_range(), $ReferenceError = require_ref(), $SyntaxError = require_syntax(), $TypeError = require_type(), $URIError = require_uri(), abs = require_abs(), floor = require_floor(), max = require_max(), min = require_min(), pow = require_pow(), round = require_round(), sign = require_sign(), $Function = Function, getEvalledConstructor = function(expressionSyntax) {
      try {
        return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
      } catch (e) {}
    }, $gOPD = require_gopd(), $defineProperty = require_es_define_property(), throwTypeError = function() {
      throw new $TypeError;
    }, ThrowTypeError = $gOPD ? function() {
      try {
        return arguments.callee, throwTypeError;
      } catch (calleeThrows) {
        try {
          return $gOPD(arguments, "callee").get;
        } catch (gOPDthrows) {
          return throwTypeError;
        }
      }
    }() : throwTypeError, hasSymbols = require_has_symbols()(), getProto = require_get_proto(), $ObjectGPO = require_Object_getPrototypeOf(), $ReflectGPO = require_Reflect_getPrototypeOf(), $apply = require_functionApply(), $call = require_functionCall(), needsEval = {}, TypedArray = typeof Uint8Array === "undefined" || !getProto ? undefined2 : getProto(Uint8Array), INTRINSICS = { __proto__: null, "%AggregateError%": typeof AggregateError === "undefined" ? undefined2 : AggregateError, "%Array%": Array, "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined2 : ArrayBuffer, "%ArrayIteratorPrototype%": hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined2, "%AsyncFromSyncIteratorPrototype%": undefined2, "%AsyncFunction%": needsEval, "%AsyncGenerator%": needsEval, "%AsyncGeneratorFunction%": needsEval, "%AsyncIteratorPrototype%": needsEval, "%Atomics%": typeof Atomics === "undefined" ? undefined2 : Atomics, "%BigInt%": typeof BigInt === "undefined" ? undefined2 : BigInt, "%BigInt64Array%": typeof BigInt64Array === "undefined" ? undefined2 : BigInt64Array, "%BigUint64Array%": typeof BigUint64Array === "undefined" ? undefined2 : BigUint64Array, "%Boolean%": Boolean, "%DataView%": typeof DataView === "undefined" ? undefined2 : DataView, "%Date%": Date, "%decodeURI%": decodeURI, "%decodeURIComponent%": decodeURIComponent, "%encodeURI%": encodeURI, "%encodeURIComponent%": encodeURIComponent, "%Error%": $Error, "%eval%": eval, "%EvalError%": $EvalError, "%Float16Array%": typeof Float16Array === "undefined" ? undefined2 : Float16Array, "%Float32Array%": typeof Float32Array === "undefined" ? undefined2 : Float32Array, "%Float64Array%": typeof Float64Array === "undefined" ? undefined2 : Float64Array, "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined2 : FinalizationRegistry, "%Function%": $Function, "%GeneratorFunction%": needsEval, "%Int8Array%": typeof Int8Array === "undefined" ? undefined2 : Int8Array, "%Int16Array%": typeof Int16Array === "undefined" ? undefined2 : Int16Array, "%Int32Array%": typeof Int32Array === "undefined" ? undefined2 : Int32Array, "%isFinite%": isFinite, "%isNaN%": isNaN, "%IteratorPrototype%": hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined2, "%JSON%": typeof JSON === "object" ? JSON : undefined2, "%Map%": typeof Map === "undefined" ? undefined2 : Map, "%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto(new Map()[Symbol.iterator]()), "%Math%": Math, "%Number%": Number, "%Object%": $Object, "%Object.getOwnPropertyDescriptor%": $gOPD, "%parseFloat%": parseFloat, "%parseInt%": parseInt, "%Promise%": typeof Promise === "undefined" ? undefined2 : Promise, "%Proxy%": typeof Proxy === "undefined" ? undefined2 : Proxy, "%RangeError%": $RangeError, "%ReferenceError%": $ReferenceError, "%Reflect%": typeof Reflect === "undefined" ? undefined2 : Reflect, "%RegExp%": RegExp, "%Set%": typeof Set === "undefined" ? undefined2 : Set, "%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto(new Set()[Symbol.iterator]()), "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined2 : SharedArrayBuffer, "%String%": String, "%StringIteratorPrototype%": hasSymbols && getProto ? getProto(""[Symbol.iterator]()) : undefined2, "%Symbol%": hasSymbols ? Symbol : undefined2, "%SyntaxError%": $SyntaxError, "%ThrowTypeError%": ThrowTypeError, "%TypedArray%": TypedArray, "%TypeError%": $TypeError, "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined2 : Uint8Array, "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined2 : Uint8ClampedArray, "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined2 : Uint16Array, "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined2 : Uint32Array, "%URIError%": $URIError, "%WeakMap%": typeof WeakMap === "undefined" ? undefined2 : WeakMap, "%WeakRef%": typeof WeakRef === "undefined" ? undefined2 : WeakRef, "%WeakSet%": typeof WeakSet === "undefined" ? undefined2 : WeakSet, "%Function.prototype.call%": $call, "%Function.prototype.apply%": $apply, "%Object.defineProperty%": $defineProperty, "%Object.getPrototypeOf%": $ObjectGPO, "%Math.abs%": abs, "%Math.floor%": floor, "%Math.max%": max, "%Math.min%": min, "%Math.pow%": pow, "%Math.round%": round, "%Math.sign%": sign, "%Reflect.getPrototypeOf%": $ReflectGPO };
    if (getProto)
      try {
        null.error;
      } catch (e) {
        errorProto = getProto(getProto(e)), INTRINSICS["%Error.prototype%"] = errorProto;
      }
    var errorProto, doEval = function doEval(name) {
      var value;
      if (name === "%AsyncFunction%")
        value = getEvalledConstructor("async function () {}");
      else if (name === "%GeneratorFunction%")
        value = getEvalledConstructor("function* () {}");
      else if (name === "%AsyncGeneratorFunction%")
        value = getEvalledConstructor("async function* () {}");
      else if (name === "%AsyncGenerator%") {
        var fn = doEval("%AsyncGeneratorFunction%");
        if (fn)
          value = fn.prototype;
      } else if (name === "%AsyncIteratorPrototype%") {
        var gen = doEval("%AsyncGenerator%");
        if (gen && getProto)
          value = getProto(gen.prototype);
      }
      return INTRINSICS[name] = value, value;
    }, LEGACY_ALIASES = { __proto__: null, "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"], "%ArrayPrototype%": ["Array", "prototype"], "%ArrayProto_entries%": ["Array", "prototype", "entries"], "%ArrayProto_forEach%": ["Array", "prototype", "forEach"], "%ArrayProto_keys%": ["Array", "prototype", "keys"], "%ArrayProto_values%": ["Array", "prototype", "values"], "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"], "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"], "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"], "%BooleanPrototype%": ["Boolean", "prototype"], "%DataViewPrototype%": ["DataView", "prototype"], "%DatePrototype%": ["Date", "prototype"], "%ErrorPrototype%": ["Error", "prototype"], "%EvalErrorPrototype%": ["EvalError", "prototype"], "%Float32ArrayPrototype%": ["Float32Array", "prototype"], "%Float64ArrayPrototype%": ["Float64Array", "prototype"], "%FunctionPrototype%": ["Function", "prototype"], "%Generator%": ["GeneratorFunction", "prototype"], "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"], "%Int8ArrayPrototype%": ["Int8Array", "prototype"], "%Int16ArrayPrototype%": ["Int16Array", "prototype"], "%Int32ArrayPrototype%": ["Int32Array", "prototype"], "%JSONParse%": ["JSON", "parse"], "%JSONStringify%": ["JSON", "stringify"], "%MapPrototype%": ["Map", "prototype"], "%NumberPrototype%": ["Number", "prototype"], "%ObjectPrototype%": ["Object", "prototype"], "%ObjProto_toString%": ["Object", "prototype", "toString"], "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"], "%PromisePrototype%": ["Promise", "prototype"], "%PromiseProto_then%": ["Promise", "prototype", "then"], "%Promise_all%": ["Promise", "all"], "%Promise_reject%": ["Promise", "reject"], "%Promise_resolve%": ["Promise", "resolve"], "%RangeErrorPrototype%": ["RangeError", "prototype"], "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"], "%RegExpPrototype%": ["RegExp", "prototype"], "%SetPrototype%": ["Set", "prototype"], "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"], "%StringPrototype%": ["String", "prototype"], "%SymbolPrototype%": ["Symbol", "prototype"], "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"], "%TypedArrayPrototype%": ["TypedArray", "prototype"], "%TypeErrorPrototype%": ["TypeError", "prototype"], "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"], "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"], "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"], "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"], "%URIErrorPrototype%": ["URIError", "prototype"], "%WeakMapPrototype%": ["WeakMap", "prototype"], "%WeakSetPrototype%": ["WeakSet", "prototype"] }, bind = require_function_bind(), hasOwn = require_hasown(), $concat = bind.call($call, Array.prototype.concat), $spliceApply = bind.call($apply, Array.prototype.splice), $replace = bind.call($call, String.prototype.replace), $strSlice = bind.call($call, String.prototype.slice), $exec = bind.call($call, RegExp.prototype.exec), rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, reEscapeChar = /\\(\\)?/g, stringToPath = function stringToPath(string) {
      var first = $strSlice(string, 0, 1), last = $strSlice(string, -1);
      if (first === "%" && last !== "%")
        throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
      else if (last === "%" && first !== "%")
        throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
      var result = [];
      return $replace(string, rePropName, function(match, number, quote, subString) {
        result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number || match;
      }), result;
    }, getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
      var intrinsicName = name, alias;
      if (hasOwn(LEGACY_ALIASES, intrinsicName))
        alias = LEGACY_ALIASES[intrinsicName], intrinsicName = "%" + alias[0] + "%";
      if (hasOwn(INTRINSICS, intrinsicName)) {
        var value = INTRINSICS[intrinsicName];
        if (value === needsEval)
          value = doEval(intrinsicName);
        if (typeof value === "undefined" && !allowMissing)
          throw new $TypeError("intrinsic " + name + " exists, but is not available. Please file an issue!");
        return { alias, name: intrinsicName, value };
      }
      throw new $SyntaxError("intrinsic " + name + " does not exist!");
    };
    module.exports = function GetIntrinsic(name, allowMissing) {
      if (typeof name !== "string" || name.length === 0)
        throw new $TypeError("intrinsic name must be a non-empty string");
      if (arguments.length > 1 && typeof allowMissing !== "boolean")
        throw new $TypeError('"allowMissing" argument must be a boolean');
      if ($exec(/^%?[^%]*%?$/, name) === null)
        throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
      var parts = stringToPath(name), intrinsicBaseName = parts.length > 0 ? parts[0] : "", intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing), intrinsicRealName = intrinsic.name, value = intrinsic.value, skipFurtherCaching = false, alias = intrinsic.alias;
      if (alias)
        intrinsicBaseName = alias[0], $spliceApply(parts, $concat([0, 1], alias));
      for (var i = 1, isOwn = true;i < parts.length; i += 1) {
        var part = parts[i], first = $strSlice(part, 0, 1), last = $strSlice(part, -1);
        if ((first === '"' || first === "'" || first === "`" || (last === '"' || last === "'" || last === "`")) && first !== last)
          throw new $SyntaxError("property names with quotes must have matching quotes");
        if (part === "constructor" || !isOwn)
          skipFurtherCaching = true;
        if (intrinsicBaseName += "." + part, intrinsicRealName = "%" + intrinsicBaseName + "%", hasOwn(INTRINSICS, intrinsicRealName))
          value = INTRINSICS[intrinsicRealName];
        else if (value != null) {
          if (!(part in value)) {
            if (!allowMissing)
              throw new $TypeError("base intrinsic for " + name + " exists, but the property is not available.");
            return;
          }
          if ($gOPD && i + 1 >= parts.length) {
            var desc = $gOPD(value, part);
            if (isOwn = !!desc, isOwn && "get" in desc && !("originalValue" in desc.get))
              value = desc.get;
            else
              value = value[part];
          } else
            isOwn = hasOwn(value, part), value = value[part];
          if (isOwn && !skipFurtherCaching)
            INTRINSICS[intrinsicRealName] = value;
        }
      }
      return value;
    };
  });
  require_call_bound = __commonJS2((exports, module) => {
    var GetIntrinsic = require_get_intrinsic(), callBindBasic = require_call_bind_apply_helpers(), $indexOf = callBindBasic([GetIntrinsic("%String.prototype.indexOf%")]);
    module.exports = function callBoundIntrinsic(name, allowMissing) {
      var intrinsic = GetIntrinsic(name, !!allowMissing);
      if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1)
        return callBindBasic([intrinsic]);
      return intrinsic;
    };
  });
  require_is_arguments = __commonJS2((exports, module) => {
    var hasToStringTag = require_shams2()(), callBound = require_call_bound(), $toString = callBound("Object.prototype.toString"), isStandardArguments = function isArguments(value) {
      if (hasToStringTag && value && typeof value === "object" && Symbol.toStringTag in value)
        return false;
      return $toString(value) === "[object Arguments]";
    }, isLegacyArguments = function isArguments(value) {
      if (isStandardArguments(value))
        return true;
      return value !== null && typeof value === "object" && "length" in value && typeof value.length === "number" && value.length >= 0 && $toString(value) !== "[object Array]" && "callee" in value && $toString(value.callee) === "[object Function]";
    }, supportsStandardArguments = function() {
      return isStandardArguments(arguments);
    }();
    isStandardArguments.isLegacyArguments = isLegacyArguments;
    module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;
  });
  require_is_regex = __commonJS2((exports, module) => {
    var callBound = require_call_bound(), hasToStringTag = require_shams2()(), hasOwn = require_hasown(), gOPD = require_gopd(), fn;
    if (hasToStringTag) {
      if ($exec = callBound("RegExp.prototype.exec"), isRegexMarker = {}, throwRegexMarker = function() {
        throw isRegexMarker;
      }, badStringifier = { toString: throwRegexMarker, valueOf: throwRegexMarker }, typeof Symbol.toPrimitive === "symbol")
        badStringifier[Symbol.toPrimitive] = throwRegexMarker;
      fn = function isRegex(value) {
        if (!value || typeof value !== "object")
          return false;
        var descriptor = gOPD(value, "lastIndex"), hasLastIndexDataProperty = descriptor && hasOwn(descriptor, "value");
        if (!hasLastIndexDataProperty)
          return false;
        try {
          $exec(value, badStringifier);
        } catch (e) {
          return e === isRegexMarker;
        }
      };
    } else
      $toString = callBound("Object.prototype.toString"), regexClass = "[object RegExp]", fn = function isRegex(value) {
        if (!value || typeof value !== "object" && typeof value !== "function")
          return false;
        return $toString(value) === regexClass;
      };
    var $exec, isRegexMarker, throwRegexMarker, badStringifier, $toString, regexClass;
    module.exports = fn;
  });
  require_safe_regex_test = __commonJS2((exports, module) => {
    var callBound = require_call_bound(), isRegex = require_is_regex(), $exec = callBound("RegExp.prototype.exec"), $TypeError = require_type();
    module.exports = function regexTester(regex) {
      if (!isRegex(regex))
        throw new $TypeError("`regex` must be a RegExp");
      return function test(s) {
        return $exec(regex, s) !== null;
      };
    };
  });
  require_is_generator_function = __commonJS2((exports, module) => {
    var callBound = require_call_bound(), safeRegexTest = require_safe_regex_test(), isFnRegex = safeRegexTest(/^\s*(?:function)?\*/), hasToStringTag = require_shams2()(), getProto = require_get_proto(), toStr = callBound("Object.prototype.toString"), fnToStr = callBound("Function.prototype.toString"), getGeneratorFunc = function() {
      if (!hasToStringTag)
        return false;
      try {
        return Function("return function*() {}")();
      } catch (e) {}
    }, GeneratorFunction;
    module.exports = function isGeneratorFunction(fn) {
      if (typeof fn !== "function")
        return false;
      if (isFnRegex(fnToStr(fn)))
        return true;
      if (!hasToStringTag) {
        var str = toStr(fn);
        return str === "[object GeneratorFunction]";
      }
      if (!getProto)
        return false;
      if (typeof GeneratorFunction === "undefined") {
        var generatorFunc = getGeneratorFunc();
        GeneratorFunction = generatorFunc ? getProto(generatorFunc) : false;
      }
      return getProto(fn) === GeneratorFunction;
    };
  });
  require_is_callable = __commonJS2((exports, module) => {
    var fnToStr = Function.prototype.toString, reflectApply = typeof Reflect === "object" && Reflect !== null && Reflect.apply, badArrayLike, isCallableMarker;
    if (typeof reflectApply === "function" && typeof Object.defineProperty === "function")
      try {
        badArrayLike = Object.defineProperty({}, "length", { get: function() {
          throw isCallableMarker;
        } }), isCallableMarker = {}, reflectApply(function() {
          throw 42;
        }, null, badArrayLike);
      } catch (_) {
        if (_ !== isCallableMarker)
          reflectApply = null;
      }
    else
      reflectApply = null;
    var constructorRegex = /^\s*class\b/, isES6ClassFn = function isES6ClassFunction(value) {
      try {
        var fnStr = fnToStr.call(value);
        return constructorRegex.test(fnStr);
      } catch (e) {
        return false;
      }
    }, tryFunctionObject = function tryFunctionToStr(value) {
      try {
        if (isES6ClassFn(value))
          return false;
        return fnToStr.call(value), true;
      } catch (e) {
        return false;
      }
    }, toStr = Object.prototype.toString, objectClass = "[object Object]", fnClass = "[object Function]", genClass = "[object GeneratorFunction]", ddaClass = "[object HTMLAllCollection]", ddaClass2 = "[object HTML document.all class]", ddaClass3 = "[object HTMLCollection]", hasToStringTag = typeof Symbol === "function" && !!Symbol.toStringTag, isIE68 = !(0 in [,]), isDDA = function isDocumentDotAll() {
      return false;
    };
    if (typeof document === "object") {
      if (all = document.all, toStr.call(all) === toStr.call(document.all))
        isDDA = function isDocumentDotAll(value) {
          if ((isIE68 || !value) && (typeof value === "undefined" || typeof value === "object"))
            try {
              var str = toStr.call(value);
              return (str === ddaClass || str === ddaClass2 || str === ddaClass3 || str === objectClass) && value("") == null;
            } catch (e) {}
          return false;
        };
    }
    var all;
    module.exports = reflectApply ? function isCallable(value) {
      if (isDDA(value))
        return true;
      if (!value)
        return false;
      if (typeof value !== "function" && typeof value !== "object")
        return false;
      try {
        reflectApply(value, null, badArrayLike);
      } catch (e) {
        if (e !== isCallableMarker)
          return false;
      }
      return !isES6ClassFn(value) && tryFunctionObject(value);
    } : function isCallable(value) {
      if (isDDA(value))
        return true;
      if (!value)
        return false;
      if (typeof value !== "function" && typeof value !== "object")
        return false;
      if (hasToStringTag)
        return tryFunctionObject(value);
      if (isES6ClassFn(value))
        return false;
      var strClass = toStr.call(value);
      if (strClass !== fnClass && strClass !== genClass && !/^\[object HTML/.test(strClass))
        return false;
      return tryFunctionObject(value);
    };
  });
  require_for_each = __commonJS2((exports, module) => {
    var isCallable = require_is_callable(), toStr = Object.prototype.toString, hasOwnProperty2 = Object.prototype.hasOwnProperty, forEachArray = function forEachArray(array, iterator, receiver) {
      for (var i = 0, len = array.length;i < len; i++)
        if (hasOwnProperty2.call(array, i))
          if (receiver == null)
            iterator(array[i], i, array);
          else
            iterator.call(receiver, array[i], i, array);
    }, forEachString = function forEachString(string, iterator, receiver) {
      for (var i = 0, len = string.length;i < len; i++)
        if (receiver == null)
          iterator(string.charAt(i), i, string);
        else
          iterator.call(receiver, string.charAt(i), i, string);
    }, forEachObject = function forEachObject(object, iterator, receiver) {
      for (var k in object)
        if (hasOwnProperty2.call(object, k))
          if (receiver == null)
            iterator(object[k], k, object);
          else
            iterator.call(receiver, object[k], k, object);
    };
    function isArray2(x) {
      return toStr.call(x) === "[object Array]";
    }
    module.exports = function forEach(list, iterator, thisArg) {
      if (!isCallable(iterator))
        throw new TypeError("iterator must be a function");
      var receiver;
      if (arguments.length >= 3)
        receiver = thisArg;
      if (isArray2(list))
        forEachArray(list, iterator, receiver);
      else if (typeof list === "string")
        forEachString(list, iterator, receiver);
      else
        forEachObject(list, iterator, receiver);
    };
  });
  require_possible_typed_array_names = __commonJS2((exports, module) => {
    module.exports = ["Float16Array", "Float32Array", "Float64Array", "Int8Array", "Int16Array", "Int32Array", "Uint8Array", "Uint8ClampedArray", "Uint16Array", "Uint32Array", "BigInt64Array", "BigUint64Array"];
  });
  require_available_typed_arrays = __commonJS2((exports, module) => {
    var possibleNames = require_possible_typed_array_names(), g = typeof globalThis === "undefined" ? global : globalThis;
    module.exports = function availableTypedArrays() {
      var out = [];
      for (var i = 0;i < possibleNames.length; i++)
        if (typeof g[possibleNames[i]] === "function")
          out[out.length] = possibleNames[i];
      return out;
    };
  });
  require_define_data_property = __commonJS2((exports, module) => {
    var $defineProperty = require_es_define_property(), $SyntaxError = require_syntax(), $TypeError = require_type(), gopd = require_gopd();
    module.exports = function defineDataProperty(obj, property, value) {
      if (!obj || typeof obj !== "object" && typeof obj !== "function")
        throw new $TypeError("`obj` must be an object or a function`");
      if (typeof property !== "string" && typeof property !== "symbol")
        throw new $TypeError("`property` must be a string or a symbol`");
      if (arguments.length > 3 && typeof arguments[3] !== "boolean" && arguments[3] !== null)
        throw new $TypeError("`nonEnumerable`, if provided, must be a boolean or null");
      if (arguments.length > 4 && typeof arguments[4] !== "boolean" && arguments[4] !== null)
        throw new $TypeError("`nonWritable`, if provided, must be a boolean or null");
      if (arguments.length > 5 && typeof arguments[5] !== "boolean" && arguments[5] !== null)
        throw new $TypeError("`nonConfigurable`, if provided, must be a boolean or null");
      if (arguments.length > 6 && typeof arguments[6] !== "boolean")
        throw new $TypeError("`loose`, if provided, must be a boolean");
      var nonEnumerable = arguments.length > 3 ? arguments[3] : null, nonWritable = arguments.length > 4 ? arguments[4] : null, nonConfigurable = arguments.length > 5 ? arguments[5] : null, loose = arguments.length > 6 ? arguments[6] : false, desc = !!gopd && gopd(obj, property);
      if ($defineProperty)
        $defineProperty(obj, property, { configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable, enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable, value, writable: nonWritable === null && desc ? desc.writable : !nonWritable });
      else if (loose || !nonEnumerable && !nonWritable && !nonConfigurable)
        obj[property] = value;
      else
        throw new $SyntaxError("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
    };
  });
  require_has_property_descriptors = __commonJS2((exports, module) => {
    var $defineProperty = require_es_define_property(), hasPropertyDescriptors = function hasPropertyDescriptors() {
      return !!$defineProperty;
    };
    hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
      if (!$defineProperty)
        return null;
      try {
        return $defineProperty([], "length", { value: 1 }).length !== 1;
      } catch (e) {
        return true;
      }
    };
    module.exports = hasPropertyDescriptors;
  });
  require_set_function_length = __commonJS2((exports, module) => {
    var GetIntrinsic = require_get_intrinsic(), define = require_define_data_property(), hasDescriptors = require_has_property_descriptors()(), gOPD = require_gopd(), $TypeError = require_type(), $floor = GetIntrinsic("%Math.floor%");
    module.exports = function setFunctionLength(fn, length) {
      if (typeof fn !== "function")
        throw new $TypeError("`fn` is not a function");
      if (typeof length !== "number" || length < 0 || length > 4294967295 || $floor(length) !== length)
        throw new $TypeError("`length` must be a positive 32-bit integer");
      var loose = arguments.length > 2 && !!arguments[2], functionLengthIsConfigurable = true, functionLengthIsWritable = true;
      if ("length" in fn && gOPD) {
        var desc = gOPD(fn, "length");
        if (desc && !desc.configurable)
          functionLengthIsConfigurable = false;
        if (desc && !desc.writable)
          functionLengthIsWritable = false;
      }
      if (functionLengthIsConfigurable || functionLengthIsWritable || !loose)
        if (hasDescriptors)
          define(fn, "length", length, true, true);
        else
          define(fn, "length", length);
      return fn;
    };
  });
  require_applyBind = __commonJS2((exports, module) => {
    var bind = require_function_bind(), $apply = require_functionApply(), actualApply = require_actualApply();
    module.exports = function applyBind() {
      return actualApply(bind, $apply, arguments);
    };
  });
  require_call_bind = __commonJS2((exports, module) => {
    var setFunctionLength = require_set_function_length(), $defineProperty = require_es_define_property(), callBindBasic = require_call_bind_apply_helpers(), applyBind = require_applyBind();
    module.exports = function callBind(originalFunction) {
      var func = callBindBasic(arguments), adjustedLength = originalFunction.length - (arguments.length - 1);
      return setFunctionLength(func, 1 + (adjustedLength > 0 ? adjustedLength : 0), true);
    };
    if ($defineProperty)
      $defineProperty(module.exports, "apply", { value: applyBind });
    else
      module.exports.apply = applyBind;
  });
  require_which_typed_array = __commonJS2((exports, module) => {
    var forEach = require_for_each(), availableTypedArrays = require_available_typed_arrays(), callBind = require_call_bind(), callBound = require_call_bound(), gOPD = require_gopd(), getProto = require_get_proto(), $toString = callBound("Object.prototype.toString"), hasToStringTag = require_shams2()(), g = typeof globalThis === "undefined" ? global : globalThis, typedArrays = availableTypedArrays(), $slice = callBound("String.prototype.slice"), $indexOf = callBound("Array.prototype.indexOf", true) || function indexOf(array, value) {
      for (var i = 0;i < array.length; i += 1)
        if (array[i] === value)
          return i;
      return -1;
    }, cache = { __proto__: null };
    if (hasToStringTag && gOPD && getProto)
      forEach(typedArrays, function(typedArray) {
        var arr = new g[typedArray];
        if (Symbol.toStringTag in arr && getProto) {
          var proto = getProto(arr), descriptor = gOPD(proto, Symbol.toStringTag);
          if (!descriptor && proto) {
            var superProto = getProto(proto);
            descriptor = gOPD(superProto, Symbol.toStringTag);
          }
          cache["$" + typedArray] = callBind(descriptor.get);
        }
      });
    else
      forEach(typedArrays, function(typedArray) {
        var arr = new g[typedArray], fn = arr.slice || arr.set;
        if (fn)
          cache["$" + typedArray] = callBind(fn);
      });
    var tryTypedArrays = function tryAllTypedArrays(value) {
      var found = false;
      return forEach(cache, function(getter, typedArray) {
        if (!found)
          try {
            if ("$" + getter(value) === typedArray)
              found = $slice(typedArray, 1);
          } catch (e) {}
      }), found;
    }, trySlices = function tryAllSlices(value) {
      var found = false;
      return forEach(cache, function(getter, name) {
        if (!found)
          try {
            getter(value), found = $slice(name, 1);
          } catch (e) {}
      }), found;
    };
    module.exports = function whichTypedArray(value) {
      if (!value || typeof value !== "object")
        return false;
      if (!hasToStringTag) {
        var tag = $slice($toString(value), 8, -1);
        if ($indexOf(typedArrays, tag) > -1)
          return tag;
        if (tag !== "Object")
          return false;
        return trySlices(value);
      }
      if (!gOPD)
        return null;
      return tryTypedArrays(value);
    };
  });
  require_is_typed_array = __commonJS2((exports, module) => {
    var whichTypedArray = require_which_typed_array();
    module.exports = function isTypedArray(value) {
      return !!whichTypedArray(value);
    };
  });
  require_types = __commonJS2((exports) => {
    var isArgumentsObject = require_is_arguments(), isGeneratorFunction = require_is_generator_function(), whichTypedArray = require_which_typed_array(), isTypedArray = require_is_typed_array();
    function uncurryThis(f) {
      return f.call.bind(f);
    }
    var BigIntSupported = typeof BigInt !== "undefined", SymbolSupported = typeof Symbol !== "undefined", ObjectToString = uncurryThis(Object.prototype.toString), numberValue = uncurryThis(Number.prototype.valueOf), stringValue = uncurryThis(String.prototype.valueOf), booleanValue = uncurryThis(Boolean.prototype.valueOf);
    if (BigIntSupported)
      bigIntValue = uncurryThis(BigInt.prototype.valueOf);
    var bigIntValue;
    if (SymbolSupported)
      symbolValue = uncurryThis(Symbol.prototype.valueOf);
    var symbolValue;
    function checkBoxedPrimitive(value, prototypeValueOf) {
      if (typeof value !== "object")
        return false;
      try {
        return prototypeValueOf(value), true;
      } catch (e) {
        return false;
      }
    }
    exports.isArgumentsObject = isArgumentsObject;
    exports.isGeneratorFunction = isGeneratorFunction;
    exports.isTypedArray = isTypedArray;
    function isPromise(input) {
      return typeof Promise !== "undefined" && input instanceof Promise || input !== null && typeof input === "object" && typeof input.then === "function" && typeof input.catch === "function";
    }
    exports.isPromise = isPromise;
    function isArrayBufferView(value) {
      if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView)
        return ArrayBuffer.isView(value);
      return isTypedArray(value) || isDataView(value);
    }
    exports.isArrayBufferView = isArrayBufferView;
    function isUint8Array(value) {
      return whichTypedArray(value) === "Uint8Array";
    }
    exports.isUint8Array = isUint8Array;
    function isUint8ClampedArray(value) {
      return whichTypedArray(value) === "Uint8ClampedArray";
    }
    exports.isUint8ClampedArray = isUint8ClampedArray;
    function isUint16Array(value) {
      return whichTypedArray(value) === "Uint16Array";
    }
    exports.isUint16Array = isUint16Array;
    function isUint32Array(value) {
      return whichTypedArray(value) === "Uint32Array";
    }
    exports.isUint32Array = isUint32Array;
    function isInt8Array(value) {
      return whichTypedArray(value) === "Int8Array";
    }
    exports.isInt8Array = isInt8Array;
    function isInt16Array(value) {
      return whichTypedArray(value) === "Int16Array";
    }
    exports.isInt16Array = isInt16Array;
    function isInt32Array(value) {
      return whichTypedArray(value) === "Int32Array";
    }
    exports.isInt32Array = isInt32Array;
    function isFloat32Array(value) {
      return whichTypedArray(value) === "Float32Array";
    }
    exports.isFloat32Array = isFloat32Array;
    function isFloat64Array(value) {
      return whichTypedArray(value) === "Float64Array";
    }
    exports.isFloat64Array = isFloat64Array;
    function isBigInt64Array(value) {
      return whichTypedArray(value) === "BigInt64Array";
    }
    exports.isBigInt64Array = isBigInt64Array;
    function isBigUint64Array(value) {
      return whichTypedArray(value) === "BigUint64Array";
    }
    exports.isBigUint64Array = isBigUint64Array;
    function isMapToString(value) {
      return ObjectToString(value) === "[object Map]";
    }
    isMapToString.working = typeof Map !== "undefined" && isMapToString(new Map);
    function isMap(value) {
      if (typeof Map === "undefined")
        return false;
      return isMapToString.working ? isMapToString(value) : value instanceof Map;
    }
    exports.isMap = isMap;
    function isSetToString(value) {
      return ObjectToString(value) === "[object Set]";
    }
    isSetToString.working = typeof Set !== "undefined" && isSetToString(new Set);
    function isSet(value) {
      if (typeof Set === "undefined")
        return false;
      return isSetToString.working ? isSetToString(value) : value instanceof Set;
    }
    exports.isSet = isSet;
    function isWeakMapToString(value) {
      return ObjectToString(value) === "[object WeakMap]";
    }
    isWeakMapToString.working = typeof WeakMap !== "undefined" && isWeakMapToString(new WeakMap);
    function isWeakMap(value) {
      if (typeof WeakMap === "undefined")
        return false;
      return isWeakMapToString.working ? isWeakMapToString(value) : value instanceof WeakMap;
    }
    exports.isWeakMap = isWeakMap;
    function isWeakSetToString(value) {
      return ObjectToString(value) === "[object WeakSet]";
    }
    isWeakSetToString.working = typeof WeakSet !== "undefined" && isWeakSetToString(new WeakSet);
    function isWeakSet(value) {
      return isWeakSetToString(value);
    }
    exports.isWeakSet = isWeakSet;
    function isArrayBufferToString(value) {
      return ObjectToString(value) === "[object ArrayBuffer]";
    }
    isArrayBufferToString.working = typeof ArrayBuffer !== "undefined" && isArrayBufferToString(new ArrayBuffer);
    function isArrayBuffer(value) {
      if (typeof ArrayBuffer === "undefined")
        return false;
      return isArrayBufferToString.working ? isArrayBufferToString(value) : value instanceof ArrayBuffer;
    }
    exports.isArrayBuffer = isArrayBuffer;
    function isDataViewToString(value) {
      return ObjectToString(value) === "[object DataView]";
    }
    isDataViewToString.working = typeof ArrayBuffer !== "undefined" && typeof DataView !== "undefined" && isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1));
    function isDataView(value) {
      if (typeof DataView === "undefined")
        return false;
      return isDataViewToString.working ? isDataViewToString(value) : value instanceof DataView;
    }
    exports.isDataView = isDataView;
    var SharedArrayBufferCopy = typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : undefined;
    function isSharedArrayBufferToString(value) {
      return ObjectToString(value) === "[object SharedArrayBuffer]";
    }
    function isSharedArrayBuffer(value) {
      if (typeof SharedArrayBufferCopy === "undefined")
        return false;
      if (typeof isSharedArrayBufferToString.working === "undefined")
        isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy);
      return isSharedArrayBufferToString.working ? isSharedArrayBufferToString(value) : value instanceof SharedArrayBufferCopy;
    }
    exports.isSharedArrayBuffer = isSharedArrayBuffer;
    function isAsyncFunction(value) {
      return ObjectToString(value) === "[object AsyncFunction]";
    }
    exports.isAsyncFunction = isAsyncFunction;
    function isMapIterator(value) {
      return ObjectToString(value) === "[object Map Iterator]";
    }
    exports.isMapIterator = isMapIterator;
    function isSetIterator(value) {
      return ObjectToString(value) === "[object Set Iterator]";
    }
    exports.isSetIterator = isSetIterator;
    function isGeneratorObject(value) {
      return ObjectToString(value) === "[object Generator]";
    }
    exports.isGeneratorObject = isGeneratorObject;
    function isWebAssemblyCompiledModule(value) {
      return ObjectToString(value) === "[object WebAssembly.Module]";
    }
    exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;
    function isNumberObject(value) {
      return checkBoxedPrimitive(value, numberValue);
    }
    exports.isNumberObject = isNumberObject;
    function isStringObject(value) {
      return checkBoxedPrimitive(value, stringValue);
    }
    exports.isStringObject = isStringObject;
    function isBooleanObject(value) {
      return checkBoxedPrimitive(value, booleanValue);
    }
    exports.isBooleanObject = isBooleanObject;
    function isBigIntObject(value) {
      return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
    }
    exports.isBigIntObject = isBigIntObject;
    function isSymbolObject(value) {
      return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
    }
    exports.isSymbolObject = isSymbolObject;
    function isBoxedPrimitive(value) {
      return isNumberObject(value) || isStringObject(value) || isBooleanObject(value) || isBigIntObject(value) || isSymbolObject(value);
    }
    exports.isBoxedPrimitive = isBoxedPrimitive;
    function isAnyArrayBuffer(value) {
      return typeof Uint8Array !== "undefined" && (isArrayBuffer(value) || isSharedArrayBuffer(value));
    }
    exports.isAnyArrayBuffer = isAnyArrayBuffer;
    ["isProxy", "isExternal", "isModuleNamespaceObject"].forEach(function(method) {
      Object.defineProperty(exports, method, { enumerable: false, value: function() {
        throw new Error(method + " is not supported in userland");
      } });
    });
  });
  require_isBuffer = __commonJS2((exports, module) => {
    module.exports = function isBuffer(arg) {
      return arg instanceof Buffer;
    };
  });
  require_inherits_browser = __commonJS2((exports, module) => {
    if (typeof Object.create === "function")
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor)
          ctor.super_ = superCtor, ctor.prototype = Object.create(superCtor.prototype, { constructor: { value: ctor, enumerable: false, writable: true, configurable: true } });
      };
    else
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {};
          TempCtor.prototype = superCtor.prototype, ctor.prototype = new TempCtor, ctor.prototype.constructor = ctor;
        }
      };
  });
  require_inherits = __commonJS2((exports, module) => {
    try {
      if (util = (init_util(), __toCommonJS(exports_util)), typeof util.inherits !== "function")
        throw "";
      module.exports = util.inherits;
    } catch (e) {
      module.exports = require_inherits_browser();
    }
    var util;
  });
  require_util = __commonJS2((exports) => {
    var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors(obj) {
      var keys = Object.keys(obj), descriptors = {};
      for (var i = 0;i < keys.length; i++)
        descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
      return descriptors;
    }, formatRegExp2 = /%[sdj%]/g;
    exports.format = function(f) {
      if (!isString2(f)) {
        var objects = [];
        for (var i = 0;i < arguments.length; i++)
          objects.push(inspect3(arguments[i]));
        return objects.join(" ");
      }
      var i = 1, args = arguments, len = args.length, str = String(f).replace(formatRegExp2, function(x2) {
        if (x2 === "%%")
          return "%";
        if (i >= len)
          return x2;
        switch (x2) {
          case "%s":
            return String(args[i++]);
          case "%d":
            return Number(args[i++]);
          case "%j":
            try {
              return JSON.stringify(args[i++]);
            } catch (_) {
              return "[Circular]";
            }
          default:
            return x2;
        }
      });
      for (var x = args[i];i < len; x = args[++i])
        if (isNull2(x) || !isObject2(x))
          str += " " + x;
        else
          str += " " + inspect3(x);
      return str;
    };
    exports.deprecate = function(fn, msg) {
      if (typeof process !== "undefined" && process.noDeprecation === true)
        return fn;
      if (typeof process === "undefined")
        return function() {
          return exports.deprecate(fn, msg).apply(this, arguments);
        };
      var warned = false;
      function deprecated() {
        if (!warned) {
          if (process.throwDeprecation)
            throw new Error(msg);
          else if (process.traceDeprecation)
            console.trace(msg);
          else
            console.error(msg);
          warned = true;
        }
        return fn.apply(this, arguments);
      }
      return deprecated;
    };
    var debugs = {}, debugEnvRegex = /^$/;
    if (process.env.NODE_DEBUG)
      debugEnv = process.env.NODE_DEBUG, debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^").toUpperCase(), debugEnvRegex = new RegExp("^" + debugEnv + "$", "i");
    var debugEnv;
    exports.debuglog = function(set) {
      if (set = set.toUpperCase(), !debugs[set])
        if (debugEnvRegex.test(set)) {
          var pid2 = process.pid;
          debugs[set] = function() {
            var msg = exports.format.apply(exports, arguments);
            console.error("%s %d: %s", set, pid2, msg);
          };
        } else
          debugs[set] = function() {};
      return debugs[set];
    };
    function inspect3(obj, opts) {
      var ctx = { seen: [], stylize: stylizeNoColor2 };
      if (arguments.length >= 3)
        ctx.depth = arguments[2];
      if (arguments.length >= 4)
        ctx.colors = arguments[3];
      if (isBoolean2(opts))
        ctx.showHidden = opts;
      else if (opts)
        exports._extend(ctx, opts);
      if (isUndefined2(ctx.showHidden))
        ctx.showHidden = false;
      if (isUndefined2(ctx.depth))
        ctx.depth = 2;
      if (isUndefined2(ctx.colors))
        ctx.colors = false;
      if (isUndefined2(ctx.customInspect))
        ctx.customInspect = true;
      if (ctx.colors)
        ctx.stylize = stylizeWithColor2;
      return formatValue2(ctx, obj, ctx.depth);
    }
    exports.inspect = inspect3;
    inspect3.colors = { bold: [1, 22], italic: [3, 23], underline: [4, 24], inverse: [7, 27], white: [37, 39], grey: [90, 39], black: [30, 39], blue: [34, 39], cyan: [36, 39], green: [32, 39], magenta: [35, 39], red: [31, 39], yellow: [33, 39] };
    inspect3.styles = { special: "cyan", number: "yellow", boolean: "yellow", undefined: "grey", null: "bold", string: "green", date: "magenta", regexp: "red" };
    function stylizeWithColor2(str, styleType) {
      var style = inspect3.styles[styleType];
      if (style)
        return "\x1B[" + inspect3.colors[style][0] + "m" + str + "\x1B[" + inspect3.colors[style][1] + "m";
      else
        return str;
    }
    function stylizeNoColor2(str, styleType) {
      return str;
    }
    function arrayToHash2(array) {
      var hash = {};
      return array.forEach(function(val, idx) {
        hash[val] = true;
      }), hash;
    }
    function formatValue2(ctx, value, recurseTimes) {
      if (ctx.customInspect && value && isFunction2(value.inspect) && value.inspect !== exports.inspect && !(value.constructor && value.constructor.prototype === value)) {
        var ret = value.inspect(recurseTimes, ctx);
        if (!isString2(ret))
          ret = formatValue2(ctx, ret, recurseTimes);
        return ret;
      }
      var primitive = formatPrimitive2(ctx, value);
      if (primitive)
        return primitive;
      var keys = Object.keys(value), visibleKeys = arrayToHash2(keys);
      if (ctx.showHidden)
        keys = Object.getOwnPropertyNames(value);
      if (isError2(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0))
        return formatError2(value);
      if (keys.length === 0) {
        if (isFunction2(value)) {
          var name = value.name ? ": " + value.name : "";
          return ctx.stylize("[Function" + name + "]", "special");
        }
        if (isRegExp2(value))
          return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
        if (isDate2(value))
          return ctx.stylize(Date.prototype.toString.call(value), "date");
        if (isError2(value))
          return formatError2(value);
      }
      var base = "", array = false, braces = ["{", "}"];
      if (isArray2(value))
        array = true, braces = ["[", "]"];
      if (isFunction2(value)) {
        var n = value.name ? ": " + value.name : "";
        base = " [Function" + n + "]";
      }
      if (isRegExp2(value))
        base = " " + RegExp.prototype.toString.call(value);
      if (isDate2(value))
        base = " " + Date.prototype.toUTCString.call(value);
      if (isError2(value))
        base = " " + formatError2(value);
      if (keys.length === 0 && (!array || value.length == 0))
        return braces[0] + base + braces[1];
      if (recurseTimes < 0)
        if (isRegExp2(value))
          return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
        else
          return ctx.stylize("[Object]", "special");
      ctx.seen.push(value);
      var output;
      if (array)
        output = formatArray2(ctx, value, recurseTimes, visibleKeys, keys);
      else
        output = keys.map(function(key) {
          return formatProperty2(ctx, value, recurseTimes, visibleKeys, key, array);
        });
      return ctx.seen.pop(), reduceToSingleString2(output, base, braces);
    }
    function formatPrimitive2(ctx, value) {
      if (isUndefined2(value))
        return ctx.stylize("undefined", "undefined");
      if (isString2(value)) {
        var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
        return ctx.stylize(simple, "string");
      }
      if (isNumber2(value))
        return ctx.stylize("" + value, "number");
      if (isBoolean2(value))
        return ctx.stylize("" + value, "boolean");
      if (isNull2(value))
        return ctx.stylize("null", "null");
    }
    function formatError2(value) {
      return "[" + Error.prototype.toString.call(value) + "]";
    }
    function formatArray2(ctx, value, recurseTimes, visibleKeys, keys) {
      var output = [];
      for (var i = 0, l = value.length;i < l; ++i)
        if (hasOwnProperty2(value, String(i)))
          output.push(formatProperty2(ctx, value, recurseTimes, visibleKeys, String(i), true));
        else
          output.push("");
      return keys.forEach(function(key) {
        if (!key.match(/^\d+$/))
          output.push(formatProperty2(ctx, value, recurseTimes, visibleKeys, key, true));
      }), output;
    }
    function formatProperty2(ctx, value, recurseTimes, visibleKeys, key, array) {
      var name, str, desc;
      if (desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] }, desc.get)
        if (desc.set)
          str = ctx.stylize("[Getter/Setter]", "special");
        else
          str = ctx.stylize("[Getter]", "special");
      else if (desc.set)
        str = ctx.stylize("[Setter]", "special");
      if (!hasOwnProperty2(visibleKeys, key))
        name = "[" + key + "]";
      if (!str)
        if (ctx.seen.indexOf(desc.value) < 0) {
          if (isNull2(recurseTimes))
            str = formatValue2(ctx, desc.value, null);
          else
            str = formatValue2(ctx, desc.value, recurseTimes - 1);
          if (str.indexOf(`
`) > -1)
            if (array)
              str = str.split(`
`).map(function(line) {
                return "  " + line;
              }).join(`
`).slice(2);
            else
              str = `
` + str.split(`
`).map(function(line) {
                return "   " + line;
              }).join(`
`);
        } else
          str = ctx.stylize("[Circular]", "special");
      if (isUndefined2(name)) {
        if (array && key.match(/^\d+$/))
          return str;
        if (name = JSON.stringify("" + key), name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/))
          name = name.slice(1, -1), name = ctx.stylize(name, "name");
        else
          name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), name = ctx.stylize(name, "string");
      }
      return name + ": " + str;
    }
    function reduceToSingleString2(output, base, braces) {
      var numLinesEst = 0, length = output.reduce(function(prev, cur) {
        if (numLinesEst++, cur.indexOf(`
`) >= 0)
          numLinesEst++;
        return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
      }, 0);
      if (length > 60)
        return braces[0] + (base === "" ? "" : base + `
 `) + " " + output.join(`,
  `) + " " + braces[1];
      return braces[0] + base + " " + output.join(", ") + " " + braces[1];
    }
    exports.types = require_types();
    function isArray2(ar) {
      return Array.isArray(ar);
    }
    exports.isArray = isArray2;
    function isBoolean2(arg) {
      return typeof arg === "boolean";
    }
    exports.isBoolean = isBoolean2;
    function isNull2(arg) {
      return arg === null;
    }
    exports.isNull = isNull2;
    function isNullOrUndefined2(arg) {
      return arg == null;
    }
    exports.isNullOrUndefined = isNullOrUndefined2;
    function isNumber2(arg) {
      return typeof arg === "number";
    }
    exports.isNumber = isNumber2;
    function isString2(arg) {
      return typeof arg === "string";
    }
    exports.isString = isString2;
    function isSymbol2(arg) {
      return typeof arg === "symbol";
    }
    exports.isSymbol = isSymbol2;
    function isUndefined2(arg) {
      return arg === undefined;
    }
    exports.isUndefined = isUndefined2;
    function isRegExp2(re) {
      return isObject2(re) && objectToString2(re) === "[object RegExp]";
    }
    exports.isRegExp = isRegExp2;
    exports.types.isRegExp = isRegExp2;
    function isObject2(arg) {
      return typeof arg === "object" && arg !== null;
    }
    exports.isObject = isObject2;
    function isDate2(d) {
      return isObject2(d) && objectToString2(d) === "[object Date]";
    }
    exports.isDate = isDate2;
    exports.types.isDate = isDate2;
    function isError2(e) {
      return isObject2(e) && (objectToString2(e) === "[object Error]" || e instanceof Error);
    }
    exports.isError = isError2;
    exports.types.isNativeError = isError2;
    function isFunction2(arg) {
      return typeof arg === "function";
    }
    exports.isFunction = isFunction2;
    function isPrimitive2(arg) {
      return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
    }
    exports.isPrimitive = isPrimitive2;
    exports.isBuffer = require_isBuffer();
    function objectToString2(o) {
      return Object.prototype.toString.call(o);
    }
    function pad2(n) {
      return n < 10 ? "0" + n.toString(10) : n.toString(10);
    }
    var months2 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function timestamp2() {
      var d = new Date, time = [pad2(d.getHours()), pad2(d.getMinutes()), pad2(d.getSeconds())].join(":");
      return [d.getDate(), months2[d.getMonth()], time].join(" ");
    }
    exports.log = function() {
      console.log("%s - %s", timestamp2(), exports.format.apply(exports, arguments));
    };
    exports.inherits = require_inherits();
    exports._extend = function(origin, add) {
      if (!add || !isObject2(add))
        return origin;
      var keys = Object.keys(add), i = keys.length;
      while (i--)
        origin[keys[i]] = add[keys[i]];
      return origin;
    };
    function hasOwnProperty2(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
    var kCustomPromisifiedSymbol2 = typeof Symbol !== "undefined" ? Symbol("util.promisify.custom") : undefined;
    exports.promisify = function promisify(original) {
      if (typeof original !== "function")
        throw new TypeError('The "original" argument must be of type Function');
      if (kCustomPromisifiedSymbol2 && original[kCustomPromisifiedSymbol2]) {
        var fn = original[kCustomPromisifiedSymbol2];
        if (typeof fn !== "function")
          throw new TypeError('The "util.promisify.custom" argument must be of type Function');
        return Object.defineProperty(fn, kCustomPromisifiedSymbol2, { value: fn, enumerable: false, writable: false, configurable: true }), fn;
      }
      function fn() {
        var promiseResolve, promiseReject, promise = new Promise(function(resolve, reject) {
          promiseResolve = resolve, promiseReject = reject;
        }), args = [];
        for (var i = 0;i < arguments.length; i++)
          args.push(arguments[i]);
        args.push(function(err, value) {
          if (err)
            promiseReject(err);
          else
            promiseResolve(value);
        });
        try {
          original.apply(this, args);
        } catch (err) {
          promiseReject(err);
        }
        return promise;
      }
      if (Object.setPrototypeOf(fn, Object.getPrototypeOf(original)), kCustomPromisifiedSymbol2)
        Object.defineProperty(fn, kCustomPromisifiedSymbol2, { value: fn, enumerable: false, writable: false, configurable: true });
      return Object.defineProperties(fn, getOwnPropertyDescriptors(original));
    };
    exports.promisify.custom = kCustomPromisifiedSymbol2;
    function callbackifyOnRejected2(reason, cb) {
      if (!reason) {
        var newReason = new Error("Promise was rejected with a falsy value");
        newReason.reason = reason, reason = newReason;
      }
      return cb(reason);
    }
    function callbackify2(original) {
      if (typeof original !== "function")
        throw new TypeError('The "original" argument must be of type Function');
      function callbackified() {
        var args = [];
        for (var i = 0;i < arguments.length; i++)
          args.push(arguments[i]);
        var maybeCb = args.pop();
        if (typeof maybeCb !== "function")
          throw new TypeError("The last argument must be of type Function");
        var self = this, cb = function() {
          return maybeCb.apply(self, arguments);
        };
        original.apply(this, args).then(function(ret) {
          process.nextTick(cb.bind(null, null, ret));
        }, function(rej) {
          process.nextTick(callbackifyOnRejected2.bind(null, rej, cb));
        });
      }
      return Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original)), Object.defineProperties(callbackified, getOwnPropertyDescriptors(original)), callbackified;
    }
    exports.callbackify = callbackify2;
  });
  require_errors = __commonJS2((exports, module) => {
    function _typeof(o) {
      return _typeof = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && typeof Symbol == "function" && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function _defineProperties(target, props) {
      for (var i = 0;i < props.length; i++) {
        var descriptor = props[i];
        if (descriptor.enumerable = descriptor.enumerable || false, descriptor.configurable = true, "value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        _defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        _defineProperties(Constructor, staticProps);
      return Object.defineProperty(Constructor, "prototype", { writable: false }), Constructor;
    }
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return _typeof(key) === "symbol" ? key : String(key);
    }
    function _toPrimitive(input, hint) {
      if (_typeof(input) !== "object" || input === null)
        return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== undefined) {
        var res = prim.call(input, hint || "default");
        if (_typeof(res) !== "object")
          return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor))
        throw new TypeError("Cannot call a class as a function");
    }
    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null)
        throw new TypeError("Super expression must either be null or a function");
      if (subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }), Object.defineProperty(subClass, "prototype", { writable: false }), superClass)
        _setPrototypeOf(subClass, superClass);
    }
    function _setPrototypeOf(o, p) {
      return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o2, p2) {
        return o2.__proto__ = p2, o2;
      }, _setPrototypeOf(o, p);
    }
    function _createSuper(Derived) {
      var hasNativeReflectConstruct = _isNativeReflectConstruct();
      return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived), result;
        if (hasNativeReflectConstruct) {
          var NewTarget = _getPrototypeOf(this).constructor;
          result = Reflect.construct(Super, arguments, NewTarget);
        } else
          result = Super.apply(this, arguments);
        return _possibleConstructorReturn(this, result);
      };
    }
    function _possibleConstructorReturn(self, call) {
      if (call && (_typeof(call) === "object" || typeof call === "function"))
        return call;
      else if (call !== undefined)
        throw new TypeError("Derived constructors may only return object or undefined");
      return _assertThisInitialized(self);
    }
    function _assertThisInitialized(self) {
      if (self === undefined)
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return self;
    }
    function _isNativeReflectConstruct() {
      if (typeof Reflect === "undefined" || !Reflect.construct)
        return false;
      if (Reflect.construct.sham)
        return false;
      if (typeof Proxy === "function")
        return true;
      try {
        return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {})), true;
      } catch (e) {
        return false;
      }
    }
    function _getPrototypeOf(o) {
      return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o2) {
        return o2.__proto__ || Object.getPrototypeOf(o2);
      }, _getPrototypeOf(o);
    }
    var codes = {}, assert, util;
    function createErrorType(code, message, Base) {
      if (!Base)
        Base = Error;
      function getMessage(arg1, arg2, arg3) {
        if (typeof message === "string")
          return message;
        else
          return message(arg1, arg2, arg3);
      }
      var NodeError = function(_Base) {
        _inherits(NodeError2, _Base);
        var _super = _createSuper(NodeError2);
        function NodeError2(arg1, arg2, arg3) {
          var _this;
          return _classCallCheck(this, NodeError2), _this = _super.call(this, getMessage(arg1, arg2, arg3)), _this.code = code, _this;
        }
        return _createClass(NodeError2);
      }(Base);
      codes[code] = NodeError;
    }
    function oneOf(expected, thing) {
      if (Array.isArray(expected)) {
        var len = expected.length;
        if (expected = expected.map(function(i) {
          return String(i);
        }), len > 2)
          return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(", "), ", or ") + expected[len - 1];
        else if (len === 2)
          return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
        else
          return "of ".concat(thing, " ").concat(expected[0]);
      } else
        return "of ".concat(thing, " ").concat(String(expected));
    }
    function startsWith(str, search, pos) {
      return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    }
    function endsWith(str, search, this_len) {
      if (this_len === undefined || this_len > str.length)
        this_len = str.length;
      return str.substring(this_len - search.length, this_len) === search;
    }
    function includes(str, search, start) {
      if (typeof start !== "number")
        start = 0;
      if (start + search.length > str.length)
        return false;
      else
        return str.indexOf(search, start) !== -1;
    }
    createErrorType("ERR_AMBIGUOUS_ARGUMENT", 'The "%s" argument is ambiguous. %s', TypeError);
    createErrorType("ERR_INVALID_ARG_TYPE", function(name, expected, actual) {
      if (assert === undefined)
        assert = require_assert();
      assert(typeof name === "string", "'name' must be a string");
      var determiner;
      if (typeof expected === "string" && startsWith(expected, "not "))
        determiner = "must not be", expected = expected.replace(/^not /, "");
      else
        determiner = "must be";
      var msg;
      if (endsWith(name, " argument"))
        msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, "type"));
      else {
        var type = includes(name, ".") ? "property" : "argument";
        msg = 'The "'.concat(name, '" ').concat(type, " ").concat(determiner, " ").concat(oneOf(expected, "type"));
      }
      return msg += ". Received type ".concat(_typeof(actual)), msg;
    }, TypeError);
    createErrorType("ERR_INVALID_ARG_VALUE", function(name, value) {
      var reason = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "is invalid";
      if (util === undefined)
        util = require_util();
      var inspected = util.inspect(value);
      if (inspected.length > 128)
        inspected = "".concat(inspected.slice(0, 128), "...");
      return "The argument '".concat(name, "' ").concat(reason, ". Received ").concat(inspected);
    }, TypeError, RangeError);
    createErrorType("ERR_INVALID_RETURN_VALUE", function(input, name, value) {
      var type;
      if (value && value.constructor && value.constructor.name)
        type = "instance of ".concat(value.constructor.name);
      else
        type = "type ".concat(_typeof(value));
      return "Expected ".concat(input, ' to be returned from the "').concat(name, '"') + " function but got ".concat(type, ".");
    }, TypeError);
    createErrorType("ERR_MISSING_ARGS", function() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0;_key < _len; _key++)
        args[_key] = arguments[_key];
      if (assert === undefined)
        assert = require_assert();
      assert(args.length > 0, "At least one arg needs to be specified");
      var msg = "The ", len = args.length;
      switch (args = args.map(function(a) {
        return '"'.concat(a, '"');
      }), len) {
        case 1:
          msg += "".concat(args[0], " argument");
          break;
        case 2:
          msg += "".concat(args[0], " and ").concat(args[1], " arguments");
          break;
        default:
          msg += args.slice(0, len - 1).join(", "), msg += ", and ".concat(args[len - 1], " arguments");
          break;
      }
      return "".concat(msg, " must be specified");
    }, TypeError);
    exports.codes = codes;
  });
  require_assertion_error = __commonJS2((exports, module) => {
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r2) {
          return Object.getOwnPropertyDescriptor(e, r2).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread(e) {
      for (var r = 1;r < arguments.length; r++) {
        var t = arguments[r] != null ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
          _defineProperty(e, r2, t[r2]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
          Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
        });
      }
      return e;
    }
    function _defineProperty(obj, key, value) {
      if (key = _toPropertyKey(key), key in obj)
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      else
        obj[key] = value;
      return obj;
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor))
        throw new TypeError("Cannot call a class as a function");
    }
    function _defineProperties(target, props) {
      for (var i = 0;i < props.length; i++) {
        var descriptor = props[i];
        if (descriptor.enumerable = descriptor.enumerable || false, descriptor.configurable = true, "value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        _defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        _defineProperties(Constructor, staticProps);
      return Object.defineProperty(Constructor, "prototype", { writable: false }), Constructor;
    }
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return _typeof(key) === "symbol" ? key : String(key);
    }
    function _toPrimitive(input, hint) {
      if (_typeof(input) !== "object" || input === null)
        return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== undefined) {
        var res = prim.call(input, hint || "default");
        if (_typeof(res) !== "object")
          return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null)
        throw new TypeError("Super expression must either be null or a function");
      if (subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }), Object.defineProperty(subClass, "prototype", { writable: false }), superClass)
        _setPrototypeOf(subClass, superClass);
    }
    function _createSuper(Derived) {
      var hasNativeReflectConstruct = _isNativeReflectConstruct();
      return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived), result;
        if (hasNativeReflectConstruct) {
          var NewTarget = _getPrototypeOf(this).constructor;
          result = Reflect.construct(Super, arguments, NewTarget);
        } else
          result = Super.apply(this, arguments);
        return _possibleConstructorReturn(this, result);
      };
    }
    function _possibleConstructorReturn(self, call) {
      if (call && (_typeof(call) === "object" || typeof call === "function"))
        return call;
      else if (call !== undefined)
        throw new TypeError("Derived constructors may only return object or undefined");
      return _assertThisInitialized(self);
    }
    function _assertThisInitialized(self) {
      if (self === undefined)
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return self;
    }
    function _wrapNativeSuper(Class) {
      var _cache = typeof Map === "function" ? new Map : undefined;
      return _wrapNativeSuper = function _wrapNativeSuper(Class2) {
        if (Class2 === null || !_isNativeFunction(Class2))
          return Class2;
        if (typeof Class2 !== "function")
          throw new TypeError("Super expression must either be null or a function");
        if (typeof _cache !== "undefined") {
          if (_cache.has(Class2))
            return _cache.get(Class2);
          _cache.set(Class2, Wrapper);
        }
        function Wrapper() {
          return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
        }
        return Wrapper.prototype = Object.create(Class2.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }), _setPrototypeOf(Wrapper, Class2);
      }, _wrapNativeSuper(Class);
    }
    function _construct(Parent, args, Class) {
      if (_isNativeReflectConstruct())
        _construct = Reflect.construct.bind();
      else
        _construct = function _construct(Parent2, args2, Class2) {
          var a = [null];
          a.push.apply(a, args2);
          var Constructor = Function.bind.apply(Parent2, a), instance = new Constructor;
          if (Class2)
            _setPrototypeOf(instance, Class2.prototype);
          return instance;
        };
      return _construct.apply(null, arguments);
    }
    function _isNativeReflectConstruct() {
      if (typeof Reflect === "undefined" || !Reflect.construct)
        return false;
      if (Reflect.construct.sham)
        return false;
      if (typeof Proxy === "function")
        return true;
      try {
        return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {})), true;
      } catch (e) {
        return false;
      }
    }
    function _isNativeFunction(fn) {
      return Function.toString.call(fn).indexOf("[native code]") !== -1;
    }
    function _setPrototypeOf(o, p) {
      return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o2, p2) {
        return o2.__proto__ = p2, o2;
      }, _setPrototypeOf(o, p);
    }
    function _getPrototypeOf(o) {
      return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o2) {
        return o2.__proto__ || Object.getPrototypeOf(o2);
      }, _getPrototypeOf(o);
    }
    function _typeof(o) {
      return _typeof = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && typeof Symbol == "function" && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    var _require = require_util(), inspect3 = _require.inspect, _require2 = require_errors(), ERR_INVALID_ARG_TYPE = _require2.codes.ERR_INVALID_ARG_TYPE;
    function endsWith(str, search, this_len) {
      if (this_len === undefined || this_len > str.length)
        this_len = str.length;
      return str.substring(this_len - search.length, this_len) === search;
    }
    function repeat(str, count) {
      if (count = Math.floor(count), str.length == 0 || count == 0)
        return "";
      var maxCount = str.length * count;
      count = Math.floor(Math.log(count) / Math.log(2));
      while (count)
        str += str, count--;
      return str += str.substring(0, maxCount - str.length), str;
    }
    var blue = "", green = "", red = "", white = "", kReadableOperator = { deepStrictEqual: "Expected values to be strictly deep-equal:", strictEqual: "Expected values to be strictly equal:", strictEqualObject: 'Expected "actual" to be reference-equal to "expected":', deepEqual: "Expected values to be loosely deep-equal:", equal: "Expected values to be loosely equal:", notDeepStrictEqual: 'Expected "actual" not to be strictly deep-equal to:', notStrictEqual: 'Expected "actual" to be strictly unequal to:', notStrictEqualObject: 'Expected "actual" not to be reference-equal to "expected":', notDeepEqual: 'Expected "actual" not to be loosely deep-equal to:', notEqual: 'Expected "actual" to be loosely unequal to:', notIdentical: "Values identical but not reference-equal:" }, kMaxShortLength = 10;
    function copyError(source) {
      var keys = Object.keys(source), target = Object.create(Object.getPrototypeOf(source));
      return keys.forEach(function(key) {
        target[key] = source[key];
      }), Object.defineProperty(target, "message", { value: source.message }), target;
    }
    function inspectValue(val) {
      return inspect3(val, { compact: false, customInspect: false, depth: 1000, maxArrayLength: 1 / 0, showHidden: false, breakLength: 1 / 0, showProxy: false, sorted: true, getters: true });
    }
    function createErrDiff(actual, expected, operator) {
      var other = "", res = "", lastPos = 0, end = "", skipped = false, actualInspected = inspectValue(actual), actualLines = actualInspected.split(`
`), expectedLines = inspectValue(expected).split(`
`), i = 0, indicator = "";
      if (operator === "strictEqual" && _typeof(actual) === "object" && _typeof(expected) === "object" && actual !== null && expected !== null)
        operator = "strictEqualObject";
      if (actualLines.length === 1 && expectedLines.length === 1 && actualLines[0] !== expectedLines[0]) {
        var inputLength = actualLines[0].length + expectedLines[0].length;
        if (inputLength <= kMaxShortLength) {
          if ((_typeof(actual) !== "object" || actual === null) && (_typeof(expected) !== "object" || expected === null) && (actual !== 0 || expected !== 0))
            return "".concat(kReadableOperator[operator], `

`) + "".concat(actualLines[0], " !== ").concat(expectedLines[0], `
`);
        } else if (operator !== "strictEqualObject") {
          var maxLength = process.stderr && process.stderr.isTTY ? process.stderr.columns : 80;
          if (inputLength < maxLength) {
            while (actualLines[0][i] === expectedLines[0][i])
              i++;
            if (i > 2)
              indicator = `
  `.concat(repeat(" ", i), "^"), i = 0;
          }
        }
      }
      var a = actualLines[actualLines.length - 1], b = expectedLines[expectedLines.length - 1];
      while (a === b) {
        if (i++ < 2)
          end = `
  `.concat(a).concat(end);
        else
          other = a;
        if (actualLines.pop(), expectedLines.pop(), actualLines.length === 0 || expectedLines.length === 0)
          break;
        a = actualLines[actualLines.length - 1], b = expectedLines[expectedLines.length - 1];
      }
      var maxLines = Math.max(actualLines.length, expectedLines.length);
      if (maxLines === 0) {
        var _actualLines = actualInspected.split(`
`);
        if (_actualLines.length > 30) {
          _actualLines[26] = "".concat(blue, "...").concat(white);
          while (_actualLines.length > 27)
            _actualLines.pop();
        }
        return "".concat(kReadableOperator.notIdentical, `

`).concat(_actualLines.join(`
`), `
`);
      }
      if (i > 3)
        end = `
`.concat(blue, "...").concat(white).concat(end), skipped = true;
      if (other !== "")
        end = `
  `.concat(other).concat(end), other = "";
      var printedLines = 0, msg = kReadableOperator[operator] + `
`.concat(green, "+ actual").concat(white, " ").concat(red, "- expected").concat(white), skippedMsg = " ".concat(blue, "...").concat(white, " Lines skipped");
      for (i = 0;i < maxLines; i++) {
        var cur = i - lastPos;
        if (actualLines.length < i + 1) {
          if (cur > 1 && i > 2) {
            if (cur > 4)
              res += `
`.concat(blue, "...").concat(white), skipped = true;
            else if (cur > 3)
              res += `
  `.concat(expectedLines[i - 2]), printedLines++;
            res += `
  `.concat(expectedLines[i - 1]), printedLines++;
          }
          lastPos = i, other += `
`.concat(red, "-").concat(white, " ").concat(expectedLines[i]), printedLines++;
        } else if (expectedLines.length < i + 1) {
          if (cur > 1 && i > 2) {
            if (cur > 4)
              res += `
`.concat(blue, "...").concat(white), skipped = true;
            else if (cur > 3)
              res += `
  `.concat(actualLines[i - 2]), printedLines++;
            res += `
  `.concat(actualLines[i - 1]), printedLines++;
          }
          lastPos = i, res += `
`.concat(green, "+").concat(white, " ").concat(actualLines[i]), printedLines++;
        } else {
          var expectedLine = expectedLines[i], actualLine = actualLines[i], divergingLines = actualLine !== expectedLine && (!endsWith(actualLine, ",") || actualLine.slice(0, -1) !== expectedLine);
          if (divergingLines && endsWith(expectedLine, ",") && expectedLine.slice(0, -1) === actualLine)
            divergingLines = false, actualLine += ",";
          if (divergingLines) {
            if (cur > 1 && i > 2) {
              if (cur > 4)
                res += `
`.concat(blue, "...").concat(white), skipped = true;
              else if (cur > 3)
                res += `
  `.concat(actualLines[i - 2]), printedLines++;
              res += `
  `.concat(actualLines[i - 1]), printedLines++;
            }
            lastPos = i, res += `
`.concat(green, "+").concat(white, " ").concat(actualLine), other += `
`.concat(red, "-").concat(white, " ").concat(expectedLine), printedLines += 2;
          } else if (res += other, other = "", cur === 1 || i === 0)
            res += `
  `.concat(actualLine), printedLines++;
        }
        if (printedLines > 20 && i < maxLines - 2)
          return "".concat(msg).concat(skippedMsg, `
`).concat(res, `
`).concat(blue, "...").concat(white).concat(other, `
`) + "".concat(blue, "...").concat(white);
      }
      return "".concat(msg).concat(skipped ? skippedMsg : "", `
`).concat(res).concat(other).concat(end).concat(indicator);
    }
    var AssertionError = function(_Error, _inspect$custom) {
      _inherits(AssertionError2, _Error);
      var _super = _createSuper(AssertionError2);
      function AssertionError2(options) {
        var _this;
        if (_classCallCheck(this, AssertionError2), _typeof(options) !== "object" || options === null)
          throw new ERR_INVALID_ARG_TYPE("options", "Object", options);
        var { message, operator, stackStartFn, actual, expected } = options, limit = Error.stackTraceLimit;
        if (Error.stackTraceLimit = 0, message != null)
          _this = _super.call(this, String(message));
        else {
          if (process.stderr && process.stderr.isTTY)
            if (process.stderr && process.stderr.getColorDepth && process.stderr.getColorDepth() !== 1)
              blue = "\x1B[34m", green = "\x1B[32m", white = "\x1B[39m", red = "\x1B[31m";
            else
              blue = "", green = "", white = "", red = "";
          if (_typeof(actual) === "object" && actual !== null && _typeof(expected) === "object" && expected !== null && "stack" in actual && actual instanceof Error && "stack" in expected && expected instanceof Error)
            actual = copyError(actual), expected = copyError(expected);
          if (operator === "deepStrictEqual" || operator === "strictEqual")
            _this = _super.call(this, createErrDiff(actual, expected, operator));
          else if (operator === "notDeepStrictEqual" || operator === "notStrictEqual") {
            var base = kReadableOperator[operator], res = inspectValue(actual).split(`
`);
            if (operator === "notStrictEqual" && _typeof(actual) === "object" && actual !== null)
              base = kReadableOperator.notStrictEqualObject;
            if (res.length > 30) {
              res[26] = "".concat(blue, "...").concat(white);
              while (res.length > 27)
                res.pop();
            }
            if (res.length === 1)
              _this = _super.call(this, "".concat(base, " ").concat(res[0]));
            else
              _this = _super.call(this, "".concat(base, `

`).concat(res.join(`
`), `
`));
          } else {
            var _res = inspectValue(actual), other = "", knownOperators = kReadableOperator[operator];
            if (operator === "notDeepEqual" || operator === "notEqual") {
              if (_res = "".concat(kReadableOperator[operator], `

`).concat(_res), _res.length > 1024)
                _res = "".concat(_res.slice(0, 1021), "...");
            } else {
              if (other = "".concat(inspectValue(expected)), _res.length > 512)
                _res = "".concat(_res.slice(0, 509), "...");
              if (other.length > 512)
                other = "".concat(other.slice(0, 509), "...");
              if (operator === "deepEqual" || operator === "equal")
                _res = "".concat(knownOperators, `

`).concat(_res, `

should equal

`);
              else
                other = " ".concat(operator, " ").concat(other);
            }
            _this = _super.call(this, "".concat(_res).concat(other));
          }
        }
        if (Error.stackTraceLimit = limit, _this.generatedMessage = !message, Object.defineProperty(_assertThisInitialized(_this), "name", { value: "AssertionError [ERR_ASSERTION]", enumerable: false, writable: true, configurable: true }), _this.code = "ERR_ASSERTION", _this.actual = actual, _this.expected = expected, _this.operator = operator, Error.captureStackTrace)
          Error.captureStackTrace(_assertThisInitialized(_this), stackStartFn);
        return _this.stack, _this.name = "AssertionError", _possibleConstructorReturn(_this);
      }
      return _createClass(AssertionError2, [{ key: "toString", value: function toString() {
        return "".concat(this.name, " [").concat(this.code, "]: ").concat(this.message);
      } }, { key: _inspect$custom, value: function value(recurseTimes, ctx) {
        return inspect3(this, _objectSpread(_objectSpread({}, ctx), {}, { customInspect: false, depth: 0 }));
      } }]), AssertionError2;
    }(_wrapNativeSuper(Error), inspect3.custom);
    module.exports = AssertionError;
  });
  require_isArguments = __commonJS2((exports, module) => {
    var toStr = Object.prototype.toString;
    module.exports = function isArguments(value) {
      var str = toStr.call(value), isArgs = str === "[object Arguments]";
      if (!isArgs)
        isArgs = str !== "[object Array]" && value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && toStr.call(value.callee) === "[object Function]";
      return isArgs;
    };
  });
  require_implementation2 = __commonJS2((exports, module) => {
    var keysShim;
    if (!Object.keys)
      has = Object.prototype.hasOwnProperty, toStr = Object.prototype.toString, isArgs = require_isArguments(), isEnumerable = Object.prototype.propertyIsEnumerable, hasDontEnumBug = !isEnumerable.call({ toString: null }, "toString"), hasProtoEnumBug = isEnumerable.call(function() {}, "prototype"), dontEnums = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"], equalsConstructorPrototype = function(o) {
        var ctor = o.constructor;
        return ctor && ctor.prototype === o;
      }, excludedKeys = { $applicationCache: true, $console: true, $external: true, $frame: true, $frameElement: true, $frames: true, $innerHeight: true, $innerWidth: true, $onmozfullscreenchange: true, $onmozfullscreenerror: true, $outerHeight: true, $outerWidth: true, $pageXOffset: true, $pageYOffset: true, $parent: true, $scrollLeft: true, $scrollTop: true, $scrollX: true, $scrollY: true, $self: true, $webkitIndexedDB: true, $webkitStorageInfo: true, $window: true }, hasAutomationEqualityBug = function() {
        if (typeof window === "undefined")
          return false;
        for (var k in window)
          try {
            if (!excludedKeys["$" + k] && has.call(window, k) && window[k] !== null && typeof window[k] === "object")
              try {
                equalsConstructorPrototype(window[k]);
              } catch (e) {
                return true;
              }
          } catch (e) {
            return true;
          }
        return false;
      }(), equalsConstructorPrototypeIfNotBuggy = function(o) {
        if (typeof window === "undefined" || !hasAutomationEqualityBug)
          return equalsConstructorPrototype(o);
        try {
          return equalsConstructorPrototype(o);
        } catch (e) {
          return false;
        }
      }, keysShim = function keys(object) {
        var isObject2 = object !== null && typeof object === "object", isFunction2 = toStr.call(object) === "[object Function]", isArguments = isArgs(object), isString2 = isObject2 && toStr.call(object) === "[object String]", theKeys = [];
        if (!isObject2 && !isFunction2 && !isArguments)
          throw new TypeError("Object.keys called on a non-object");
        var skipProto = hasProtoEnumBug && isFunction2;
        if (isString2 && object.length > 0 && !has.call(object, 0))
          for (var i = 0;i < object.length; ++i)
            theKeys.push(String(i));
        if (isArguments && object.length > 0)
          for (var j = 0;j < object.length; ++j)
            theKeys.push(String(j));
        else
          for (var name in object)
            if (!(skipProto && name === "prototype") && has.call(object, name))
              theKeys.push(String(name));
        if (hasDontEnumBug) {
          var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
          for (var k = 0;k < dontEnums.length; ++k)
            if (!(skipConstructor && dontEnums[k] === "constructor") && has.call(object, dontEnums[k]))
              theKeys.push(dontEnums[k]);
        }
        return theKeys;
      };
    var has, toStr, isArgs, isEnumerable, hasDontEnumBug, hasProtoEnumBug, dontEnums, equalsConstructorPrototype, excludedKeys, hasAutomationEqualityBug, equalsConstructorPrototypeIfNotBuggy;
    module.exports = keysShim;
  });
  require_object_keys = __commonJS2((exports, module) => {
    var slice = Array.prototype.slice, isArgs = require_isArguments(), origKeys = Object.keys, keysShim = origKeys ? function keys(o) {
      return origKeys(o);
    } : require_implementation2(), originalKeys = Object.keys;
    keysShim.shim = function shimObjectKeys() {
      if (Object.keys) {
        var keysWorksWithArguments = function() {
          var args = Object.keys(arguments);
          return args && args.length === arguments.length;
        }(1, 2);
        if (!keysWorksWithArguments)
          Object.keys = function keys(object) {
            if (isArgs(object))
              return originalKeys(slice.call(object));
            return originalKeys(object);
          };
      } else
        Object.keys = keysShim;
      return Object.keys || keysShim;
    };
    module.exports = keysShim;
  });
  require_implementation3 = __commonJS2((exports, module) => {
    var objectKeys = require_object_keys(), hasSymbols = require_shams()(), callBound = require_call_bound(), $Object = require_es_object_atoms(), $push = callBound("Array.prototype.push"), $propIsEnumerable = callBound("Object.prototype.propertyIsEnumerable"), originalGetSymbols = hasSymbols ? $Object.getOwnPropertySymbols : null;
    module.exports = function assign(target, source1) {
      if (target == null)
        throw new TypeError("target must be an object");
      var to = $Object(target);
      if (arguments.length === 1)
        return to;
      for (var s = 1;s < arguments.length; ++s) {
        var from = $Object(arguments[s]), keys = objectKeys(from), getSymbols = hasSymbols && ($Object.getOwnPropertySymbols || originalGetSymbols);
        if (getSymbols) {
          var syms = getSymbols(from);
          for (var j = 0;j < syms.length; ++j) {
            var key = syms[j];
            if ($propIsEnumerable(from, key))
              $push(keys, key);
          }
        }
        for (var i = 0;i < keys.length; ++i) {
          var nextKey = keys[i];
          if ($propIsEnumerable(from, nextKey)) {
            var propValue = from[nextKey];
            to[nextKey] = propValue;
          }
        }
      }
      return to;
    };
  });
  require_polyfill = __commonJS2((exports, module) => {
    var implementation = require_implementation3(), lacksProperEnumerationOrder = function() {
      if (!Object.assign)
        return false;
      var str = "abcdefghijklmnopqrst", letters = str.split(""), map = {};
      for (var i = 0;i < letters.length; ++i)
        map[letters[i]] = letters[i];
      var obj = Object.assign({}, map), actual = "";
      for (var k in obj)
        actual += k;
      return str !== actual;
    }, assignHasPendingExceptions = function() {
      if (!Object.assign || !Object.preventExtensions)
        return false;
      var thrower = Object.preventExtensions({ 1: 2 });
      try {
        Object.assign(thrower, "xy");
      } catch (e) {
        return thrower[1] === "y";
      }
      return false;
    };
    module.exports = function getPolyfill() {
      if (!Object.assign)
        return implementation;
      if (lacksProperEnumerationOrder())
        return implementation;
      if (assignHasPendingExceptions())
        return implementation;
      return Object.assign;
    };
  });
  require_implementation4 = __commonJS2((exports, module) => {
    var numberIsNaN2 = function(value) {
      return value !== value;
    };
    module.exports = function is(a, b) {
      if (a === 0 && b === 0)
        return 1 / a === 1 / b;
      if (a === b)
        return true;
      if (numberIsNaN2(a) && numberIsNaN2(b))
        return true;
      return false;
    };
  });
  require_polyfill2 = __commonJS2((exports, module) => {
    var implementation = require_implementation4();
    module.exports = function getPolyfill() {
      return typeof Object.is === "function" ? Object.is : implementation;
    };
  });
  require_callBound = __commonJS2((exports, module) => {
    var GetIntrinsic = require_get_intrinsic(), callBind = require_call_bind(), $indexOf = callBind(GetIntrinsic("String.prototype.indexOf"));
    module.exports = function callBoundIntrinsic(name, allowMissing) {
      var intrinsic = GetIntrinsic(name, !!allowMissing);
      if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1)
        return callBind(intrinsic);
      return intrinsic;
    };
  });
  require_define_properties = __commonJS2((exports, module) => {
    var keys = require_object_keys(), hasSymbols = typeof Symbol === "function" && typeof Symbol("foo") === "symbol", toStr = Object.prototype.toString, concat = Array.prototype.concat, defineDataProperty = require_define_data_property(), isFunction2 = function(fn) {
      return typeof fn === "function" && toStr.call(fn) === "[object Function]";
    }, supportsDescriptors = require_has_property_descriptors()(), defineProperty = function(object, name, value, predicate) {
      if (name in object) {
        if (predicate === true) {
          if (object[name] === value)
            return;
        } else if (!isFunction2(predicate) || !predicate())
          return;
      }
      if (supportsDescriptors)
        defineDataProperty(object, name, value, true);
      else
        defineDataProperty(object, name, value);
    }, defineProperties = function(object, map) {
      var predicates = arguments.length > 2 ? arguments[2] : {}, props = keys(map);
      if (hasSymbols)
        props = concat.call(props, Object.getOwnPropertySymbols(map));
      for (var i = 0;i < props.length; i += 1)
        defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
    };
    defineProperties.supportsDescriptors = !!supportsDescriptors;
    module.exports = defineProperties;
  });
  require_shim = __commonJS2((exports, module) => {
    var getPolyfill = require_polyfill2(), define = require_define_properties();
    module.exports = function shimObjectIs() {
      var polyfill = getPolyfill();
      return define(Object, { is: polyfill }, { is: function testObjectIs() {
        return Object.is !== polyfill;
      } }), polyfill;
    };
  });
  require_object_is = __commonJS2((exports, module) => {
    var define = require_define_properties(), callBind = require_call_bind(), implementation = require_implementation4(), getPolyfill = require_polyfill2(), shim = require_shim(), polyfill = callBind(getPolyfill(), Object);
    define(polyfill, { getPolyfill, implementation, shim });
    module.exports = polyfill;
  });
  require_implementation5 = __commonJS2((exports, module) => {
    module.exports = function isNaN(value) {
      return value !== value;
    };
  });
  require_polyfill3 = __commonJS2((exports, module) => {
    var implementation = require_implementation5();
    module.exports = function getPolyfill() {
      if (Number.isNaN && Number.isNaN(NaN) && !Number.isNaN("a"))
        return Number.isNaN;
      return implementation;
    };
  });
  require_shim2 = __commonJS2((exports, module) => {
    var define = require_define_properties(), getPolyfill = require_polyfill3();
    module.exports = function shimNumberIsNaN() {
      var polyfill = getPolyfill();
      return define(Number, { isNaN: polyfill }, { isNaN: function testIsNaN() {
        return Number.isNaN !== polyfill;
      } }), polyfill;
    };
  });
  require_is_nan = __commonJS2((exports, module) => {
    var callBind = require_call_bind(), define = require_define_properties(), implementation = require_implementation5(), getPolyfill = require_polyfill3(), shim = require_shim2(), polyfill = callBind(getPolyfill(), Number);
    define(polyfill, { getPolyfill, implementation, shim });
    module.exports = polyfill;
  });
  require_comparisons = __commonJS2((exports, module) => {
    function _slicedToArray(arr, i) {
      return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
    }
    function _nonIterableRest() {
      throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return _arrayLikeToArray(o, minLen);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len);i < len; i++)
        arr2[i] = arr[i];
      return arr2;
    }
    function _iterableToArrayLimit(r, l) {
      var t = r == null ? null : typeof Symbol != "undefined" && r[Symbol.iterator] || r["@@iterator"];
      if (t != null) {
        var e, n, i, u, a = [], f = true, o = false;
        try {
          if (i = (t = t.call(r)).next, l === 0) {
            if (Object(t) !== t)
              return;
            f = false;
          } else
            for (;!(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true)
              ;
        } catch (r2) {
          o = true, n = r2;
        } finally {
          try {
            if (!f && t.return != null && (u = t.return(), Object(u) !== u))
              return;
          } finally {
            if (o)
              throw n;
          }
        }
        return a;
      }
    }
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr))
        return arr;
    }
    function _typeof(o) {
      return _typeof = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && typeof Symbol == "function" && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    var regexFlagsSupported = /a/g.flags !== undefined, arrayFromSet = function arrayFromSet(set) {
      var array = [];
      return set.forEach(function(value) {
        return array.push(value);
      }), array;
    }, arrayFromMap = function arrayFromMap(map) {
      var array = [];
      return map.forEach(function(value, key) {
        return array.push([key, value]);
      }), array;
    }, objectIs = Object.is ? Object.is : require_object_is(), objectGetOwnPropertySymbols = Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols : function() {
      return [];
    }, numberIsNaN2 = Number.isNaN ? Number.isNaN : require_is_nan();
    function uncurryThis(f) {
      return f.call.bind(f);
    }
    var hasOwnProperty2 = uncurryThis(Object.prototype.hasOwnProperty), propertyIsEnumerable = uncurryThis(Object.prototype.propertyIsEnumerable), objectToString2 = uncurryThis(Object.prototype.toString), _require$types = require_util().types, isAnyArrayBuffer = _require$types.isAnyArrayBuffer, isArrayBufferView = _require$types.isArrayBufferView, isDate2 = _require$types.isDate, isMap = _require$types.isMap, isRegExp2 = _require$types.isRegExp, isSet = _require$types.isSet, isNativeError = _require$types.isNativeError, isBoxedPrimitive = _require$types.isBoxedPrimitive, isNumberObject = _require$types.isNumberObject, isStringObject = _require$types.isStringObject, isBooleanObject = _require$types.isBooleanObject, isBigIntObject = _require$types.isBigIntObject, isSymbolObject = _require$types.isSymbolObject, isFloat32Array = _require$types.isFloat32Array, isFloat64Array = _require$types.isFloat64Array;
    function isNonIndex(key) {
      if (key.length === 0 || key.length > 10)
        return true;
      for (var i = 0;i < key.length; i++) {
        var code = key.charCodeAt(i);
        if (code < 48 || code > 57)
          return true;
      }
      return key.length === 10 && key >= Math.pow(2, 32);
    }
    function getOwnNonIndexProperties(value) {
      return Object.keys(value).filter(isNonIndex).concat(objectGetOwnPropertySymbols(value).filter(Object.prototype.propertyIsEnumerable.bind(value)));
    }
    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
     * @license  MIT
     */
    function compare(a, b) {
      if (a === b)
        return 0;
      var x = a.length, y = b.length;
      for (var i = 0, len = Math.min(x, y);i < len; ++i)
        if (a[i] !== b[i]) {
          x = a[i], y = b[i];
          break;
        }
      if (x < y)
        return -1;
      if (y < x)
        return 1;
      return 0;
    }
    var ONLY_ENUMERABLE = undefined, kStrict = true, kLoose = false, kNoIterator = 0, kIsArray = 1, kIsSet = 2, kIsMap = 3;
    function areSimilarRegExps(a, b) {
      return regexFlagsSupported ? a.source === b.source && a.flags === b.flags : RegExp.prototype.toString.call(a) === RegExp.prototype.toString.call(b);
    }
    function areSimilarFloatArrays(a, b) {
      if (a.byteLength !== b.byteLength)
        return false;
      for (var offset = 0;offset < a.byteLength; offset++)
        if (a[offset] !== b[offset])
          return false;
      return true;
    }
    function areSimilarTypedArrays(a, b) {
      if (a.byteLength !== b.byteLength)
        return false;
      return compare(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), new Uint8Array(b.buffer, b.byteOffset, b.byteLength)) === 0;
    }
    function areEqualArrayBuffers(buf1, buf2) {
      return buf1.byteLength === buf2.byteLength && compare(new Uint8Array(buf1), new Uint8Array(buf2)) === 0;
    }
    function isEqualBoxedPrimitive(val1, val2) {
      if (isNumberObject(val1))
        return isNumberObject(val2) && objectIs(Number.prototype.valueOf.call(val1), Number.prototype.valueOf.call(val2));
      if (isStringObject(val1))
        return isStringObject(val2) && String.prototype.valueOf.call(val1) === String.prototype.valueOf.call(val2);
      if (isBooleanObject(val1))
        return isBooleanObject(val2) && Boolean.prototype.valueOf.call(val1) === Boolean.prototype.valueOf.call(val2);
      if (isBigIntObject(val1))
        return isBigIntObject(val2) && BigInt.prototype.valueOf.call(val1) === BigInt.prototype.valueOf.call(val2);
      return isSymbolObject(val2) && Symbol.prototype.valueOf.call(val1) === Symbol.prototype.valueOf.call(val2);
    }
    function innerDeepEqual(val1, val2, strict, memos) {
      if (val1 === val2) {
        if (val1 !== 0)
          return true;
        return strict ? objectIs(val1, val2) : true;
      }
      if (strict) {
        if (_typeof(val1) !== "object")
          return typeof val1 === "number" && numberIsNaN2(val1) && numberIsNaN2(val2);
        if (_typeof(val2) !== "object" || val1 === null || val2 === null)
          return false;
        if (Object.getPrototypeOf(val1) !== Object.getPrototypeOf(val2))
          return false;
      } else {
        if (val1 === null || _typeof(val1) !== "object") {
          if (val2 === null || _typeof(val2) !== "object")
            return val1 == val2;
          return false;
        }
        if (val2 === null || _typeof(val2) !== "object")
          return false;
      }
      var val1Tag = objectToString2(val1), val2Tag = objectToString2(val2);
      if (val1Tag !== val2Tag)
        return false;
      if (Array.isArray(val1)) {
        if (val1.length !== val2.length)
          return false;
        var keys1 = getOwnNonIndexProperties(val1, ONLY_ENUMERABLE), keys2 = getOwnNonIndexProperties(val2, ONLY_ENUMERABLE);
        if (keys1.length !== keys2.length)
          return false;
        return keyCheck(val1, val2, strict, memos, kIsArray, keys1);
      }
      if (val1Tag === "[object Object]") {
        if (!isMap(val1) && isMap(val2) || !isSet(val1) && isSet(val2))
          return false;
      }
      if (isDate2(val1)) {
        if (!isDate2(val2) || Date.prototype.getTime.call(val1) !== Date.prototype.getTime.call(val2))
          return false;
      } else if (isRegExp2(val1)) {
        if (!isRegExp2(val2) || !areSimilarRegExps(val1, val2))
          return false;
      } else if (isNativeError(val1) || val1 instanceof Error) {
        if (val1.message !== val2.message || val1.name !== val2.name)
          return false;
      } else if (isArrayBufferView(val1)) {
        if (!strict && (isFloat32Array(val1) || isFloat64Array(val1))) {
          if (!areSimilarFloatArrays(val1, val2))
            return false;
        } else if (!areSimilarTypedArrays(val1, val2))
          return false;
        var _keys = getOwnNonIndexProperties(val1, ONLY_ENUMERABLE), _keys2 = getOwnNonIndexProperties(val2, ONLY_ENUMERABLE);
        if (_keys.length !== _keys2.length)
          return false;
        return keyCheck(val1, val2, strict, memos, kNoIterator, _keys);
      } else if (isSet(val1)) {
        if (!isSet(val2) || val1.size !== val2.size)
          return false;
        return keyCheck(val1, val2, strict, memos, kIsSet);
      } else if (isMap(val1)) {
        if (!isMap(val2) || val1.size !== val2.size)
          return false;
        return keyCheck(val1, val2, strict, memos, kIsMap);
      } else if (isAnyArrayBuffer(val1)) {
        if (!areEqualArrayBuffers(val1, val2))
          return false;
      } else if (isBoxedPrimitive(val1) && !isEqualBoxedPrimitive(val1, val2))
        return false;
      return keyCheck(val1, val2, strict, memos, kNoIterator);
    }
    function getEnumerables(val, keys) {
      return keys.filter(function(k) {
        return propertyIsEnumerable(val, k);
      });
    }
    function keyCheck(val1, val2, strict, memos, iterationType, aKeys) {
      if (arguments.length === 5) {
        aKeys = Object.keys(val1);
        var bKeys = Object.keys(val2);
        if (aKeys.length !== bKeys.length)
          return false;
      }
      var i = 0;
      for (;i < aKeys.length; i++)
        if (!hasOwnProperty2(val2, aKeys[i]))
          return false;
      if (strict && arguments.length === 5) {
        var symbolKeysA = objectGetOwnPropertySymbols(val1);
        if (symbolKeysA.length !== 0) {
          var count = 0;
          for (i = 0;i < symbolKeysA.length; i++) {
            var key = symbolKeysA[i];
            if (propertyIsEnumerable(val1, key)) {
              if (!propertyIsEnumerable(val2, key))
                return false;
              aKeys.push(key), count++;
            } else if (propertyIsEnumerable(val2, key))
              return false;
          }
          var symbolKeysB = objectGetOwnPropertySymbols(val2);
          if (symbolKeysA.length !== symbolKeysB.length && getEnumerables(val2, symbolKeysB).length !== count)
            return false;
        } else {
          var _symbolKeysB = objectGetOwnPropertySymbols(val2);
          if (_symbolKeysB.length !== 0 && getEnumerables(val2, _symbolKeysB).length !== 0)
            return false;
        }
      }
      if (aKeys.length === 0 && (iterationType === kNoIterator || iterationType === kIsArray && val1.length === 0 || val1.size === 0))
        return true;
      if (memos === undefined)
        memos = { val1: new Map, val2: new Map, position: 0 };
      else {
        var val2MemoA = memos.val1.get(val1);
        if (val2MemoA !== undefined) {
          var val2MemoB = memos.val2.get(val2);
          if (val2MemoB !== undefined)
            return val2MemoA === val2MemoB;
        }
        memos.position++;
      }
      memos.val1.set(val1, memos.position), memos.val2.set(val2, memos.position);
      var areEq = objEquiv(val1, val2, strict, aKeys, memos, iterationType);
      return memos.val1.delete(val1), memos.val2.delete(val2), areEq;
    }
    function setHasEqualElement(set, val1, strict, memo) {
      var setValues = arrayFromSet(set);
      for (var i = 0;i < setValues.length; i++) {
        var val2 = setValues[i];
        if (innerDeepEqual(val1, val2, strict, memo))
          return set.delete(val2), true;
      }
      return false;
    }
    function findLooseMatchingPrimitives(prim) {
      switch (_typeof(prim)) {
        case "undefined":
          return null;
        case "object":
          return;
        case "symbol":
          return false;
        case "string":
          prim = +prim;
        case "number":
          if (numberIsNaN2(prim))
            return false;
      }
      return true;
    }
    function setMightHaveLoosePrim(a, b, prim) {
      var altValue = findLooseMatchingPrimitives(prim);
      if (altValue != null)
        return altValue;
      return b.has(altValue) && !a.has(altValue);
    }
    function mapMightHaveLoosePrim(a, b, prim, item, memo) {
      var altValue = findLooseMatchingPrimitives(prim);
      if (altValue != null)
        return altValue;
      var curB = b.get(altValue);
      if (curB === undefined && !b.has(altValue) || !innerDeepEqual(item, curB, false, memo))
        return false;
      return !a.has(altValue) && innerDeepEqual(item, curB, false, memo);
    }
    function setEquiv(a, b, strict, memo) {
      var set = null, aValues = arrayFromSet(a);
      for (var i = 0;i < aValues.length; i++) {
        var val = aValues[i];
        if (_typeof(val) === "object" && val !== null) {
          if (set === null)
            set = new Set;
          set.add(val);
        } else if (!b.has(val)) {
          if (strict)
            return false;
          if (!setMightHaveLoosePrim(a, b, val))
            return false;
          if (set === null)
            set = new Set;
          set.add(val);
        }
      }
      if (set !== null) {
        var bValues = arrayFromSet(b);
        for (var _i = 0;_i < bValues.length; _i++) {
          var _val = bValues[_i];
          if (_typeof(_val) === "object" && _val !== null) {
            if (!setHasEqualElement(set, _val, strict, memo))
              return false;
          } else if (!strict && !a.has(_val) && !setHasEqualElement(set, _val, strict, memo))
            return false;
        }
        return set.size === 0;
      }
      return true;
    }
    function mapHasEqualEntry(set, map, key1, item1, strict, memo) {
      var setValues = arrayFromSet(set);
      for (var i = 0;i < setValues.length; i++) {
        var key2 = setValues[i];
        if (innerDeepEqual(key1, key2, strict, memo) && innerDeepEqual(item1, map.get(key2), strict, memo))
          return set.delete(key2), true;
      }
      return false;
    }
    function mapEquiv(a, b, strict, memo) {
      var set = null, aEntries = arrayFromMap(a);
      for (var i = 0;i < aEntries.length; i++) {
        var _aEntries$i = _slicedToArray(aEntries[i], 2), key = _aEntries$i[0], item1 = _aEntries$i[1];
        if (_typeof(key) === "object" && key !== null) {
          if (set === null)
            set = new Set;
          set.add(key);
        } else {
          var item2 = b.get(key);
          if (item2 === undefined && !b.has(key) || !innerDeepEqual(item1, item2, strict, memo)) {
            if (strict)
              return false;
            if (!mapMightHaveLoosePrim(a, b, key, item1, memo))
              return false;
            if (set === null)
              set = new Set;
            set.add(key);
          }
        }
      }
      if (set !== null) {
        var bEntries = arrayFromMap(b);
        for (var _i2 = 0;_i2 < bEntries.length; _i2++) {
          var _bEntries$_i = _slicedToArray(bEntries[_i2], 2), _key = _bEntries$_i[0], item = _bEntries$_i[1];
          if (_typeof(_key) === "object" && _key !== null) {
            if (!mapHasEqualEntry(set, a, _key, item, strict, memo))
              return false;
          } else if (!strict && (!a.has(_key) || !innerDeepEqual(a.get(_key), item, false, memo)) && !mapHasEqualEntry(set, a, _key, item, false, memo))
            return false;
        }
        return set.size === 0;
      }
      return true;
    }
    function objEquiv(a, b, strict, keys, memos, iterationType) {
      var i = 0;
      if (iterationType === kIsSet) {
        if (!setEquiv(a, b, strict, memos))
          return false;
      } else if (iterationType === kIsMap) {
        if (!mapEquiv(a, b, strict, memos))
          return false;
      } else if (iterationType === kIsArray)
        for (;i < a.length; i++)
          if (hasOwnProperty2(a, i)) {
            if (!hasOwnProperty2(b, i) || !innerDeepEqual(a[i], b[i], strict, memos))
              return false;
          } else if (hasOwnProperty2(b, i))
            return false;
          else {
            var keysA = Object.keys(a);
            for (;i < keysA.length; i++) {
              var key = keysA[i];
              if (!hasOwnProperty2(b, key) || !innerDeepEqual(a[key], b[key], strict, memos))
                return false;
            }
            if (keysA.length !== Object.keys(b).length)
              return false;
            return true;
          }
      for (i = 0;i < keys.length; i++) {
        var _key2 = keys[i];
        if (!innerDeepEqual(a[_key2], b[_key2], strict, memos))
          return false;
      }
      return true;
    }
    function isDeepEqual(val1, val2) {
      return innerDeepEqual(val1, val2, kLoose);
    }
    function isDeepStrictEqual(val1, val2) {
      return innerDeepEqual(val1, val2, kStrict);
    }
    module.exports = { isDeepEqual, isDeepStrictEqual };
  });
  require_assert = __commonJS2((exports, module) => {
    function _typeof(o) {
      return _typeof = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && typeof Symbol == "function" && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function _defineProperties(target, props) {
      for (var i = 0;i < props.length; i++) {
        var descriptor = props[i];
        if (descriptor.enumerable = descriptor.enumerable || false, descriptor.configurable = true, "value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        _defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        _defineProperties(Constructor, staticProps);
      return Object.defineProperty(Constructor, "prototype", { writable: false }), Constructor;
    }
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return _typeof(key) === "symbol" ? key : String(key);
    }
    function _toPrimitive(input, hint) {
      if (_typeof(input) !== "object" || input === null)
        return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== undefined) {
        var res = prim.call(input, hint || "default");
        if (_typeof(res) !== "object")
          return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor))
        throw new TypeError("Cannot call a class as a function");
    }
    var _require = require_errors(), _require$codes = _require.codes, ERR_AMBIGUOUS_ARGUMENT = _require$codes.ERR_AMBIGUOUS_ARGUMENT, ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE, ERR_INVALID_ARG_VALUE = _require$codes.ERR_INVALID_ARG_VALUE, ERR_INVALID_RETURN_VALUE = _require$codes.ERR_INVALID_RETURN_VALUE, ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS, AssertionError = require_assertion_error(), _require2 = require_util(), inspect3 = _require2.inspect, _require$types = require_util().types, isPromise = _require$types.isPromise, isRegExp2 = _require$types.isRegExp, objectAssign = require_polyfill()(), objectIs = require_polyfill2()(), RegExpPrototypeTest = require_callBound()("RegExp.prototype.test"), isDeepEqual, isDeepStrictEqual;
    function lazyLoadComparison() {
      var comparison = require_comparisons();
      isDeepEqual = comparison.isDeepEqual, isDeepStrictEqual = comparison.isDeepStrictEqual;
    }
    var warned = false, assert = module.exports = ok, NO_EXCEPTION_SENTINEL = {};
    function innerFail(obj) {
      if (obj.message instanceof Error)
        throw obj.message;
      throw new AssertionError(obj);
    }
    function fail(actual, expected, message, operator, stackStartFn) {
      var argsLen = arguments.length, internalMessage;
      if (argsLen === 0)
        internalMessage = "Failed";
      else if (argsLen === 1)
        message = actual, actual = undefined;
      else {
        if (warned === false) {
          warned = true;
          var warn = process.emitWarning ? process.emitWarning : console.warn.bind(console);
          warn("assert.fail() with more than one argument is deprecated. Please use assert.strictEqual() instead or only pass a message.", "DeprecationWarning", "DEP0094");
        }
        if (argsLen === 2)
          operator = "!=";
      }
      if (message instanceof Error)
        throw message;
      var errArgs = { actual, expected, operator: operator === undefined ? "fail" : operator, stackStartFn: stackStartFn || fail };
      if (message !== undefined)
        errArgs.message = message;
      var err = new AssertionError(errArgs);
      if (internalMessage)
        err.message = internalMessage, err.generatedMessage = true;
      throw err;
    }
    assert.fail = fail;
    assert.AssertionError = AssertionError;
    function innerOk(fn, argLen, value, message) {
      if (!value) {
        var generatedMessage = false;
        if (argLen === 0)
          generatedMessage = true, message = "No value argument passed to `assert.ok()`";
        else if (message instanceof Error)
          throw message;
        var err = new AssertionError({ actual: value, expected: true, message, operator: "==", stackStartFn: fn });
        throw err.generatedMessage = generatedMessage, err;
      }
    }
    function ok() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0;_key < _len; _key++)
        args[_key] = arguments[_key];
      innerOk.apply(undefined, [ok, args.length].concat(args));
    }
    assert.ok = ok;
    assert.equal = function equal(actual, expected, message) {
      if (arguments.length < 2)
        throw new ERR_MISSING_ARGS("actual", "expected");
      if (actual != expected)
        innerFail({ actual, expected, message, operator: "==", stackStartFn: equal });
    };
    assert.notEqual = function notEqual(actual, expected, message) {
      if (arguments.length < 2)
        throw new ERR_MISSING_ARGS("actual", "expected");
      if (actual == expected)
        innerFail({ actual, expected, message, operator: "!=", stackStartFn: notEqual });
    };
    assert.deepEqual = function deepEqual(actual, expected, message) {
      if (arguments.length < 2)
        throw new ERR_MISSING_ARGS("actual", "expected");
      if (isDeepEqual === undefined)
        lazyLoadComparison();
      if (!isDeepEqual(actual, expected))
        innerFail({ actual, expected, message, operator: "deepEqual", stackStartFn: deepEqual });
    };
    assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
      if (arguments.length < 2)
        throw new ERR_MISSING_ARGS("actual", "expected");
      if (isDeepEqual === undefined)
        lazyLoadComparison();
      if (isDeepEqual(actual, expected))
        innerFail({ actual, expected, message, operator: "notDeepEqual", stackStartFn: notDeepEqual });
    };
    assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
      if (arguments.length < 2)
        throw new ERR_MISSING_ARGS("actual", "expected");
      if (isDeepEqual === undefined)
        lazyLoadComparison();
      if (!isDeepStrictEqual(actual, expected))
        innerFail({ actual, expected, message, operator: "deepStrictEqual", stackStartFn: deepStrictEqual });
    };
    assert.notDeepStrictEqual = notDeepStrictEqual;
    function notDeepStrictEqual(actual, expected, message) {
      if (arguments.length < 2)
        throw new ERR_MISSING_ARGS("actual", "expected");
      if (isDeepEqual === undefined)
        lazyLoadComparison();
      if (isDeepStrictEqual(actual, expected))
        innerFail({ actual, expected, message, operator: "notDeepStrictEqual", stackStartFn: notDeepStrictEqual });
    }
    assert.strictEqual = function strictEqual(actual, expected, message) {
      if (arguments.length < 2)
        throw new ERR_MISSING_ARGS("actual", "expected");
      if (!objectIs(actual, expected))
        innerFail({ actual, expected, message, operator: "strictEqual", stackStartFn: strictEqual });
    };
    assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
      if (arguments.length < 2)
        throw new ERR_MISSING_ARGS("actual", "expected");
      if (objectIs(actual, expected))
        innerFail({ actual, expected, message, operator: "notStrictEqual", stackStartFn: notStrictEqual });
    };
    var Comparison = _createClass(function Comparison(obj, keys, actual) {
      var _this = this;
      _classCallCheck(this, Comparison), keys.forEach(function(key) {
        if (key in obj)
          if (actual !== undefined && typeof actual[key] === "string" && isRegExp2(obj[key]) && RegExpPrototypeTest(obj[key], actual[key]))
            _this[key] = actual[key];
          else
            _this[key] = obj[key];
      });
    });
    function compareExceptionKey(actual, expected, key, message, keys, fn) {
      if (!(key in actual) || !isDeepStrictEqual(actual[key], expected[key])) {
        if (!message) {
          var a = new Comparison(actual, keys), b = new Comparison(expected, keys, actual), err = new AssertionError({ actual: a, expected: b, operator: "deepStrictEqual", stackStartFn: fn });
          throw err.actual = actual, err.expected = expected, err.operator = fn.name, err;
        }
        innerFail({ actual, expected, message, operator: fn.name, stackStartFn: fn });
      }
    }
    function expectedException(actual, expected, msg, fn) {
      if (typeof expected !== "function") {
        if (isRegExp2(expected))
          return RegExpPrototypeTest(expected, actual);
        if (arguments.length === 2)
          throw new ERR_INVALID_ARG_TYPE("expected", ["Function", "RegExp"], expected);
        if (_typeof(actual) !== "object" || actual === null) {
          var err = new AssertionError({ actual, expected, message: msg, operator: "deepStrictEqual", stackStartFn: fn });
          throw err.operator = fn.name, err;
        }
        var keys = Object.keys(expected);
        if (expected instanceof Error)
          keys.push("name", "message");
        else if (keys.length === 0)
          throw new ERR_INVALID_ARG_VALUE("error", expected, "may not be an empty object");
        if (isDeepEqual === undefined)
          lazyLoadComparison();
        return keys.forEach(function(key) {
          if (typeof actual[key] === "string" && isRegExp2(expected[key]) && RegExpPrototypeTest(expected[key], actual[key]))
            return;
          compareExceptionKey(actual, expected, key, msg, keys, fn);
        }), true;
      }
      if (expected.prototype !== undefined && actual instanceof expected)
        return true;
      if (Error.isPrototypeOf(expected))
        return false;
      return expected.call({}, actual) === true;
    }
    function getActual(fn) {
      if (typeof fn !== "function")
        throw new ERR_INVALID_ARG_TYPE("fn", "Function", fn);
      try {
        fn();
      } catch (e) {
        return e;
      }
      return NO_EXCEPTION_SENTINEL;
    }
    function checkIsPromise(obj) {
      return isPromise(obj) || obj !== null && _typeof(obj) === "object" && typeof obj.then === "function" && typeof obj.catch === "function";
    }
    function waitForActual(promiseFn) {
      return Promise.resolve().then(function() {
        var resultPromise;
        if (typeof promiseFn === "function") {
          if (resultPromise = promiseFn(), !checkIsPromise(resultPromise))
            throw new ERR_INVALID_RETURN_VALUE("instance of Promise", "promiseFn", resultPromise);
        } else if (checkIsPromise(promiseFn))
          resultPromise = promiseFn;
        else
          throw new ERR_INVALID_ARG_TYPE("promiseFn", ["Function", "Promise"], promiseFn);
        return Promise.resolve().then(function() {
          return resultPromise;
        }).then(function() {
          return NO_EXCEPTION_SENTINEL;
        }).catch(function(e) {
          return e;
        });
      });
    }
    function expectsError(stackStartFn, actual, error, message) {
      if (typeof error === "string") {
        if (arguments.length === 4)
          throw new ERR_INVALID_ARG_TYPE("error", ["Object", "Error", "Function", "RegExp"], error);
        if (_typeof(actual) === "object" && actual !== null) {
          if (actual.message === error)
            throw new ERR_AMBIGUOUS_ARGUMENT("error/message", 'The error message "'.concat(actual.message, '" is identical to the message.'));
        } else if (actual === error)
          throw new ERR_AMBIGUOUS_ARGUMENT("error/message", 'The error "'.concat(actual, '" is identical to the message.'));
        message = error, error = undefined;
      } else if (error != null && _typeof(error) !== "object" && typeof error !== "function")
        throw new ERR_INVALID_ARG_TYPE("error", ["Object", "Error", "Function", "RegExp"], error);
      if (actual === NO_EXCEPTION_SENTINEL) {
        var details = "";
        if (error && error.name)
          details += " (".concat(error.name, ")");
        details += message ? ": ".concat(message) : ".";
        var fnType = stackStartFn.name === "rejects" ? "rejection" : "exception";
        innerFail({ actual: undefined, expected: error, operator: stackStartFn.name, message: "Missing expected ".concat(fnType).concat(details), stackStartFn });
      }
      if (error && !expectedException(actual, error, message, stackStartFn))
        throw actual;
    }
    function expectsNoError(stackStartFn, actual, error, message) {
      if (actual === NO_EXCEPTION_SENTINEL)
        return;
      if (typeof error === "string")
        message = error, error = undefined;
      if (!error || expectedException(actual, error)) {
        var details = message ? ": ".concat(message) : ".", fnType = stackStartFn.name === "doesNotReject" ? "rejection" : "exception";
        innerFail({ actual, expected: error, operator: stackStartFn.name, message: "Got unwanted ".concat(fnType).concat(details, `
`) + 'Actual message: "'.concat(actual && actual.message, '"'), stackStartFn });
      }
      throw actual;
    }
    assert.throws = function throws(promiseFn) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1;_key2 < _len2; _key2++)
        args[_key2 - 1] = arguments[_key2];
      expectsError.apply(undefined, [throws, getActual(promiseFn)].concat(args));
    };
    assert.rejects = function rejects(promiseFn) {
      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1;_key3 < _len3; _key3++)
        args[_key3 - 1] = arguments[_key3];
      return waitForActual(promiseFn).then(function(result) {
        return expectsError.apply(undefined, [rejects, result].concat(args));
      });
    };
    assert.doesNotThrow = function doesNotThrow(fn) {
      for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1;_key4 < _len4; _key4++)
        args[_key4 - 1] = arguments[_key4];
      expectsNoError.apply(undefined, [doesNotThrow, getActual(fn)].concat(args));
    };
    assert.doesNotReject = function doesNotReject(fn) {
      for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1;_key5 < _len5; _key5++)
        args[_key5 - 1] = arguments[_key5];
      return waitForActual(fn).then(function(result) {
        return expectsNoError.apply(undefined, [doesNotReject, result].concat(args));
      });
    };
    assert.ifError = function ifError(err) {
      if (err !== null && err !== undefined) {
        var message = "ifError got unwanted exception: ";
        if (_typeof(err) === "object" && typeof err.message === "string")
          if (err.message.length === 0 && err.constructor)
            message += err.constructor.name;
          else
            message += err.message;
        else
          message += inspect3(err);
        var newErr = new AssertionError({ actual: err, expected: null, operator: "ifError", message, stackStartFn: ifError }), origStack = err.stack;
        if (typeof origStack === "string") {
          var tmp2 = origStack.split(`
`);
          tmp2.shift();
          var tmp1 = newErr.stack.split(`
`);
          for (var i = 0;i < tmp2.length; i++) {
            var pos = tmp1.indexOf(tmp2[i]);
            if (pos !== -1) {
              tmp1 = tmp1.slice(0, pos);
              break;
            }
          }
          newErr.stack = "".concat(tmp1.join(`
`), `
`).concat(tmp2.join(`
`));
        }
        throw newErr;
      }
    };
    function internalMatch(string, regexp, message, fn, fnName) {
      if (!isRegExp2(regexp))
        throw new ERR_INVALID_ARG_TYPE("regexp", "RegExp", regexp);
      var match = fnName === "match";
      if (typeof string !== "string" || RegExpPrototypeTest(regexp, string) !== match) {
        if (message instanceof Error)
          throw message;
        var generatedMessage = !message;
        message = message || (typeof string !== "string" ? 'The "string" argument must be of type string. Received type ' + "".concat(_typeof(string), " (").concat(inspect3(string), ")") : (match ? "The input did not match the regular expression " : "The input was expected to not match the regular expression ") + "".concat(inspect3(regexp), `. Input:

`).concat(inspect3(string), `
`));
        var err = new AssertionError({ actual: string, expected: regexp, message, operator: fnName, stackStartFn: fn });
        throw err.generatedMessage = generatedMessage, err;
      }
    }
    assert.match = function match(string, regexp, message) {
      internalMatch(string, regexp, message, match, "match");
    };
    assert.doesNotMatch = function doesNotMatch(string, regexp, message) {
      internalMatch(string, regexp, message, doesNotMatch, "doesNotMatch");
    };
    function strict() {
      for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0;_key6 < _len6; _key6++)
        args[_key6] = arguments[_key6];
      innerOk.apply(undefined, [strict, args.length].concat(args));
    }
    assert.strict = objectAssign(strict, assert, { equal: assert.strictEqual, deepEqual: assert.deepStrictEqual, notEqual: assert.notStrictEqual, notDeepEqual: assert.notDeepStrictEqual });
    assert.strict.strict = assert.strict;
  });
  assert = __toESM2(require_assert(), 1);
  ({ AssertionError, CallTracker, deepEqual, deepStrictEqual, doesNotMatch, doesNotReject, doesNotThrow, equal, fail, ifError, match, notDeepEqual, notDeepStrictEqual, notEqual, notStrictEqual, ok, rejects, strict, strictEqual, throws } = assert);
  assert_default = assert;
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/types.js
var require_types2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isElementCollectionFixedSizeBeet = exports.isFixableBeet = exports.assertFixedSizeBeet = exports.isFixedSizeBeet = exports.BEET_TYPE_ARG_INNER = exports.BEET_TYPE_ARG_LEN = exports.BEET_PACKAGE = undefined;
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  exports.BEET_PACKAGE = "@metaplex-foundation/beet";
  exports.BEET_TYPE_ARG_LEN = "len";
  exports.BEET_TYPE_ARG_INNER = "Beet<{innner}>";
  function isFixedSizeBeet(x) {
    return Object.keys(x).includes("byteSize");
  }
  exports.isFixedSizeBeet = isFixedSizeBeet;
  function assertFixedSizeBeet(x, msg = `${x} should have been a fixed beet`) {
    (0, assert_1.strict)(isFixedSizeBeet(x), msg);
  }
  exports.assertFixedSizeBeet = assertFixedSizeBeet;
  function isFixableBeet(x) {
    return typeof x.toFixedFromData === "function" && typeof x.toFixedFromValue === "function";
  }
  exports.isFixableBeet = isFixableBeet;
  function isElementCollectionFixedSizeBeet(x) {
    const keys = Object.keys(x);
    return keys.includes("length") && keys.includes("elementByteSize") && keys.includes("lenPrefixByteSize");
  }
  exports.isElementCollectionFixedSizeBeet = isElementCollectionFixedSizeBeet;
});

// node:buffer
var exports_buffer2 = {};
__export(exports_buffer2, {
  transcode: () => transcode,
  resolveObjectURL: () => resolveObjectURL,
  kStringMaxLength: () => kStringMaxLength,
  kMaxLength: () => kMaxLength,
  isUtf8: () => isUtf8,
  isAscii: () => isAscii,
  default: () => buffer_default,
  constants: () => constants,
  btoa: () => btoa,
  atob: () => atob,
  INSPECT_MAX_BYTES: () => INSPECT_MAX_BYTES,
  File: () => File,
  Buffer: () => Buffer2,
  Blob: () => Blob
});
function getLens(b64) {
  var len2 = b64.length;
  if (len2 % 4 > 0)
    throw new Error("Invalid string. Length must be a multiple of 4");
  var validLen = b64.indexOf("=");
  if (validLen === -1)
    validLen = len2;
  var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
}
function _byteLength(validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function toByteArray(b64) {
  var tmp, lens = getLens(b64), validLen = lens[0], placeHoldersLen = lens[1], arr = new Uint8Array(_byteLength(validLen, placeHoldersLen)), curByte = 0, len2 = placeHoldersLen > 0 ? validLen - 4 : validLen, i2;
  for (i2 = 0;i2 < len2; i2 += 4)
    tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)], arr[curByte++] = tmp >> 16 & 255, arr[curByte++] = tmp >> 8 & 255, arr[curByte++] = tmp & 255;
  if (placeHoldersLen === 2)
    tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4, arr[curByte++] = tmp & 255;
  if (placeHoldersLen === 1)
    tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2, arr[curByte++] = tmp >> 8 & 255, arr[curByte++] = tmp & 255;
  return arr;
}
function tripletToBase64(num) {
  return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk(uint8, start, end) {
  var tmp, output = [];
  for (var i2 = start;i2 < end; i2 += 3)
    tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255), output.push(tripletToBase64(tmp));
  return output.join("");
}
function fromByteArray(uint8) {
  var tmp, len2 = uint8.length, extraBytes = len2 % 3, parts = [], maxChunkLength = 16383;
  for (var i2 = 0, len22 = len2 - extraBytes;i2 < len22; i2 += maxChunkLength)
    parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
  if (extraBytes === 1)
    tmp = uint8[len2 - 1], parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
  else if (extraBytes === 2)
    tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1], parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
  return parts.join("");
}
function read(buffer, offset, isLE, mLen, nBytes) {
  var e, m, eLen = nBytes * 8 - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, nBits = -7, i2 = isLE ? nBytes - 1 : 0, d = isLE ? -1 : 1, s = buffer[offset + i2];
  i2 += d, e = s & (1 << -nBits) - 1, s >>= -nBits, nBits += eLen;
  for (;nBits > 0; e = e * 256 + buffer[offset + i2], i2 += d, nBits -= 8)
    ;
  m = e & (1 << -nBits) - 1, e >>= -nBits, nBits += mLen;
  for (;nBits > 0; m = m * 256 + buffer[offset + i2], i2 += d, nBits -= 8)
    ;
  if (e === 0)
    e = 1 - eBias;
  else if (e === eMax)
    return m ? NaN : (s ? -1 : 1) * (1 / 0);
  else
    m = m + Math.pow(2, mLen), e = e - eBias;
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}
function write(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c, eLen = nBytes * 8 - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, i2 = isLE ? 0 : nBytes - 1, d = isLE ? 1 : -1, s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  if (value = Math.abs(value), isNaN(value) || value === 1 / 0)
    m = isNaN(value) ? 1 : 0, e = eMax;
  else {
    if (e = Math.floor(Math.log(value) / Math.LN2), value * (c = Math.pow(2, -e)) < 1)
      e--, c *= 2;
    if (e + eBias >= 1)
      value += rt / c;
    else
      value += rt * Math.pow(2, 1 - eBias);
    if (value * c >= 2)
      e++, c /= 2;
    if (e + eBias >= eMax)
      m = 0, e = eMax;
    else if (e + eBias >= 1)
      m = (value * c - 1) * Math.pow(2, mLen), e = e + eBias;
    else
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen), e = 0;
  }
  for (;mLen >= 8; buffer[offset + i2] = m & 255, i2 += d, m /= 256, mLen -= 8)
    ;
  e = e << mLen | m, eLen += mLen;
  for (;eLen > 0; buffer[offset + i2] = e & 255, i2 += d, e /= 256, eLen -= 8)
    ;
  buffer[offset + i2 - d] |= s * 128;
}
function createBuffer(length) {
  if (length > kMaxLength)
    throw new RangeError('The value "' + length + '" is invalid for option "size"');
  let buf = new Uint8Array(length);
  return Object.setPrototypeOf(buf, Buffer2.prototype), buf;
}
function E(sym, getMessage, Base) {
  return class NodeError extends Base {
    constructor() {
      super();
      Object.defineProperty(this, "message", { value: getMessage.apply(this, arguments), writable: true, configurable: true }), this.name = `${this.name} [${sym}]`, this.stack, delete this.name;
    }
    get code() {
      return sym;
    }
    set code(value) {
      Object.defineProperty(this, "code", { configurable: true, enumerable: true, value, writable: true });
    }
    toString() {
      return `${this.name} [${sym}]: ${this.message}`;
    }
  };
}
function Buffer2(arg, encodingOrOffset, length) {
  if (typeof arg === "number") {
    if (typeof encodingOrOffset === "string")
      throw new TypeError('The "string" argument must be of type string. Received type number');
    return allocUnsafe(arg);
  }
  return from(arg, encodingOrOffset, length);
}
function from(value, encodingOrOffset, length) {
  if (typeof value === "string")
    return fromString(value, encodingOrOffset);
  if (ArrayBuffer.isView(value))
    return fromArrayView(value);
  if (value == null)
    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
  if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer))
    return fromArrayBuffer(value, encodingOrOffset, length);
  if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer)))
    return fromArrayBuffer(value, encodingOrOffset, length);
  if (typeof value === "number")
    throw new TypeError('The "value" argument must not be of type number. Received type number');
  let valueOf = value.valueOf && value.valueOf();
  if (valueOf != null && valueOf !== value)
    return Buffer2.from(valueOf, encodingOrOffset, length);
  let b = fromObject(value);
  if (b)
    return b;
  if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function")
    return Buffer2.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
  throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
}
function assertSize(size) {
  if (typeof size !== "number")
    throw new TypeError('"size" argument must be of type number');
  else if (size < 0)
    throw new RangeError('The value "' + size + '" is invalid for option "size"');
}
function alloc(size, fill, encoding) {
  if (assertSize(size), size <= 0)
    return createBuffer(size);
  if (fill !== undefined)
    return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
  return createBuffer(size);
}
function allocUnsafe(size) {
  return assertSize(size), createBuffer(size < 0 ? 0 : checked(size) | 0);
}
function fromString(string, encoding) {
  if (typeof encoding !== "string" || encoding === "")
    encoding = "utf8";
  if (!Buffer2.isEncoding(encoding))
    throw new TypeError("Unknown encoding: " + encoding);
  let length = byteLength(string, encoding) | 0, buf = createBuffer(length), actual = buf.write(string, encoding);
  if (actual !== length)
    buf = buf.slice(0, actual);
  return buf;
}
function fromArrayLike(array) {
  let length = array.length < 0 ? 0 : checked(array.length) | 0, buf = createBuffer(length);
  for (let i2 = 0;i2 < length; i2 += 1)
    buf[i2] = array[i2] & 255;
  return buf;
}
function fromArrayView(arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    let copy = new Uint8Array(arrayView);
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
  }
  return fromArrayLike(arrayView);
}
function fromArrayBuffer(array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset)
    throw new RangeError('"offset" is outside of buffer bounds');
  if (array.byteLength < byteOffset + (length || 0))
    throw new RangeError('"length" is outside of buffer bounds');
  let buf;
  if (byteOffset === undefined && length === undefined)
    buf = new Uint8Array(array);
  else if (length === undefined)
    buf = new Uint8Array(array, byteOffset);
  else
    buf = new Uint8Array(array, byteOffset, length);
  return Object.setPrototypeOf(buf, Buffer2.prototype), buf;
}
function fromObject(obj) {
  if (Buffer2.isBuffer(obj)) {
    let len2 = checked(obj.length) | 0, buf = createBuffer(len2);
    if (buf.length === 0)
      return buf;
    return obj.copy(buf, 0, 0, len2), buf;
  }
  if (obj.length !== undefined) {
    if (typeof obj.length !== "number" || numberIsNaN(obj.length))
      return createBuffer(0);
    return fromArrayLike(obj);
  }
  if (obj.type === "Buffer" && Array.isArray(obj.data))
    return fromArrayLike(obj.data);
}
function checked(length) {
  if (length >= kMaxLength)
    throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength.toString(16) + " bytes");
  return length | 0;
}
function byteLength(string, encoding) {
  if (Buffer2.isBuffer(string))
    return string.length;
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer))
    return string.byteLength;
  if (typeof string !== "string")
    throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string);
  let len2 = string.length, mustMatch = arguments.length > 2 && arguments[2] === true;
  if (!mustMatch && len2 === 0)
    return 0;
  let loweredCase = false;
  for (;; )
    switch (encoding) {
      case "ascii":
      case "latin1":
      case "binary":
        return len2;
      case "utf8":
      case "utf-8":
        return utf8ToBytes(string).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return len2 * 2;
      case "hex":
        return len2 >>> 1;
      case "base64":
        return base64ToBytes(string).length;
      default:
        if (loweredCase)
          return mustMatch ? -1 : utf8ToBytes(string).length;
        encoding = ("" + encoding).toLowerCase(), loweredCase = true;
    }
}
function slowToString(encoding, start, end) {
  let loweredCase = false;
  if (start === undefined || start < 0)
    start = 0;
  if (start > this.length)
    return "";
  if (end === undefined || end > this.length)
    end = this.length;
  if (end <= 0)
    return "";
  if (end >>>= 0, start >>>= 0, end <= start)
    return "";
  if (!encoding)
    encoding = "utf8";
  while (true)
    switch (encoding) {
      case "hex":
        return hexSlice(this, start, end);
      case "utf8":
      case "utf-8":
        return utf8Slice(this, start, end);
      case "ascii":
        return asciiSlice(this, start, end);
      case "latin1":
      case "binary":
        return latin1Slice(this, start, end);
      case "base64":
        return base64Slice(this, start, end);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return utf16leSlice(this, start, end);
      default:
        if (loweredCase)
          throw new TypeError("Unknown encoding: " + encoding);
        encoding = (encoding + "").toLowerCase(), loweredCase = true;
    }
}
function swap(b, n, m) {
  let i2 = b[n];
  b[n] = b[m], b[m] = i2;
}
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  if (buffer.length === 0)
    return -1;
  if (typeof byteOffset === "string")
    encoding = byteOffset, byteOffset = 0;
  else if (byteOffset > 2147483647)
    byteOffset = 2147483647;
  else if (byteOffset < -2147483648)
    byteOffset = -2147483648;
  if (byteOffset = +byteOffset, Number.isNaN(byteOffset))
    byteOffset = dir ? 0 : buffer.length - 1;
  if (byteOffset < 0)
    byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length)
    if (dir)
      return -1;
    else
      byteOffset = buffer.length - 1;
  else if (byteOffset < 0)
    if (dir)
      byteOffset = 0;
    else
      return -1;
  if (typeof val === "string")
    val = Buffer2.from(val, encoding);
  if (Buffer2.isBuffer(val)) {
    if (val.length === 0)
      return -1;
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === "number") {
    if (val = val & 255, typeof Uint8Array.prototype.indexOf === "function")
      if (dir)
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      else
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }
  throw new TypeError("val must be string, number or Buffer");
}
function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  let indexSize = 1, arrLength = arr.length, valLength = val.length;
  if (encoding !== undefined) {
    if (encoding = String(encoding).toLowerCase(), encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
      if (arr.length < 2 || val.length < 2)
        return -1;
      indexSize = 2, arrLength /= 2, valLength /= 2, byteOffset /= 2;
    }
  }
  function read2(buf, i22) {
    if (indexSize === 1)
      return buf[i22];
    else
      return buf.readUInt16BE(i22 * indexSize);
  }
  let i2;
  if (dir) {
    let foundIndex = -1;
    for (i2 = byteOffset;i2 < arrLength; i2++)
      if (read2(arr, i2) === read2(val, foundIndex === -1 ? 0 : i2 - foundIndex)) {
        if (foundIndex === -1)
          foundIndex = i2;
        if (i2 - foundIndex + 1 === valLength)
          return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1)
          i2 -= i2 - foundIndex;
        foundIndex = -1;
      }
  } else {
    if (byteOffset + valLength > arrLength)
      byteOffset = arrLength - valLength;
    for (i2 = byteOffset;i2 >= 0; i2--) {
      let found = true;
      for (let j = 0;j < valLength; j++)
        if (read2(arr, i2 + j) !== read2(val, j)) {
          found = false;
          break;
        }
      if (found)
        return i2;
    }
  }
  return -1;
}
function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  let remaining = buf.length - offset;
  if (!length)
    length = remaining;
  else if (length = Number(length), length > remaining)
    length = remaining;
  let strLen = string.length;
  if (length > strLen / 2)
    length = strLen / 2;
  let i2;
  for (i2 = 0;i2 < length; ++i2) {
    let parsed = parseInt(string.substr(i2 * 2, 2), 16);
    if (numberIsNaN(parsed))
      return i2;
    buf[offset + i2] = parsed;
  }
  return i2;
}
function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}
function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function base64Write(buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}
function base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length)
    return fromByteArray(buf);
  else
    return fromByteArray(buf.slice(start, end));
}
function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  let res = [], i2 = start;
  while (i2 < end) {
    let firstByte = buf[i2], codePoint = null, bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
    if (i2 + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint;
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 128)
            codePoint = firstByte;
          break;
        case 2:
          if (secondByte = buf[i2 + 1], (secondByte & 192) === 128) {
            if (tempCodePoint = (firstByte & 31) << 6 | secondByte & 63, tempCodePoint > 127)
              codePoint = tempCodePoint;
          }
          break;
        case 3:
          if (secondByte = buf[i2 + 1], thirdByte = buf[i2 + 2], (secondByte & 192) === 128 && (thirdByte & 192) === 128) {
            if (tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63, tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343))
              codePoint = tempCodePoint;
          }
          break;
        case 4:
          if (secondByte = buf[i2 + 1], thirdByte = buf[i2 + 2], fourthByte = buf[i2 + 3], (secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
            if (tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63, tempCodePoint > 65535 && tempCodePoint < 1114112)
              codePoint = tempCodePoint;
          }
      }
    }
    if (codePoint === null)
      codePoint = 65533, bytesPerSequence = 1;
    else if (codePoint > 65535)
      codePoint -= 65536, res.push(codePoint >>> 10 & 1023 | 55296), codePoint = 56320 | codePoint & 1023;
    res.push(codePoint), i2 += bytesPerSequence;
  }
  return decodeCodePointsArray(res);
}
function decodeCodePointsArray(codePoints) {
  let len2 = codePoints.length;
  if (len2 <= MAX_ARGUMENTS_LENGTH)
    return String.fromCharCode.apply(String, codePoints);
  let res = "", i2 = 0;
  while (i2 < len2)
    res += String.fromCharCode.apply(String, codePoints.slice(i2, i2 += MAX_ARGUMENTS_LENGTH));
  return res;
}
function asciiSlice(buf, start, end) {
  let ret = "";
  end = Math.min(buf.length, end);
  for (let i2 = start;i2 < end; ++i2)
    ret += String.fromCharCode(buf[i2] & 127);
  return ret;
}
function latin1Slice(buf, start, end) {
  let ret = "";
  end = Math.min(buf.length, end);
  for (let i2 = start;i2 < end; ++i2)
    ret += String.fromCharCode(buf[i2]);
  return ret;
}
function hexSlice(buf, start, end) {
  let len2 = buf.length;
  if (!start || start < 0)
    start = 0;
  if (!end || end < 0 || end > len2)
    end = len2;
  let out = "";
  for (let i2 = start;i2 < end; ++i2)
    out += hexSliceLookupTable[buf[i2]];
  return out;
}
function utf16leSlice(buf, start, end) {
  let bytes = buf.slice(start, end), res = "";
  for (let i2 = 0;i2 < bytes.length - 1; i2 += 2)
    res += String.fromCharCode(bytes[i2] + bytes[i2 + 1] * 256);
  return res;
}
function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0)
    throw new RangeError("offset is not uint");
  if (offset + ext > length)
    throw new RangeError("Trying to access beyond buffer length");
}
function checkInt(buf, value, offset, ext, max, min) {
  if (!Buffer2.isBuffer(buf))
    throw new TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min)
    throw new RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length)
    throw new RangeError("Index out of range");
}
function wrtBigUInt64LE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  let lo = Number(value & BigInt(4294967295));
  buf[offset++] = lo, lo = lo >> 8, buf[offset++] = lo, lo = lo >> 8, buf[offset++] = lo, lo = lo >> 8, buf[offset++] = lo;
  let hi = Number(value >> BigInt(32) & BigInt(4294967295));
  return buf[offset++] = hi, hi = hi >> 8, buf[offset++] = hi, hi = hi >> 8, buf[offset++] = hi, hi = hi >> 8, buf[offset++] = hi, offset;
}
function wrtBigUInt64BE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  let lo = Number(value & BigInt(4294967295));
  buf[offset + 7] = lo, lo = lo >> 8, buf[offset + 6] = lo, lo = lo >> 8, buf[offset + 5] = lo, lo = lo >> 8, buf[offset + 4] = lo;
  let hi = Number(value >> BigInt(32) & BigInt(4294967295));
  return buf[offset + 3] = hi, hi = hi >> 8, buf[offset + 2] = hi, hi = hi >> 8, buf[offset + 1] = hi, hi = hi >> 8, buf[offset] = hi, offset + 8;
}
function checkIEEE754(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length)
    throw new RangeError("Index out of range");
  if (offset < 0)
    throw new RangeError("Index out of range");
}
function writeFloat(buf, value, offset, littleEndian, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkIEEE754(buf, value, offset, 4, 340282346638528860000000000000000000000, -340282346638528860000000000000000000000);
  return write(buf, value, offset, littleEndian, 23, 4), offset + 4;
}
function writeDouble(buf, value, offset, littleEndian, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkIEEE754(buf, value, offset, 8, 179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000, -179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000);
  return write(buf, value, offset, littleEndian, 52, 8), offset + 8;
}
function addNumericalSeparator(val) {
  let res = "", i2 = val.length, start = val[0] === "-" ? 1 : 0;
  for (;i2 >= start + 4; i2 -= 3)
    res = `_${val.slice(i2 - 3, i2)}${res}`;
  return `${val.slice(0, i2)}${res}`;
}
function checkBounds(buf, offset, byteLength2) {
  if (validateNumber(offset, "offset"), buf[offset] === undefined || buf[offset + byteLength2] === undefined)
    boundsError(offset, buf.length - (byteLength2 + 1));
}
function checkIntBI(value, min, max, buf, offset, byteLength2) {
  if (value > max || value < min) {
    let n = typeof min === "bigint" ? "n" : "", range;
    if (byteLength2 > 3)
      if (min === 0 || min === BigInt(0))
        range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
      else
        range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
    else
      range = `>= ${min}${n} and <= ${max}${n}`;
    throw new ERR_OUT_OF_RANGE("value", range, value);
  }
  checkBounds(buf, offset, byteLength2);
}
function validateNumber(value, name) {
  if (typeof value !== "number")
    throw new ERR_INVALID_ARG_TYPE(name, "number", value);
}
function boundsError(value, length, type) {
  if (Math.floor(value) !== value)
    throw validateNumber(value, type), new ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
  if (length < 0)
    throw new ERR_BUFFER_OUT_OF_BOUNDS;
  throw new ERR_OUT_OF_RANGE(type || "offset", `>= ${type ? 1 : 0} and <= ${length}`, value);
}
function base64clean(str) {
  if (str = str.split("=")[0], str = str.trim().replace(INVALID_BASE64_RE, ""), str.length < 2)
    return "";
  while (str.length % 4 !== 0)
    str = str + "=";
  return str;
}
function utf8ToBytes(string, units) {
  units = units || 1 / 0;
  let codePoint, length = string.length, leadSurrogate = null, bytes = [];
  for (let i2 = 0;i2 < length; ++i2) {
    if (codePoint = string.charCodeAt(i2), codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        } else if (i2 + 1 === length) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1)
          bytes.push(239, 191, 189);
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1)
        bytes.push(239, 191, 189);
    }
    if (leadSurrogate = null, codePoint < 128) {
      if ((units -= 1) < 0)
        break;
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0)
        break;
      bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0)
        break;
      bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0)
        break;
      bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else
      throw new Error("Invalid code point");
  }
  return bytes;
}
function asciiToBytes(str) {
  let byteArray = [];
  for (let i2 = 0;i2 < str.length; ++i2)
    byteArray.push(str.charCodeAt(i2) & 255);
  return byteArray;
}
function utf16leToBytes(str, units) {
  let c, hi, lo, byteArray = [];
  for (let i2 = 0;i2 < str.length; ++i2) {
    if ((units -= 2) < 0)
      break;
    c = str.charCodeAt(i2), hi = c >> 8, lo = c % 256, byteArray.push(lo), byteArray.push(hi);
  }
  return byteArray;
}
function base64ToBytes(str) {
  return toByteArray(base64clean(str));
}
function blitBuffer(src, dst, offset, length) {
  let i2;
  for (i2 = 0;i2 < length; ++i2) {
    if (i2 + offset >= dst.length || i2 >= src.length)
      break;
    dst[i2 + offset] = src[i2];
  }
  return i2;
}
function isInstance(obj, type) {
  return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}
function defineBigIntMethod(fn) {
  return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
}
function BufferBigIntNotDefined() {
  throw new Error("BigInt not supported");
}
function notimpl(name) {
  return () => {
    throw new Error(name + " is not implemented for node:buffer browser polyfill");
  };
}
var lookup, revLookup, code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", i, len, customInspectSymbol, INSPECT_MAX_BYTES = 50, kMaxLength = 2147483647, kStringMaxLength = 536870888, btoa, atob, File, Blob, constants, ERR_BUFFER_OUT_OF_BOUNDS, ERR_INVALID_ARG_TYPE, ERR_OUT_OF_RANGE, MAX_ARGUMENTS_LENGTH = 4096, INVALID_BASE64_RE, hexSliceLookupTable, resolveObjectURL, isUtf8, isAscii = (str) => {
  for (let char of str)
    if (char.charCodeAt(0) > 127)
      return false;
  return true;
}, transcode, buffer_default;
var init_buffer = __esm(() => {
  lookup = [];
  revLookup = [];
  for (i = 0, len = code.length;i < len; ++i)
    lookup[i] = code[i], revLookup[code.charCodeAt(i)] = i;
  revLookup[45] = 62;
  revLookup[95] = 63;
  customInspectSymbol = typeof Symbol === "function" && typeof Symbol.for === "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
  btoa = globalThis.btoa;
  atob = globalThis.atob;
  File = globalThis.File;
  Blob = globalThis.Blob;
  constants = { MAX_LENGTH: kMaxLength, MAX_STRING_LENGTH: kStringMaxLength };
  ERR_BUFFER_OUT_OF_BOUNDS = E("ERR_BUFFER_OUT_OF_BOUNDS", function(name) {
    if (name)
      return `${name} is outside of buffer bounds`;
    return "Attempt to access memory outside buffer bounds";
  }, RangeError);
  ERR_INVALID_ARG_TYPE = E("ERR_INVALID_ARG_TYPE", function(name, actual) {
    return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
  }, TypeError);
  ERR_OUT_OF_RANGE = E("ERR_OUT_OF_RANGE", function(str, range, input) {
    let msg = `The value of "${str}" is out of range.`, received = input;
    if (Number.isInteger(input) && Math.abs(input) > 4294967296)
      received = addNumericalSeparator(String(input));
    else if (typeof input === "bigint") {
      if (received = String(input), input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32)))
        received = addNumericalSeparator(received);
      received += "n";
    }
    return msg += ` It must be ${range}. Received ${received}`, msg;
  }, RangeError);
  Object.defineProperty(Buffer2.prototype, "parent", { enumerable: true, get: function() {
    if (!Buffer2.isBuffer(this))
      return;
    return this.buffer;
  } });
  Object.defineProperty(Buffer2.prototype, "offset", { enumerable: true, get: function() {
    if (!Buffer2.isBuffer(this))
      return;
    return this.byteOffset;
  } });
  Buffer2.poolSize = 8192;
  Buffer2.from = function(value, encodingOrOffset, length) {
    return from(value, encodingOrOffset, length);
  };
  Object.setPrototypeOf(Buffer2.prototype, Uint8Array.prototype);
  Object.setPrototypeOf(Buffer2, Uint8Array);
  Buffer2.alloc = function(size, fill, encoding) {
    return alloc(size, fill, encoding);
  };
  Buffer2.allocUnsafe = function(size) {
    return allocUnsafe(size);
  };
  Buffer2.allocUnsafeSlow = function(size) {
    return allocUnsafe(size);
  };
  Buffer2.isBuffer = function isBuffer2(b) {
    return b != null && b._isBuffer === true && b !== Buffer2.prototype;
  };
  Buffer2.compare = function compare(a, b) {
    if (isInstance(a, Uint8Array))
      a = Buffer2.from(a, a.offset, a.byteLength);
    if (isInstance(b, Uint8Array))
      b = Buffer2.from(b, b.offset, b.byteLength);
    if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b))
      throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
    if (a === b)
      return 0;
    let x = a.length, y = b.length;
    for (let i2 = 0, len2 = Math.min(x, y);i2 < len2; ++i2)
      if (a[i2] !== b[i2]) {
        x = a[i2], y = b[i2];
        break;
      }
    if (x < y)
      return -1;
    if (y < x)
      return 1;
    return 0;
  };
  Buffer2.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return true;
      default:
        return false;
    }
  };
  Buffer2.concat = function concat(list, length) {
    if (!Array.isArray(list))
      throw new TypeError('"list" argument must be an Array of Buffers');
    if (list.length === 0)
      return Buffer2.alloc(0);
    let i2;
    if (length === undefined) {
      length = 0;
      for (i2 = 0;i2 < list.length; ++i2)
        length += list[i2].length;
    }
    let buffer = Buffer2.allocUnsafe(length), pos = 0;
    for (i2 = 0;i2 < list.length; ++i2) {
      let buf = list[i2];
      if (isInstance(buf, Uint8Array))
        if (pos + buf.length > buffer.length) {
          if (!Buffer2.isBuffer(buf))
            buf = Buffer2.from(buf);
          buf.copy(buffer, pos);
        } else
          Uint8Array.prototype.set.call(buffer, buf, pos);
      else if (!Buffer2.isBuffer(buf))
        throw new TypeError('"list" argument must be an Array of Buffers');
      else
        buf.copy(buffer, pos);
      pos += buf.length;
    }
    return buffer;
  };
  Buffer2.byteLength = byteLength;
  Buffer2.prototype._isBuffer = true;
  Buffer2.prototype.swap16 = function swap16() {
    let len2 = this.length;
    if (len2 % 2 !== 0)
      throw new RangeError("Buffer size must be a multiple of 16-bits");
    for (let i2 = 0;i2 < len2; i2 += 2)
      swap(this, i2, i2 + 1);
    return this;
  };
  Buffer2.prototype.swap32 = function swap32() {
    let len2 = this.length;
    if (len2 % 4 !== 0)
      throw new RangeError("Buffer size must be a multiple of 32-bits");
    for (let i2 = 0;i2 < len2; i2 += 4)
      swap(this, i2, i2 + 3), swap(this, i2 + 1, i2 + 2);
    return this;
  };
  Buffer2.prototype.swap64 = function swap64() {
    let len2 = this.length;
    if (len2 % 8 !== 0)
      throw new RangeError("Buffer size must be a multiple of 64-bits");
    for (let i2 = 0;i2 < len2; i2 += 8)
      swap(this, i2, i2 + 7), swap(this, i2 + 1, i2 + 6), swap(this, i2 + 2, i2 + 5), swap(this, i2 + 3, i2 + 4);
    return this;
  };
  Buffer2.prototype.toString = function toString() {
    let length = this.length;
    if (length === 0)
      return "";
    if (arguments.length === 0)
      return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
  };
  Buffer2.prototype.toLocaleString = Buffer2.prototype.toString;
  Buffer2.prototype.equals = function equals(b) {
    if (!Buffer2.isBuffer(b))
      throw new TypeError("Argument must be a Buffer");
    if (this === b)
      return true;
    return Buffer2.compare(this, b) === 0;
  };
  Buffer2.prototype.inspect = function inspect3() {
    let str = "", max = exports_buffer.INSPECT_MAX_BYTES;
    if (str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim(), this.length > max)
      str += " ... ";
    return "<Buffer " + str + ">";
  };
  if (customInspectSymbol)
    Buffer2.prototype[customInspectSymbol] = Buffer2.prototype.inspect;
  Buffer2.prototype.compare = function compare2(target, start, end, thisStart, thisEnd) {
    if (isInstance(target, Uint8Array))
      target = Buffer2.from(target, target.offset, target.byteLength);
    if (!Buffer2.isBuffer(target))
      throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target);
    if (start === undefined)
      start = 0;
    if (end === undefined)
      end = target ? target.length : 0;
    if (thisStart === undefined)
      thisStart = 0;
    if (thisEnd === undefined)
      thisEnd = this.length;
    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length)
      throw new RangeError("out of range index");
    if (thisStart >= thisEnd && start >= end)
      return 0;
    if (thisStart >= thisEnd)
      return -1;
    if (start >= end)
      return 1;
    if (start >>>= 0, end >>>= 0, thisStart >>>= 0, thisEnd >>>= 0, this === target)
      return 0;
    let x = thisEnd - thisStart, y = end - start, len2 = Math.min(x, y), thisCopy = this.slice(thisStart, thisEnd), targetCopy = target.slice(start, end);
    for (let i2 = 0;i2 < len2; ++i2)
      if (thisCopy[i2] !== targetCopy[i2]) {
        x = thisCopy[i2], y = targetCopy[i2];
        break;
      }
    if (x < y)
      return -1;
    if (y < x)
      return 1;
    return 0;
  };
  Buffer2.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
  };
  Buffer2.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
  };
  Buffer2.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
  };
  Buffer2.prototype.write = function write2(string, offset, length, encoding) {
    if (offset === undefined)
      encoding = "utf8", length = this.length, offset = 0;
    else if (length === undefined && typeof offset === "string")
      encoding = offset, length = this.length, offset = 0;
    else if (isFinite(offset))
      if (offset = offset >>> 0, isFinite(length)) {
        if (length = length >>> 0, encoding === undefined)
          encoding = "utf8";
      } else
        encoding = length, length = undefined;
    else
      throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
    let remaining = this.length - offset;
    if (length === undefined || length > remaining)
      length = remaining;
    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length)
      throw new RangeError("Attempt to write outside buffer bounds");
    if (!encoding)
      encoding = "utf8";
    let loweredCase = false;
    for (;; )
      switch (encoding) {
        case "hex":
          return hexWrite(this, string, offset, length);
        case "utf8":
        case "utf-8":
          return utf8Write(this, string, offset, length);
        case "ascii":
        case "latin1":
        case "binary":
          return asciiWrite(this, string, offset, length);
        case "base64":
          return base64Write(this, string, offset, length);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return ucs2Write(this, string, offset, length);
        default:
          if (loweredCase)
            throw new TypeError("Unknown encoding: " + encoding);
          encoding = ("" + encoding).toLowerCase(), loweredCase = true;
      }
  };
  Buffer2.prototype.toJSON = function toJSON() {
    return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
  };
  Buffer2.prototype.slice = function slice(start, end) {
    let len2 = this.length;
    if (start = ~~start, end = end === undefined ? len2 : ~~end, start < 0) {
      if (start += len2, start < 0)
        start = 0;
    } else if (start > len2)
      start = len2;
    if (end < 0) {
      if (end += len2, end < 0)
        end = 0;
    } else if (end > len2)
      end = len2;
    if (end < start)
      end = start;
    let newBuf = this.subarray(start, end);
    return Object.setPrototypeOf(newBuf, Buffer2.prototype), newBuf;
  };
  Buffer2.prototype.readUintLE = Buffer2.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
    if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
      checkOffset(offset, byteLength2, this.length);
    let val = this[offset], mul = 1, i2 = 0;
    while (++i2 < byteLength2 && (mul *= 256))
      val += this[offset + i2] * mul;
    return val;
  };
  Buffer2.prototype.readUintBE = Buffer2.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
    if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
      checkOffset(offset, byteLength2, this.length);
    let val = this[offset + --byteLength2], mul = 1;
    while (byteLength2 > 0 && (mul *= 256))
      val += this[offset + --byteLength2] * mul;
    return val;
  };
  Buffer2.prototype.readUint8 = Buffer2.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 1, this.length);
    return this[offset];
  };
  Buffer2.prototype.readUint16LE = Buffer2.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
  };
  Buffer2.prototype.readUint16BE = Buffer2.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
  };
  Buffer2.prototype.readUint32LE = Buffer2.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 4, this.length);
    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
  };
  Buffer2.prototype.readUint32BE = Buffer2.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 4, this.length);
    return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
  };
  Buffer2.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
    offset = offset >>> 0, validateNumber(offset, "offset");
    let first = this[offset], last = this[offset + 7];
    if (first === undefined || last === undefined)
      boundsError(offset, this.length - 8);
    let lo = first + this[++offset] * 256 + this[++offset] * 65536 + this[++offset] * 16777216, hi = this[++offset] + this[++offset] * 256 + this[++offset] * 65536 + last * 16777216;
    return BigInt(lo) + (BigInt(hi) << BigInt(32));
  });
  Buffer2.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
    offset = offset >>> 0, validateNumber(offset, "offset");
    let first = this[offset], last = this[offset + 7];
    if (first === undefined || last === undefined)
      boundsError(offset, this.length - 8);
    let hi = first * 16777216 + this[++offset] * 65536 + this[++offset] * 256 + this[++offset], lo = this[++offset] * 16777216 + this[++offset] * 65536 + this[++offset] * 256 + last;
    return (BigInt(hi) << BigInt(32)) + BigInt(lo);
  });
  Buffer2.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
    if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
      checkOffset(offset, byteLength2, this.length);
    let val = this[offset], mul = 1, i2 = 0;
    while (++i2 < byteLength2 && (mul *= 256))
      val += this[offset + i2] * mul;
    if (mul *= 128, val >= mul)
      val -= Math.pow(2, 8 * byteLength2);
    return val;
  };
  Buffer2.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
    if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
      checkOffset(offset, byteLength2, this.length);
    let i2 = byteLength2, mul = 1, val = this[offset + --i2];
    while (i2 > 0 && (mul *= 256))
      val += this[offset + --i2] * mul;
    if (mul *= 128, val >= mul)
      val -= Math.pow(2, 8 * byteLength2);
    return val;
  };
  Buffer2.prototype.readInt8 = function readInt8(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 1, this.length);
    if (!(this[offset] & 128))
      return this[offset];
    return (255 - this[offset] + 1) * -1;
  };
  Buffer2.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 2, this.length);
    let val = this[offset] | this[offset + 1] << 8;
    return val & 32768 ? val | 4294901760 : val;
  };
  Buffer2.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 2, this.length);
    let val = this[offset + 1] | this[offset] << 8;
    return val & 32768 ? val | 4294901760 : val;
  };
  Buffer2.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 4, this.length);
    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  };
  Buffer2.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 4, this.length);
    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  };
  Buffer2.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
    offset = offset >>> 0, validateNumber(offset, "offset");
    let first = this[offset], last = this[offset + 7];
    if (first === undefined || last === undefined)
      boundsError(offset, this.length - 8);
    let val = this[offset + 4] + this[offset + 5] * 256 + this[offset + 6] * 65536 + (last << 24);
    return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 256 + this[++offset] * 65536 + this[++offset] * 16777216);
  });
  Buffer2.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
    offset = offset >>> 0, validateNumber(offset, "offset");
    let first = this[offset], last = this[offset + 7];
    if (first === undefined || last === undefined)
      boundsError(offset, this.length - 8);
    let val = (first << 24) + this[++offset] * 65536 + this[++offset] * 256 + this[++offset];
    return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 16777216 + this[++offset] * 65536 + this[++offset] * 256 + last);
  });
  Buffer2.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4);
  };
  Buffer2.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4);
  };
  Buffer2.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8);
  };
  Buffer2.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    if (offset = offset >>> 0, !noAssert)
      checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8);
  };
  Buffer2.prototype.writeUintLE = Buffer2.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
    if (value = +value, offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert) {
      let maxBytes = Math.pow(2, 8 * byteLength2) - 1;
      checkInt(this, value, offset, byteLength2, maxBytes, 0);
    }
    let mul = 1, i2 = 0;
    this[offset] = value & 255;
    while (++i2 < byteLength2 && (mul *= 256))
      this[offset + i2] = value / mul & 255;
    return offset + byteLength2;
  };
  Buffer2.prototype.writeUintBE = Buffer2.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
    if (value = +value, offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert) {
      let maxBytes = Math.pow(2, 8 * byteLength2) - 1;
      checkInt(this, value, offset, byteLength2, maxBytes, 0);
    }
    let i2 = byteLength2 - 1, mul = 1;
    this[offset + i2] = value & 255;
    while (--i2 >= 0 && (mul *= 256))
      this[offset + i2] = value / mul & 255;
    return offset + byteLength2;
  };
  Buffer2.prototype.writeUint8 = Buffer2.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 1, 255, 0);
    return this[offset] = value & 255, offset + 1;
  };
  Buffer2.prototype.writeUint16LE = Buffer2.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 2, 65535, 0);
    return this[offset] = value & 255, this[offset + 1] = value >>> 8, offset + 2;
  };
  Buffer2.prototype.writeUint16BE = Buffer2.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 2, 65535, 0);
    return this[offset] = value >>> 8, this[offset + 1] = value & 255, offset + 2;
  };
  Buffer2.prototype.writeUint32LE = Buffer2.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 4, 4294967295, 0);
    return this[offset + 3] = value >>> 24, this[offset + 2] = value >>> 16, this[offset + 1] = value >>> 8, this[offset] = value & 255, offset + 4;
  };
  Buffer2.prototype.writeUint32BE = Buffer2.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 4, 4294967295, 0);
    return this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = value & 255, offset + 4;
  };
  Buffer2.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
  });
  Buffer2.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
  });
  Buffer2.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert) {
      let limit = Math.pow(2, 8 * byteLength2 - 1);
      checkInt(this, value, offset, byteLength2, limit - 1, -limit);
    }
    let i2 = 0, mul = 1, sub = 0;
    this[offset] = value & 255;
    while (++i2 < byteLength2 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i2 - 1] !== 0)
        sub = 1;
      this[offset + i2] = (value / mul >> 0) - sub & 255;
    }
    return offset + byteLength2;
  };
  Buffer2.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert) {
      let limit = Math.pow(2, 8 * byteLength2 - 1);
      checkInt(this, value, offset, byteLength2, limit - 1, -limit);
    }
    let i2 = byteLength2 - 1, mul = 1, sub = 0;
    this[offset + i2] = value & 255;
    while (--i2 >= 0 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i2 + 1] !== 0)
        sub = 1;
      this[offset + i2] = (value / mul >> 0) - sub & 255;
    }
    return offset + byteLength2;
  };
  Buffer2.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 1, 127, -128);
    if (value < 0)
      value = 255 + value + 1;
    return this[offset] = value & 255, offset + 1;
  };
  Buffer2.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 2, 32767, -32768);
    return this[offset] = value & 255, this[offset + 1] = value >>> 8, offset + 2;
  };
  Buffer2.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 2, 32767, -32768);
    return this[offset] = value >>> 8, this[offset + 1] = value & 255, offset + 2;
  };
  Buffer2.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 4, 2147483647, -2147483648);
    return this[offset] = value & 255, this[offset + 1] = value >>> 8, this[offset + 2] = value >>> 16, this[offset + 3] = value >>> 24, offset + 4;
  };
  Buffer2.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    if (value = +value, offset = offset >>> 0, !noAssert)
      checkInt(this, value, offset, 4, 2147483647, -2147483648);
    if (value < 0)
      value = 4294967295 + value + 1;
    return this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = value & 255, offset + 4;
  };
  Buffer2.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  });
  Buffer2.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  });
  Buffer2.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };
  Buffer2.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };
  Buffer2.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };
  Buffer2.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  };
  Buffer2.prototype.copy = function copy(target, targetStart, start, end) {
    if (!Buffer2.isBuffer(target))
      throw new TypeError("argument should be a Buffer");
    if (!start)
      start = 0;
    if (!end && end !== 0)
      end = this.length;
    if (targetStart >= target.length)
      targetStart = target.length;
    if (!targetStart)
      targetStart = 0;
    if (end > 0 && end < start)
      end = start;
    if (end === start)
      return 0;
    if (target.length === 0 || this.length === 0)
      return 0;
    if (targetStart < 0)
      throw new RangeError("targetStart out of bounds");
    if (start < 0 || start >= this.length)
      throw new RangeError("Index out of range");
    if (end < 0)
      throw new RangeError("sourceEnd out of bounds");
    if (end > this.length)
      end = this.length;
    if (target.length - targetStart < end - start)
      end = target.length - targetStart + start;
    let len2 = end - start;
    if (this === target && typeof Uint8Array.prototype.copyWithin === "function")
      this.copyWithin(targetStart, start, end);
    else
      Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
    return len2;
  };
  Buffer2.prototype.fill = function fill(val, start, end, encoding) {
    if (typeof val === "string") {
      if (typeof start === "string")
        encoding = start, start = 0, end = this.length;
      else if (typeof end === "string")
        encoding = end, end = this.length;
      if (encoding !== undefined && typeof encoding !== "string")
        throw new TypeError("encoding must be a string");
      if (typeof encoding === "string" && !Buffer2.isEncoding(encoding))
        throw new TypeError("Unknown encoding: " + encoding);
      if (val.length === 1) {
        let code2 = val.charCodeAt(0);
        if (encoding === "utf8" && code2 < 128 || encoding === "latin1")
          val = code2;
      }
    } else if (typeof val === "number")
      val = val & 255;
    else if (typeof val === "boolean")
      val = Number(val);
    if (start < 0 || this.length < start || this.length < end)
      throw new RangeError("Out of range index");
    if (end <= start)
      return this;
    if (start = start >>> 0, end = end === undefined ? this.length : end >>> 0, !val)
      val = 0;
    let i2;
    if (typeof val === "number")
      for (i2 = start;i2 < end; ++i2)
        this[i2] = val;
    else {
      let bytes = Buffer2.isBuffer(val) ? val : Buffer2.from(val, encoding), len2 = bytes.length;
      if (len2 === 0)
        throw new TypeError('The value "' + val + '" is invalid for argument "value"');
      for (i2 = 0;i2 < end - start; ++i2)
        this[i2 + start] = bytes[i2 % len2];
    }
    return this;
  };
  INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
  hexSliceLookupTable = function() {
    let table = new Array(256);
    for (let i2 = 0;i2 < 16; ++i2) {
      let i16 = i2 * 16;
      for (let j = 0;j < 16; ++j)
        table[i16 + j] = "0123456789abcdef"[i2] + "0123456789abcdef"[j];
    }
    return table;
  }();
  resolveObjectURL = notimpl("resolveObjectURL");
  isUtf8 = notimpl("isUtf8");
  transcode = notimpl("transcode");
  buffer_default = Buffer2;
});

// ../../node_modules/bn.js/lib/bn.js
var require_bn = __commonJS((exports, module) => {
  (function(module2, exports2) {
    function assert2(val, msg) {
      if (!val)
        throw new Error(msg || "Assertion failed");
    }
    function inherits2(ctor, superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function() {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor;
      ctor.prototype.constructor = ctor;
    }
    function BN(number, base, endian) {
      if (BN.isBN(number)) {
        return number;
      }
      this.negative = 0;
      this.words = null;
      this.length = 0;
      this.red = null;
      if (number !== null) {
        if (base === "le" || base === "be") {
          endian = base;
          base = 10;
        }
        this._init(number || 0, base || 10, endian || "be");
      }
    }
    if (typeof module2 === "object") {
      module2.exports = BN;
    } else {
      exports2.BN = BN;
    }
    BN.BN = BN;
    BN.wordSize = 26;
    var Buffer3;
    try {
      if (typeof window !== "undefined" && typeof window.Buffer !== "undefined") {
        Buffer3 = window.Buffer;
      } else {
        Buffer3 = (init_buffer(), __toCommonJS(exports_buffer2)).Buffer;
      }
    } catch (e) {}
    BN.isBN = function isBN(num) {
      if (num instanceof BN) {
        return true;
      }
      return num !== null && typeof num === "object" && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
    };
    BN.max = function max(left, right) {
      if (left.cmp(right) > 0)
        return left;
      return right;
    };
    BN.min = function min(left, right) {
      if (left.cmp(right) < 0)
        return left;
      return right;
    };
    BN.prototype._init = function init(number, base, endian) {
      if (typeof number === "number") {
        return this._initNumber(number, base, endian);
      }
      if (typeof number === "object") {
        return this._initArray(number, base, endian);
      }
      if (base === "hex") {
        base = 16;
      }
      assert2(base === (base | 0) && base >= 2 && base <= 36);
      number = number.toString().replace(/\s+/g, "");
      var start = 0;
      if (number[0] === "-") {
        start++;
        this.negative = 1;
      }
      if (start < number.length) {
        if (base === 16) {
          this._parseHex(number, start, endian);
        } else {
          this._parseBase(number, base, start);
          if (endian === "le") {
            this._initArray(this.toArray(), base, endian);
          }
        }
      }
    };
    BN.prototype._initNumber = function _initNumber(number, base, endian) {
      if (number < 0) {
        this.negative = 1;
        number = -number;
      }
      if (number < 67108864) {
        this.words = [number & 67108863];
        this.length = 1;
      } else if (number < 4503599627370496) {
        this.words = [
          number & 67108863,
          number / 67108864 & 67108863
        ];
        this.length = 2;
      } else {
        assert2(number < 9007199254740992);
        this.words = [
          number & 67108863,
          number / 67108864 & 67108863,
          1
        ];
        this.length = 3;
      }
      if (endian !== "le")
        return;
      this._initArray(this.toArray(), base, endian);
    };
    BN.prototype._initArray = function _initArray(number, base, endian) {
      assert2(typeof number.length === "number");
      if (number.length <= 0) {
        this.words = [0];
        this.length = 1;
        return this;
      }
      this.length = Math.ceil(number.length / 3);
      this.words = new Array(this.length);
      for (var i2 = 0;i2 < this.length; i2++) {
        this.words[i2] = 0;
      }
      var j, w;
      var off = 0;
      if (endian === "be") {
        for (i2 = number.length - 1, j = 0;i2 >= 0; i2 -= 3) {
          w = number[i2] | number[i2 - 1] << 8 | number[i2 - 2] << 16;
          this.words[j] |= w << off & 67108863;
          this.words[j + 1] = w >>> 26 - off & 67108863;
          off += 24;
          if (off >= 26) {
            off -= 26;
            j++;
          }
        }
      } else if (endian === "le") {
        for (i2 = 0, j = 0;i2 < number.length; i2 += 3) {
          w = number[i2] | number[i2 + 1] << 8 | number[i2 + 2] << 16;
          this.words[j] |= w << off & 67108863;
          this.words[j + 1] = w >>> 26 - off & 67108863;
          off += 24;
          if (off >= 26) {
            off -= 26;
            j++;
          }
        }
      }
      return this._strip();
    };
    function parseHex4Bits(string, index) {
      var c = string.charCodeAt(index);
      if (c >= 48 && c <= 57) {
        return c - 48;
      } else if (c >= 65 && c <= 70) {
        return c - 55;
      } else if (c >= 97 && c <= 102) {
        return c - 87;
      } else {
        assert2(false, "Invalid character in " + string);
      }
    }
    function parseHexByte(string, lowerBound, index) {
      var r = parseHex4Bits(string, index);
      if (index - 1 >= lowerBound) {
        r |= parseHex4Bits(string, index - 1) << 4;
      }
      return r;
    }
    BN.prototype._parseHex = function _parseHex(number, start, endian) {
      this.length = Math.ceil((number.length - start) / 6);
      this.words = new Array(this.length);
      for (var i2 = 0;i2 < this.length; i2++) {
        this.words[i2] = 0;
      }
      var off = 0;
      var j = 0;
      var w;
      if (endian === "be") {
        for (i2 = number.length - 1;i2 >= start; i2 -= 2) {
          w = parseHexByte(number, start, i2) << off;
          this.words[j] |= w & 67108863;
          if (off >= 18) {
            off -= 18;
            j += 1;
            this.words[j] |= w >>> 26;
          } else {
            off += 8;
          }
        }
      } else {
        var parseLength = number.length - start;
        for (i2 = parseLength % 2 === 0 ? start + 1 : start;i2 < number.length; i2 += 2) {
          w = parseHexByte(number, start, i2) << off;
          this.words[j] |= w & 67108863;
          if (off >= 18) {
            off -= 18;
            j += 1;
            this.words[j] |= w >>> 26;
          } else {
            off += 8;
          }
        }
      }
      this._strip();
    };
    function parseBase(str, start, end, mul) {
      var r = 0;
      var b = 0;
      var len2 = Math.min(str.length, end);
      for (var i2 = start;i2 < len2; i2++) {
        var c = str.charCodeAt(i2) - 48;
        r *= mul;
        if (c >= 49) {
          b = c - 49 + 10;
        } else if (c >= 17) {
          b = c - 17 + 10;
        } else {
          b = c;
        }
        assert2(c >= 0 && b < mul, "Invalid character");
        r += b;
      }
      return r;
    }
    BN.prototype._parseBase = function _parseBase(number, base, start) {
      this.words = [0];
      this.length = 1;
      for (var limbLen = 0, limbPow = 1;limbPow <= 67108863; limbPow *= base) {
        limbLen++;
      }
      limbLen--;
      limbPow = limbPow / base | 0;
      var total = number.length - start;
      var mod = total % limbLen;
      var end = Math.min(total, total - mod) + start;
      var word = 0;
      for (var i2 = start;i2 < end; i2 += limbLen) {
        word = parseBase(number, i2, i2 + limbLen, base);
        this.imuln(limbPow);
        if (this.words[0] + word < 67108864) {
          this.words[0] += word;
        } else {
          this._iaddn(word);
        }
      }
      if (mod !== 0) {
        var pow = 1;
        word = parseBase(number, i2, number.length, base);
        for (i2 = 0;i2 < mod; i2++) {
          pow *= base;
        }
        this.imuln(pow);
        if (this.words[0] + word < 67108864) {
          this.words[0] += word;
        } else {
          this._iaddn(word);
        }
      }
      this._strip();
    };
    BN.prototype.copy = function copy(dest) {
      dest.words = new Array(this.length);
      for (var i2 = 0;i2 < this.length; i2++) {
        dest.words[i2] = this.words[i2];
      }
      dest.length = this.length;
      dest.negative = this.negative;
      dest.red = this.red;
    };
    function move(dest, src) {
      dest.words = src.words;
      dest.length = src.length;
      dest.negative = src.negative;
      dest.red = src.red;
    }
    BN.prototype._move = function _move(dest) {
      move(dest, this);
    };
    BN.prototype.clone = function clone() {
      var r = new BN(null);
      this.copy(r);
      return r;
    };
    BN.prototype._expand = function _expand(size) {
      while (this.length < size) {
        this.words[this.length++] = 0;
      }
      return this;
    };
    BN.prototype._strip = function strip() {
      while (this.length > 1 && this.words[this.length - 1] === 0) {
        this.length--;
      }
      return this._normSign();
    };
    BN.prototype._normSign = function _normSign() {
      if (this.length === 1 && this.words[0] === 0) {
        this.negative = 0;
      }
      return this;
    };
    if (typeof Symbol !== "undefined" && typeof Symbol.for === "function") {
      try {
        BN.prototype[Symbol.for("nodejs.util.inspect.custom")] = inspect4;
      } catch (e) {
        BN.prototype.inspect = inspect4;
      }
    } else {
      BN.prototype.inspect = inspect4;
    }
    function inspect4() {
      return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
    }
    var zeros = [
      "",
      "0",
      "00",
      "000",
      "0000",
      "00000",
      "000000",
      "0000000",
      "00000000",
      "000000000",
      "0000000000",
      "00000000000",
      "000000000000",
      "0000000000000",
      "00000000000000",
      "000000000000000",
      "0000000000000000",
      "00000000000000000",
      "000000000000000000",
      "0000000000000000000",
      "00000000000000000000",
      "000000000000000000000",
      "0000000000000000000000",
      "00000000000000000000000",
      "000000000000000000000000",
      "0000000000000000000000000"
    ];
    var groupSizes = [
      0,
      0,
      25,
      16,
      12,
      11,
      10,
      9,
      8,
      8,
      7,
      7,
      7,
      7,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5
    ];
    var groupBases = [
      0,
      0,
      33554432,
      43046721,
      16777216,
      48828125,
      60466176,
      40353607,
      16777216,
      43046721,
      1e7,
      19487171,
      35831808,
      62748517,
      7529536,
      11390625,
      16777216,
      24137569,
      34012224,
      47045881,
      64000000,
      4084101,
      5153632,
      6436343,
      7962624,
      9765625,
      11881376,
      14348907,
      17210368,
      20511149,
      24300000,
      28629151,
      33554432,
      39135393,
      45435424,
      52521875,
      60466176
    ];
    BN.prototype.toString = function toString(base, padding) {
      base = base || 10;
      padding = padding | 0 || 1;
      var out;
      if (base === 16 || base === "hex") {
        out = "";
        var off = 0;
        var carry = 0;
        for (var i2 = 0;i2 < this.length; i2++) {
          var w = this.words[i2];
          var word = ((w << off | carry) & 16777215).toString(16);
          carry = w >>> 24 - off & 16777215;
          off += 2;
          if (off >= 26) {
            off -= 26;
            i2--;
          }
          if (carry !== 0 || i2 !== this.length - 1) {
            out = zeros[6 - word.length] + word + out;
          } else {
            out = word + out;
          }
        }
        if (carry !== 0) {
          out = carry.toString(16) + out;
        }
        while (out.length % padding !== 0) {
          out = "0" + out;
        }
        if (this.negative !== 0) {
          out = "-" + out;
        }
        return out;
      }
      if (base === (base | 0) && base >= 2 && base <= 36) {
        var groupSize = groupSizes[base];
        var groupBase = groupBases[base];
        out = "";
        var c = this.clone();
        c.negative = 0;
        while (!c.isZero()) {
          var r = c.modrn(groupBase).toString(base);
          c = c.idivn(groupBase);
          if (!c.isZero()) {
            out = zeros[groupSize - r.length] + r + out;
          } else {
            out = r + out;
          }
        }
        if (this.isZero()) {
          out = "0" + out;
        }
        while (out.length % padding !== 0) {
          out = "0" + out;
        }
        if (this.negative !== 0) {
          out = "-" + out;
        }
        return out;
      }
      assert2(false, "Base should be between 2 and 36");
    };
    BN.prototype.toNumber = function toNumber() {
      var ret = this.words[0];
      if (this.length === 2) {
        ret += this.words[1] * 67108864;
      } else if (this.length === 3 && this.words[2] === 1) {
        ret += 4503599627370496 + this.words[1] * 67108864;
      } else if (this.length > 2) {
        assert2(false, "Number can only safely store up to 53 bits");
      }
      return this.negative !== 0 ? -ret : ret;
    };
    BN.prototype.toJSON = function toJSON() {
      return this.toString(16, 2);
    };
    if (Buffer3) {
      BN.prototype.toBuffer = function toBuffer(endian, length) {
        return this.toArrayLike(Buffer3, endian, length);
      };
    }
    BN.prototype.toArray = function toArray(endian, length) {
      return this.toArrayLike(Array, endian, length);
    };
    var allocate = function allocate(ArrayType, size) {
      if (ArrayType.allocUnsafe) {
        return ArrayType.allocUnsafe(size);
      }
      return new ArrayType(size);
    };
    BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
      this._strip();
      var byteLength2 = this.byteLength();
      var reqLength = length || Math.max(1, byteLength2);
      assert2(byteLength2 <= reqLength, "byte array longer than desired length");
      assert2(reqLength > 0, "Requested array length <= 0");
      var res = allocate(ArrayType, reqLength);
      var postfix = endian === "le" ? "LE" : "BE";
      this["_toArrayLike" + postfix](res, byteLength2);
      return res;
    };
    BN.prototype._toArrayLikeLE = function _toArrayLikeLE(res, byteLength2) {
      var position = 0;
      var carry = 0;
      for (var i2 = 0, shift = 0;i2 < this.length; i2++) {
        var word = this.words[i2] << shift | carry;
        res[position++] = word & 255;
        if (position < res.length) {
          res[position++] = word >> 8 & 255;
        }
        if (position < res.length) {
          res[position++] = word >> 16 & 255;
        }
        if (shift === 6) {
          if (position < res.length) {
            res[position++] = word >> 24 & 255;
          }
          carry = 0;
          shift = 0;
        } else {
          carry = word >>> 24;
          shift += 2;
        }
      }
      if (position < res.length) {
        res[position++] = carry;
        while (position < res.length) {
          res[position++] = 0;
        }
      }
    };
    BN.prototype._toArrayLikeBE = function _toArrayLikeBE(res, byteLength2) {
      var position = res.length - 1;
      var carry = 0;
      for (var i2 = 0, shift = 0;i2 < this.length; i2++) {
        var word = this.words[i2] << shift | carry;
        res[position--] = word & 255;
        if (position >= 0) {
          res[position--] = word >> 8 & 255;
        }
        if (position >= 0) {
          res[position--] = word >> 16 & 255;
        }
        if (shift === 6) {
          if (position >= 0) {
            res[position--] = word >> 24 & 255;
          }
          carry = 0;
          shift = 0;
        } else {
          carry = word >>> 24;
          shift += 2;
        }
      }
      if (position >= 0) {
        res[position--] = carry;
        while (position >= 0) {
          res[position--] = 0;
        }
      }
    };
    if (Math.clz32) {
      BN.prototype._countBits = function _countBits(w) {
        return 32 - Math.clz32(w);
      };
    } else {
      BN.prototype._countBits = function _countBits(w) {
        var t = w;
        var r = 0;
        if (t >= 4096) {
          r += 13;
          t >>>= 13;
        }
        if (t >= 64) {
          r += 7;
          t >>>= 7;
        }
        if (t >= 8) {
          r += 4;
          t >>>= 4;
        }
        if (t >= 2) {
          r += 2;
          t >>>= 2;
        }
        return r + t;
      };
    }
    BN.prototype._zeroBits = function _zeroBits(w) {
      if (w === 0)
        return 26;
      var t = w;
      var r = 0;
      if ((t & 8191) === 0) {
        r += 13;
        t >>>= 13;
      }
      if ((t & 127) === 0) {
        r += 7;
        t >>>= 7;
      }
      if ((t & 15) === 0) {
        r += 4;
        t >>>= 4;
      }
      if ((t & 3) === 0) {
        r += 2;
        t >>>= 2;
      }
      if ((t & 1) === 0) {
        r++;
      }
      return r;
    };
    BN.prototype.bitLength = function bitLength() {
      var w = this.words[this.length - 1];
      var hi = this._countBits(w);
      return (this.length - 1) * 26 + hi;
    };
    function toBitArray(num) {
      var w = new Array(num.bitLength());
      for (var bit = 0;bit < w.length; bit++) {
        var off = bit / 26 | 0;
        var wbit = bit % 26;
        w[bit] = num.words[off] >>> wbit & 1;
      }
      return w;
    }
    BN.prototype.zeroBits = function zeroBits() {
      if (this.isZero())
        return 0;
      var r = 0;
      for (var i2 = 0;i2 < this.length; i2++) {
        var b = this._zeroBits(this.words[i2]);
        r += b;
        if (b !== 26)
          break;
      }
      return r;
    };
    BN.prototype.byteLength = function byteLength() {
      return Math.ceil(this.bitLength() / 8);
    };
    BN.prototype.toTwos = function toTwos(width) {
      if (this.negative !== 0) {
        return this.abs().inotn(width).iaddn(1);
      }
      return this.clone();
    };
    BN.prototype.fromTwos = function fromTwos(width) {
      if (this.testn(width - 1)) {
        return this.notn(width).iaddn(1).ineg();
      }
      return this.clone();
    };
    BN.prototype.isNeg = function isNeg() {
      return this.negative !== 0;
    };
    BN.prototype.neg = function neg() {
      return this.clone().ineg();
    };
    BN.prototype.ineg = function ineg() {
      if (!this.isZero()) {
        this.negative ^= 1;
      }
      return this;
    };
    BN.prototype.iuor = function iuor(num) {
      while (this.length < num.length) {
        this.words[this.length++] = 0;
      }
      for (var i2 = 0;i2 < num.length; i2++) {
        this.words[i2] = this.words[i2] | num.words[i2];
      }
      return this._strip();
    };
    BN.prototype.ior = function ior(num) {
      assert2((this.negative | num.negative) === 0);
      return this.iuor(num);
    };
    BN.prototype.or = function or(num) {
      if (this.length > num.length)
        return this.clone().ior(num);
      return num.clone().ior(this);
    };
    BN.prototype.uor = function uor(num) {
      if (this.length > num.length)
        return this.clone().iuor(num);
      return num.clone().iuor(this);
    };
    BN.prototype.iuand = function iuand(num) {
      var b;
      if (this.length > num.length) {
        b = num;
      } else {
        b = this;
      }
      for (var i2 = 0;i2 < b.length; i2++) {
        this.words[i2] = this.words[i2] & num.words[i2];
      }
      this.length = b.length;
      return this._strip();
    };
    BN.prototype.iand = function iand(num) {
      assert2((this.negative | num.negative) === 0);
      return this.iuand(num);
    };
    BN.prototype.and = function and(num) {
      if (this.length > num.length)
        return this.clone().iand(num);
      return num.clone().iand(this);
    };
    BN.prototype.uand = function uand(num) {
      if (this.length > num.length)
        return this.clone().iuand(num);
      return num.clone().iuand(this);
    };
    BN.prototype.iuxor = function iuxor(num) {
      var a;
      var b;
      if (this.length > num.length) {
        a = this;
        b = num;
      } else {
        a = num;
        b = this;
      }
      for (var i2 = 0;i2 < b.length; i2++) {
        this.words[i2] = a.words[i2] ^ b.words[i2];
      }
      if (this !== a) {
        for (;i2 < a.length; i2++) {
          this.words[i2] = a.words[i2];
        }
      }
      this.length = a.length;
      return this._strip();
    };
    BN.prototype.ixor = function ixor(num) {
      assert2((this.negative | num.negative) === 0);
      return this.iuxor(num);
    };
    BN.prototype.xor = function xor(num) {
      if (this.length > num.length)
        return this.clone().ixor(num);
      return num.clone().ixor(this);
    };
    BN.prototype.uxor = function uxor(num) {
      if (this.length > num.length)
        return this.clone().iuxor(num);
      return num.clone().iuxor(this);
    };
    BN.prototype.inotn = function inotn(width) {
      assert2(typeof width === "number" && width >= 0);
      var bytesNeeded = Math.ceil(width / 26) | 0;
      var bitsLeft = width % 26;
      this._expand(bytesNeeded);
      if (bitsLeft > 0) {
        bytesNeeded--;
      }
      for (var i2 = 0;i2 < bytesNeeded; i2++) {
        this.words[i2] = ~this.words[i2] & 67108863;
      }
      if (bitsLeft > 0) {
        this.words[i2] = ~this.words[i2] & 67108863 >> 26 - bitsLeft;
      }
      return this._strip();
    };
    BN.prototype.notn = function notn(width) {
      return this.clone().inotn(width);
    };
    BN.prototype.setn = function setn(bit, val) {
      assert2(typeof bit === "number" && bit >= 0);
      var off = bit / 26 | 0;
      var wbit = bit % 26;
      this._expand(off + 1);
      if (val) {
        this.words[off] = this.words[off] | 1 << wbit;
      } else {
        this.words[off] = this.words[off] & ~(1 << wbit);
      }
      return this._strip();
    };
    BN.prototype.iadd = function iadd(num) {
      var r;
      if (this.negative !== 0 && num.negative === 0) {
        this.negative = 0;
        r = this.isub(num);
        this.negative ^= 1;
        return this._normSign();
      } else if (this.negative === 0 && num.negative !== 0) {
        num.negative = 0;
        r = this.isub(num);
        num.negative = 1;
        return r._normSign();
      }
      var a, b;
      if (this.length > num.length) {
        a = this;
        b = num;
      } else {
        a = num;
        b = this;
      }
      var carry = 0;
      for (var i2 = 0;i2 < b.length; i2++) {
        r = (a.words[i2] | 0) + (b.words[i2] | 0) + carry;
        this.words[i2] = r & 67108863;
        carry = r >>> 26;
      }
      for (;carry !== 0 && i2 < a.length; i2++) {
        r = (a.words[i2] | 0) + carry;
        this.words[i2] = r & 67108863;
        carry = r >>> 26;
      }
      this.length = a.length;
      if (carry !== 0) {
        this.words[this.length] = carry;
        this.length++;
      } else if (a !== this) {
        for (;i2 < a.length; i2++) {
          this.words[i2] = a.words[i2];
        }
      }
      return this;
    };
    BN.prototype.add = function add(num) {
      var res;
      if (num.negative !== 0 && this.negative === 0) {
        num.negative = 0;
        res = this.sub(num);
        num.negative ^= 1;
        return res;
      } else if (num.negative === 0 && this.negative !== 0) {
        this.negative = 0;
        res = num.sub(this);
        this.negative = 1;
        return res;
      }
      if (this.length > num.length)
        return this.clone().iadd(num);
      return num.clone().iadd(this);
    };
    BN.prototype.isub = function isub(num) {
      if (num.negative !== 0) {
        num.negative = 0;
        var r = this.iadd(num);
        num.negative = 1;
        return r._normSign();
      } else if (this.negative !== 0) {
        this.negative = 0;
        this.iadd(num);
        this.negative = 1;
        return this._normSign();
      }
      var cmp = this.cmp(num);
      if (cmp === 0) {
        this.negative = 0;
        this.length = 1;
        this.words[0] = 0;
        return this;
      }
      var a, b;
      if (cmp > 0) {
        a = this;
        b = num;
      } else {
        a = num;
        b = this;
      }
      var carry = 0;
      for (var i2 = 0;i2 < b.length; i2++) {
        r = (a.words[i2] | 0) - (b.words[i2] | 0) + carry;
        carry = r >> 26;
        this.words[i2] = r & 67108863;
      }
      for (;carry !== 0 && i2 < a.length; i2++) {
        r = (a.words[i2] | 0) + carry;
        carry = r >> 26;
        this.words[i2] = r & 67108863;
      }
      if (carry === 0 && i2 < a.length && a !== this) {
        for (;i2 < a.length; i2++) {
          this.words[i2] = a.words[i2];
        }
      }
      this.length = Math.max(this.length, i2);
      if (a !== this) {
        this.negative = 1;
      }
      return this._strip();
    };
    BN.prototype.sub = function sub(num) {
      return this.clone().isub(num);
    };
    function smallMulTo(self, num, out) {
      out.negative = num.negative ^ self.negative;
      var len2 = self.length + num.length | 0;
      out.length = len2;
      len2 = len2 - 1 | 0;
      var a = self.words[0] | 0;
      var b = num.words[0] | 0;
      var r = a * b;
      var lo = r & 67108863;
      var carry = r / 67108864 | 0;
      out.words[0] = lo;
      for (var k = 1;k < len2; k++) {
        var ncarry = carry >>> 26;
        var rword = carry & 67108863;
        var maxJ = Math.min(k, num.length - 1);
        for (var j = Math.max(0, k - self.length + 1);j <= maxJ; j++) {
          var i2 = k - j | 0;
          a = self.words[i2] | 0;
          b = num.words[j] | 0;
          r = a * b + rword;
          ncarry += r / 67108864 | 0;
          rword = r & 67108863;
        }
        out.words[k] = rword | 0;
        carry = ncarry | 0;
      }
      if (carry !== 0) {
        out.words[k] = carry | 0;
      } else {
        out.length--;
      }
      return out._strip();
    }
    var comb10MulTo = function comb10MulTo(self, num, out) {
      var a = self.words;
      var b = num.words;
      var o = out.words;
      var c = 0;
      var lo;
      var mid;
      var hi;
      var a0 = a[0] | 0;
      var al0 = a0 & 8191;
      var ah0 = a0 >>> 13;
      var a1 = a[1] | 0;
      var al1 = a1 & 8191;
      var ah1 = a1 >>> 13;
      var a2 = a[2] | 0;
      var al2 = a2 & 8191;
      var ah2 = a2 >>> 13;
      var a3 = a[3] | 0;
      var al3 = a3 & 8191;
      var ah3 = a3 >>> 13;
      var a4 = a[4] | 0;
      var al4 = a4 & 8191;
      var ah4 = a4 >>> 13;
      var a5 = a[5] | 0;
      var al5 = a5 & 8191;
      var ah5 = a5 >>> 13;
      var a6 = a[6] | 0;
      var al6 = a6 & 8191;
      var ah6 = a6 >>> 13;
      var a7 = a[7] | 0;
      var al7 = a7 & 8191;
      var ah7 = a7 >>> 13;
      var a8 = a[8] | 0;
      var al8 = a8 & 8191;
      var ah8 = a8 >>> 13;
      var a9 = a[9] | 0;
      var al9 = a9 & 8191;
      var ah9 = a9 >>> 13;
      var b0 = b[0] | 0;
      var bl0 = b0 & 8191;
      var bh0 = b0 >>> 13;
      var b1 = b[1] | 0;
      var bl1 = b1 & 8191;
      var bh1 = b1 >>> 13;
      var b2 = b[2] | 0;
      var bl2 = b2 & 8191;
      var bh2 = b2 >>> 13;
      var b3 = b[3] | 0;
      var bl3 = b3 & 8191;
      var bh3 = b3 >>> 13;
      var b4 = b[4] | 0;
      var bl4 = b4 & 8191;
      var bh4 = b4 >>> 13;
      var b5 = b[5] | 0;
      var bl5 = b5 & 8191;
      var bh5 = b5 >>> 13;
      var b6 = b[6] | 0;
      var bl6 = b6 & 8191;
      var bh6 = b6 >>> 13;
      var b7 = b[7] | 0;
      var bl7 = b7 & 8191;
      var bh7 = b7 >>> 13;
      var b8 = b[8] | 0;
      var bl8 = b8 & 8191;
      var bh8 = b8 >>> 13;
      var b9 = b[9] | 0;
      var bl9 = b9 & 8191;
      var bh9 = b9 >>> 13;
      out.negative = self.negative ^ num.negative;
      out.length = 19;
      lo = Math.imul(al0, bl0);
      mid = Math.imul(al0, bh0);
      mid = mid + Math.imul(ah0, bl0) | 0;
      hi = Math.imul(ah0, bh0);
      var w0 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
      w0 &= 67108863;
      lo = Math.imul(al1, bl0);
      mid = Math.imul(al1, bh0);
      mid = mid + Math.imul(ah1, bl0) | 0;
      hi = Math.imul(ah1, bh0);
      lo = lo + Math.imul(al0, bl1) | 0;
      mid = mid + Math.imul(al0, bh1) | 0;
      mid = mid + Math.imul(ah0, bl1) | 0;
      hi = hi + Math.imul(ah0, bh1) | 0;
      var w1 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
      w1 &= 67108863;
      lo = Math.imul(al2, bl0);
      mid = Math.imul(al2, bh0);
      mid = mid + Math.imul(ah2, bl0) | 0;
      hi = Math.imul(ah2, bh0);
      lo = lo + Math.imul(al1, bl1) | 0;
      mid = mid + Math.imul(al1, bh1) | 0;
      mid = mid + Math.imul(ah1, bl1) | 0;
      hi = hi + Math.imul(ah1, bh1) | 0;
      lo = lo + Math.imul(al0, bl2) | 0;
      mid = mid + Math.imul(al0, bh2) | 0;
      mid = mid + Math.imul(ah0, bl2) | 0;
      hi = hi + Math.imul(ah0, bh2) | 0;
      var w2 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
      w2 &= 67108863;
      lo = Math.imul(al3, bl0);
      mid = Math.imul(al3, bh0);
      mid = mid + Math.imul(ah3, bl0) | 0;
      hi = Math.imul(ah3, bh0);
      lo = lo + Math.imul(al2, bl1) | 0;
      mid = mid + Math.imul(al2, bh1) | 0;
      mid = mid + Math.imul(ah2, bl1) | 0;
      hi = hi + Math.imul(ah2, bh1) | 0;
      lo = lo + Math.imul(al1, bl2) | 0;
      mid = mid + Math.imul(al1, bh2) | 0;
      mid = mid + Math.imul(ah1, bl2) | 0;
      hi = hi + Math.imul(ah1, bh2) | 0;
      lo = lo + Math.imul(al0, bl3) | 0;
      mid = mid + Math.imul(al0, bh3) | 0;
      mid = mid + Math.imul(ah0, bl3) | 0;
      hi = hi + Math.imul(ah0, bh3) | 0;
      var w3 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
      w3 &= 67108863;
      lo = Math.imul(al4, bl0);
      mid = Math.imul(al4, bh0);
      mid = mid + Math.imul(ah4, bl0) | 0;
      hi = Math.imul(ah4, bh0);
      lo = lo + Math.imul(al3, bl1) | 0;
      mid = mid + Math.imul(al3, bh1) | 0;
      mid = mid + Math.imul(ah3, bl1) | 0;
      hi = hi + Math.imul(ah3, bh1) | 0;
      lo = lo + Math.imul(al2, bl2) | 0;
      mid = mid + Math.imul(al2, bh2) | 0;
      mid = mid + Math.imul(ah2, bl2) | 0;
      hi = hi + Math.imul(ah2, bh2) | 0;
      lo = lo + Math.imul(al1, bl3) | 0;
      mid = mid + Math.imul(al1, bh3) | 0;
      mid = mid + Math.imul(ah1, bl3) | 0;
      hi = hi + Math.imul(ah1, bh3) | 0;
      lo = lo + Math.imul(al0, bl4) | 0;
      mid = mid + Math.imul(al0, bh4) | 0;
      mid = mid + Math.imul(ah0, bl4) | 0;
      hi = hi + Math.imul(ah0, bh4) | 0;
      var w4 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
      w4 &= 67108863;
      lo = Math.imul(al5, bl0);
      mid = Math.imul(al5, bh0);
      mid = mid + Math.imul(ah5, bl0) | 0;
      hi = Math.imul(ah5, bh0);
      lo = lo + Math.imul(al4, bl1) | 0;
      mid = mid + Math.imul(al4, bh1) | 0;
      mid = mid + Math.imul(ah4, bl1) | 0;
      hi = hi + Math.imul(ah4, bh1) | 0;
      lo = lo + Math.imul(al3, bl2) | 0;
      mid = mid + Math.imul(al3, bh2) | 0;
      mid = mid + Math.imul(ah3, bl2) | 0;
      hi = hi + Math.imul(ah3, bh2) | 0;
      lo = lo + Math.imul(al2, bl3) | 0;
      mid = mid + Math.imul(al2, bh3) | 0;
      mid = mid + Math.imul(ah2, bl3) | 0;
      hi = hi + Math.imul(ah2, bh3) | 0;
      lo = lo + Math.imul(al1, bl4) | 0;
      mid = mid + Math.imul(al1, bh4) | 0;
      mid = mid + Math.imul(ah1, bl4) | 0;
      hi = hi + Math.imul(ah1, bh4) | 0;
      lo = lo + Math.imul(al0, bl5) | 0;
      mid = mid + Math.imul(al0, bh5) | 0;
      mid = mid + Math.imul(ah0, bl5) | 0;
      hi = hi + Math.imul(ah0, bh5) | 0;
      var w5 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
      w5 &= 67108863;
      lo = Math.imul(al6, bl0);
      mid = Math.imul(al6, bh0);
      mid = mid + Math.imul(ah6, bl0) | 0;
      hi = Math.imul(ah6, bh0);
      lo = lo + Math.imul(al5, bl1) | 0;
      mid = mid + Math.imul(al5, bh1) | 0;
      mid = mid + Math.imul(ah5, bl1) | 0;
      hi = hi + Math.imul(ah5, bh1) | 0;
      lo = lo + Math.imul(al4, bl2) | 0;
      mid = mid + Math.imul(al4, bh2) | 0;
      mid = mid + Math.imul(ah4, bl2) | 0;
      hi = hi + Math.imul(ah4, bh2) | 0;
      lo = lo + Math.imul(al3, bl3) | 0;
      mid = mid + Math.imul(al3, bh3) | 0;
      mid = mid + Math.imul(ah3, bl3) | 0;
      hi = hi + Math.imul(ah3, bh3) | 0;
      lo = lo + Math.imul(al2, bl4) | 0;
      mid = mid + Math.imul(al2, bh4) | 0;
      mid = mid + Math.imul(ah2, bl4) | 0;
      hi = hi + Math.imul(ah2, bh4) | 0;
      lo = lo + Math.imul(al1, bl5) | 0;
      mid = mid + Math.imul(al1, bh5) | 0;
      mid = mid + Math.imul(ah1, bl5) | 0;
      hi = hi + Math.imul(ah1, bh5) | 0;
      lo = lo + Math.imul(al0, bl6) | 0;
      mid = mid + Math.imul(al0, bh6) | 0;
      mid = mid + Math.imul(ah0, bl6) | 0;
      hi = hi + Math.imul(ah0, bh6) | 0;
      var w6 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
      w6 &= 67108863;
      lo = Math.imul(al7, bl0);
      mid = Math.imul(al7, bh0);
      mid = mid + Math.imul(ah7, bl0) | 0;
      hi = Math.imul(ah7, bh0);
      lo = lo + Math.imul(al6, bl1) | 0;
      mid = mid + Math.imul(al6, bh1) | 0;
      mid = mid + Math.imul(ah6, bl1) | 0;
      hi = hi + Math.imul(ah6, bh1) | 0;
      lo = lo + Math.imul(al5, bl2) | 0;
      mid = mid + Math.imul(al5, bh2) | 0;
      mid = mid + Math.imul(ah5, bl2) | 0;
      hi = hi + Math.imul(ah5, bh2) | 0;
      lo = lo + Math.imul(al4, bl3) | 0;
      mid = mid + Math.imul(al4, bh3) | 0;
      mid = mid + Math.imul(ah4, bl3) | 0;
      hi = hi + Math.imul(ah4, bh3) | 0;
      lo = lo + Math.imul(al3, bl4) | 0;
      mid = mid + Math.imul(al3, bh4) | 0;
      mid = mid + Math.imul(ah3, bl4) | 0;
      hi = hi + Math.imul(ah3, bh4) | 0;
      lo = lo + Math.imul(al2, bl5) | 0;
      mid = mid + Math.imul(al2, bh5) | 0;
      mid = mid + Math.imul(ah2, bl5) | 0;
      hi = hi + Math.imul(ah2, bh5) | 0;
      lo = lo + Math.imul(al1, bl6) | 0;
      mid = mid + Math.imul(al1, bh6) | 0;
      mid = mid + Math.imul(ah1, bl6) | 0;
      hi = hi + Math.imul(ah1, bh6) | 0;
      lo = lo + Math.imul(al0, bl7) | 0;
      mid = mid + Math.imul(al0, bh7) | 0;
      mid = mid + Math.imul(ah0, bl7) | 0;
      hi = hi + Math.imul(ah0, bh7) | 0;
      var w7 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
      w7 &= 67108863;
      lo = Math.imul(al8, bl0);
      mid = Math.imul(al8, bh0);
      mid = mid + Math.imul(ah8, bl0) | 0;
      hi = Math.imul(ah8, bh0);
      lo = lo + Math.imul(al7, bl1) | 0;
      mid = mid + Math.imul(al7, bh1) | 0;
      mid = mid + Math.imul(ah7, bl1) | 0;
      hi = hi + Math.imul(ah7, bh1) | 0;
      lo = lo + Math.imul(al6, bl2) | 0;
      mid = mid + Math.imul(al6, bh2) | 0;
      mid = mid + Math.imul(ah6, bl2) | 0;
      hi = hi + Math.imul(ah6, bh2) | 0;
      lo = lo + Math.imul(al5, bl3) | 0;
      mid = mid + Math.imul(al5, bh3) | 0;
      mid = mid + Math.imul(ah5, bl3) | 0;
      hi = hi + Math.imul(ah5, bh3) | 0;
      lo = lo + Math.imul(al4, bl4) | 0;
      mid = mid + Math.imul(al4, bh4) | 0;
      mid = mid + Math.imul(ah4, bl4) | 0;
      hi = hi + Math.imul(ah4, bh4) | 0;
      lo = lo + Math.imul(al3, bl5) | 0;
      mid = mid + Math.imul(al3, bh5) | 0;
      mid = mid + Math.imul(ah3, bl5) | 0;
      hi = hi + Math.imul(ah3, bh5) | 0;
      lo = lo + Math.imul(al2, bl6) | 0;
      mid = mid + Math.imul(al2, bh6) | 0;
      mid = mid + Math.imul(ah2, bl6) | 0;
      hi = hi + Math.imul(ah2, bh6) | 0;
      lo = lo + Math.imul(al1, bl7) | 0;
      mid = mid + Math.imul(al1, bh7) | 0;
      mid = mid + Math.imul(ah1, bl7) | 0;
      hi = hi + Math.imul(ah1, bh7) | 0;
      lo = lo + Math.imul(al0, bl8) | 0;
      mid = mid + Math.imul(al0, bh8) | 0;
      mid = mid + Math.imul(ah0, bl8) | 0;
      hi = hi + Math.imul(ah0, bh8) | 0;
      var w8 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
      w8 &= 67108863;
      lo = Math.imul(al9, bl0);
      mid = Math.imul(al9, bh0);
      mid = mid + Math.imul(ah9, bl0) | 0;
      hi = Math.imul(ah9, bh0);
      lo = lo + Math.imul(al8, bl1) | 0;
      mid = mid + Math.imul(al8, bh1) | 0;
      mid = mid + Math.imul(ah8, bl1) | 0;
      hi = hi + Math.imul(ah8, bh1) | 0;
      lo = lo + Math.imul(al7, bl2) | 0;
      mid = mid + Math.imul(al7, bh2) | 0;
      mid = mid + Math.imul(ah7, bl2) | 0;
      hi = hi + Math.imul(ah7, bh2) | 0;
      lo = lo + Math.imul(al6, bl3) | 0;
      mid = mid + Math.imul(al6, bh3) | 0;
      mid = mid + Math.imul(ah6, bl3) | 0;
      hi = hi + Math.imul(ah6, bh3) | 0;
      lo = lo + Math.imul(al5, bl4) | 0;
      mid = mid + Math.imul(al5, bh4) | 0;
      mid = mid + Math.imul(ah5, bl4) | 0;
      hi = hi + Math.imul(ah5, bh4) | 0;
      lo = lo + Math.imul(al4, bl5) | 0;
      mid = mid + Math.imul(al4, bh5) | 0;
      mid = mid + Math.imul(ah4, bl5) | 0;
      hi = hi + Math.imul(ah4, bh5) | 0;
      lo = lo + Math.imul(al3, bl6) | 0;
      mid = mid + Math.imul(al3, bh6) | 0;
      mid = mid + Math.imul(ah3, bl6) | 0;
      hi = hi + Math.imul(ah3, bh6) | 0;
      lo = lo + Math.imul(al2, bl7) | 0;
      mid = mid + Math.imul(al2, bh7) | 0;
      mid = mid + Math.imul(ah2, bl7) | 0;
      hi = hi + Math.imul(ah2, bh7) | 0;
      lo = lo + Math.imul(al1, bl8) | 0;
      mid = mid + Math.imul(al1, bh8) | 0;
      mid = mid + Math.imul(ah1, bl8) | 0;
      hi = hi + Math.imul(ah1, bh8) | 0;
      lo = lo + Math.imul(al0, bl9) | 0;
      mid = mid + Math.imul(al0, bh9) | 0;
      mid = mid + Math.imul(ah0, bl9) | 0;
      hi = hi + Math.imul(ah0, bh9) | 0;
      var w9 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
      w9 &= 67108863;
      lo = Math.imul(al9, bl1);
      mid = Math.imul(al9, bh1);
      mid = mid + Math.imul(ah9, bl1) | 0;
      hi = Math.imul(ah9, bh1);
      lo = lo + Math.imul(al8, bl2) | 0;
      mid = mid + Math.imul(al8, bh2) | 0;
      mid = mid + Math.imul(ah8, bl2) | 0;
      hi = hi + Math.imul(ah8, bh2) | 0;
      lo = lo + Math.imul(al7, bl3) | 0;
      mid = mid + Math.imul(al7, bh3) | 0;
      mid = mid + Math.imul(ah7, bl3) | 0;
      hi = hi + Math.imul(ah7, bh3) | 0;
      lo = lo + Math.imul(al6, bl4) | 0;
      mid = mid + Math.imul(al6, bh4) | 0;
      mid = mid + Math.imul(ah6, bl4) | 0;
      hi = hi + Math.imul(ah6, bh4) | 0;
      lo = lo + Math.imul(al5, bl5) | 0;
      mid = mid + Math.imul(al5, bh5) | 0;
      mid = mid + Math.imul(ah5, bl5) | 0;
      hi = hi + Math.imul(ah5, bh5) | 0;
      lo = lo + Math.imul(al4, bl6) | 0;
      mid = mid + Math.imul(al4, bh6) | 0;
      mid = mid + Math.imul(ah4, bl6) | 0;
      hi = hi + Math.imul(ah4, bh6) | 0;
      lo = lo + Math.imul(al3, bl7) | 0;
      mid = mid + Math.imul(al3, bh7) | 0;
      mid = mid + Math.imul(ah3, bl7) | 0;
      hi = hi + Math.imul(ah3, bh7) | 0;
      lo = lo + Math.imul(al2, bl8) | 0;
      mid = mid + Math.imul(al2, bh8) | 0;
      mid = mid + Math.imul(ah2, bl8) | 0;
      hi = hi + Math.imul(ah2, bh8) | 0;
      lo = lo + Math.imul(al1, bl9) | 0;
      mid = mid + Math.imul(al1, bh9) | 0;
      mid = mid + Math.imul(ah1, bl9) | 0;
      hi = hi + Math.imul(ah1, bh9) | 0;
      var w10 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
      w10 &= 67108863;
      lo = Math.imul(al9, bl2);
      mid = Math.imul(al9, bh2);
      mid = mid + Math.imul(ah9, bl2) | 0;
      hi = Math.imul(ah9, bh2);
      lo = lo + Math.imul(al8, bl3) | 0;
      mid = mid + Math.imul(al8, bh3) | 0;
      mid = mid + Math.imul(ah8, bl3) | 0;
      hi = hi + Math.imul(ah8, bh3) | 0;
      lo = lo + Math.imul(al7, bl4) | 0;
      mid = mid + Math.imul(al7, bh4) | 0;
      mid = mid + Math.imul(ah7, bl4) | 0;
      hi = hi + Math.imul(ah7, bh4) | 0;
      lo = lo + Math.imul(al6, bl5) | 0;
      mid = mid + Math.imul(al6, bh5) | 0;
      mid = mid + Math.imul(ah6, bl5) | 0;
      hi = hi + Math.imul(ah6, bh5) | 0;
      lo = lo + Math.imul(al5, bl6) | 0;
      mid = mid + Math.imul(al5, bh6) | 0;
      mid = mid + Math.imul(ah5, bl6) | 0;
      hi = hi + Math.imul(ah5, bh6) | 0;
      lo = lo + Math.imul(al4, bl7) | 0;
      mid = mid + Math.imul(al4, bh7) | 0;
      mid = mid + Math.imul(ah4, bl7) | 0;
      hi = hi + Math.imul(ah4, bh7) | 0;
      lo = lo + Math.imul(al3, bl8) | 0;
      mid = mid + Math.imul(al3, bh8) | 0;
      mid = mid + Math.imul(ah3, bl8) | 0;
      hi = hi + Math.imul(ah3, bh8) | 0;
      lo = lo + Math.imul(al2, bl9) | 0;
      mid = mid + Math.imul(al2, bh9) | 0;
      mid = mid + Math.imul(ah2, bl9) | 0;
      hi = hi + Math.imul(ah2, bh9) | 0;
      var w11 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
      w11 &= 67108863;
      lo = Math.imul(al9, bl3);
      mid = Math.imul(al9, bh3);
      mid = mid + Math.imul(ah9, bl3) | 0;
      hi = Math.imul(ah9, bh3);
      lo = lo + Math.imul(al8, bl4) | 0;
      mid = mid + Math.imul(al8, bh4) | 0;
      mid = mid + Math.imul(ah8, bl4) | 0;
      hi = hi + Math.imul(ah8, bh4) | 0;
      lo = lo + Math.imul(al7, bl5) | 0;
      mid = mid + Math.imul(al7, bh5) | 0;
      mid = mid + Math.imul(ah7, bl5) | 0;
      hi = hi + Math.imul(ah7, bh5) | 0;
      lo = lo + Math.imul(al6, bl6) | 0;
      mid = mid + Math.imul(al6, bh6) | 0;
      mid = mid + Math.imul(ah6, bl6) | 0;
      hi = hi + Math.imul(ah6, bh6) | 0;
      lo = lo + Math.imul(al5, bl7) | 0;
      mid = mid + Math.imul(al5, bh7) | 0;
      mid = mid + Math.imul(ah5, bl7) | 0;
      hi = hi + Math.imul(ah5, bh7) | 0;
      lo = lo + Math.imul(al4, bl8) | 0;
      mid = mid + Math.imul(al4, bh8) | 0;
      mid = mid + Math.imul(ah4, bl8) | 0;
      hi = hi + Math.imul(ah4, bh8) | 0;
      lo = lo + Math.imul(al3, bl9) | 0;
      mid = mid + Math.imul(al3, bh9) | 0;
      mid = mid + Math.imul(ah3, bl9) | 0;
      hi = hi + Math.imul(ah3, bh9) | 0;
      var w12 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
      w12 &= 67108863;
      lo = Math.imul(al9, bl4);
      mid = Math.imul(al9, bh4);
      mid = mid + Math.imul(ah9, bl4) | 0;
      hi = Math.imul(ah9, bh4);
      lo = lo + Math.imul(al8, bl5) | 0;
      mid = mid + Math.imul(al8, bh5) | 0;
      mid = mid + Math.imul(ah8, bl5) | 0;
      hi = hi + Math.imul(ah8, bh5) | 0;
      lo = lo + Math.imul(al7, bl6) | 0;
      mid = mid + Math.imul(al7, bh6) | 0;
      mid = mid + Math.imul(ah7, bl6) | 0;
      hi = hi + Math.imul(ah7, bh6) | 0;
      lo = lo + Math.imul(al6, bl7) | 0;
      mid = mid + Math.imul(al6, bh7) | 0;
      mid = mid + Math.imul(ah6, bl7) | 0;
      hi = hi + Math.imul(ah6, bh7) | 0;
      lo = lo + Math.imul(al5, bl8) | 0;
      mid = mid + Math.imul(al5, bh8) | 0;
      mid = mid + Math.imul(ah5, bl8) | 0;
      hi = hi + Math.imul(ah5, bh8) | 0;
      lo = lo + Math.imul(al4, bl9) | 0;
      mid = mid + Math.imul(al4, bh9) | 0;
      mid = mid + Math.imul(ah4, bl9) | 0;
      hi = hi + Math.imul(ah4, bh9) | 0;
      var w13 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
      w13 &= 67108863;
      lo = Math.imul(al9, bl5);
      mid = Math.imul(al9, bh5);
      mid = mid + Math.imul(ah9, bl5) | 0;
      hi = Math.imul(ah9, bh5);
      lo = lo + Math.imul(al8, bl6) | 0;
      mid = mid + Math.imul(al8, bh6) | 0;
      mid = mid + Math.imul(ah8, bl6) | 0;
      hi = hi + Math.imul(ah8, bh6) | 0;
      lo = lo + Math.imul(al7, bl7) | 0;
      mid = mid + Math.imul(al7, bh7) | 0;
      mid = mid + Math.imul(ah7, bl7) | 0;
      hi = hi + Math.imul(ah7, bh7) | 0;
      lo = lo + Math.imul(al6, bl8) | 0;
      mid = mid + Math.imul(al6, bh8) | 0;
      mid = mid + Math.imul(ah6, bl8) | 0;
      hi = hi + Math.imul(ah6, bh8) | 0;
      lo = lo + Math.imul(al5, bl9) | 0;
      mid = mid + Math.imul(al5, bh9) | 0;
      mid = mid + Math.imul(ah5, bl9) | 0;
      hi = hi + Math.imul(ah5, bh9) | 0;
      var w14 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
      w14 &= 67108863;
      lo = Math.imul(al9, bl6);
      mid = Math.imul(al9, bh6);
      mid = mid + Math.imul(ah9, bl6) | 0;
      hi = Math.imul(ah9, bh6);
      lo = lo + Math.imul(al8, bl7) | 0;
      mid = mid + Math.imul(al8, bh7) | 0;
      mid = mid + Math.imul(ah8, bl7) | 0;
      hi = hi + Math.imul(ah8, bh7) | 0;
      lo = lo + Math.imul(al7, bl8) | 0;
      mid = mid + Math.imul(al7, bh8) | 0;
      mid = mid + Math.imul(ah7, bl8) | 0;
      hi = hi + Math.imul(ah7, bh8) | 0;
      lo = lo + Math.imul(al6, bl9) | 0;
      mid = mid + Math.imul(al6, bh9) | 0;
      mid = mid + Math.imul(ah6, bl9) | 0;
      hi = hi + Math.imul(ah6, bh9) | 0;
      var w15 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
      w15 &= 67108863;
      lo = Math.imul(al9, bl7);
      mid = Math.imul(al9, bh7);
      mid = mid + Math.imul(ah9, bl7) | 0;
      hi = Math.imul(ah9, bh7);
      lo = lo + Math.imul(al8, bl8) | 0;
      mid = mid + Math.imul(al8, bh8) | 0;
      mid = mid + Math.imul(ah8, bl8) | 0;
      hi = hi + Math.imul(ah8, bh8) | 0;
      lo = lo + Math.imul(al7, bl9) | 0;
      mid = mid + Math.imul(al7, bh9) | 0;
      mid = mid + Math.imul(ah7, bl9) | 0;
      hi = hi + Math.imul(ah7, bh9) | 0;
      var w16 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
      w16 &= 67108863;
      lo = Math.imul(al9, bl8);
      mid = Math.imul(al9, bh8);
      mid = mid + Math.imul(ah9, bl8) | 0;
      hi = Math.imul(ah9, bh8);
      lo = lo + Math.imul(al8, bl9) | 0;
      mid = mid + Math.imul(al8, bh9) | 0;
      mid = mid + Math.imul(ah8, bl9) | 0;
      hi = hi + Math.imul(ah8, bh9) | 0;
      var w17 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
      w17 &= 67108863;
      lo = Math.imul(al9, bl9);
      mid = Math.imul(al9, bh9);
      mid = mid + Math.imul(ah9, bl9) | 0;
      hi = Math.imul(ah9, bh9);
      var w18 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
      c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
      w18 &= 67108863;
      o[0] = w0;
      o[1] = w1;
      o[2] = w2;
      o[3] = w3;
      o[4] = w4;
      o[5] = w5;
      o[6] = w6;
      o[7] = w7;
      o[8] = w8;
      o[9] = w9;
      o[10] = w10;
      o[11] = w11;
      o[12] = w12;
      o[13] = w13;
      o[14] = w14;
      o[15] = w15;
      o[16] = w16;
      o[17] = w17;
      o[18] = w18;
      if (c !== 0) {
        o[19] = c;
        out.length++;
      }
      return out;
    };
    if (!Math.imul) {
      comb10MulTo = smallMulTo;
    }
    function bigMulTo(self, num, out) {
      out.negative = num.negative ^ self.negative;
      out.length = self.length + num.length;
      var carry = 0;
      var hncarry = 0;
      for (var k = 0;k < out.length - 1; k++) {
        var ncarry = hncarry;
        hncarry = 0;
        var rword = carry & 67108863;
        var maxJ = Math.min(k, num.length - 1);
        for (var j = Math.max(0, k - self.length + 1);j <= maxJ; j++) {
          var i2 = k - j;
          var a = self.words[i2] | 0;
          var b = num.words[j] | 0;
          var r = a * b;
          var lo = r & 67108863;
          ncarry = ncarry + (r / 67108864 | 0) | 0;
          lo = lo + rword | 0;
          rword = lo & 67108863;
          ncarry = ncarry + (lo >>> 26) | 0;
          hncarry += ncarry >>> 26;
          ncarry &= 67108863;
        }
        out.words[k] = rword;
        carry = ncarry;
        ncarry = hncarry;
      }
      if (carry !== 0) {
        out.words[k] = carry;
      } else {
        out.length--;
      }
      return out._strip();
    }
    function jumboMulTo(self, num, out) {
      return bigMulTo(self, num, out);
    }
    BN.prototype.mulTo = function mulTo(num, out) {
      var res;
      var len2 = this.length + num.length;
      if (this.length === 10 && num.length === 10) {
        res = comb10MulTo(this, num, out);
      } else if (len2 < 63) {
        res = smallMulTo(this, num, out);
      } else if (len2 < 1024) {
        res = bigMulTo(this, num, out);
      } else {
        res = jumboMulTo(this, num, out);
      }
      return res;
    };
    function FFTM(x, y) {
      this.x = x;
      this.y = y;
    }
    FFTM.prototype.makeRBT = function makeRBT(N) {
      var t = new Array(N);
      var l = BN.prototype._countBits(N) - 1;
      for (var i2 = 0;i2 < N; i2++) {
        t[i2] = this.revBin(i2, l, N);
      }
      return t;
    };
    FFTM.prototype.revBin = function revBin(x, l, N) {
      if (x === 0 || x === N - 1)
        return x;
      var rb = 0;
      for (var i2 = 0;i2 < l; i2++) {
        rb |= (x & 1) << l - i2 - 1;
        x >>= 1;
      }
      return rb;
    };
    FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
      for (var i2 = 0;i2 < N; i2++) {
        rtws[i2] = rws[rbt[i2]];
        itws[i2] = iws[rbt[i2]];
      }
    };
    FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
      this.permute(rbt, rws, iws, rtws, itws, N);
      for (var s = 1;s < N; s <<= 1) {
        var l = s << 1;
        var rtwdf = Math.cos(2 * Math.PI / l);
        var itwdf = Math.sin(2 * Math.PI / l);
        for (var p = 0;p < N; p += l) {
          var rtwdf_ = rtwdf;
          var itwdf_ = itwdf;
          for (var j = 0;j < s; j++) {
            var re = rtws[p + j];
            var ie = itws[p + j];
            var ro = rtws[p + j + s];
            var io = itws[p + j + s];
            var rx = rtwdf_ * ro - itwdf_ * io;
            io = rtwdf_ * io + itwdf_ * ro;
            ro = rx;
            rtws[p + j] = re + ro;
            itws[p + j] = ie + io;
            rtws[p + j + s] = re - ro;
            itws[p + j + s] = ie - io;
            if (j !== l) {
              rx = rtwdf * rtwdf_ - itwdf * itwdf_;
              itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
              rtwdf_ = rx;
            }
          }
        }
      }
    };
    FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
      var N = Math.max(m, n) | 1;
      var odd = N & 1;
      var i2 = 0;
      for (N = N / 2 | 0;N; N = N >>> 1) {
        i2++;
      }
      return 1 << i2 + 1 + odd;
    };
    FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
      if (N <= 1)
        return;
      for (var i2 = 0;i2 < N / 2; i2++) {
        var t = rws[i2];
        rws[i2] = rws[N - i2 - 1];
        rws[N - i2 - 1] = t;
        t = iws[i2];
        iws[i2] = -iws[N - i2 - 1];
        iws[N - i2 - 1] = -t;
      }
    };
    FFTM.prototype.normalize13b = function normalize13b(ws, N) {
      var carry = 0;
      for (var i2 = 0;i2 < N / 2; i2++) {
        var w = Math.round(ws[2 * i2 + 1] / N) * 8192 + Math.round(ws[2 * i2] / N) + carry;
        ws[i2] = w & 67108863;
        if (w < 67108864) {
          carry = 0;
        } else {
          carry = w / 67108864 | 0;
        }
      }
      return ws;
    };
    FFTM.prototype.convert13b = function convert13b(ws, len2, rws, N) {
      var carry = 0;
      for (var i2 = 0;i2 < len2; i2++) {
        carry = carry + (ws[i2] | 0);
        rws[2 * i2] = carry & 8191;
        carry = carry >>> 13;
        rws[2 * i2 + 1] = carry & 8191;
        carry = carry >>> 13;
      }
      for (i2 = 2 * len2;i2 < N; ++i2) {
        rws[i2] = 0;
      }
      assert2(carry === 0);
      assert2((carry & ~8191) === 0);
    };
    FFTM.prototype.stub = function stub(N) {
      var ph = new Array(N);
      for (var i2 = 0;i2 < N; i2++) {
        ph[i2] = 0;
      }
      return ph;
    };
    FFTM.prototype.mulp = function mulp(x, y, out) {
      var N = 2 * this.guessLen13b(x.length, y.length);
      var rbt = this.makeRBT(N);
      var _ = this.stub(N);
      var rws = new Array(N);
      var rwst = new Array(N);
      var iwst = new Array(N);
      var nrws = new Array(N);
      var nrwst = new Array(N);
      var niwst = new Array(N);
      var rmws = out.words;
      rmws.length = N;
      this.convert13b(x.words, x.length, rws, N);
      this.convert13b(y.words, y.length, nrws, N);
      this.transform(rws, _, rwst, iwst, N, rbt);
      this.transform(nrws, _, nrwst, niwst, N, rbt);
      for (var i2 = 0;i2 < N; i2++) {
        var rx = rwst[i2] * nrwst[i2] - iwst[i2] * niwst[i2];
        iwst[i2] = rwst[i2] * niwst[i2] + iwst[i2] * nrwst[i2];
        rwst[i2] = rx;
      }
      this.conjugate(rwst, iwst, N);
      this.transform(rwst, iwst, rmws, _, N, rbt);
      this.conjugate(rmws, _, N);
      this.normalize13b(rmws, N);
      out.negative = x.negative ^ y.negative;
      out.length = x.length + y.length;
      return out._strip();
    };
    BN.prototype.mul = function mul(num) {
      var out = new BN(null);
      out.words = new Array(this.length + num.length);
      return this.mulTo(num, out);
    };
    BN.prototype.mulf = function mulf(num) {
      var out = new BN(null);
      out.words = new Array(this.length + num.length);
      return jumboMulTo(this, num, out);
    };
    BN.prototype.imul = function imul(num) {
      return this.clone().mulTo(num, this);
    };
    BN.prototype.imuln = function imuln(num) {
      var isNegNum = num < 0;
      if (isNegNum)
        num = -num;
      assert2(typeof num === "number");
      assert2(num < 67108864);
      var carry = 0;
      for (var i2 = 0;i2 < this.length; i2++) {
        var w = (this.words[i2] | 0) * num;
        var lo = (w & 67108863) + (carry & 67108863);
        carry >>= 26;
        carry += w / 67108864 | 0;
        carry += lo >>> 26;
        this.words[i2] = lo & 67108863;
      }
      if (carry !== 0) {
        this.words[i2] = carry;
        this.length++;
      }
      this.length = num === 0 ? 1 : this.length;
      return isNegNum ? this.ineg() : this;
    };
    BN.prototype.muln = function muln(num) {
      return this.clone().imuln(num);
    };
    BN.prototype.sqr = function sqr() {
      return this.mul(this);
    };
    BN.prototype.isqr = function isqr() {
      return this.imul(this.clone());
    };
    BN.prototype.pow = function pow(num) {
      var w = toBitArray(num);
      if (w.length === 0)
        return new BN(1);
      var res = this;
      for (var i2 = 0;i2 < w.length; i2++, res = res.sqr()) {
        if (w[i2] !== 0)
          break;
      }
      if (++i2 < w.length) {
        for (var q = res.sqr();i2 < w.length; i2++, q = q.sqr()) {
          if (w[i2] === 0)
            continue;
          res = res.mul(q);
        }
      }
      return res;
    };
    BN.prototype.iushln = function iushln(bits) {
      assert2(typeof bits === "number" && bits >= 0);
      var r = bits % 26;
      var s = (bits - r) / 26;
      var carryMask = 67108863 >>> 26 - r << 26 - r;
      var i2;
      if (r !== 0) {
        var carry = 0;
        for (i2 = 0;i2 < this.length; i2++) {
          var newCarry = this.words[i2] & carryMask;
          var c = (this.words[i2] | 0) - newCarry << r;
          this.words[i2] = c | carry;
          carry = newCarry >>> 26 - r;
        }
        if (carry) {
          this.words[i2] = carry;
          this.length++;
        }
      }
      if (s !== 0) {
        for (i2 = this.length - 1;i2 >= 0; i2--) {
          this.words[i2 + s] = this.words[i2];
        }
        for (i2 = 0;i2 < s; i2++) {
          this.words[i2] = 0;
        }
        this.length += s;
      }
      return this._strip();
    };
    BN.prototype.ishln = function ishln(bits) {
      assert2(this.negative === 0);
      return this.iushln(bits);
    };
    BN.prototype.iushrn = function iushrn(bits, hint, extended) {
      assert2(typeof bits === "number" && bits >= 0);
      var h;
      if (hint) {
        h = (hint - hint % 26) / 26;
      } else {
        h = 0;
      }
      var r = bits % 26;
      var s = Math.min((bits - r) / 26, this.length);
      var mask = 67108863 ^ 67108863 >>> r << r;
      var maskedWords = extended;
      h -= s;
      h = Math.max(0, h);
      if (maskedWords) {
        for (var i2 = 0;i2 < s; i2++) {
          maskedWords.words[i2] = this.words[i2];
        }
        maskedWords.length = s;
      }
      if (s === 0) {} else if (this.length > s) {
        this.length -= s;
        for (i2 = 0;i2 < this.length; i2++) {
          this.words[i2] = this.words[i2 + s];
        }
      } else {
        this.words[0] = 0;
        this.length = 1;
      }
      var carry = 0;
      for (i2 = this.length - 1;i2 >= 0 && (carry !== 0 || i2 >= h); i2--) {
        var word = this.words[i2] | 0;
        this.words[i2] = carry << 26 - r | word >>> r;
        carry = word & mask;
      }
      if (maskedWords && carry !== 0) {
        maskedWords.words[maskedWords.length++] = carry;
      }
      if (this.length === 0) {
        this.words[0] = 0;
        this.length = 1;
      }
      return this._strip();
    };
    BN.prototype.ishrn = function ishrn(bits, hint, extended) {
      assert2(this.negative === 0);
      return this.iushrn(bits, hint, extended);
    };
    BN.prototype.shln = function shln(bits) {
      return this.clone().ishln(bits);
    };
    BN.prototype.ushln = function ushln(bits) {
      return this.clone().iushln(bits);
    };
    BN.prototype.shrn = function shrn(bits) {
      return this.clone().ishrn(bits);
    };
    BN.prototype.ushrn = function ushrn(bits) {
      return this.clone().iushrn(bits);
    };
    BN.prototype.testn = function testn(bit) {
      assert2(typeof bit === "number" && bit >= 0);
      var r = bit % 26;
      var s = (bit - r) / 26;
      var q = 1 << r;
      if (this.length <= s)
        return false;
      var w = this.words[s];
      return !!(w & q);
    };
    BN.prototype.imaskn = function imaskn(bits) {
      assert2(typeof bits === "number" && bits >= 0);
      var r = bits % 26;
      var s = (bits - r) / 26;
      assert2(this.negative === 0, "imaskn works only with positive numbers");
      if (this.length <= s) {
        return this;
      }
      if (r !== 0) {
        s++;
      }
      this.length = Math.min(s, this.length);
      if (r !== 0) {
        var mask = 67108863 ^ 67108863 >>> r << r;
        this.words[this.length - 1] &= mask;
      }
      return this._strip();
    };
    BN.prototype.maskn = function maskn(bits) {
      return this.clone().imaskn(bits);
    };
    BN.prototype.iaddn = function iaddn(num) {
      assert2(typeof num === "number");
      assert2(num < 67108864);
      if (num < 0)
        return this.isubn(-num);
      if (this.negative !== 0) {
        if (this.length === 1 && (this.words[0] | 0) <= num) {
          this.words[0] = num - (this.words[0] | 0);
          this.negative = 0;
          return this;
        }
        this.negative = 0;
        this.isubn(num);
        this.negative = 1;
        return this;
      }
      return this._iaddn(num);
    };
    BN.prototype._iaddn = function _iaddn(num) {
      this.words[0] += num;
      for (var i2 = 0;i2 < this.length && this.words[i2] >= 67108864; i2++) {
        this.words[i2] -= 67108864;
        if (i2 === this.length - 1) {
          this.words[i2 + 1] = 1;
        } else {
          this.words[i2 + 1]++;
        }
      }
      this.length = Math.max(this.length, i2 + 1);
      return this;
    };
    BN.prototype.isubn = function isubn(num) {
      assert2(typeof num === "number");
      assert2(num < 67108864);
      if (num < 0)
        return this.iaddn(-num);
      if (this.negative !== 0) {
        this.negative = 0;
        this.iaddn(num);
        this.negative = 1;
        return this;
      }
      this.words[0] -= num;
      if (this.length === 1 && this.words[0] < 0) {
        this.words[0] = -this.words[0];
        this.negative = 1;
      } else {
        for (var i2 = 0;i2 < this.length && this.words[i2] < 0; i2++) {
          this.words[i2] += 67108864;
          this.words[i2 + 1] -= 1;
        }
      }
      return this._strip();
    };
    BN.prototype.addn = function addn(num) {
      return this.clone().iaddn(num);
    };
    BN.prototype.subn = function subn(num) {
      return this.clone().isubn(num);
    };
    BN.prototype.iabs = function iabs() {
      this.negative = 0;
      return this;
    };
    BN.prototype.abs = function abs() {
      return this.clone().iabs();
    };
    BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
      var len2 = num.length + shift;
      var i2;
      this._expand(len2);
      var w;
      var carry = 0;
      for (i2 = 0;i2 < num.length; i2++) {
        w = (this.words[i2 + shift] | 0) + carry;
        var right = (num.words[i2] | 0) * mul;
        w -= right & 67108863;
        carry = (w >> 26) - (right / 67108864 | 0);
        this.words[i2 + shift] = w & 67108863;
      }
      for (;i2 < this.length - shift; i2++) {
        w = (this.words[i2 + shift] | 0) + carry;
        carry = w >> 26;
        this.words[i2 + shift] = w & 67108863;
      }
      if (carry === 0)
        return this._strip();
      assert2(carry === -1);
      carry = 0;
      for (i2 = 0;i2 < this.length; i2++) {
        w = -(this.words[i2] | 0) + carry;
        carry = w >> 26;
        this.words[i2] = w & 67108863;
      }
      this.negative = 1;
      return this._strip();
    };
    BN.prototype._wordDiv = function _wordDiv(num, mode) {
      var shift = this.length - num.length;
      var a = this.clone();
      var b = num;
      var bhi = b.words[b.length - 1] | 0;
      var bhiBits = this._countBits(bhi);
      shift = 26 - bhiBits;
      if (shift !== 0) {
        b = b.ushln(shift);
        a.iushln(shift);
        bhi = b.words[b.length - 1] | 0;
      }
      var m = a.length - b.length;
      var q;
      if (mode !== "mod") {
        q = new BN(null);
        q.length = m + 1;
        q.words = new Array(q.length);
        for (var i2 = 0;i2 < q.length; i2++) {
          q.words[i2] = 0;
        }
      }
      var diff = a.clone()._ishlnsubmul(b, 1, m);
      if (diff.negative === 0) {
        a = diff;
        if (q) {
          q.words[m] = 1;
        }
      }
      for (var j = m - 1;j >= 0; j--) {
        var qj = (a.words[b.length + j] | 0) * 67108864 + (a.words[b.length + j - 1] | 0);
        qj = Math.min(qj / bhi | 0, 67108863);
        a._ishlnsubmul(b, qj, j);
        while (a.negative !== 0) {
          qj--;
          a.negative = 0;
          a._ishlnsubmul(b, 1, j);
          if (!a.isZero()) {
            a.negative ^= 1;
          }
        }
        if (q) {
          q.words[j] = qj;
        }
      }
      if (q) {
        q._strip();
      }
      a._strip();
      if (mode !== "div" && shift !== 0) {
        a.iushrn(shift);
      }
      return {
        div: q || null,
        mod: a
      };
    };
    BN.prototype.divmod = function divmod(num, mode, positive) {
      assert2(!num.isZero());
      if (this.isZero()) {
        return {
          div: new BN(0),
          mod: new BN(0)
        };
      }
      var div, mod, res;
      if (this.negative !== 0 && num.negative === 0) {
        res = this.neg().divmod(num, mode);
        if (mode !== "mod") {
          div = res.div.neg();
        }
        if (mode !== "div") {
          mod = res.mod.neg();
          if (positive && mod.negative !== 0) {
            mod.iadd(num);
          }
        }
        return {
          div,
          mod
        };
      }
      if (this.negative === 0 && num.negative !== 0) {
        res = this.divmod(num.neg(), mode);
        if (mode !== "mod") {
          div = res.div.neg();
        }
        return {
          div,
          mod: res.mod
        };
      }
      if ((this.negative & num.negative) !== 0) {
        res = this.neg().divmod(num.neg(), mode);
        if (mode !== "div") {
          mod = res.mod.neg();
          if (positive && mod.negative !== 0) {
            mod.isub(num);
          }
        }
        return {
          div: res.div,
          mod
        };
      }
      if (num.length > this.length || this.cmp(num) < 0) {
        return {
          div: new BN(0),
          mod: this
        };
      }
      if (num.length === 1) {
        if (mode === "div") {
          return {
            div: this.divn(num.words[0]),
            mod: null
          };
        }
        if (mode === "mod") {
          return {
            div: null,
            mod: new BN(this.modrn(num.words[0]))
          };
        }
        return {
          div: this.divn(num.words[0]),
          mod: new BN(this.modrn(num.words[0]))
        };
      }
      return this._wordDiv(num, mode);
    };
    BN.prototype.div = function div(num) {
      return this.divmod(num, "div", false).div;
    };
    BN.prototype.mod = function mod(num) {
      return this.divmod(num, "mod", false).mod;
    };
    BN.prototype.umod = function umod(num) {
      return this.divmod(num, "mod", true).mod;
    };
    BN.prototype.divRound = function divRound(num) {
      var dm = this.divmod(num);
      if (dm.mod.isZero())
        return dm.div;
      var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;
      var half = num.ushrn(1);
      var r2 = num.andln(1);
      var cmp = mod.cmp(half);
      if (cmp < 0 || r2 === 1 && cmp === 0)
        return dm.div;
      return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
    };
    BN.prototype.modrn = function modrn(num) {
      var isNegNum = num < 0;
      if (isNegNum)
        num = -num;
      assert2(num <= 67108863);
      var p = (1 << 26) % num;
      var acc = 0;
      for (var i2 = this.length - 1;i2 >= 0; i2--) {
        acc = (p * acc + (this.words[i2] | 0)) % num;
      }
      return isNegNum ? -acc : acc;
    };
    BN.prototype.modn = function modn(num) {
      return this.modrn(num);
    };
    BN.prototype.idivn = function idivn(num) {
      var isNegNum = num < 0;
      if (isNegNum)
        num = -num;
      assert2(num <= 67108863);
      var carry = 0;
      for (var i2 = this.length - 1;i2 >= 0; i2--) {
        var w = (this.words[i2] | 0) + carry * 67108864;
        this.words[i2] = w / num | 0;
        carry = w % num;
      }
      this._strip();
      return isNegNum ? this.ineg() : this;
    };
    BN.prototype.divn = function divn(num) {
      return this.clone().idivn(num);
    };
    BN.prototype.egcd = function egcd(p) {
      assert2(p.negative === 0);
      assert2(!p.isZero());
      var x = this;
      var y = p.clone();
      if (x.negative !== 0) {
        x = x.umod(p);
      } else {
        x = x.clone();
      }
      var A = new BN(1);
      var B = new BN(0);
      var C = new BN(0);
      var D = new BN(1);
      var g = 0;
      while (x.isEven() && y.isEven()) {
        x.iushrn(1);
        y.iushrn(1);
        ++g;
      }
      var yp = y.clone();
      var xp = x.clone();
      while (!x.isZero()) {
        for (var i2 = 0, im = 1;(x.words[0] & im) === 0 && i2 < 26; ++i2, im <<= 1)
          ;
        if (i2 > 0) {
          x.iushrn(i2);
          while (i2-- > 0) {
            if (A.isOdd() || B.isOdd()) {
              A.iadd(yp);
              B.isub(xp);
            }
            A.iushrn(1);
            B.iushrn(1);
          }
        }
        for (var j = 0, jm = 1;(y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1)
          ;
        if (j > 0) {
          y.iushrn(j);
          while (j-- > 0) {
            if (C.isOdd() || D.isOdd()) {
              C.iadd(yp);
              D.isub(xp);
            }
            C.iushrn(1);
            D.iushrn(1);
          }
        }
        if (x.cmp(y) >= 0) {
          x.isub(y);
          A.isub(C);
          B.isub(D);
        } else {
          y.isub(x);
          C.isub(A);
          D.isub(B);
        }
      }
      return {
        a: C,
        b: D,
        gcd: y.iushln(g)
      };
    };
    BN.prototype._invmp = function _invmp(p) {
      assert2(p.negative === 0);
      assert2(!p.isZero());
      var a = this;
      var b = p.clone();
      if (a.negative !== 0) {
        a = a.umod(p);
      } else {
        a = a.clone();
      }
      var x1 = new BN(1);
      var x2 = new BN(0);
      var delta = b.clone();
      while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
        for (var i2 = 0, im = 1;(a.words[0] & im) === 0 && i2 < 26; ++i2, im <<= 1)
          ;
        if (i2 > 0) {
          a.iushrn(i2);
          while (i2-- > 0) {
            if (x1.isOdd()) {
              x1.iadd(delta);
            }
            x1.iushrn(1);
          }
        }
        for (var j = 0, jm = 1;(b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1)
          ;
        if (j > 0) {
          b.iushrn(j);
          while (j-- > 0) {
            if (x2.isOdd()) {
              x2.iadd(delta);
            }
            x2.iushrn(1);
          }
        }
        if (a.cmp(b) >= 0) {
          a.isub(b);
          x1.isub(x2);
        } else {
          b.isub(a);
          x2.isub(x1);
        }
      }
      var res;
      if (a.cmpn(1) === 0) {
        res = x1;
      } else {
        res = x2;
      }
      if (res.cmpn(0) < 0) {
        res.iadd(p);
      }
      return res;
    };
    BN.prototype.gcd = function gcd(num) {
      if (this.isZero())
        return num.abs();
      if (num.isZero())
        return this.abs();
      var a = this.clone();
      var b = num.clone();
      a.negative = 0;
      b.negative = 0;
      for (var shift = 0;a.isEven() && b.isEven(); shift++) {
        a.iushrn(1);
        b.iushrn(1);
      }
      do {
        while (a.isEven()) {
          a.iushrn(1);
        }
        while (b.isEven()) {
          b.iushrn(1);
        }
        var r = a.cmp(b);
        if (r < 0) {
          var t = a;
          a = b;
          b = t;
        } else if (r === 0 || b.cmpn(1) === 0) {
          break;
        }
        a.isub(b);
      } while (true);
      return b.iushln(shift);
    };
    BN.prototype.invm = function invm(num) {
      return this.egcd(num).a.umod(num);
    };
    BN.prototype.isEven = function isEven() {
      return (this.words[0] & 1) === 0;
    };
    BN.prototype.isOdd = function isOdd() {
      return (this.words[0] & 1) === 1;
    };
    BN.prototype.andln = function andln(num) {
      return this.words[0] & num;
    };
    BN.prototype.bincn = function bincn(bit) {
      assert2(typeof bit === "number");
      var r = bit % 26;
      var s = (bit - r) / 26;
      var q = 1 << r;
      if (this.length <= s) {
        this._expand(s + 1);
        this.words[s] |= q;
        return this;
      }
      var carry = q;
      for (var i2 = s;carry !== 0 && i2 < this.length; i2++) {
        var w = this.words[i2] | 0;
        w += carry;
        carry = w >>> 26;
        w &= 67108863;
        this.words[i2] = w;
      }
      if (carry !== 0) {
        this.words[i2] = carry;
        this.length++;
      }
      return this;
    };
    BN.prototype.isZero = function isZero() {
      return this.length === 1 && this.words[0] === 0;
    };
    BN.prototype.cmpn = function cmpn(num) {
      var negative = num < 0;
      if (this.negative !== 0 && !negative)
        return -1;
      if (this.negative === 0 && negative)
        return 1;
      this._strip();
      var res;
      if (this.length > 1) {
        res = 1;
      } else {
        if (negative) {
          num = -num;
        }
        assert2(num <= 67108863, "Number is too big");
        var w = this.words[0] | 0;
        res = w === num ? 0 : w < num ? -1 : 1;
      }
      if (this.negative !== 0)
        return -res | 0;
      return res;
    };
    BN.prototype.cmp = function cmp(num) {
      if (this.negative !== 0 && num.negative === 0)
        return -1;
      if (this.negative === 0 && num.negative !== 0)
        return 1;
      var res = this.ucmp(num);
      if (this.negative !== 0)
        return -res | 0;
      return res;
    };
    BN.prototype.ucmp = function ucmp(num) {
      if (this.length > num.length)
        return 1;
      if (this.length < num.length)
        return -1;
      var res = 0;
      for (var i2 = this.length - 1;i2 >= 0; i2--) {
        var a = this.words[i2] | 0;
        var b = num.words[i2] | 0;
        if (a === b)
          continue;
        if (a < b) {
          res = -1;
        } else if (a > b) {
          res = 1;
        }
        break;
      }
      return res;
    };
    BN.prototype.gtn = function gtn(num) {
      return this.cmpn(num) === 1;
    };
    BN.prototype.gt = function gt(num) {
      return this.cmp(num) === 1;
    };
    BN.prototype.gten = function gten(num) {
      return this.cmpn(num) >= 0;
    };
    BN.prototype.gte = function gte(num) {
      return this.cmp(num) >= 0;
    };
    BN.prototype.ltn = function ltn(num) {
      return this.cmpn(num) === -1;
    };
    BN.prototype.lt = function lt(num) {
      return this.cmp(num) === -1;
    };
    BN.prototype.lten = function lten(num) {
      return this.cmpn(num) <= 0;
    };
    BN.prototype.lte = function lte(num) {
      return this.cmp(num) <= 0;
    };
    BN.prototype.eqn = function eqn(num) {
      return this.cmpn(num) === 0;
    };
    BN.prototype.eq = function eq(num) {
      return this.cmp(num) === 0;
    };
    BN.red = function red(num) {
      return new Red(num);
    };
    BN.prototype.toRed = function toRed(ctx) {
      assert2(!this.red, "Already a number in reduction context");
      assert2(this.negative === 0, "red works only with positives");
      return ctx.convertTo(this)._forceRed(ctx);
    };
    BN.prototype.fromRed = function fromRed() {
      assert2(this.red, "fromRed works only with numbers in reduction context");
      return this.red.convertFrom(this);
    };
    BN.prototype._forceRed = function _forceRed(ctx) {
      this.red = ctx;
      return this;
    };
    BN.prototype.forceRed = function forceRed(ctx) {
      assert2(!this.red, "Already a number in reduction context");
      return this._forceRed(ctx);
    };
    BN.prototype.redAdd = function redAdd(num) {
      assert2(this.red, "redAdd works only with red numbers");
      return this.red.add(this, num);
    };
    BN.prototype.redIAdd = function redIAdd(num) {
      assert2(this.red, "redIAdd works only with red numbers");
      return this.red.iadd(this, num);
    };
    BN.prototype.redSub = function redSub(num) {
      assert2(this.red, "redSub works only with red numbers");
      return this.red.sub(this, num);
    };
    BN.prototype.redISub = function redISub(num) {
      assert2(this.red, "redISub works only with red numbers");
      return this.red.isub(this, num);
    };
    BN.prototype.redShl = function redShl(num) {
      assert2(this.red, "redShl works only with red numbers");
      return this.red.shl(this, num);
    };
    BN.prototype.redMul = function redMul(num) {
      assert2(this.red, "redMul works only with red numbers");
      this.red._verify2(this, num);
      return this.red.mul(this, num);
    };
    BN.prototype.redIMul = function redIMul(num) {
      assert2(this.red, "redMul works only with red numbers");
      this.red._verify2(this, num);
      return this.red.imul(this, num);
    };
    BN.prototype.redSqr = function redSqr() {
      assert2(this.red, "redSqr works only with red numbers");
      this.red._verify1(this);
      return this.red.sqr(this);
    };
    BN.prototype.redISqr = function redISqr() {
      assert2(this.red, "redISqr works only with red numbers");
      this.red._verify1(this);
      return this.red.isqr(this);
    };
    BN.prototype.redSqrt = function redSqrt() {
      assert2(this.red, "redSqrt works only with red numbers");
      this.red._verify1(this);
      return this.red.sqrt(this);
    };
    BN.prototype.redInvm = function redInvm() {
      assert2(this.red, "redInvm works only with red numbers");
      this.red._verify1(this);
      return this.red.invm(this);
    };
    BN.prototype.redNeg = function redNeg() {
      assert2(this.red, "redNeg works only with red numbers");
      this.red._verify1(this);
      return this.red.neg(this);
    };
    BN.prototype.redPow = function redPow(num) {
      assert2(this.red && !num.red, "redPow(normalNum)");
      this.red._verify1(this);
      return this.red.pow(this, num);
    };
    var primes = {
      k256: null,
      p224: null,
      p192: null,
      p25519: null
    };
    function MPrime(name, p) {
      this.name = name;
      this.p = new BN(p, 16);
      this.n = this.p.bitLength();
      this.k = new BN(1).iushln(this.n).isub(this.p);
      this.tmp = this._tmp();
    }
    MPrime.prototype._tmp = function _tmp() {
      var tmp = new BN(null);
      tmp.words = new Array(Math.ceil(this.n / 13));
      return tmp;
    };
    MPrime.prototype.ireduce = function ireduce(num) {
      var r = num;
      var rlen;
      do {
        this.split(r, this.tmp);
        r = this.imulK(r);
        r = r.iadd(this.tmp);
        rlen = r.bitLength();
      } while (rlen > this.n);
      var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
      if (cmp === 0) {
        r.words[0] = 0;
        r.length = 1;
      } else if (cmp > 0) {
        r.isub(this.p);
      } else {
        if (r.strip !== undefined) {
          r.strip();
        } else {
          r._strip();
        }
      }
      return r;
    };
    MPrime.prototype.split = function split(input, out) {
      input.iushrn(this.n, 0, out);
    };
    MPrime.prototype.imulK = function imulK(num) {
      return num.imul(this.k);
    };
    function K256() {
      MPrime.call(this, "k256", "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f");
    }
    inherits2(K256, MPrime);
    K256.prototype.split = function split(input, output) {
      var mask = 4194303;
      var outLen = Math.min(input.length, 9);
      for (var i2 = 0;i2 < outLen; i2++) {
        output.words[i2] = input.words[i2];
      }
      output.length = outLen;
      if (input.length <= 9) {
        input.words[0] = 0;
        input.length = 1;
        return;
      }
      var prev = input.words[9];
      output.words[output.length++] = prev & mask;
      for (i2 = 10;i2 < input.length; i2++) {
        var next = input.words[i2] | 0;
        input.words[i2 - 10] = (next & mask) << 4 | prev >>> 22;
        prev = next;
      }
      prev >>>= 22;
      input.words[i2 - 10] = prev;
      if (prev === 0 && input.length > 10) {
        input.length -= 10;
      } else {
        input.length -= 9;
      }
    };
    K256.prototype.imulK = function imulK(num) {
      num.words[num.length] = 0;
      num.words[num.length + 1] = 0;
      num.length += 2;
      var lo = 0;
      for (var i2 = 0;i2 < num.length; i2++) {
        var w = num.words[i2] | 0;
        lo += w * 977;
        num.words[i2] = lo & 67108863;
        lo = w * 64 + (lo / 67108864 | 0);
      }
      if (num.words[num.length - 1] === 0) {
        num.length--;
        if (num.words[num.length - 1] === 0) {
          num.length--;
        }
      }
      return num;
    };
    function P224() {
      MPrime.call(this, "p224", "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001");
    }
    inherits2(P224, MPrime);
    function P192() {
      MPrime.call(this, "p192", "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff");
    }
    inherits2(P192, MPrime);
    function P25519() {
      MPrime.call(this, "25519", "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed");
    }
    inherits2(P25519, MPrime);
    P25519.prototype.imulK = function imulK(num) {
      var carry = 0;
      for (var i2 = 0;i2 < num.length; i2++) {
        var hi = (num.words[i2] | 0) * 19 + carry;
        var lo = hi & 67108863;
        hi >>>= 26;
        num.words[i2] = lo;
        carry = hi;
      }
      if (carry !== 0) {
        num.words[num.length++] = carry;
      }
      return num;
    };
    BN._prime = function prime(name) {
      if (primes[name])
        return primes[name];
      var prime;
      if (name === "k256") {
        prime = new K256;
      } else if (name === "p224") {
        prime = new P224;
      } else if (name === "p192") {
        prime = new P192;
      } else if (name === "p25519") {
        prime = new P25519;
      } else {
        throw new Error("Unknown prime " + name);
      }
      primes[name] = prime;
      return prime;
    };
    function Red(m) {
      if (typeof m === "string") {
        var prime = BN._prime(m);
        this.m = prime.p;
        this.prime = prime;
      } else {
        assert2(m.gtn(1), "modulus must be greater than 1");
        this.m = m;
        this.prime = null;
      }
    }
    Red.prototype._verify1 = function _verify1(a) {
      assert2(a.negative === 0, "red works only with positives");
      assert2(a.red, "red works only with red numbers");
    };
    Red.prototype._verify2 = function _verify2(a, b) {
      assert2((a.negative | b.negative) === 0, "red works only with positives");
      assert2(a.red && a.red === b.red, "red works only with red numbers");
    };
    Red.prototype.imod = function imod(a) {
      if (this.prime)
        return this.prime.ireduce(a)._forceRed(this);
      move(a, a.umod(this.m)._forceRed(this));
      return a;
    };
    Red.prototype.neg = function neg(a) {
      if (a.isZero()) {
        return a.clone();
      }
      return this.m.sub(a)._forceRed(this);
    };
    Red.prototype.add = function add(a, b) {
      this._verify2(a, b);
      var res = a.add(b);
      if (res.cmp(this.m) >= 0) {
        res.isub(this.m);
      }
      return res._forceRed(this);
    };
    Red.prototype.iadd = function iadd(a, b) {
      this._verify2(a, b);
      var res = a.iadd(b);
      if (res.cmp(this.m) >= 0) {
        res.isub(this.m);
      }
      return res;
    };
    Red.prototype.sub = function sub(a, b) {
      this._verify2(a, b);
      var res = a.sub(b);
      if (res.cmpn(0) < 0) {
        res.iadd(this.m);
      }
      return res._forceRed(this);
    };
    Red.prototype.isub = function isub(a, b) {
      this._verify2(a, b);
      var res = a.isub(b);
      if (res.cmpn(0) < 0) {
        res.iadd(this.m);
      }
      return res;
    };
    Red.prototype.shl = function shl(a, num) {
      this._verify1(a);
      return this.imod(a.ushln(num));
    };
    Red.prototype.imul = function imul(a, b) {
      this._verify2(a, b);
      return this.imod(a.imul(b));
    };
    Red.prototype.mul = function mul(a, b) {
      this._verify2(a, b);
      return this.imod(a.mul(b));
    };
    Red.prototype.isqr = function isqr(a) {
      return this.imul(a, a.clone());
    };
    Red.prototype.sqr = function sqr(a) {
      return this.mul(a, a);
    };
    Red.prototype.sqrt = function sqrt(a) {
      if (a.isZero())
        return a.clone();
      var mod3 = this.m.andln(3);
      assert2(mod3 % 2 === 1);
      if (mod3 === 3) {
        var pow = this.m.add(new BN(1)).iushrn(2);
        return this.pow(a, pow);
      }
      var q = this.m.subn(1);
      var s = 0;
      while (!q.isZero() && q.andln(1) === 0) {
        s++;
        q.iushrn(1);
      }
      assert2(!q.isZero());
      var one = new BN(1).toRed(this);
      var nOne = one.redNeg();
      var lpow = this.m.subn(1).iushrn(1);
      var z = this.m.bitLength();
      z = new BN(2 * z * z).toRed(this);
      while (this.pow(z, lpow).cmp(nOne) !== 0) {
        z.redIAdd(nOne);
      }
      var c = this.pow(z, q);
      var r = this.pow(a, q.addn(1).iushrn(1));
      var t = this.pow(a, q);
      var m = s;
      while (t.cmp(one) !== 0) {
        var tmp = t;
        for (var i2 = 0;tmp.cmp(one) !== 0; i2++) {
          tmp = tmp.redSqr();
        }
        assert2(i2 < m);
        var b = this.pow(c, new BN(1).iushln(m - i2 - 1));
        r = r.redMul(b);
        c = b.redSqr();
        t = t.redMul(c);
        m = i2;
      }
      return r;
    };
    Red.prototype.invm = function invm(a) {
      var inv = a._invmp(this.m);
      if (inv.negative !== 0) {
        inv.negative = 0;
        return this.imod(inv).redNeg();
      } else {
        return this.imod(inv);
      }
    };
    Red.prototype.pow = function pow(a, num) {
      if (num.isZero())
        return new BN(1).toRed(this);
      if (num.cmpn(1) === 0)
        return a.clone();
      var windowSize = 4;
      var wnd = new Array(1 << windowSize);
      wnd[0] = new BN(1).toRed(this);
      wnd[1] = a;
      for (var i2 = 2;i2 < wnd.length; i2++) {
        wnd[i2] = this.mul(wnd[i2 - 1], a);
      }
      var res = wnd[0];
      var current = 0;
      var currentLen = 0;
      var start = num.bitLength() % 26;
      if (start === 0) {
        start = 26;
      }
      for (i2 = num.length - 1;i2 >= 0; i2--) {
        var word = num.words[i2];
        for (var j = start - 1;j >= 0; j--) {
          var bit = word >> j & 1;
          if (res !== wnd[0]) {
            res = this.sqr(res);
          }
          if (bit === 0 && current === 0) {
            currentLen = 0;
            continue;
          }
          current <<= 1;
          current |= bit;
          currentLen++;
          if (currentLen !== windowSize && (i2 !== 0 || j !== 0))
            continue;
          res = this.mul(res, wnd[current]);
          currentLen = 0;
          current = 0;
        }
        start = 26;
      }
      return res;
    };
    Red.prototype.convertTo = function convertTo(num) {
      var r = num.umod(this.m);
      return r === num ? r.clone() : r;
    };
    Red.prototype.convertFrom = function convertFrom(num) {
      var res = num.clone();
      res.red = null;
      return res;
    };
    BN.mont = function mont(num) {
      return new Mont(num);
    };
    function Mont(m) {
      Red.call(this, m);
      this.shift = this.m.bitLength();
      if (this.shift % 26 !== 0) {
        this.shift += 26 - this.shift % 26;
      }
      this.r = new BN(1).iushln(this.shift);
      this.r2 = this.imod(this.r.sqr());
      this.rinv = this.r._invmp(this.m);
      this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
      this.minv = this.minv.umod(this.r);
      this.minv = this.r.sub(this.minv);
    }
    inherits2(Mont, Red);
    Mont.prototype.convertTo = function convertTo(num) {
      return this.imod(num.ushln(this.shift));
    };
    Mont.prototype.convertFrom = function convertFrom(num) {
      var r = this.imod(num.mul(this.rinv));
      r.red = null;
      return r;
    };
    Mont.prototype.imul = function imul(a, b) {
      if (a.isZero() || b.isZero()) {
        a.words[0] = 0;
        a.length = 1;
        return a;
      }
      var t = a.imul(b);
      var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
      var u = t.isub(c).iushrn(this.shift);
      var res = u;
      if (u.cmp(this.m) >= 0) {
        res = u.isub(this.m);
      } else if (u.cmpn(0) < 0) {
        res = u.iadd(this.m);
      }
      return res._forceRed(this);
    };
    Mont.prototype.mul = function mul(a, b) {
      if (a.isZero() || b.isZero())
        return new BN(0)._forceRed(this);
      var t = a.mul(b);
      var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
      var u = t.isub(c).iushrn(this.shift);
      var res = u;
      if (u.cmp(this.m) >= 0) {
        res = u.isub(this.m);
      } else if (u.cmpn(0) < 0) {
        res = u.iadd(this.m);
      }
      return res._forceRed(this);
    };
    Mont.prototype.invm = function invm(a) {
      var res = this.imod(a._invmp(this.m).mul(this.r2));
      return res._forceRed(this);
    };
  })(typeof module === "undefined" || module, exports);
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/numbers.js
var require_numbers = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.numbersTypeMap = exports.bool = exports.i512 = exports.i256 = exports.i128 = exports.i64 = exports.i32 = exports.i16 = exports.i8 = exports.u512 = exports.u256 = exports.u128 = exports.u64 = exports.u32 = exports.u16 = exports.u8 = undefined;
  var bn_js_1 = __importDefault(require_bn());
  var types_1 = require_types2();
  exports.u8 = {
    write: function(buf, offset, value) {
      buf.writeUInt8(value, offset);
    },
    read: function(buf, offset) {
      return buf.readUInt8(offset);
    },
    byteSize: 1,
    description: "u8"
  };
  exports.u16 = {
    write: function(buf, offset, value) {
      buf.writeUInt16LE(value, offset);
    },
    read: function(buf, offset) {
      return buf.readUInt16LE(offset);
    },
    byteSize: 2,
    description: "u16"
  };
  exports.u32 = {
    write: function(buf, offset, value) {
      buf.writeUInt32LE(value, offset);
    },
    read: function(buf, offset) {
      return buf.readUInt32LE(offset);
    },
    byteSize: 4,
    description: "u32"
  };
  function unsignedLargeBeet(byteSize, description) {
    return {
      write: function(buf, offset, value) {
        const bn = bn_js_1.default.isBN(value) ? value : new bn_js_1.default(value);
        const bytesArray = bn.toArray("le", this.byteSize);
        const bytesArrayBuf = Buffer.from(bytesArray);
        bytesArrayBuf.copy(buf, offset, 0, this.byteSize);
      },
      read: function(buf, offset) {
        const slice2 = buf.slice(offset, offset + this.byteSize);
        return new bn_js_1.default(slice2, "le");
      },
      byteSize,
      description
    };
  }
  exports.u64 = unsignedLargeBeet(8, "u64");
  exports.u128 = unsignedLargeBeet(16, "u128");
  exports.u256 = unsignedLargeBeet(32, "u256");
  exports.u512 = unsignedLargeBeet(64, "u512");
  exports.i8 = {
    write: function(buf, offset, value) {
      buf.writeInt8(value, offset);
    },
    read: function(buf, offset) {
      return buf.readInt8(offset);
    },
    byteSize: 1,
    description: "i8"
  };
  exports.i16 = {
    write: function(buf, offset, value) {
      buf.writeInt16LE(value, offset);
    },
    read: function(buf, offset) {
      return buf.readInt16LE(offset);
    },
    byteSize: 2,
    description: "i16"
  };
  exports.i32 = {
    write: function(buf, offset, value) {
      buf.writeInt32LE(value, offset);
    },
    read: function(buf, offset) {
      return buf.readInt32LE(offset);
    },
    byteSize: 4,
    description: "i32"
  };
  function signedLargeBeet(byteSize, description) {
    const bitSize = byteSize * 8;
    return {
      write: function(buf, offset, value) {
        const bn = (bn_js_1.default.isBN(value) ? value : new bn_js_1.default(value)).toTwos(bitSize);
        const bytesArray = bn.toArray("le", this.byteSize);
        const bytesArrayBuf = Buffer.from(bytesArray);
        bytesArrayBuf.copy(buf, offset, 0, this.byteSize);
      },
      read: function(buf, offset) {
        const slice2 = buf.slice(offset, offset + this.byteSize);
        const x = new bn_js_1.default(slice2, "le");
        return x.fromTwos(bitSize);
      },
      byteSize,
      description
    };
  }
  exports.i64 = signedLargeBeet(8, "i64");
  exports.i128 = signedLargeBeet(16, "i128");
  exports.i256 = signedLargeBeet(32, "i256");
  exports.i512 = signedLargeBeet(64, "i512");
  exports.bool = {
    write: function(buf, offset, value) {
      const n = value ? 1 : 0;
      exports.u8.write(buf, offset, n);
    },
    read: function(buf, offset) {
      return exports.u8.read(buf, offset) === 1;
    },
    byteSize: 1,
    description: "bool"
  };
  exports.numbersTypeMap = {
    u8: { beet: "u8", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "number" },
    u16: { beet: "u16", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "number" },
    u32: { beet: "u32", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "number" },
    i8: { beet: "i8", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "number" },
    i16: { beet: "i16", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "number" },
    i32: { beet: "i32", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "number" },
    bool: { beet: "bool", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "boolean" },
    u64: { beet: "u64", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "bignum", pack: types_1.BEET_PACKAGE },
    u128: { beet: "u128", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "bignum", pack: types_1.BEET_PACKAGE },
    u256: { beet: "u256", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "bignum", pack: types_1.BEET_PACKAGE },
    u512: { beet: "u512", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "bignum", pack: types_1.BEET_PACKAGE },
    i64: { beet: "i64", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "bignum", pack: types_1.BEET_PACKAGE },
    i128: { beet: "i128", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "bignum", pack: types_1.BEET_PACKAGE },
    i256: { beet: "i256", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "bignum", pack: types_1.BEET_PACKAGE },
    i512: { beet: "i512", isFixable: false, sourcePack: types_1.BEET_PACKAGE, ts: "bignum", pack: types_1.BEET_PACKAGE }
  };
});

// ../../node_modules/ms/index.js
var require_ms = __commonJS((exports, module) => {
  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  module.exports = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match2 = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
    if (!match2) {
      return;
    }
    var n = parseFloat(match2[1]);
    var type = (match2[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return;
    }
  }
  function fmtShort(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return Math.round(ms / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms / s) + "s";
    }
    return ms + "ms";
  }
  function fmtLong(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return plural(ms, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms, msAbs, s, "second");
    }
    return ms + " ms";
  }
  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
  }
});

// ../../node_modules/@metaplex-foundation/beet/node_modules/debug/src/common.js
var require_common = __commonJS((exports, module) => {
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = require_ms();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i2 = 0;i2 < namespace.length; i2++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i2);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug(...args) {
        if (!debug.enabled) {
          return;
        }
        const self = debug;
        const curr = Number(new Date);
        const ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match2, format2) => {
          if (match2 === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format2];
          if (typeof formatter === "function") {
            const val = args[index];
            match2 = formatter.call(self, val);
            args.splice(index, 1);
            index--;
          }
          return match2;
        });
        createDebug.formatArgs.call(self, args);
        const logFn = self.log || createDebug.log;
        logFn.apply(self, args);
      }
      debug.namespace = namespace;
      debug.useColors = createDebug.useColors();
      debug.color = createDebug.selectColor(namespace);
      debug.extend = extend;
      debug.destroy = createDebug.destroy;
      Object.defineProperty(debug, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug);
      }
      return debug;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  module.exports = setup;
});

// ../../node_modules/@metaplex-foundation/beet/node_modules/debug/src/browser.js
var require_browser = __commonJS((exports, module) => {
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    let m;
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match2) => {
      if (match2 === "%%") {
        return;
      }
      index++;
      if (match2 === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c);
  }
  exports.log = console.debug || console.log || (() => {});
  function save(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error) {}
  }
  function load() {
    let r;
    try {
      r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
    } catch (error) {}
    if (!r && typeof process !== "undefined" && "env" in process) {
      r = process.env.DEBUG;
    }
    return r;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {}
  }
  module.exports = require_common()(exports);
  var { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
});

// ../../node_modules/ansicolors/ansicolors.js
var require_ansicolors = __commonJS((exports, module) => {
  var colorNums = {
    white: 37,
    black: 30,
    blue: 34,
    cyan: 36,
    green: 32,
    magenta: 35,
    red: 31,
    yellow: 33,
    brightBlack: 90,
    brightRed: 91,
    brightGreen: 92,
    brightYellow: 93,
    brightBlue: 94,
    brightMagenta: 95,
    brightCyan: 96,
    brightWhite: 97
  };
  var backgroundColorNums = {
    bgBlack: 40,
    bgRed: 41,
    bgGreen: 42,
    bgYellow: 43,
    bgBlue: 44,
    bgMagenta: 45,
    bgCyan: 46,
    bgWhite: 47,
    bgBrightBlack: 100,
    bgBrightRed: 101,
    bgBrightGreen: 102,
    bgBrightYellow: 103,
    bgBrightBlue: 104,
    bgBrightMagenta: 105,
    bgBrightCyan: 106,
    bgBrightWhite: 107
  };
  var open = {};
  var close = {};
  var colors = {};
  Object.keys(colorNums).forEach(function(k) {
    var o = open[k] = "\x1B[" + colorNums[k] + "m";
    var c = close[k] = "\x1B[39m";
    colors[k] = function(s) {
      return o + s + c;
    };
  });
  Object.keys(backgroundColorNums).forEach(function(k) {
    var o = open[k] = "\x1B[" + backgroundColorNums[k] + "m";
    var c = close[k] = "\x1B[49m";
    colors[k] = function(s) {
      return o + s + c;
    };
  });
  module.exports = colors;
  colors.open = open;
  colors.close = close;
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/utils.js
var require_utils = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.UnreachableCaseError = exports.stringify = exports.bytes = exports.beetBytes = exports.logTrace = exports.logDebug = exports.logInfo = exports.logError = undefined;
  var debug_1 = __importDefault(require_browser());
  var ansicolors_1 = __importDefault(require_ansicolors());
  var types_1 = require_types2();
  var { brightBlack } = ansicolors_1.default;
  exports.logError = (0, debug_1.default)("beet:error");
  exports.logInfo = (0, debug_1.default)("beet:info");
  exports.logDebug = (0, debug_1.default)("beet:debug");
  exports.logTrace = (0, debug_1.default)("beet:trace");
  function beetBytes(beet, isFixable = false) {
    let bytes2;
    if ((0, types_1.isFixableBeet)(beet)) {
      bytes2 = "? B";
    } else if ((0, types_1.isElementCollectionFixedSizeBeet)(beet)) {
      const len2 = isFixable ? "length" : beet.length;
      const lenBytes = beet.lenPrefixByteSize;
      bytes2 = lenBytes > 0 ? `${lenBytes} + (${beet.elementByteSize} * ${len2}) B  (${beet.byteSize} B)` : `(${beet.elementByteSize} * ${len2}) B (${beet.byteSize} B)`;
    } else {
      bytes2 = `${beet.byteSize} B`;
    }
    return brightBlack(bytes2);
  }
  exports.beetBytes = beetBytes;
  function bytes(n) {
    return brightBlack(`${n} B`);
  }
  exports.bytes = bytes;
  function stringify(x) {
    return x.toString === "function" ? x.toString() : x;
  }
  exports.stringify = stringify;

  class UnreachableCaseError extends Error {
    constructor(value) {
      super(`Unreachable case: ${value}`);
    }
  }
  exports.UnreachableCaseError = UnreachableCaseError;
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beet.fixable.js
var require_beet_fixable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.fixBeetFromValue = exports.fixBeetFromData = undefined;
  var types_1 = require_types2();
  var utils_1 = require_utils();
  function fixBeetFromData(beet, buf, offset) {
    if ((0, types_1.isFixedSizeBeet)(beet)) {
      return beet;
    }
    if ((0, types_1.isFixableBeet)(beet)) {
      return beet.toFixedFromData(buf, offset);
    }
    throw new utils_1.UnreachableCaseError(beet);
  }
  exports.fixBeetFromData = fixBeetFromData;
  function fixBeetFromValue(beet, val) {
    if ((0, types_1.isFixedSizeBeet)(beet)) {
      return beet;
    }
    if ((0, types_1.isFixableBeet)(beet)) {
      return beet.toFixedFromValue(val);
    }
    throw new utils_1.UnreachableCaseError(beet);
  }
  exports.fixBeetFromValue = fixBeetFromValue;
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/collections.js
var require_collections = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.collectionsTypeMap = exports.uint8Array = exports.fixedSizeUint8Array = exports.fixedSizeBuffer = exports.array = exports.fixedSizeArray = exports.uniformFixedSizeArray = undefined;
  var types_1 = require_types2();
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  var numbers_1 = require_numbers();
  var types_2 = require_types2();
  var utils_1 = require_utils();
  var beet_fixable_1 = require_beet_fixable();
  function uniformFixedSizeArray(element, len2, lenPrefix = false) {
    const arraySize = element.byteSize * len2;
    const byteSize = lenPrefix ? 4 + arraySize : arraySize;
    return {
      write: function(buf, offset, value) {
        assert_1.strict.equal(value.length, len2, `array length ${value.length} should match len ${len2}`);
        if (lenPrefix) {
          numbers_1.u32.write(buf, offset, len2);
          offset += 4;
        }
        for (let i2 = 0;i2 < len2; i2++) {
          element.write(buf, offset + i2 * element.byteSize, value[i2]);
        }
      },
      read: function(buf, offset) {
        if (lenPrefix) {
          const size = numbers_1.u32.read(buf, offset);
          assert_1.strict.equal(size, len2, "invalid byte size");
          offset += 4;
        }
        const arr = new Array(len2);
        for (let i2 = 0;i2 < len2; i2++) {
          arr[i2] = element.read(buf, offset + i2 * element.byteSize);
        }
        return arr;
      },
      byteSize,
      length: len2,
      elementByteSize: element.byteSize,
      lenPrefixByteSize: 4,
      description: `Array<${element.description}>(${len2})`
    };
  }
  exports.uniformFixedSizeArray = uniformFixedSizeArray;
  function fixedSizeArray(elements, elementsByteSize) {
    const len2 = elements.length;
    const firstElement = len2 === 0 ? "<EMPTY>" : elements[0].description;
    return {
      write: function(buf, offset, value) {
        assert_1.strict.equal(value.length, len2, `array length ${value.length} should match len ${len2}`);
        numbers_1.u32.write(buf, offset, len2);
        let cursor = offset + 4;
        for (let i2 = 0;i2 < len2; i2++) {
          const element = elements[i2];
          element.write(buf, cursor, value[i2]);
          cursor += element.byteSize;
        }
      },
      read: function(buf, offset) {
        const size = numbers_1.u32.read(buf, offset);
        assert_1.strict.equal(size, len2, "invalid byte size");
        let cursor = offset + 4;
        const arr = new Array(len2);
        for (let i2 = 0;i2 < len2; i2++) {
          const element = elements[i2];
          arr[i2] = element.read(buf, cursor);
          cursor += element.byteSize;
        }
        return arr;
      },
      byteSize: 4 + elementsByteSize,
      length: len2,
      description: `Array<${firstElement}>(${len2})[ 4 + ${elementsByteSize} ]`
    };
  }
  exports.fixedSizeArray = fixedSizeArray;
  function array(element) {
    return {
      toFixedFromData(buf, offset) {
        const len2 = numbers_1.u32.read(buf, offset);
        (0, utils_1.logTrace)(`${this.description}[${len2}]`);
        const cursorStart = offset + 4;
        let cursor = cursorStart;
        const fixedElements = new Array(len2);
        for (let i2 = 0;i2 < len2; i2++) {
          const fixedElement = (0, beet_fixable_1.fixBeetFromData)(element, buf, cursor);
          fixedElements[i2] = fixedElement;
          cursor += fixedElement.byteSize;
        }
        return fixedSizeArray(fixedElements, cursor - cursorStart);
      },
      toFixedFromValue(vals) {
        (0, assert_1.strict)(Array.isArray(vals), `${vals} should be an array`);
        let elementsSize = 0;
        const fixedElements = new Array(vals.length);
        for (let i2 = 0;i2 < vals.length; i2++) {
          const fixedElement = (0, beet_fixable_1.fixBeetFromValue)(element, vals[i2]);
          fixedElements[i2] = fixedElement;
          elementsSize += fixedElement.byteSize;
        }
        return fixedSizeArray(fixedElements, elementsSize);
      },
      description: `array`
    };
  }
  exports.array = array;
  function fixedSizeBuffer(bytes) {
    return {
      write: function(buf, offset, value) {
        value.copy(buf, offset, 0, bytes);
      },
      read: function(buf, offset) {
        return buf.slice(offset, offset + bytes);
      },
      byteSize: bytes,
      description: `Buffer(${bytes})`
    };
  }
  exports.fixedSizeBuffer = fixedSizeBuffer;
  function fixedSizeUint8Array(len2, lenPrefix = false) {
    const arrayBufferBeet = fixedSizeBuffer(len2);
    const byteSize = lenPrefix ? len2 + 4 : len2;
    return {
      write: function(buf, offset, value) {
        assert_1.strict.equal(value.byteLength, len2, `Uint8Array length ${value.byteLength} should match len ${len2}`);
        if (lenPrefix) {
          numbers_1.u32.write(buf, offset, len2);
          offset += 4;
        }
        const valueBuf = Buffer.from(value);
        arrayBufferBeet.write(buf, offset, valueBuf);
      },
      read: function(buf, offset) {
        if (lenPrefix) {
          const size = numbers_1.u32.read(buf, offset);
          assert_1.strict.equal(size, len2, "invalid byte size");
          offset += 4;
        }
        const arrayBuffer = arrayBufferBeet.read(buf, offset);
        return Uint8Array.from(arrayBuffer);
      },
      byteSize,
      description: `Uint8Array(${len2})`
    };
  }
  exports.fixedSizeUint8Array = fixedSizeUint8Array;
  exports.uint8Array = {
    toFixedFromData(buf, offset) {
      const len2 = numbers_1.u32.read(buf, offset);
      (0, utils_1.logTrace)(`${this.description}[${len2}]`);
      return fixedSizeUint8Array(len2, true);
    },
    toFixedFromValue(val) {
      const len2 = val.byteLength;
      return fixedSizeUint8Array(len2, true);
    },
    description: `Uint8Array`
  };
  exports.collectionsTypeMap = {
    Array: {
      beet: "array",
      isFixable: true,
      sourcePack: types_2.BEET_PACKAGE,
      ts: "Array",
      arg: types_1.BEET_TYPE_ARG_LEN
    },
    FixedSizeArray: {
      beet: "fixedSizeArray",
      isFixable: false,
      sourcePack: types_2.BEET_PACKAGE,
      ts: "Array",
      arg: types_1.BEET_TYPE_ARG_LEN
    },
    UniformFixedSizeArray: {
      beet: "uniformFixedSizeArray",
      isFixable: false,
      sourcePack: types_2.BEET_PACKAGE,
      ts: "Array",
      arg: types_1.BEET_TYPE_ARG_LEN
    },
    Buffer: {
      beet: "fixedSizeBuffer",
      isFixable: false,
      sourcePack: types_2.BEET_PACKAGE,
      ts: "Buffer",
      arg: types_1.BEET_TYPE_ARG_LEN
    },
    FixedSizeUint8Array: {
      beet: "fixedSizeUint8Array",
      isFixable: false,
      sourcePack: types_2.BEET_PACKAGE,
      ts: "Uint8Array",
      arg: types_1.BEET_TYPE_ARG_LEN
    },
    Uint8Array: {
      beet: "uint8Array",
      isFixable: true,
      sourcePack: types_2.BEET_PACKAGE,
      ts: "Uint8Array",
      arg: types_1.BEET_TYPE_ARG_LEN
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/composites.js
var require_composites = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.compositesTypeMap = exports.coption = exports.coptionSome = exports.coptionNone = exports.isNoneBuffer = exports.isSomeBuffer = undefined;
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  var types_1 = require_types2();
  var types_2 = require_types2();
  var utils_1 = require_utils();
  var beet_fixable_1 = require_beet_fixable();
  var NONE = 0;
  var SOME = 1;
  function isSomeBuffer(buf, offset) {
    return buf[offset] === SOME;
  }
  exports.isSomeBuffer = isSomeBuffer;
  function isNoneBuffer(buf, offset) {
    return buf[offset] === NONE;
  }
  exports.isNoneBuffer = isNoneBuffer;
  function coptionNone(description) {
    (0, utils_1.logTrace)(`coptionNone(${description})`);
    return {
      write: function(buf, offset, value) {
        (0, assert_1.strict)(value == null, "coptionNone can only handle `null` values");
        buf[offset] = NONE;
      },
      read: function(buf, offset) {
        (0, assert_1.strict)(isNoneBuffer(buf, offset), "coptionNone can only handle `NONE` data");
        return null;
      },
      byteSize: 1,
      description: `COption<None(${description})>`
    };
  }
  exports.coptionNone = coptionNone;
  function coptionSome(inner) {
    const byteSize = 1 + inner.byteSize;
    const beet = {
      write: function(buf, offset, value) {
        (0, types_1.assertFixedSizeBeet)(inner, `coption inner type ${inner.description} needs to be fixed before calling write`);
        (0, assert_1.strict)(value != null, "coptionSome cannot handle `null` values");
        buf[offset] = SOME;
        inner.write(buf, offset + 1, value);
      },
      read: function(buf, offset) {
        (0, types_1.assertFixedSizeBeet)(inner, `coption inner type ${inner.description} needs to be fixed before calling read`);
        (0, assert_1.strict)(isSomeBuffer(buf, offset), "coptionSome can only handle `SOME` data");
        return inner.read(buf, offset + 1);
      },
      description: `COption<${inner.description}>[1 + ${inner.byteSize}]`,
      byteSize,
      inner
    };
    (0, utils_1.logTrace)(beet.description);
    return beet;
  }
  exports.coptionSome = coptionSome;
  function coption(inner) {
    return {
      toFixedFromData(buf, offset) {
        if (isSomeBuffer(buf, offset)) {
          const innerFixed = (0, beet_fixable_1.fixBeetFromData)(inner, buf, offset + 1);
          return coptionSome(innerFixed);
        } else {
          (0, assert_1.strict)(isNoneBuffer(buf, offset), `Expected ${buf} to hold a COption`);
          return coptionNone(inner.description);
        }
      },
      toFixedFromValue(val) {
        return val == null ? coptionNone(inner.description) : coptionSome((0, beet_fixable_1.fixBeetFromValue)(inner, val));
      },
      description: `COption<${inner.description}>`
    };
  }
  exports.coption = coption;
  exports.compositesTypeMap = {
    option: {
      beet: "coption",
      isFixable: true,
      sourcePack: types_2.BEET_PACKAGE,
      ts: "COption<Inner>",
      arg: types_1.BEET_TYPE_ARG_INNER,
      pack: types_2.BEET_PACKAGE
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/string.js
var require_string = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.stringTypeMap = exports.utf8String = exports.fixedSizeUtf8String = undefined;
  var types_1 = require_types2();
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  var numbers_1 = require_numbers();
  var utils_1 = require_utils();
  var fixedSizeUtf8String = (stringByteLength) => {
    return {
      write: function(buf, offset, value) {
        const stringBuf = Buffer.from(value, "utf8");
        assert_1.strict.equal(stringBuf.byteLength, stringByteLength, `${value} has invalid byte size`);
        numbers_1.u32.write(buf, offset, stringByteLength);
        stringBuf.copy(buf, offset + 4, 0, stringByteLength);
      },
      read: function(buf, offset) {
        const size = numbers_1.u32.read(buf, offset);
        assert_1.strict.equal(size, stringByteLength, `invalid byte size`);
        const stringSlice = buf.slice(offset + 4, offset + 4 + stringByteLength);
        return stringSlice.toString("utf8");
      },
      elementByteSize: 1,
      length: stringByteLength,
      lenPrefixByteSize: 4,
      byteSize: 4 + stringByteLength,
      description: `Utf8String(4 + ${stringByteLength})`
    };
  };
  exports.fixedSizeUtf8String = fixedSizeUtf8String;
  exports.utf8String = {
    toFixedFromData(buf, offset) {
      const len2 = numbers_1.u32.read(buf, offset);
      (0, utils_1.logTrace)(`${this.description}[${len2}]`);
      return (0, exports.fixedSizeUtf8String)(len2);
    },
    toFixedFromValue(val) {
      const len2 = Buffer.from(val).byteLength;
      return (0, exports.fixedSizeUtf8String)(len2);
    },
    description: `Utf8String`
  };
  exports.stringTypeMap = {
    fixedSizeString: {
      beet: "fixedSizeUtf8String",
      isFixable: false,
      sourcePack: types_1.BEET_PACKAGE,
      ts: "string",
      arg: types_1.BEET_TYPE_ARG_LEN
    },
    string: {
      beet: "utf8String",
      isFixable: true,
      sourcePack: types_1.BEET_PACKAGE,
      ts: "string"
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/read-write.js
var require_read_write = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BeetReader = exports.BeetWriter = undefined;
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));

  class BeetWriter {
    constructor(byteSize) {
      this.buf = Buffer.alloc(byteSize);
      this._offset = 0;
    }
    get buffer() {
      return this.buf;
    }
    get offset() {
      return this._offset;
    }
    maybeResize(bytesNeeded) {
      if (this._offset + bytesNeeded > this.buf.length) {
        assert_1.strict.fail(`We shouldn't ever need to resize, but ${this._offset + bytesNeeded} > ${this.buf.length}`);
      }
    }
    write(beet, value) {
      this.maybeResize(beet.byteSize);
      beet.write(this.buf, this._offset, value);
      this._offset += beet.byteSize;
    }
    writeStruct(instance, fields) {
      for (const [key, beet] of fields) {
        const value = instance[key];
        this.write(beet, value);
      }
    }
  }
  exports.BeetWriter = BeetWriter;

  class BeetReader {
    constructor(buffer, _offset = 0) {
      this.buffer = buffer;
      this._offset = _offset;
    }
    get offset() {
      return this._offset;
    }
    read(beet) {
      const value = beet.read(this.buffer, this._offset);
      this._offset += beet.byteSize;
      return value;
    }
    readStruct(fields) {
      const acc = {};
      for (const [key, beet] of fields) {
        acc[key] = this.read(beet);
      }
      return acc;
    }
  }
  exports.BeetReader = BeetReader;
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/struct.js
var require_struct = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BeetArgsStruct = exports.isBeetStruct = exports.BeetStruct = undefined;
  var read_write_1 = require_read_write();
  var utils_1 = require_utils();

  class BeetStruct {
    constructor(fields, construct, description = BeetStruct.description) {
      this.fields = fields;
      this.construct = construct;
      this.description = description;
      this.byteSize = this.getByteSize();
      if (utils_1.logDebug.enabled) {
        const flds = fields.map(([key, val]) => `${String(key)}: ${val.description} ${(0, utils_1.beetBytes)(val)}`).join(`
  `);
        (0, utils_1.logDebug)(`struct ${description} {
  ${flds}
} ${(0, utils_1.beetBytes)(this)}`);
      }
    }
    read(buf, offset) {
      const [value] = this.deserialize(buf, offset);
      return value;
    }
    write(buf, offset, value) {
      const [innerBuf, innerOffset] = this.serialize(value);
      innerBuf.copy(buf, offset, 0, innerOffset);
    }
    deserialize(buffer, offset = 0) {
      if (utils_1.logTrace.enabled) {
        (0, utils_1.logTrace)("deserializing [%s] from %d bytes buffer", this.description, buffer.byteLength);
        (0, utils_1.logTrace)(buffer);
        (0, utils_1.logTrace)(buffer.toJSON().data);
      }
      const reader = new read_write_1.BeetReader(buffer, offset);
      const args = reader.readStruct(this.fields);
      return [this.construct(args), reader.offset];
    }
    serialize(instance, byteSize = this.byteSize) {
      (0, utils_1.logTrace)("serializing [%s] %o to %d bytes buffer", this.description, instance, byteSize);
      const writer = new read_write_1.BeetWriter(byteSize);
      writer.writeStruct(instance, this.fields);
      return [writer.buffer, writer.offset];
    }
    getByteSize() {
      return this.fields.reduce((acc, [_, beet]) => acc + beet.byteSize, 0);
    }
    get type() {
      return BeetStruct.TYPE;
    }
  }
  exports.BeetStruct = BeetStruct;
  BeetStruct.description = "BeetStruct";
  BeetStruct.TYPE = "BeetStruct";
  function isBeetStruct(beet) {
    return beet.type === BeetStruct.TYPE;
  }
  exports.isBeetStruct = isBeetStruct;

  class BeetArgsStruct extends BeetStruct {
    constructor(fields, description = BeetArgsStruct.description) {
      super(fields, (args) => args, description);
    }
  }
  exports.BeetArgsStruct = BeetArgsStruct;
  BeetArgsStruct.description = "BeetArgsStruct";
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/struct.fixable.js
var require_struct_fixable = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.FixableBeetArgsStruct = exports.isFixableBeetStruct = exports.FixableBeetStruct = undefined;
  var beet_fixable_1 = require_beet_fixable();
  var struct_1 = require_struct();
  var types_1 = require_types2();
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  var utils_1 = require_utils();
  var ansicolors_1 = __importDefault(require_ansicolors());
  var { brightBlack } = ansicolors_1.default;

  class FixableBeetStruct {
    constructor(fields, construct, description = FixableBeetStruct.description) {
      this.fields = fields;
      this.construct = construct;
      this.description = description;
      let minByteSize = 0;
      if (utils_1.logDebug.enabled) {
        const flds = fields.map(([key, val]) => {
          if ((0, types_1.isFixedSizeBeet)(val)) {
            minByteSize += val.byteSize;
          }
          return `${key}: ${val.description} ${(0, utils_1.beetBytes)(val)}`;
        }).join(`
  `);
        const bytes = `> ${minByteSize} B`;
        (0, utils_1.logDebug)(`struct ${description} {
  ${flds}
} ${brightBlack(bytes)}`);
      }
    }
    deserialize(buffer, offset = 0) {
      return this.toFixedFromData(buffer, offset).deserialize(buffer, offset);
    }
    serialize(instance, byteSize) {
      return this.toFixedFromValue(instance).serialize(instance, byteSize);
    }
    toFixedFromData(buf, offset) {
      let cursor = offset;
      const fixedFields = new Array(this.fields.length);
      for (let i2 = 0;i2 < this.fields.length; i2++) {
        const [key, beet] = this.fields[i2];
        const fixedBeet = (0, beet_fixable_1.fixBeetFromData)(beet, buf, cursor);
        fixedFields[i2] = [key, fixedBeet];
        cursor += fixedBeet.byteSize;
      }
      return this.description !== FixableBeetStruct.description ? new struct_1.BeetStruct(fixedFields, this.construct, this.description) : new struct_1.BeetStruct(fixedFields, this.construct);
    }
    toFixedFromValue(args) {
      const argsKeys = Object.keys(args);
      const fixedFields = new Array(this.fields.length);
      for (let i2 = 0;i2 < this.fields.length; i2++) {
        const [key, beet] = this.fields[i2];
        (0, assert_1.strict)(argsKeys.includes(key), `Value with keys [ ${argsKeys} ] should include struct key '${key}' but doesn't.`);
        const val = args[key];
        const fixedBeet = (0, beet_fixable_1.fixBeetFromValue)(beet, val);
        fixedFields[i2] = [key, fixedBeet];
      }
      return this.description !== FixableBeetStruct.description ? new struct_1.BeetStruct(fixedFields, this.construct, this.description) : new struct_1.BeetStruct(fixedFields, this.construct);
    }
    get type() {
      return FixableBeetStruct.TYPE;
    }
  }
  exports.FixableBeetStruct = FixableBeetStruct;
  FixableBeetStruct.description = "FixableBeetStruct";
  FixableBeetStruct.TYPE = "FixableBeetStruct";
  function isFixableBeetStruct(beet) {
    return beet.type === FixableBeetStruct.TYPE;
  }
  exports.isFixableBeetStruct = isFixableBeetStruct;

  class FixableBeetArgsStruct extends FixableBeetStruct {
    constructor(fields, description = FixableBeetArgsStruct.description) {
      super(fields, (args) => args, description);
    }
  }
  exports.FixableBeetArgsStruct = FixableBeetArgsStruct;
  FixableBeetArgsStruct.description = "FixableBeetArgsStruct";
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/unit.js
var require_unit = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.unitTypeMap = exports.unit = undefined;
  var types_1 = require_types2();
  exports.unit = {
    write: function(_buf, _offset, _value) {},
    read: function(_buf, _offset) {
      return;
    },
    byteSize: 0,
    description: "unit"
  };
  exports.unitTypeMap = {
    unit: {
      beet: "unit",
      isFixable: false,
      sourcePack: types_1.BEET_PACKAGE,
      ts: "void"
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/enums.js
var require_enums = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.enumsTypeMap = exports.dataEnum = exports.uniformDataEnum = exports.fixedScalarEnum = undefined;
  var types_1 = require_types2();
  var numbers_1 = require_numbers();
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  var struct_1 = require_struct();
  var struct_fixable_1 = require_struct_fixable();
  var unit_1 = require_unit();
  function resolveEnumVariant(value, isNumVariant) {
    return isNumVariant ? `${value}` : value;
  }
  function fixedScalarEnum(enumType) {
    const keys = Object.keys(enumType);
    return {
      write(buf, offset, value) {
        const isNumVariant = typeof value === "number";
        const variantKey = resolveEnumVariant(value, isNumVariant);
        if (!keys.includes(variantKey)) {
          assert_1.strict.fail(`${value} should be a variant of the provided enum type, i.e. [ ${Object.values(enumType).join(", ")} ], but isn't`);
        }
        if (isNumVariant) {
          numbers_1.u8.write(buf, offset, value);
        } else {
          const enumValue = enumType[variantKey];
          numbers_1.u8.write(buf, offset, enumValue);
        }
      },
      read(buf, offset) {
        const value = numbers_1.u8.read(buf, offset);
        const isNumVariant = typeof value === "number";
        const variantKey = resolveEnumVariant(value, isNumVariant);
        if (!keys.includes(variantKey)) {
          assert_1.strict.fail(`${value} should be a of a variant of the provided enum type, i.e. [ ${Object.values(enumType).join(", ")} ], but isn't`);
        }
        return isNumVariant ? value : enumType[variantKey];
      },
      byteSize: numbers_1.u8.byteSize,
      description: "Enum"
    };
  }
  exports.fixedScalarEnum = fixedScalarEnum;
  function uniformDataEnum(inner) {
    return {
      write: function(buf, offset, value) {
        numbers_1.u8.write(buf, offset, value.kind);
        inner.write(buf, offset + 1, value.data);
      },
      read: function(buf, offset) {
        const kind = numbers_1.u8.read(buf, offset);
        const data = inner.read(buf, offset + 1);
        return { kind, data };
      },
      byteSize: 1 + inner.byteSize,
      description: `UniformDataEnum<${inner.description}>`
    };
  }
  exports.uniformDataEnum = uniformDataEnum;
  function enumDataVariantBeet(inner, discriminant, kind) {
    return {
      write(buf, offset, value) {
        numbers_1.u8.write(buf, offset, discriminant);
        inner.write(buf, offset + numbers_1.u8.byteSize, value);
      },
      read(buf, offset) {
        const val = inner.read(buf, offset + numbers_1.u8.byteSize);
        return { __kind: kind, ...val };
      },
      byteSize: inner.byteSize + numbers_1.u8.byteSize,
      description: `EnumData<${inner.description}>`
    };
  }
  function dataEnum(variants) {
    for (const [_, beet] of variants) {
      (0, assert_1.strict)((0, struct_1.isBeetStruct)(beet) || (0, struct_fixable_1.isFixableBeetStruct)(beet) || beet === unit_1.unit, "dataEnum: variants must be a data beet struct or a scalar unit");
    }
    return {
      toFixedFromData(buf, offset) {
        const discriminant = numbers_1.u8.read(buf, offset);
        const variant = variants[discriminant];
        (0, assert_1.strict)(variant != null, `Discriminant ${discriminant} out of range for ${variants.length} variants`);
        const [__kind, dataBeet] = variant;
        const fixed = (0, types_1.isFixedSizeBeet)(dataBeet) ? dataBeet : dataBeet.toFixedFromData(buf, offset + 1);
        return enumDataVariantBeet(fixed, discriminant, __kind);
      },
      toFixedFromValue(val) {
        if (val.__kind == null) {
          const keys = Object.keys(val).join(", ");
          const validKinds = variants.map(([__kind2]) => __kind2).join(", ");
          assert_1.strict.fail(`Value with fields [ ${keys} ] is missing __kind, ` + `which needs to be set to one of [ ${validKinds} ]`);
        }
        const discriminant = variants.findIndex(([__kind2]) => __kind2 === val.__kind);
        if (discriminant < 0) {
          const validKinds = variants.map(([__kind2]) => __kind2).join(", ");
          assert_1.strict.fail(`${val.__kind} is not a valid kind, needs to be one of [ ${validKinds} ]`);
        }
        const variant = variants[discriminant];
        const { __kind, ...dataValue } = val;
        const [__variantKind, dataBeet] = variant;
        const fixed = (0, types_1.isFixedSizeBeet)(dataBeet) ? dataBeet : dataBeet.toFixedFromValue(dataValue);
        return enumDataVariantBeet(fixed, discriminant, __variantKind);
      },
      description: `DataEnum<${variants.length} variants>`
    };
  }
  exports.dataEnum = dataEnum;
  exports.enumsTypeMap = {
    fixedScalarEnum: {
      beet: "fixedScalarEnum",
      isFixable: false,
      sourcePack: types_1.BEET_PACKAGE,
      ts: "<TypeName>",
      arg: types_1.BEET_TYPE_ARG_INNER,
      pack: types_1.BEET_PACKAGE
    },
    dataEnum: {
      beet: "dataEnum",
      isFixable: false,
      sourcePack: types_1.BEET_PACKAGE,
      ts: "DataEnum<Kind, Inner>",
      arg: types_1.BEET_TYPE_ARG_INNER,
      pack: types_1.BEET_PACKAGE
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/aliases.js
var require_aliases = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.aliasesTypeMap = exports.bytes = undefined;
  var collections_1 = require_collections();
  exports.bytes = collections_1.uint8Array;
  exports.aliasesTypeMap = {
    bytes: collections_1.collectionsTypeMap.Uint8Array
  };
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/tuples.js
var require_tuples = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.tuplesTypeMap = exports.tuple = exports.fixedSizeTuple = undefined;
  var types_1 = require_types2();
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  var beet_fixable_1 = require_beet_fixable();
  function fixedSizeTuple(elements) {
    const len2 = elements.length;
    const elDescs = elements.map((x) => x.description);
    const byteSizes = elements.map((x) => x.byteSize);
    const byteSize = byteSizes.reduce((acc, x) => acc + x, 0);
    return {
      write: function(buf, offset, value) {
        assert_1.strict.equal(value.length, len2, `tuple value element size ${value.length} should match len ${len2}`);
        let cursor = offset;
        for (let i2 = 0;i2 < len2; i2++) {
          const v = value[i2];
          const beetEl = elements[i2];
          beetEl.write(buf, cursor, v);
          cursor += beetEl.byteSize;
        }
      },
      read: function(buf, offset) {
        const els = [];
        let cursor = offset;
        for (let i2 = 0;i2 < len2; i2++) {
          const elBeet = elements[i2];
          els[i2] = elBeet.read(buf, cursor);
          cursor += elBeet.byteSize;
        }
        return els;
      },
      byteSize,
      length: len2,
      description: `FixedSizeTuple<${elDescs.join(",")}>[ ${byteSizes.join(", ")} ]`
    };
  }
  exports.fixedSizeTuple = fixedSizeTuple;
  function tuple(elements) {
    const len2 = elements.length;
    const elDescs = elements.map((x) => x.description);
    return {
      toFixedFromData(buf, offset) {
        let cursor = offset;
        const fixedElements = new Array(len2);
        for (let i2 = 0;i2 < len2; i2++) {
          const fixedElement = (0, beet_fixable_1.fixBeetFromData)(elements[i2], buf, cursor);
          fixedElements[i2] = fixedElement;
          cursor += fixedElement.byteSize;
        }
        return fixedSizeTuple(fixedElements);
      },
      toFixedFromValue(vals) {
        (0, assert_1.strict)(Array.isArray(vals), `${vals} should be an array of tuple values`);
        assert_1.strict.equal(vals.length, len2, `There should be ${len2} tuple values, but there are ${vals.length}`);
        const fixedElements = new Array(len2);
        for (let i2 = 0;i2 < vals.length; i2++) {
          const fixedElement = (0, beet_fixable_1.fixBeetFromValue)(elements[i2], vals[i2]);
          fixedElements[i2] = fixedElement;
        }
        return fixedSizeTuple(fixedElements);
      },
      description: `Tuple<${elDescs.join(",")}>`
    };
  }
  exports.tuple = tuple;
  exports.tuplesTypeMap = {
    Tuple: {
      beet: "tuple",
      isFixable: true,
      sourcePack: types_1.BEET_PACKAGE,
      ts: "[__tuple_elements__]"
    },
    FixedSizeTuple: {
      beet: "fixedSizeTuple",
      isFixable: false,
      sourcePack: types_1.BEET_PACKAGE,
      ts: "[__tuple_elements__]"
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/maps.js
var require_maps = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.mapsTypeMap = exports.map = undefined;
  var types_1 = require_types2();
  var numbers_1 = require_numbers();
  var utils_1 = require_utils();
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  function fixedSizeMap(keyElement, valElement, fixedElements, len2) {
    const keyElementFixed = (0, types_1.isFixedSizeBeet)(keyElement);
    const valElementFixed = (0, types_1.isFixedSizeBeet)(valElement);
    function determineSizes() {
      if (keyElementFixed && valElementFixed) {
        const elementByteSize2 = keyElement.byteSize + valElement.byteSize;
        return {
          elementByteSize: elementByteSize2,
          byteSize: 4 + len2 * elementByteSize2
        };
      } else if (keyElementFixed) {
        let valsByteSize = 0;
        for (const [_, v] of fixedElements.values()) {
          valsByteSize += v.byteSize;
        }
        const elementByteSize2 = keyElement.byteSize + Math.ceil(valsByteSize / len2);
        return {
          elementByteSize: elementByteSize2,
          byteSize: 4 + keyElement.byteSize * len2 + valsByteSize
        };
      } else if (valElementFixed) {
        let keysByteSize = 0;
        for (const [k, _] of fixedElements.values()) {
          keysByteSize += k.byteSize;
        }
        const elementByteSize2 = Math.ceil(keysByteSize / len2) + valElement.byteSize;
        return {
          elementByteSize: elementByteSize2,
          byteSize: 4 + keysByteSize + valElement.byteSize * len2
        };
      } else {
        let keysByteSize = 0;
        let valsByteSize = 0;
        for (const [k, v] of fixedElements.values()) {
          keysByteSize += k.byteSize;
          valsByteSize += v.byteSize;
        }
        const elementByteSize2 = Math.ceil(keysByteSize / len2 + valsByteSize / len2);
        return {
          elementByteSize: elementByteSize2,
          byteSize: 4 + keysByteSize + valsByteSize
        };
      }
    }
    const { elementByteSize, byteSize } = determineSizes();
    return {
      write: function(buf, offset, map2) {
        let cursor = offset + 4;
        let size = 0;
        for (const [k, v] of map2.entries()) {
          let fixedKey = keyElementFixed ? keyElement : null;
          let fixedVal = valElementFixed ? valElement : null;
          if (fixedKey == null || fixedVal == null) {
            const els = fixedElements.get(k);
            (0, assert_1.strict)(els != null, `Should be able to find beet els for ${(0, utils_1.stringify)(k)}, but could not`);
            fixedKey !== null && fixedKey !== undefined || (fixedKey = els[0]);
            fixedVal !== null && fixedVal !== undefined || (fixedVal = els[1]);
          }
          fixedKey.write(buf, cursor, k);
          cursor += fixedKey.byteSize;
          fixedVal.write(buf, cursor, v);
          cursor += fixedVal.byteSize;
          size++;
        }
        numbers_1.u32.write(buf, offset, size);
        assert_1.strict.equal(size, len2, `Expected map to have size ${len2}, but has ${size}.`);
      },
      read: function(buf, offset) {
        const size = numbers_1.u32.read(buf, offset);
        assert_1.strict.equal(size, len2, `Expected map to have size ${len2}, but has ${size}.`);
        let cursor = offset + 4;
        const map2 = new Map;
        for (let i2 = 0;i2 < size; i2++) {
          const fixedKey = keyElementFixed ? keyElement : keyElement.toFixedFromData(buf, cursor);
          const k = fixedKey.read(buf, cursor);
          cursor += fixedKey.byteSize;
          const fixedVal = valElementFixed ? valElement : valElement.toFixedFromData(buf, cursor);
          const v = fixedVal.read(buf, cursor);
          cursor += fixedVal.byteSize;
          map2.set(k, v);
        }
        return map2;
      },
      elementByteSize,
      byteSize,
      length: len2,
      lenPrefixByteSize: 4,
      description: `Map<${keyElement.description}, ${valElement.description}>`
    };
  }
  function map(keyElement, valElement) {
    const keyIsFixed = (0, types_1.isFixedSizeBeet)(keyElement);
    const valIsFixed = (0, types_1.isFixedSizeBeet)(valElement);
    return {
      toFixedFromData(buf, offset) {
        const len2 = numbers_1.u32.read(buf, offset);
        let cursor = offset + 4;
        if (keyIsFixed && valIsFixed) {
          return fixedSizeMap(keyElement, valElement, new Map, len2);
        }
        const fixedBeets = new Map;
        for (let i2 = 0;i2 < len2; i2++) {
          const keyFixed = keyIsFixed ? keyElement : keyElement.toFixedFromData(buf, cursor);
          const key = keyFixed.read(buf, cursor);
          cursor += keyFixed.byteSize;
          const valFixed = valIsFixed ? valElement : valElement.toFixedFromData(buf, cursor);
          cursor += valFixed.byteSize;
          fixedBeets.set(key, [keyFixed, valFixed]);
        }
        return fixedSizeMap(keyElement, valElement, fixedBeets, len2);
      },
      toFixedFromValue(mapVal) {
        const len2 = mapVal.size;
        if (keyIsFixed && valIsFixed) {
          return fixedSizeMap(keyElement, valElement, new Map, len2);
        }
        const fixedBeets = new Map;
        for (const [k, v] of mapVal) {
          const keyFixed = keyIsFixed ? keyElement : keyElement.toFixedFromValue(k);
          const valFixed = valIsFixed ? valElement : valElement.toFixedFromValue(v);
          fixedBeets.set(k, [keyFixed, valFixed]);
        }
        return fixedSizeMap(keyElement, valElement, fixedBeets, len2);
      },
      description: `FixableMap<${keyElement.description}, ${valElement.description}>`
    };
  }
  exports.map = map;
  exports.mapsTypeMap = {
    Map: {
      beet: "map",
      isFixable: true,
      sourcePack: types_1.BEET_PACKAGE,
      ts: "Map"
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beets/sets.js
var require_sets = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.setsTypeMap = exports.set = undefined;
  var types_1 = require_types2();
  var numbers_1 = require_numbers();
  var utils_1 = require_utils();
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  function fixedSizeSet(keyElement, fixedElements, len2) {
    const keyElementFixed = (0, types_1.isFixedSizeBeet)(keyElement);
    function determineSizes() {
      if (keyElementFixed) {
        const elementByteSize2 = keyElement.byteSize;
        return {
          elementByteSize: elementByteSize2,
          byteSize: 4 + len2 * elementByteSize2
        };
      } else {
        let keysByteSize = 0;
        for (const k of fixedElements.values()) {
          keysByteSize += k.byteSize;
        }
        const elementByteSize2 = Math.ceil(keysByteSize / len2);
        return {
          elementByteSize: elementByteSize2,
          byteSize: 4 + keysByteSize
        };
      }
    }
    const { elementByteSize, byteSize } = determineSizes();
    return {
      write: function(buf, offset, set2) {
        let cursor = offset + 4;
        let size = 0;
        for (const k of set2.keys()) {
          let fixedKey = keyElementFixed ? keyElement : null;
          if (fixedKey == null) {
            const el = fixedElements.get(k);
            (0, assert_1.strict)(el != null, `Should be able to find beet el for ${(0, utils_1.stringify)(k)}, but could not`);
            fixedKey !== null && fixedKey !== undefined || (fixedKey = el);
          }
          fixedKey.write(buf, cursor, k);
          cursor += fixedKey.byteSize;
          size++;
        }
        numbers_1.u32.write(buf, offset, size);
        assert_1.strict.equal(size, len2, `Expected set to have size ${len2}, but has ${size}.`);
      },
      read: function(buf, offset) {
        const size = numbers_1.u32.read(buf, offset);
        assert_1.strict.equal(size, len2, `Expected set to have size ${len2}, but has ${size}.`);
        let cursor = offset + 4;
        const set2 = new Set;
        for (let i2 = 0;i2 < size; i2++) {
          const fixedKey = keyElementFixed ? keyElement : keyElement.toFixedFromData(buf, cursor);
          const k = fixedKey.read(buf, cursor);
          cursor += fixedKey.byteSize;
          set2.add(k);
        }
        return set2;
      },
      elementByteSize,
      byteSize,
      length: len2,
      lenPrefixByteSize: 4,
      description: `Set<${keyElement.description}>`
    };
  }
  function set(keyElement) {
    const keyIsFixed = (0, types_1.isFixedSizeBeet)(keyElement);
    return {
      toFixedFromData(buf, offset) {
        const len2 = numbers_1.u32.read(buf, offset);
        let cursor = offset + 4;
        if (keyIsFixed) {
          return fixedSizeSet(keyElement, new Map, len2);
        }
        const fixedBeets = new Map;
        for (let i2 = 0;i2 < len2; i2++) {
          const keyFixed = keyIsFixed ? keyElement : keyElement.toFixedFromData(buf, cursor);
          const key = keyFixed.read(buf, cursor);
          cursor += keyFixed.byteSize;
          fixedBeets.set(key, keyFixed);
        }
        return fixedSizeSet(keyElement, fixedBeets, len2);
      },
      toFixedFromValue(setVal) {
        const len2 = setVal.size;
        if (keyIsFixed) {
          return fixedSizeSet(keyElement, new Map, len2);
        }
        const fixedBeets = new Map;
        for (const k of setVal) {
          const keyFixed = keyIsFixed ? keyElement : keyElement.toFixedFromValue(k);
          fixedBeets.set(k, keyFixed);
        }
        return fixedSizeSet(keyElement, fixedBeets, len2);
      },
      description: `FixableSet<${keyElement.description}>`
    };
  }
  exports.set = set;
  exports.setsTypeMap = {
    Set: {
      beet: "set",
      isFixable: true,
      sourcePack: types_1.BEET_PACKAGE,
      ts: "Set"
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet/dist/cjs/src/beet.js
var require_beet = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.supportedTypeMap = undefined;
  var collections_1 = require_collections();
  var composites_1 = require_composites();
  var numbers_1 = require_numbers();
  var string_1 = require_string();
  var enums_1 = require_enums();
  var aliases_1 = require_aliases();
  var tuples_1 = require_tuples();
  var maps_1 = require_maps();
  var unit_1 = require_unit();
  var sets_1 = require_sets();
  __exportStar(require_aliases(), exports);
  __exportStar(require_collections(), exports);
  __exportStar(require_composites(), exports);
  __exportStar(require_enums(), exports);
  __exportStar(require_maps(), exports);
  __exportStar(require_numbers(), exports);
  __exportStar(require_sets(), exports);
  __exportStar(require_string(), exports);
  __exportStar(require_tuples(), exports);
  __exportStar(require_unit(), exports);
  __exportStar(require_beet_fixable(), exports);
  __exportStar(require_read_write(), exports);
  __exportStar(require_struct(), exports);
  __exportStar(require_struct_fixable(), exports);
  __exportStar(require_types2(), exports);
  exports.supportedTypeMap = {
    ...collections_1.collectionsTypeMap,
    ...string_1.stringTypeMap,
    ...composites_1.compositesTypeMap,
    ...enums_1.enumsTypeMap,
    ...numbers_1.numbersTypeMap,
    ...aliases_1.aliasesTypeMap,
    ...tuples_1.tuplesTypeMap,
    ...maps_1.mapsTypeMap,
    ...sets_1.setsTypeMap,
    ...unit_1.unitTypeMap
  };
});

// ../../node_modules/@metaplex-foundation/beet-solana/dist/cjs/src/keys.js
var require_keys = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.keysTypeMap = exports.publicKey = undefined;
  var web3_js_1 = __require("@solana/web3.js");
  var beet_1 = require_beet();
  var BEET_SOLANA_PACKAGE = "@metaplex-foundation/beet-solana";
  var SOLANA_WEB3_PACKAGE = "@solana/web3.js";
  var uint8Array32 = (0, beet_1.fixedSizeUint8Array)(32);
  exports.publicKey = {
    write: function(buf, offset, value) {
      const arr = value.toBytes();
      uint8Array32.write(buf, offset, arr);
    },
    read: function(buf, offset) {
      const bytes = uint8Array32.read(buf, offset);
      return new web3_js_1.PublicKey(bytes);
    },
    byteSize: uint8Array32.byteSize,
    description: "PublicKey"
  };
  exports.keysTypeMap = {
    publicKey: {
      beet: "publicKey",
      isFixable: false,
      sourcePack: BEET_SOLANA_PACKAGE,
      ts: "PublicKey",
      pack: SOLANA_WEB3_PACKAGE
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet-solana/node_modules/debug/src/common.js
var require_common2 = __commonJS((exports, module) => {
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = require_ms();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i2 = 0;i2 < namespace.length; i2++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i2);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug(...args) {
        if (!debug.enabled) {
          return;
        }
        const self = debug;
        const curr = Number(new Date);
        const ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match2, format2) => {
          if (match2 === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format2];
          if (typeof formatter === "function") {
            const val = args[index];
            match2 = formatter.call(self, val);
            args.splice(index, 1);
            index--;
          }
          return match2;
        });
        createDebug.formatArgs.call(self, args);
        const logFn = self.log || createDebug.log;
        logFn.apply(self, args);
      }
      debug.namespace = namespace;
      debug.useColors = createDebug.useColors();
      debug.color = createDebug.selectColor(namespace);
      debug.extend = extend;
      debug.destroy = createDebug.destroy;
      Object.defineProperty(debug, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug);
      }
      return debug;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  module.exports = setup;
});

// ../../node_modules/@metaplex-foundation/beet-solana/node_modules/debug/src/browser.js
var require_browser2 = __commonJS((exports, module) => {
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    let m;
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match2) => {
      if (match2 === "%%") {
        return;
      }
      index++;
      if (match2 === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c);
  }
  exports.log = console.debug || console.log || (() => {});
  function save(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error) {}
  }
  function load() {
    let r;
    try {
      r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
    } catch (error) {}
    if (!r && typeof process !== "undefined" && "env" in process) {
      r = process.env.DEBUG;
    }
    return r;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {}
  }
  module.exports = require_common2()(exports);
  var { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
});

// ../../node_modules/@metaplex-foundation/beet-solana/dist/cjs/src/utils.js
var require_utils2 = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.logTrace = exports.logDebug = exports.logInfo = exports.logError = undefined;
  var debug_1 = __importDefault(require_browser2());
  exports.logError = (0, debug_1.default)("beet:error");
  exports.logInfo = (0, debug_1.default)("beet:info");
  exports.logDebug = (0, debug_1.default)("beet:debug");
  exports.logTrace = (0, debug_1.default)("beet:trace");
});

// ../../node_modules/@metaplex-foundation/beet-solana/node_modules/bs58/node_modules/base-x/src/index.js
var require_src = __commonJS((exports, module) => {
  function base(ALPHABET) {
    if (ALPHABET.length >= 255) {
      throw new TypeError("Alphabet too long");
    }
    var BASE_MAP = new Uint8Array(256);
    for (var j = 0;j < BASE_MAP.length; j++) {
      BASE_MAP[j] = 255;
    }
    for (var i2 = 0;i2 < ALPHABET.length; i2++) {
      var x = ALPHABET.charAt(i2);
      var xc = x.charCodeAt(0);
      if (BASE_MAP[xc] !== 255) {
        throw new TypeError(x + " is ambiguous");
      }
      BASE_MAP[xc] = i2;
    }
    var BASE = ALPHABET.length;
    var LEADER = ALPHABET.charAt(0);
    var FACTOR = Math.log(BASE) / Math.log(256);
    var iFACTOR = Math.log(256) / Math.log(BASE);
    function encode(source) {
      if (source instanceof Uint8Array) {} else if (ArrayBuffer.isView(source)) {
        source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
      } else if (Array.isArray(source)) {
        source = Uint8Array.from(source);
      }
      if (!(source instanceof Uint8Array)) {
        throw new TypeError("Expected Uint8Array");
      }
      if (source.length === 0) {
        return "";
      }
      var zeroes = 0;
      var length = 0;
      var pbegin = 0;
      var pend = source.length;
      while (pbegin !== pend && source[pbegin] === 0) {
        pbegin++;
        zeroes++;
      }
      var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
      var b58 = new Uint8Array(size);
      while (pbegin !== pend) {
        var carry = source[pbegin];
        var i3 = 0;
        for (var it1 = size - 1;(carry !== 0 || i3 < length) && it1 !== -1; it1--, i3++) {
          carry += 256 * b58[it1] >>> 0;
          b58[it1] = carry % BASE >>> 0;
          carry = carry / BASE >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length = i3;
        pbegin++;
      }
      var it2 = size - length;
      while (it2 !== size && b58[it2] === 0) {
        it2++;
      }
      var str = LEADER.repeat(zeroes);
      for (;it2 < size; ++it2) {
        str += ALPHABET.charAt(b58[it2]);
      }
      return str;
    }
    function decodeUnsafe(source) {
      if (typeof source !== "string") {
        throw new TypeError("Expected String");
      }
      if (source.length === 0) {
        return new Uint8Array;
      }
      var psz = 0;
      var zeroes = 0;
      var length = 0;
      while (source[psz] === LEADER) {
        zeroes++;
        psz++;
      }
      var size = (source.length - psz) * FACTOR + 1 >>> 0;
      var b256 = new Uint8Array(size);
      while (source[psz]) {
        var charCode = source.charCodeAt(psz);
        if (charCode > 255) {
          return;
        }
        var carry = BASE_MAP[charCode];
        if (carry === 255) {
          return;
        }
        var i3 = 0;
        for (var it3 = size - 1;(carry !== 0 || i3 < length) && it3 !== -1; it3--, i3++) {
          carry += BASE * b256[it3] >>> 0;
          b256[it3] = carry % 256 >>> 0;
          carry = carry / 256 >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length = i3;
        psz++;
      }
      var it4 = size - length;
      while (it4 !== size && b256[it4] === 0) {
        it4++;
      }
      var vch = new Uint8Array(zeroes + (size - it4));
      var j2 = zeroes;
      while (it4 !== size) {
        vch[j2++] = b256[it4++];
      }
      return vch;
    }
    function decode(string) {
      var buffer = decodeUnsafe(string);
      if (buffer) {
        return buffer;
      }
      throw new Error("Non-base" + BASE + " character");
    }
    return {
      encode,
      decodeUnsafe,
      decode
    };
  }
  module.exports = base;
});

// ../../node_modules/@metaplex-foundation/beet-solana/node_modules/bs58/index.js
var require_bs58 = __commonJS((exports, module) => {
  var basex = require_src();
  var ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  module.exports = basex(ALPHABET);
});

// ../../node_modules/@metaplex-foundation/beet-solana/dist/cjs/src/gpa/util.js
var require_util2 = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.encodeFixedBeet = undefined;
  var bs58_1 = __importDefault(require_bs58());
  function encodeFixedBeet(beet, val) {
    const buf = Buffer.alloc(beet.byteSize);
    beet.write(buf, 0, val);
    return bs58_1.default.encode(buf);
  }
  exports.encodeFixedBeet = encodeFixedBeet;
});

// ../../node_modules/@metaplex-foundation/beet-solana/dist/cjs/src/gpa/index.js
var require_gpa = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.GpaBuilder = undefined;
  var beet_1 = require_beet();
  var assert_1 = (init_assert(), __toCommonJS(exports_assert));
  var utils_1 = require_utils2();
  var util_1 = require_util2();

  class GpaBuilder {
    constructor(programId, beets, accountSize) {
      this.programId = programId;
      this.beets = beets;
      this.accountSize = accountSize;
      this.config = {};
    }
    _addFilter(filter) {
      if (this.config.filters == null) {
        this.config.filters = [];
      }
      this.config.filters.push(filter);
      return this;
    }
    _addInnerFilter(key, innerKey, val) {
      (0, utils_1.logTrace)(`gpa.addInnerFilter: ${key}.${innerKey}`);
      const outerBeetInfo = this.beets.get(key);
      (0, assert_1.strict)(outerBeetInfo != null, "Outer filter key needs to be an existing field name");
      const beetInfo = outerBeetInfo.beet;
      let offset = outerBeetInfo.offset;
      const outerBeet = (0, beet_1.isFixedSizeBeet)(beetInfo) ? beetInfo : beetInfo.toFixedFromValue(val);
      let beet;
      for (const [k, v] of outerBeet.fields) {
        if (k === innerKey) {
          beet = v;
          break;
        }
        offset += v.byteSize;
      }
      (0, assert_1.strict)(beet != null, `${innerKey} is not a field of the ${key} struct`);
      const bytes = (0, util_1.encodeFixedBeet)(beet, val);
      this._addFilter({ memcmp: { offset, bytes } });
      return this;
    }
    addInnerFilter(keys, val) {
      const parts = keys.split(".");
      assert_1.strict.equal(parts.length, 2, `inner filters can go only one level deep, i.e. 'outer.inner' is ok, but 'outer.inner.deep' is not`);
      const [ka, kb] = parts;
      return this._addInnerFilter(ka, kb, val);
    }
    addFilter(key, val) {
      const beetInfo = this.beets.get(key);
      (0, assert_1.strict)(beetInfo != null, "Filter key needs to be an existing field name");
      const beet = (0, beet_1.isFixedSizeBeet)(beetInfo.beet) ? beetInfo.beet : beetInfo.beet.toFixedFromValue(val);
      const bytes = (0, util_1.encodeFixedBeet)(beet, val);
      this._addFilter({ memcmp: { offset: beetInfo.offset, bytes } });
      return this;
    }
    dataSize(size) {
      size = size !== null && size !== undefined ? size : this.accountSize;
      (0, assert_1.strict)(size != null, "for accounts of dynamic size the dataSize arg needs to be provided");
      return this._addFilter({ dataSize: size });
    }
    run(connection) {
      return connection.getProgramAccounts(this.programId, this.config);
    }
    static fromBeetFields(programId, beetFields) {
      const map = new Map;
      let offset = 0;
      let encounteredNonFixed = false;
      for (const [k, v] of beetFields) {
        map.set(k, { beet: v, offset });
        if (!(0, beet_1.isFixedSizeBeet)(v)) {
          encounteredNonFixed = true;
          break;
        }
        offset += v.byteSize;
      }
      const accountSize = encounteredNonFixed ? undefined : offset;
      return new GpaBuilder(programId, map, accountSize);
    }
    static fromStruct(programId, struct) {
      return GpaBuilder.fromBeetFields(programId, struct.fields);
    }
  }
  exports.GpaBuilder = GpaBuilder;
});

// ../../node_modules/@metaplex-foundation/beet-solana/dist/cjs/src/beet-solana.js
var require_beet_solana = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.supportedTypeMap = undefined;
  var keys_1 = require_keys();
  __exportStar(require_keys(), exports);
  __exportStar(require_gpa(), exports);
  exports.supportedTypeMap = keys_1.keysTypeMap;
});

// ../../node_modules/invariant/browser.js
var require_browser3 = __commonJS((exports, module) => {
  var invariant = function(condition, format2, a, b, c, d, e, f) {
    if (true) {
      if (format2 === undefined) {
        throw new Error("invariant requires an error message argument");
      }
    }
    if (!condition) {
      var error;
      if (format2 === undefined) {
        error = new Error("Minified exception occurred; use the non-minified dev environment " + "for the full error message and additional helpful warnings.");
      } else {
        var args = [a, b, c, d, e, f];
        var argIndex = 0;
        error = new Error(format2.replace(/%s/g, function() {
          return args[argIndex++];
        }));
        error.name = "Invariant Violation";
      }
      error.framesToPop = 1;
      throw error;
    }
  };
  module.exports = invariant;
});

// ../../node_modules/@metaplex-foundation/cusper/dist/src/parse-error.js
var require_parse_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.errorCodeFromLogs = undefined;
  var errorLineRx = /Custom program error: (0x[a-f0-9]+)/i;
  function errorCodeFromLogs(logs) {
    for (const line of logs) {
      const match2 = line.match(errorLineRx);
      if (match2 == null)
        continue;
      const hexCode = match2[1];
      try {
        return parseInt(hexCode);
      } catch (_) {}
    }
    return null;
  }
  exports.errorCodeFromLogs = errorCodeFromLogs;
});

// ../../node_modules/@metaplex-foundation/cusper/dist/src/errors/anchor.js
var require_anchor = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.LangErrorMessage = exports.LangErrorCode = undefined;
  exports.LangErrorCode = {
    InstructionMissing: 100,
    InstructionFallbackNotFound: 101,
    InstructionDidNotDeserialize: 102,
    InstructionDidNotSerialize: 103,
    IdlInstructionStub: 1000,
    IdlInstructionInvalidProgram: 1001,
    ConstraintMut: 2000,
    ConstraintHasOne: 2001,
    ConstraintSigner: 2002,
    ConstraintRaw: 2003,
    ConstraintOwner: 2004,
    ConstraintRentExempt: 2005,
    ConstraintSeeds: 2006,
    ConstraintExecutable: 2007,
    ConstraintState: 2008,
    ConstraintAssociated: 2009,
    ConstraintAssociatedInit: 2010,
    ConstraintClose: 2011,
    ConstraintAddress: 2012,
    ConstraintZero: 2013,
    ConstraintTokenMint: 2014,
    ConstraintTokenOwner: 2015,
    ConstraintMintMintAuthority: 2016,
    ConstraintMintFreezeAuthority: 2017,
    ConstraintMintDecimals: 2018,
    ConstraintSpace: 2019,
    AccountDiscriminatorAlreadySet: 3000,
    AccountDiscriminatorNotFound: 3001,
    AccountDiscriminatorMismatch: 3002,
    AccountDidNotDeserialize: 3003,
    AccountDidNotSerialize: 3004,
    AccountNotEnoughKeys: 3005,
    AccountNotMutable: 3006,
    AccountOwnedByWrongProgram: 3007,
    InvalidProgramId: 3008,
    InvalidProgramExecutable: 3009,
    AccountNotSigner: 3010,
    AccountNotSystemOwned: 3011,
    AccountNotInitialized: 3012,
    AccountNotProgramData: 3013,
    StateInvalidAddress: 4000,
    Deprecated: 5000
  };
  exports.LangErrorMessage = new Map([
    [
      exports.LangErrorCode.InstructionMissing,
      "8 byte instruction identifier not provided"
    ],
    [
      exports.LangErrorCode.InstructionFallbackNotFound,
      "Fallback functions are not supported"
    ],
    [
      exports.LangErrorCode.InstructionDidNotDeserialize,
      "The program could not deserialize the given instruction"
    ],
    [
      exports.LangErrorCode.InstructionDidNotSerialize,
      "The program could not serialize the given instruction"
    ],
    [
      exports.LangErrorCode.IdlInstructionStub,
      "The program was compiled without idl instructions"
    ],
    [
      exports.LangErrorCode.IdlInstructionInvalidProgram,
      "The transaction was given an invalid program for the IDL instruction"
    ],
    [exports.LangErrorCode.ConstraintMut, "A mut constraint was violated"],
    [exports.LangErrorCode.ConstraintHasOne, "A has_one constraint was violated"],
    [exports.LangErrorCode.ConstraintSigner, "A signer constraint was violated"],
    [exports.LangErrorCode.ConstraintRaw, "A raw constraint was violated"],
    [exports.LangErrorCode.ConstraintOwner, "An owner constraint was violated"],
    [exports.LangErrorCode.ConstraintRentExempt, "A rent exempt constraint was violated"],
    [exports.LangErrorCode.ConstraintSeeds, "A seeds constraint was violated"],
    [exports.LangErrorCode.ConstraintExecutable, "An executable constraint was violated"],
    [exports.LangErrorCode.ConstraintState, "A state constraint was violated"],
    [exports.LangErrorCode.ConstraintAssociated, "An associated constraint was violated"],
    [
      exports.LangErrorCode.ConstraintAssociatedInit,
      "An associated init constraint was violated"
    ],
    [exports.LangErrorCode.ConstraintClose, "A close constraint was violated"],
    [exports.LangErrorCode.ConstraintAddress, "An address constraint was violated"],
    [exports.LangErrorCode.ConstraintZero, "Expected zero account discriminant"],
    [exports.LangErrorCode.ConstraintTokenMint, "A token mint constraint was violated"],
    [exports.LangErrorCode.ConstraintTokenOwner, "A token owner constraint was violated"],
    [
      exports.LangErrorCode.ConstraintMintMintAuthority,
      "A mint mint authority constraint was violated"
    ],
    [
      exports.LangErrorCode.ConstraintMintFreezeAuthority,
      "A mint freeze authority constraint was violated"
    ],
    [
      exports.LangErrorCode.ConstraintMintDecimals,
      "A mint decimals constraint was violated"
    ],
    [exports.LangErrorCode.ConstraintSpace, "A space constraint was violated"],
    [
      exports.LangErrorCode.AccountDiscriminatorAlreadySet,
      "The account discriminator was already set on this account"
    ],
    [
      exports.LangErrorCode.AccountDiscriminatorNotFound,
      "No 8 byte discriminator was found on the account"
    ],
    [
      exports.LangErrorCode.AccountDiscriminatorMismatch,
      "8 byte discriminator did not match what was expected"
    ],
    [exports.LangErrorCode.AccountDidNotDeserialize, "Failed to deserialize the account"],
    [exports.LangErrorCode.AccountDidNotSerialize, "Failed to serialize the account"],
    [
      exports.LangErrorCode.AccountNotEnoughKeys,
      "Not enough account keys given to the instruction"
    ],
    [exports.LangErrorCode.AccountNotMutable, "The given account is not mutable"],
    [
      exports.LangErrorCode.AccountOwnedByWrongProgram,
      "The given account is owned by a different program than expected"
    ],
    [exports.LangErrorCode.InvalidProgramId, "Program ID was not as expected"],
    [exports.LangErrorCode.InvalidProgramExecutable, "Program account is not executable"],
    [exports.LangErrorCode.AccountNotSigner, "The given account did not sign"],
    [
      exports.LangErrorCode.AccountNotSystemOwned,
      "The given account is not owned by the system program"
    ],
    [
      exports.LangErrorCode.AccountNotInitialized,
      "The program expected this account to be already initialized"
    ],
    [
      exports.LangErrorCode.AccountNotProgramData,
      "The given account is not a program data account"
    ],
    [
      exports.LangErrorCode.StateInvalidAddress,
      "The given state account does not have the correct address"
    ],
    [
      exports.LangErrorCode.Deprecated,
      "The API being used is deprecated and should no longer be used"
    ]
  ]);
});

// ../../node_modules/@metaplex-foundation/cusper/dist/src/errors/token-lending.js
var require_token_lending = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.tokenLendingErrors = undefined;
  exports.tokenLendingErrors = new Map([
    [
      0,
      {
        code: 0,
        message: 'Failed to unpack instruction data"',
        name: "InstructionUnpackError"
      }
    ],
    [
      1,
      {
        code: 1,
        message: 'Account is already initialized"',
        name: "AlreadyInitialized"
      }
    ],
    [
      2,
      {
        code: 2,
        message: 'Lamport balance below rent-exempt threshold"',
        name: "NotRentExempt"
      }
    ],
    [
      3,
      {
        code: 3,
        message: 'Market authority is invalid"',
        name: "InvalidMarketAuthority"
      }
    ],
    [
      4,
      {
        code: 4,
        message: 'Market owner is invalid"',
        name: "InvalidMarketOwner"
      }
    ],
    [
      5,
      {
        code: 5,
        message: 'Input account owner is not the program address"',
        name: "InvalidAccountOwner"
      }
    ],
    [
      6,
      {
        code: 6,
        message: 'Input token account is not owned by the correct token program id"',
        name: "InvalidTokenOwner"
      }
    ],
    [
      7,
      {
        code: 7,
        message: 'Input token account is not valid"',
        name: "InvalidTokenAccount"
      }
    ],
    [
      8,
      {
        code: 8,
        message: 'Input token mint account is not valid"',
        name: "InvalidTokenMint"
      }
    ],
    [
      9,
      {
        code: 9,
        message: 'Input token program account is not valid"',
        name: "InvalidTokenProgram"
      }
    ],
    [
      10,
      {
        code: 10,
        message: 'Input amount is invalid"',
        name: "InvalidAmount"
      }
    ],
    [
      11,
      {
        code: 11,
        message: 'Input config value is invalid"',
        name: "InvalidConfig"
      }
    ],
    [
      12,
      {
        code: 12,
        message: 'Input account must be a signer"',
        name: "InvalidSigner"
      }
    ],
    [
      13,
      {
        code: 13,
        message: 'Invalid account input"',
        name: "InvalidAccountInput"
      }
    ],
    [
      14,
      {
        code: 14,
        message: 'Math operation overflow"',
        name: "MathOverflow"
      }
    ],
    [
      15,
      {
        code: 15,
        message: 'Token initialize mint failed"',
        name: "TokenInitializeMintFailed"
      }
    ],
    [
      16,
      {
        code: 16,
        message: 'Token initialize account failed"',
        name: "TokenInitializeAccountFailed"
      }
    ],
    [
      17,
      {
        code: 17,
        message: 'Token transfer failed"',
        name: "TokenTransferFailed"
      }
    ],
    [
      18,
      {
        code: 18,
        message: 'Token mint to failed"',
        name: "TokenMintToFailed"
      }
    ],
    [
      19,
      {
        code: 19,
        message: 'Token burn failed"',
        name: "TokenBurnFailed"
      }
    ],
    [
      20,
      {
        code: 20,
        message: 'Insufficient liquidity available"',
        name: "InsufficientLiquidity"
      }
    ],
    [
      21,
      {
        code: 21,
        message: 'Input reserve has collateral disabled"',
        name: "ReserveCollateralDisabled"
      }
    ],
    [
      22,
      {
        code: 22,
        message: 'Reserve state needs to be refreshed"',
        name: "ReserveStale"
      }
    ],
    [
      23,
      {
        code: 23,
        message: 'Withdraw amount too small"',
        name: "WithdrawTooSmall"
      }
    ],
    [
      24,
      {
        code: 24,
        message: 'Withdraw amount too large"',
        name: "WithdrawTooLarge"
      }
    ],
    [
      25,
      {
        code: 25,
        message: 'Borrow amount too small to receive liquidity after fees"',
        name: "BorrowTooSmall"
      }
    ],
    [
      26,
      {
        code: 26,
        message: 'Borrow amount too large for deposited collateral"',
        name: "BorrowTooLarge"
      }
    ],
    [
      27,
      {
        code: 27,
        message: 'Repay amount too small to transfer liquidity"',
        name: "RepayTooSmall"
      }
    ],
    [
      28,
      {
        code: 28,
        message: 'Liquidation amount too small to receive collateral"',
        name: "LiquidationTooSmall"
      }
    ],
    [
      29,
      {
        code: 29,
        message: 'Cannot liquidate healthy obligations"',
        name: "ObligationHealthy"
      }
    ],
    [
      30,
      {
        code: 30,
        message: 'Obligation state needs to be refreshed"',
        name: "ObligationStale"
      }
    ],
    [
      31,
      {
        code: 31,
        message: 'Obligation reserve limit exceeded"',
        name: "ObligationReserveLimit"
      }
    ],
    [
      32,
      {
        code: 32,
        message: 'Obligation owner is invalid"',
        name: "InvalidObligationOwner"
      }
    ],
    [
      33,
      {
        code: 33,
        message: 'Obligation deposits are empty"',
        name: "ObligationDepositsEmpty"
      }
    ],
    [
      34,
      {
        code: 34,
        message: 'Obligation borrows are empty"',
        name: "ObligationBorrowsEmpty"
      }
    ],
    [
      35,
      {
        code: 35,
        message: 'Obligation deposits have zero value"',
        name: "ObligationDepositsZero"
      }
    ],
    [
      36,
      {
        code: 36,
        message: 'Obligation borrows have zero value"',
        name: "ObligationBorrowsZero"
      }
    ],
    [
      37,
      {
        code: 37,
        message: 'Invalid obligation collateral"',
        name: "InvalidObligationCollateral"
      }
    ],
    [
      38,
      {
        code: 38,
        message: 'Invalid obligation liquidity"',
        name: "InvalidObligationLiquidity"
      }
    ],
    [
      39,
      {
        code: 39,
        message: 'Obligation collateral is empty"',
        name: "ObligationCollateralEmpty"
      }
    ],
    [
      40,
      {
        code: 40,
        message: 'Obligation liquidity is empty"',
        name: "ObligationLiquidityEmpty"
      }
    ],
    [
      41,
      {
        code: 41,
        message: 'Interest rate is negative"',
        name: "NegativeInterestRate"
      }
    ],
    [
      42,
      {
        code: 42,
        message: 'Input oracle config is invalid"',
        name: "InvalidOracleConfig"
      }
    ],
    [
      43,
      {
        code: 43,
        message: 'Input flash loan receiver program account is not valid"',
        name: "InvalidFlashLoanReceiverProgram"
      }
    ],
    [
      44,
      {
        code: 44,
        message: 'Not enough liquidity after flash loan"',
        name: "NotEnoughLiquidityAfterFlashLoan"
      }
    ]
  ]);
});

// ../../node_modules/@metaplex-foundation/cusper/dist/src/resolve-error.js
var require_resolve_error = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TokenLendingError = exports.AnchorError = exports.CustomProgramError = exports.CusperUnknownError = exports.initCusper = exports.ErrorResolver = undefined;
  var parse_error_1 = require_parse_error();
  var anchor = __importStar(require_anchor());
  var token_lending_1 = require_token_lending();

  class ErrorResolver {
    constructor(resolveErrorFromCode) {
      this.resolveErrorFromCode = resolveErrorFromCode;
    }
    errorFromCode(code2, captureBoundaryFn, fallbackToUnknown = true) {
      let err = this.resolveErrorFromCode != null ? this.resolveErrorFromCode(code2) : null;
      if (err != null) {
        return this.passPreparedError(err, captureBoundaryFn !== null && captureBoundaryFn !== undefined ? captureBoundaryFn : this.errorFromCode);
      }
      err = AnchorError.fromCode(code2);
      if (err != null) {
        return this.passPreparedError(err, captureBoundaryFn !== null && captureBoundaryFn !== undefined ? captureBoundaryFn : this.errorFromCode);
      }
      err = TokenLendingError.fromCode(code2);
      if (err != null) {
        return this.passPreparedError(err, captureBoundaryFn !== null && captureBoundaryFn !== undefined ? captureBoundaryFn : this.errorFromCode);
      }
      if (fallbackToUnknown) {
        err = new CusperUnknownError(code2, "CusperUnknownError", "cusper does not know this error");
        return this.passPreparedError(err, captureBoundaryFn !== null && captureBoundaryFn !== undefined ? captureBoundaryFn : this.errorFromCode);
      }
    }
    errorFromProgramLogs(logs, fallbackToUnknown = true) {
      const code2 = (0, parse_error_1.errorCodeFromLogs)(logs);
      return code2 == null ? null : this.errorFromCode(code2, this.errorFromProgramLogs, fallbackToUnknown);
    }
    throwError(error) {
      const err = error.logs != null && this.errorFromProgramLogs(error.logs, true) || new CusperUnknownError(-1, "Error created without logs and thus without error code");
      throw this.passPreparedError(err, this.throwError);
    }
    passPreparedError(err, captureBoundaryFn) {
      if (err == null)
        return null;
      if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(err, captureBoundaryFn);
      }
      return err;
    }
  }
  exports.ErrorResolver = ErrorResolver;
  function initCusper(resolveErrorFromCode) {
    return new ErrorResolver(resolveErrorFromCode);
  }
  exports.initCusper = initCusper;

  class CusperUnknownError extends Error {
    constructor(code2, ...params) {
      super(...params);
      this.code = code2;
      this.name = "CusperUnknownError";
    }
  }
  exports.CusperUnknownError = CusperUnknownError;

  class CustomProgramError extends Error {
    constructor(code2, name, ...params) {
      super(...params);
      this.code = code2;
      this.name = `CustomProgramError#${name}`;
    }
  }
  exports.CustomProgramError = CustomProgramError;

  class AnchorError extends Error {
    constructor(code2, name, ...params) {
      super(...params);
      this.code = code2;
      this.name = `AnchorError#${name}`;
    }
    static fromCode(code2) {
      const errorMeta = AnchorError.errorMap.get(code2);
      return errorMeta != null ? new AnchorError(errorMeta.code, errorMeta.name, errorMeta.message) : null;
    }
    toString() {
      return `${this.name}: ${this.message}`;
    }
  }
  exports.AnchorError = AnchorError;
  AnchorError.errorMap = Object.entries(anchor.LangErrorCode).reduce((acc, [key, code2]) => {
    acc.set(code2, {
      code: code2,
      name: key,
      message: anchor.LangErrorMessage.get(code2)
    });
    return acc;
  }, new Map);

  class TokenLendingError extends Error {
    constructor(code2, name, ...params) {
      super(...params);
      this.code = code2;
      this.name = `TokenLendingError#${name}`;
    }
    static fromCode(code2) {
      const errorMeta = TokenLendingError.errorMap.get(code2);
      return errorMeta != null ? new TokenLendingError(errorMeta.code, errorMeta.name, errorMeta.message) : null;
    }
    toString() {
      return `${this.name}: ${this.message}`;
    }
  }
  exports.TokenLendingError = TokenLendingError;
  TokenLendingError.errorMap = token_lending_1.tokenLendingErrors;
});

// ../../node_modules/@metaplex-foundation/cusper/dist/src/types.js
var require_types3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// ../../node_modules/@metaplex-foundation/cusper/dist/src/cusper.js
var require_cusper = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_resolve_error(), exports);
  __exportStar(require_types3(), exports);
});

// src/generated/index.ts
var exports_generated = {};
__export(exports_generated, {
  voteOnProposalArgsBeet: () => voteOnProposalArgsBeet,
  voteBeet: () => voteBeet,
  useSpendingLimitStruct: () => useSpendingLimitStruct,
  useSpendingLimitInstructionDiscriminator: () => useSpendingLimitInstructionDiscriminator,
  useSpendingLimitArgsBeet: () => useSpendingLimitArgsBeet,
  usageStateBeet: () => usageStateBeet,
  transactionPayloadDetailsBeet: () => transactionPayloadDetailsBeet,
  transactionPayloadBeet: () => transactionPayloadBeet,
  transactionEventTypeBeet: () => transactionEventTypeBeet,
  transactionDiscriminator: () => transactionDiscriminator,
  transactionBufferDiscriminator: () => transactionBufferDiscriminator,
  transactionBufferBeet: () => transactionBufferBeet,
  transactionBeet: () => transactionBeet,
  timeConstraintsBeet: () => timeConstraintsBeet,
  synchronousTransactionEventPayloadBeet: () => synchronousTransactionEventPayloadBeet,
  syncTransactionPayloadDetailsBeet: () => syncTransactionPayloadDetailsBeet,
  syncTransactionArgsBeet: () => syncTransactionArgsBeet,
  syncSettingsTransactionArgsBeet: () => syncSettingsTransactionArgsBeet,
  syncPayloadBeet: () => syncPayloadBeet,
  spendingLimitV2Beet: () => spendingLimitV2Beet,
  spendingLimitPolicyCreationPayloadBeet: () => spendingLimitPolicyCreationPayloadBeet,
  spendingLimitPolicyBeet: () => spendingLimitPolicyBeet,
  spendingLimitPayloadBeet: () => spendingLimitPayloadBeet,
  spendingLimitDiscriminator: () => spendingLimitDiscriminator,
  spendingLimitBeet: () => spendingLimitBeet,
  smartAccountTransactionMessageBeet: () => smartAccountTransactionMessageBeet,
  smartAccountSignerBeet: () => smartAccountSignerBeet,
  smartAccountMessageAddressTableLookupBeet: () => smartAccountMessageAddressTableLookupBeet,
  smartAccountCompiledInstructionBeet: () => smartAccountCompiledInstructionBeet,
  settingsTransactionDiscriminator: () => settingsTransactionDiscriminator,
  settingsTransactionBeet: () => settingsTransactionBeet,
  settingsDiscriminator: () => settingsDiscriminator,
  settingsChangePolicyCreationPayloadBeet: () => settingsChangePolicyCreationPayloadBeet,
  settingsChangePolicyBeet: () => settingsChangePolicyBeet,
  settingsChangePayloadBeet: () => settingsChangePayloadBeet,
  settingsBeet: () => settingsBeet,
  settingsActionBeet: () => settingsActionBeet,
  setTimeLockAsAuthorityStruct: () => setTimeLockAsAuthorityStruct,
  setTimeLockAsAuthorityInstructionDiscriminator: () => setTimeLockAsAuthorityInstructionDiscriminator,
  setTimeLockArgsBeet: () => setTimeLockArgsBeet,
  setProgramConfigTreasuryStruct: () => setProgramConfigTreasuryStruct,
  setProgramConfigTreasuryInstructionDiscriminator: () => setProgramConfigTreasuryInstructionDiscriminator,
  setProgramConfigSmartAccountCreationFeeStruct: () => setProgramConfigSmartAccountCreationFeeStruct,
  setProgramConfigSmartAccountCreationFeeInstructionDiscriminator: () => setProgramConfigSmartAccountCreationFeeInstructionDiscriminator,
  setProgramConfigAuthorityStruct: () => setProgramConfigAuthorityStruct,
  setProgramConfigAuthorityInstructionDiscriminator: () => setProgramConfigAuthorityInstructionDiscriminator,
  setNewSettingsAuthorityAsAuthorityStruct: () => setNewSettingsAuthorityAsAuthorityStruct,
  setNewSettingsAuthorityAsAuthorityInstructionDiscriminator: () => setNewSettingsAuthorityAsAuthorityInstructionDiscriminator,
  setNewSettingsAuthorityArgsBeet: () => setNewSettingsAuthorityArgsBeet,
  setArchivalAuthorityAsAuthorityStruct: () => setArchivalAuthorityAsAuthorityStruct,
  setArchivalAuthorityAsAuthorityInstructionDiscriminator: () => setArchivalAuthorityAsAuthorityInstructionDiscriminator,
  setArchivalAuthorityArgsBeet: () => setArchivalAuthorityArgsBeet,
  removeSpendingLimitAsAuthorityStruct: () => removeSpendingLimitAsAuthorityStruct,
  removeSpendingLimitAsAuthorityInstructionDiscriminator: () => removeSpendingLimitAsAuthorityInstructionDiscriminator,
  removeSpendingLimitArgsBeet: () => removeSpendingLimitArgsBeet,
  removeSignerAsAuthorityStruct: () => removeSignerAsAuthorityStruct,
  removeSignerAsAuthorityInstructionDiscriminator: () => removeSignerAsAuthorityInstructionDiscriminator,
  removeSignerArgsBeet: () => removeSignerArgsBeet,
  rejectProposalStruct: () => rejectProposalStruct,
  rejectProposalInstructionDiscriminator: () => rejectProposalInstructionDiscriminator,
  quantityConstraintsBeet: () => quantityConstraintsBeet,
  proposalStatusBeet: () => proposalStatusBeet,
  proposalEventTypeBeet: () => proposalEventTypeBeet,
  proposalDiscriminator: () => proposalDiscriminator,
  proposalBeet: () => proposalBeet,
  programInteractionTransactionPayloadBeet: () => programInteractionTransactionPayloadBeet,
  programInteractionPolicyCreationPayloadBeet: () => programInteractionPolicyCreationPayloadBeet,
  programInteractionPolicyBeet: () => programInteractionPolicyBeet,
  programInteractionPayloadBeet: () => programInteractionPayloadBeet,
  programConfigSetTreasuryArgsBeet: () => programConfigSetTreasuryArgsBeet,
  programConfigSetSmartAccountCreationFeeArgsBeet: () => programConfigSetSmartAccountCreationFeeArgsBeet,
  programConfigSetAuthorityArgsBeet: () => programConfigSetAuthorityArgsBeet,
  programConfigDiscriminator: () => programConfigDiscriminator,
  programConfigBeet: () => programConfigBeet,
  policyStateBeet: () => policyStateBeet,
  policyPayloadBeet: () => policyPayloadBeet,
  policyExpirationBeet: () => policyExpirationBeet,
  policyExpirationArgsBeet: () => policyExpirationArgsBeet,
  policyExecutionContextBeet: () => policyExecutionContextBeet,
  policyEventTypeBeet: () => policyEventTypeBeet,
  policyDiscriminator: () => policyDiscriminator,
  policyCreationPayloadBeet: () => policyCreationPayloadBeet,
  policyBeet: () => policyBeet,
  policyActionPayloadDetailsBeet: () => policyActionPayloadDetailsBeet,
  permissionsBeet: () => permissionsBeet,
  periodV2Beet: () => periodV2Beet,
  periodBeet: () => periodBeet,
  payloadBeet: () => payloadBeet,
  logEventStruct: () => logEventStruct,
  logEventInstructionDiscriminator: () => logEventInstructionDiscriminator,
  logEventArgsV2Beet: () => logEventArgsV2Beet,
  logEventArgsBeet: () => logEventArgsBeet,
  limitedTimeConstraintsBeet: () => limitedTimeConstraintsBeet,
  limitedSpendingLimitBeet: () => limitedSpendingLimitBeet,
  limitedSettingsActionBeet: () => limitedSettingsActionBeet,
  limitedQuantityConstraintsBeet: () => limitedQuantityConstraintsBeet,
  legacyTransactionDiscriminator: () => legacyTransactionDiscriminator,
  legacyTransactionBeet: () => legacyTransactionBeet,
  legacySyncTransactionArgsBeet: () => legacySyncTransactionArgsBeet,
  isSynchronousTransactionEventPayloadTransactionPayload: () => isSynchronousTransactionEventPayloadTransactionPayload,
  isSynchronousTransactionEventPayloadPolicyPayload: () => isSynchronousTransactionEventPayloadPolicyPayload,
  isSyncPayloadTransaction: () => isSyncPayloadTransaction,
  isSyncPayloadPolicy: () => isSyncPayloadPolicy,
  isSettingsActionSetTimeLock: () => isSettingsActionSetTimeLock,
  isSettingsActionSetArchivalAuthority: () => isSettingsActionSetArchivalAuthority,
  isSettingsActionRemoveSpendingLimit: () => isSettingsActionRemoveSpendingLimit,
  isSettingsActionRemoveSigner: () => isSettingsActionRemoveSigner,
  isSettingsActionPolicyUpdate: () => isSettingsActionPolicyUpdate,
  isSettingsActionPolicyRemove: () => isSettingsActionPolicyRemove,
  isSettingsActionPolicyCreate: () => isSettingsActionPolicyCreate,
  isSettingsActionChangeThreshold: () => isSettingsActionChangeThreshold,
  isSettingsActionAddSpendingLimit: () => isSettingsActionAddSpendingLimit,
  isSettingsActionAddSigner: () => isSettingsActionAddSigner,
  isProposalStatusRejected: () => isProposalStatusRejected,
  isProposalStatusExecuting: () => isProposalStatusExecuting,
  isProposalStatusExecuted: () => isProposalStatusExecuted,
  isProposalStatusDraft: () => isProposalStatusDraft,
  isProposalStatusCancelled: () => isProposalStatusCancelled,
  isProposalStatusApproved: () => isProposalStatusApproved,
  isProposalStatusActive: () => isProposalStatusActive,
  isProgramInteractionTransactionPayloadSyncTransaction: () => isProgramInteractionTransactionPayloadSyncTransaction,
  isProgramInteractionTransactionPayloadAsyncTransaction: () => isProgramInteractionTransactionPayloadAsyncTransaction,
  isPolicyStateSpendingLimit: () => isPolicyStateSpendingLimit,
  isPolicyStateSettingsChange: () => isPolicyStateSettingsChange,
  isPolicyStateProgramInteraction: () => isPolicyStateProgramInteraction,
  isPolicyStateInternalFundTransfer: () => isPolicyStateInternalFundTransfer,
  isPolicyPayloadSpendingLimit: () => isPolicyPayloadSpendingLimit,
  isPolicyPayloadSettingsChange: () => isPolicyPayloadSettingsChange,
  isPolicyPayloadProgramInteraction: () => isPolicyPayloadProgramInteraction,
  isPolicyPayloadInternalFundTransfer: () => isPolicyPayloadInternalFundTransfer,
  isPolicyExpirationTimestamp: () => isPolicyExpirationTimestamp,
  isPolicyExpirationSettingsState: () => isPolicyExpirationSettingsState,
  isPolicyExpirationArgsTimestamp: () => isPolicyExpirationArgsTimestamp,
  isPolicyExpirationArgsSettingsState: () => isPolicyExpirationArgsSettingsState,
  isPolicyCreationPayloadSpendingLimit: () => isPolicyCreationPayloadSpendingLimit,
  isPolicyCreationPayloadSettingsChange: () => isPolicyCreationPayloadSettingsChange,
  isPolicyCreationPayloadProgramInteraction: () => isPolicyCreationPayloadProgramInteraction,
  isPolicyCreationPayloadInternalFundTransfer: () => isPolicyCreationPayloadInternalFundTransfer,
  isPeriodV2Weekly: () => isPeriodV2Weekly,
  isPeriodV2OneTime: () => isPeriodV2OneTime,
  isPeriodV2Monthly: () => isPeriodV2Monthly,
  isPeriodV2Daily: () => isPeriodV2Daily,
  isPeriodV2Custom: () => isPeriodV2Custom,
  isPayloadTransactionPayload: () => isPayloadTransactionPayload,
  isPayloadPolicyPayload: () => isPayloadPolicyPayload,
  isLimitedSettingsActionSetTimeLock: () => isLimitedSettingsActionSetTimeLock,
  isLimitedSettingsActionRemoveSigner: () => isLimitedSettingsActionRemoveSigner,
  isLimitedSettingsActionChangeThreshold: () => isLimitedSettingsActionChangeThreshold,
  isLimitedSettingsActionAddSigner: () => isLimitedSettingsActionAddSigner,
  isDataValueU8Slice: () => isDataValueU8Slice,
  isDataValueU8: () => isDataValueU8,
  isDataValueU64Le: () => isDataValueU64Le,
  isDataValueU32Le: () => isDataValueU32Le,
  isDataValueU16Le: () => isDataValueU16Le,
  isDataValueU128Le: () => isDataValueU128Le,
  isCreateTransactionArgsTransactionPayload: () => isCreateTransactionArgsTransactionPayload,
  isCreateTransactionArgsPolicyPayload: () => isCreateTransactionArgsPolicyPayload,
  isAllowedSettingsChangeRemoveSigner: () => isAllowedSettingsChangeRemoveSigner,
  isAllowedSettingsChangeChangeTimeLock: () => isAllowedSettingsChangeChangeTimeLock,
  isAllowedSettingsChangeChangeThreshold: () => isAllowedSettingsChangeChangeThreshold,
  isAllowedSettingsChangeAddSigner: () => isAllowedSettingsChangeAddSigner,
  isAccountConstraintTypePubkey: () => isAccountConstraintTypePubkey,
  isAccountConstraintTypeAccountData: () => isAccountConstraintTypeAccountData,
  internalFundTransferPolicyCreationPayloadBeet: () => internalFundTransferPolicyCreationPayloadBeet,
  internalFundTransferPolicyBeet: () => internalFundTransferPolicyBeet,
  internalFundTransferPayloadBeet: () => internalFundTransferPayloadBeet,
  instructionConstraintBeet: () => instructionConstraintBeet,
  initializeProgramConfigStruct: () => initializeProgramConfigStruct,
  initializeProgramConfigInstructionDiscriminator: () => initializeProgramConfigInstructionDiscriminator,
  initProgramConfigArgsBeet: () => initProgramConfigArgsBeet,
  hookBeet: () => hookBeet,
  extendTransactionBufferStruct: () => extendTransactionBufferStruct,
  extendTransactionBufferInstructionDiscriminator: () => extendTransactionBufferInstructionDiscriminator,
  extendTransactionBufferArgsBeet: () => extendTransactionBufferArgsBeet,
  executeTransactionSyncV2Struct: () => executeTransactionSyncV2Struct,
  executeTransactionSyncV2InstructionDiscriminator: () => executeTransactionSyncV2InstructionDiscriminator,
  executeTransactionSyncStruct: () => executeTransactionSyncStruct,
  executeTransactionSyncInstructionDiscriminator: () => executeTransactionSyncInstructionDiscriminator,
  executeTransactionStruct: () => executeTransactionStruct,
  executeTransactionInstructionDiscriminator: () => executeTransactionInstructionDiscriminator,
  executeSettingsTransactionSyncStruct: () => executeSettingsTransactionSyncStruct,
  executeSettingsTransactionSyncInstructionDiscriminator: () => executeSettingsTransactionSyncInstructionDiscriminator,
  executeSettingsTransactionStruct: () => executeSettingsTransactionStruct,
  executeSettingsTransactionInstructionDiscriminator: () => executeSettingsTransactionInstructionDiscriminator,
  executeBatchTransactionStruct: () => executeBatchTransactionStruct,
  executeBatchTransactionInstructionDiscriminator: () => executeBatchTransactionInstructionDiscriminator,
  errorFromName: () => errorFromName,
  errorFromCode: () => errorFromCode,
  dataValueBeet: () => dataValueBeet,
  dataOperatorBeet: () => dataOperatorBeet,
  dataConstraintBeet: () => dataConstraintBeet,
  createUseSpendingLimitInstruction: () => createUseSpendingLimitInstruction,
  createTransactionStruct: () => createTransactionStruct,
  createTransactionInstructionDiscriminator: () => createTransactionInstructionDiscriminator,
  createTransactionFromBufferStruct: () => createTransactionFromBufferStruct,
  createTransactionFromBufferInstructionDiscriminator: () => createTransactionFromBufferInstructionDiscriminator,
  createTransactionBufferStruct: () => createTransactionBufferStruct,
  createTransactionBufferInstructionDiscriminator: () => createTransactionBufferInstructionDiscriminator,
  createTransactionBufferArgsBeet: () => createTransactionBufferArgsBeet,
  createTransactionArgsBeet: () => createTransactionArgsBeet,
  createSmartAccountStruct: () => createSmartAccountStruct,
  createSmartAccountInstructionDiscriminator: () => createSmartAccountInstructionDiscriminator,
  createSmartAccountArgsBeet: () => createSmartAccountArgsBeet,
  createSettingsTransactionStruct: () => createSettingsTransactionStruct,
  createSettingsTransactionInstructionDiscriminator: () => createSettingsTransactionInstructionDiscriminator,
  createSettingsTransactionArgsBeet: () => createSettingsTransactionArgsBeet,
  createSetTimeLockAsAuthorityInstruction: () => createSetTimeLockAsAuthorityInstruction,
  createSetProgramConfigTreasuryInstruction: () => createSetProgramConfigTreasuryInstruction,
  createSetProgramConfigSmartAccountCreationFeeInstruction: () => createSetProgramConfigSmartAccountCreationFeeInstruction,
  createSetProgramConfigAuthorityInstruction: () => createSetProgramConfigAuthorityInstruction,
  createSetNewSettingsAuthorityAsAuthorityInstruction: () => createSetNewSettingsAuthorityAsAuthorityInstruction,
  createSetArchivalAuthorityAsAuthorityInstruction: () => createSetArchivalAuthorityAsAuthorityInstruction,
  createRemoveSpendingLimitAsAuthorityInstruction: () => createRemoveSpendingLimitAsAuthorityInstruction,
  createRemoveSignerAsAuthorityInstruction: () => createRemoveSignerAsAuthorityInstruction,
  createRejectProposalInstruction: () => createRejectProposalInstruction,
  createProposalStruct: () => createProposalStruct,
  createProposalInstructionDiscriminator: () => createProposalInstructionDiscriminator,
  createProposalArgsBeet: () => createProposalArgsBeet,
  createLogEventInstruction: () => createLogEventInstruction,
  createInitializeProgramConfigInstruction: () => createInitializeProgramConfigInstruction,
  createExtendTransactionBufferInstruction: () => createExtendTransactionBufferInstruction,
  createExecuteTransactionSyncV2Instruction: () => createExecuteTransactionSyncV2Instruction,
  createExecuteTransactionSyncInstruction: () => createExecuteTransactionSyncInstruction,
  createExecuteTransactionInstruction: () => createExecuteTransactionInstruction,
  createExecuteSettingsTransactionSyncInstruction: () => createExecuteSettingsTransactionSyncInstruction,
  createExecuteSettingsTransactionInstruction: () => createExecuteSettingsTransactionInstruction,
  createExecuteBatchTransactionInstruction: () => createExecuteBatchTransactionInstruction,
  createCreateTransactionInstruction: () => createCreateTransactionInstruction,
  createCreateTransactionFromBufferInstruction: () => createCreateTransactionFromBufferInstruction,
  createCreateTransactionBufferInstruction: () => createCreateTransactionBufferInstruction,
  createCreateSmartAccountInstruction: () => createCreateSmartAccountInstruction,
  createCreateSettingsTransactionInstruction: () => createCreateSettingsTransactionInstruction,
  createCreateProposalInstruction: () => createCreateProposalInstruction,
  createCreateBatchInstruction: () => createCreateBatchInstruction,
  createCloseTransactionInstruction: () => createCloseTransactionInstruction,
  createCloseTransactionBufferInstruction: () => createCloseTransactionBufferInstruction,
  createCloseSettingsTransactionInstruction: () => createCloseSettingsTransactionInstruction,
  createCloseEmptyPolicyTransactionInstruction: () => createCloseEmptyPolicyTransactionInstruction,
  createCloseBatchTransactionInstruction: () => createCloseBatchTransactionInstruction,
  createCloseBatchInstruction: () => createCloseBatchInstruction,
  createChangeThresholdAsAuthorityInstruction: () => createChangeThresholdAsAuthorityInstruction,
  createCancelProposalInstruction: () => createCancelProposalInstruction,
  createBatchStruct: () => createBatchStruct,
  createBatchInstructionDiscriminator: () => createBatchInstructionDiscriminator,
  createBatchArgsBeet: () => createBatchArgsBeet,
  createApproveProposalInstruction: () => createApproveProposalInstruction,
  createAddTransactionToBatchInstruction: () => createAddTransactionToBatchInstruction,
  createAddSpendingLimitAsAuthorityInstruction: () => createAddSpendingLimitAsAuthorityInstruction,
  createAddSignerAsAuthorityInstruction: () => createAddSignerAsAuthorityInstruction,
  createActivateProposalInstruction: () => createActivateProposalInstruction,
  consensusAccountTypeBeet: () => consensusAccountTypeBeet,
  closeTransactionStruct: () => closeTransactionStruct,
  closeTransactionInstructionDiscriminator: () => closeTransactionInstructionDiscriminator,
  closeTransactionBufferStruct: () => closeTransactionBufferStruct,
  closeTransactionBufferInstructionDiscriminator: () => closeTransactionBufferInstructionDiscriminator,
  closeSettingsTransactionStruct: () => closeSettingsTransactionStruct,
  closeSettingsTransactionInstructionDiscriminator: () => closeSettingsTransactionInstructionDiscriminator,
  closeEmptyPolicyTransactionStruct: () => closeEmptyPolicyTransactionStruct,
  closeEmptyPolicyTransactionInstructionDiscriminator: () => closeEmptyPolicyTransactionInstructionDiscriminator,
  closeBatchTransactionStruct: () => closeBatchTransactionStruct,
  closeBatchTransactionInstructionDiscriminator: () => closeBatchTransactionInstructionDiscriminator,
  closeBatchStruct: () => closeBatchStruct,
  closeBatchInstructionDiscriminator: () => closeBatchInstructionDiscriminator,
  changeThresholdAsAuthorityStruct: () => changeThresholdAsAuthorityStruct,
  changeThresholdAsAuthorityInstructionDiscriminator: () => changeThresholdAsAuthorityInstructionDiscriminator,
  changeThresholdArgsBeet: () => changeThresholdArgsBeet,
  cancelProposalStruct: () => cancelProposalStruct,
  cancelProposalInstructionDiscriminator: () => cancelProposalInstructionDiscriminator,
  batchTransactionDiscriminator: () => batchTransactionDiscriminator,
  batchTransactionBeet: () => batchTransactionBeet,
  batchDiscriminator: () => batchDiscriminator,
  batchBeet: () => batchBeet,
  approveProposalStruct: () => approveProposalStruct,
  approveProposalInstructionDiscriminator: () => approveProposalInstructionDiscriminator,
  allowedSettingsChangeBeet: () => allowedSettingsChangeBeet,
  addTransactionToBatchStruct: () => addTransactionToBatchStruct,
  addTransactionToBatchInstructionDiscriminator: () => addTransactionToBatchInstructionDiscriminator,
  addTransactionToBatchArgsBeet: () => addTransactionToBatchArgsBeet,
  addSpendingLimitAsAuthorityStruct: () => addSpendingLimitAsAuthorityStruct,
  addSpendingLimitAsAuthorityInstructionDiscriminator: () => addSpendingLimitAsAuthorityInstructionDiscriminator,
  addSpendingLimitArgsBeet: () => addSpendingLimitArgsBeet,
  addSignerAsAuthorityStruct: () => addSignerAsAuthorityStruct,
  addSignerAsAuthorityInstructionDiscriminator: () => addSignerAsAuthorityInstructionDiscriminator,
  addSignerArgsBeet: () => addSignerArgsBeet,
  activateProposalStruct: () => activateProposalStruct,
  activateProposalInstructionDiscriminator: () => activateProposalInstructionDiscriminator,
  accountProviders: () => accountProviders,
  accountConstraintTypeBeet: () => accountConstraintTypeBeet,
  accountConstraintBeet: () => accountConstraintBeet,
  Vote: () => Vote,
  UnknownPermissionError: () => UnknownPermissionError,
  UnauthorizedError: () => UnauthorizedError,
  TransactionNotMatchingProposalError: () => TransactionNotMatchingProposalError,
  TransactionNotLastInBatchError: () => TransactionNotLastInBatchError,
  TransactionForAnotherSmartAccountError: () => TransactionForAnotherSmartAccountError,
  TransactionForAnotherPolicyError: () => TransactionForAnotherPolicyError,
  TransactionEventType: () => TransactionEventType,
  TransactionBuffer: () => TransactionBuffer,
  Transaction: () => Transaction,
  TooManySignersError: () => TooManySignersError,
  TimeLockNotZeroError: () => TimeLockNotZeroError,
  TimeLockNotReleasedError: () => TimeLockNotReleasedError,
  TimeLockExceedsMaxAllowedError: () => TimeLockExceedsMaxAllowedError,
  ThresholdNotReachedError: () => ThresholdNotReachedError,
  StaleProposalError: () => StaleProposalError,
  SpendingLimitViolatesMaxPerUseConstraintError: () => SpendingLimitViolatesMaxPerUseConstraintError,
  SpendingLimitViolatesExactQuantityConstraintError: () => SpendingLimitViolatesExactQuantityConstraintError,
  SpendingLimitPolicyInvariantDuplicateDestinationsError: () => SpendingLimitPolicyInvariantDuplicateDestinationsError,
  SpendingLimitPolicyInvariantAccumulateUnusedError: () => SpendingLimitPolicyInvariantAccumulateUnusedError,
  SpendingLimitNotActiveError: () => SpendingLimitNotActiveError,
  SpendingLimitInvariantStartTimePositiveError: () => SpendingLimitInvariantStartTimePositiveError,
  SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriodError: () => SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriodError,
  SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmountError: () => SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmountError,
  SpendingLimitInvariantOverflowEnabledMustHaveExpirationError: () => SpendingLimitInvariantOverflowEnabledMustHaveExpirationError,
  SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabledError: () => SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabledError,
  SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriodError: () => SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriodError,
  SpendingLimitInvariantMaxPerPeriodZeroError: () => SpendingLimitInvariantMaxPerPeriodZeroError,
  SpendingLimitInvariantLastResetSmallerThanStartError: () => SpendingLimitInvariantLastResetSmallerThanStartError,
  SpendingLimitInvariantLastResetOutOfBoundsError: () => SpendingLimitInvariantLastResetOutOfBoundsError,
  SpendingLimitInvariantExpirationSmallerThanStartError: () => SpendingLimitInvariantExpirationSmallerThanStartError,
  SpendingLimitInvariantExactQuantityMaxPerUseZeroError: () => SpendingLimitInvariantExactQuantityMaxPerUseZeroError,
  SpendingLimitInvariantCustomPeriodNegativeError: () => SpendingLimitInvariantCustomPeriodNegativeError,
  SpendingLimitInvalidCadenceConfigurationError: () => SpendingLimitInvalidCadenceConfigurationError,
  SpendingLimitInvalidAmountError: () => SpendingLimitInvalidAmountError,
  SpendingLimitInsufficientRemainingAmountError: () => SpendingLimitInsufficientRemainingAmountError,
  SpendingLimitExpiredError: () => SpendingLimitExpiredError,
  SpendingLimitExceededError: () => SpendingLimitExceededError,
  SpendingLimit: () => SpendingLimit,
  SmartAccountCreateDeprecatedError: () => SmartAccountCreateDeprecatedError,
  SettingsTransaction: () => SettingsTransaction,
  SettingsChangeRemoveSignerViolationError: () => SettingsChangeRemoveSignerViolationError,
  SettingsChangePolicyInvariantDuplicateActionsError: () => SettingsChangePolicyInvariantDuplicateActionsError,
  SettingsChangePolicyInvariantActionIndicesActionsLengthMismatchError: () => SettingsChangePolicyInvariantActionIndicesActionsLengthMismatchError,
  SettingsChangePolicyInvariantActionIndexOutOfBoundsError: () => SettingsChangePolicyInvariantActionIndexOutOfBoundsError,
  SettingsChangePolicyActionsMustBeNonZeroError: () => SettingsChangePolicyActionsMustBeNonZeroError,
  SettingsChangeInvalidSystemProgramError: () => SettingsChangeInvalidSystemProgramError,
  SettingsChangeInvalidSettingsKeyError: () => SettingsChangeInvalidSettingsKeyError,
  SettingsChangeInvalidSettingsAccountError: () => SettingsChangeInvalidSettingsAccountError,
  SettingsChangeInvalidRentPayerError: () => SettingsChangeInvalidRentPayerError,
  SettingsChangeChangeTimelockViolationError: () => SettingsChangeChangeTimelockViolationError,
  SettingsChangeAddSignerViolationError: () => SettingsChangeAddSignerViolationError,
  SettingsChangeAddSignerPermissionsViolationError: () => SettingsChangeAddSignerPermissionsViolationError,
  SettingsChangeActionMismatchError: () => SettingsChangeActionMismatchError,
  Settings: () => Settings,
  RentReclamationDisabledError: () => RentReclamationDisabledError,
  RemoveLastSignerError: () => RemoveLastSignerError,
  ProtectedInstructionError: () => ProtectedInstructionError,
  ProtectedAccountError: () => ProtectedAccountError,
  ProposalForAnotherSmartAccountError: () => ProposalForAnotherSmartAccountError,
  ProposalEventType: () => ProposalEventType,
  Proposal: () => Proposal,
  ProgramInteractionUnsupportedSliceOperatorError: () => ProgramInteractionUnsupportedSliceOperatorError,
  ProgramInteractionTooManySpendingLimitsError: () => ProgramInteractionTooManySpendingLimitsError,
  ProgramInteractionTooManyInstructionConstraintsError: () => ProgramInteractionTooManyInstructionConstraintsError,
  ProgramInteractionTemplateHookErrorError: () => ProgramInteractionTemplateHookErrorError,
  ProgramInteractionSyncPayloadNotAllowedWithAsyncTransactionError: () => ProgramInteractionSyncPayloadNotAllowedWithAsyncTransactionError,
  ProgramInteractionProgramIdMismatchError: () => ProgramInteractionProgramIdMismatchError,
  ProgramInteractionModifiedIllegalBalanceError: () => ProgramInteractionModifiedIllegalBalanceError,
  ProgramInteractionInvalidNumericValueError: () => ProgramInteractionInvalidNumericValueError,
  ProgramInteractionInvalidByteSequenceError: () => ProgramInteractionInvalidByteSequenceError,
  ProgramInteractionInsufficientTokenAllowanceError: () => ProgramInteractionInsufficientTokenAllowanceError,
  ProgramInteractionInsufficientLamportAllowanceError: () => ProgramInteractionInsufficientLamportAllowanceError,
  ProgramInteractionInstructionCountMismatchError: () => ProgramInteractionInstructionCountMismatchError,
  ProgramInteractionIllegalTokenAccountModificationError: () => ProgramInteractionIllegalTokenAccountModificationError,
  ProgramInteractionHookAuthorityCannotBePartOfHookAccountsError: () => ProgramInteractionHookAuthorityCannotBePartOfHookAccountsError,
  ProgramInteractionDuplicateSpendingLimitError: () => ProgramInteractionDuplicateSpendingLimitError,
  ProgramInteractionDataTooShortError: () => ProgramInteractionDataTooShortError,
  ProgramInteractionDataParsingErrorError: () => ProgramInteractionDataParsingErrorError,
  ProgramInteractionConstraintIndexOutOfBoundsError: () => ProgramInteractionConstraintIndexOutOfBoundsError,
  ProgramInteractionAsyncPayloadNotAllowedWithSyncTransactionError: () => ProgramInteractionAsyncPayloadNotAllowedWithSyncTransactionError,
  ProgramInteractionAccountConstraintViolatedError: () => ProgramInteractionAccountConstraintViolatedError,
  ProgramConfig: () => ProgramConfig,
  PolicyNotActiveYetError: () => PolicyNotActiveYetError,
  PolicyInvariantInvalidExpirationError: () => PolicyInvariantInvalidExpirationError,
  PolicyExpirationViolationTimestampExpiredError: () => PolicyExpirationViolationTimestampExpiredError,
  PolicyExpirationViolationSettingsAccountNotPresentError: () => PolicyExpirationViolationSettingsAccountNotPresentError,
  PolicyExpirationViolationPolicySettingsKeyMismatchError: () => PolicyExpirationViolationPolicySettingsKeyMismatchError,
  PolicyExpirationViolationHashExpiredError: () => PolicyExpirationViolationHashExpiredError,
  PolicyExecutionContext: () => PolicyExecutionContext,
  PolicyEventType: () => PolicyEventType,
  Policy: () => Policy,
  PlaceholderErrorError: () => PlaceholderErrorError,
  Period: () => Period,
  PROGRAM_ID: () => PROGRAM_ID,
  PROGRAM_ADDRESS: () => PROGRAM_ADDRESS,
  NotSupportedForControlledError: () => NotSupportedForControlledError,
  NotImplementedError: () => NotImplementedError,
  NotASignerError: () => NotASignerError,
  NoVotersError: () => NoVotersError,
  NoProposersError: () => NoProposersError,
  NoExecutorsError: () => NoExecutorsError,
  NoActionsError: () => NoActionsError,
  MissingSignatureError: () => MissingSignatureError,
  MissingAccountError: () => MissingAccountError,
  LegacyTransaction: () => LegacyTransaction,
  InvalidTransactionMessageError: () => InvalidTransactionMessageError,
  InvalidTransactionIndexError: () => InvalidTransactionIndexError,
  InvalidThresholdError: () => InvalidThresholdError,
  InvalidStaleTransactionIndexError: () => InvalidStaleTransactionIndexError,
  InvalidSignerCountError: () => InvalidSignerCountError,
  InvalidRentCollectorError: () => InvalidRentCollectorError,
  InvalidProposalStatusError: () => InvalidProposalStatusError,
  InvalidPolicyPayloadError: () => InvalidPolicyPayloadError,
  InvalidPayloadError: () => InvalidPayloadError,
  InvalidNumberOfAccountsError: () => InvalidNumberOfAccountsError,
  InvalidMintError: () => InvalidMintError,
  InvalidInstructionArgsError: () => InvalidInstructionArgsError,
  InvalidEmptyPolicyError: () => InvalidEmptyPolicyError,
  InvalidDestinationError: () => InvalidDestinationError,
  InvalidDataConstraintError: () => InvalidDataConstraintError,
  InvalidAccountError: () => InvalidAccountError,
  InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSameError: () => InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSameError,
  InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowedError: () => InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowedError,
  InternalFundTransferPolicyInvariantMintNotAllowedError: () => InternalFundTransferPolicyInvariantMintNotAllowedError,
  InternalFundTransferPolicyInvariantDuplicateMintsError: () => InternalFundTransferPolicyInvariantDuplicateMintsError,
  InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowedError: () => InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowedError,
  InternalFundTransferPolicyInvariantAmountZeroError: () => InternalFundTransferPolicyInvariantAmountZeroError,
  InsufficientVotePermissionsError: () => InsufficientVotePermissionsError,
  InsufficientAggregatePermissionsError: () => InsufficientAggregatePermissionsError,
  IllegalAccountOwnerError: () => IllegalAccountOwnerError,
  FinalBufferSizeMismatchError: () => FinalBufferSizeMismatchError,
  FinalBufferSizeExceededError: () => FinalBufferSizeExceededError,
  FinalBufferHashMismatchError: () => FinalBufferHashMismatchError,
  EmptySignersError: () => EmptySignersError,
  DuplicateSignerError: () => DuplicateSignerError,
  DecimalsMismatchError: () => DecimalsMismatchError,
  DataOperator: () => DataOperator,
  ConsensusAccountType: () => ConsensusAccountType,
  ConsensusAccountNotSettingsError: () => ConsensusAccountNotSettingsError,
  ConsensusAccountNotPolicyError: () => ConsensusAccountNotPolicyError,
  BatchTransaction: () => BatchTransaction,
  BatchNotEmptyError: () => BatchNotEmptyError,
  Batch: () => Batch,
  AlreadyRejectedError: () => AlreadyRejectedError,
  AlreadyCancelledError: () => AlreadyCancelledError,
  AlreadyApprovedError: () => AlreadyApprovedError,
  AccountNotEmptyError: () => AccountNotEmptyError
});
import { PublicKey as PublicKey51 } from "@solana/web3.js";

// src/generated/accounts/Batch.ts
var beet = __toESM(require_beet(), 1);
var beetSolana = __toESM(require_beet_solana(), 1);
import * as web3 from "@solana/web3.js";
var batchDiscriminator = [156, 194, 70, 44, 22, 88, 137, 44];

class Batch {
  settings;
  creator;
  rentCollector;
  index;
  bump;
  accountIndex;
  accountBump;
  size;
  executedTransactionIndex;
  constructor(settings, creator, rentCollector, index, bump, accountIndex, accountBump, size, executedTransactionIndex) {
    this.settings = settings;
    this.creator = creator;
    this.rentCollector = rentCollector;
    this.index = index;
    this.bump = bump;
    this.accountIndex = accountIndex;
    this.accountBump = accountBump;
    this.size = size;
    this.executedTransactionIndex = executedTransactionIndex;
  }
  static fromArgs(args) {
    return new Batch(args.settings, args.creator, args.rentCollector, args.index, args.bump, args.accountIndex, args.accountBump, args.size, args.executedTransactionIndex);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return Batch.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find Batch account at ${address}`);
    }
    return Batch.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web3.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana.GpaBuilder.fromStruct(programId, batchBeet);
  }
  static deserialize(buf, offset = 0) {
    return batchBeet.deserialize(buf, offset);
  }
  serialize() {
    return batchBeet.serialize({
      accountDiscriminator: batchDiscriminator,
      ...this
    });
  }
  static get byteSize() {
    return batchBeet.byteSize;
  }
  static async getMinimumBalanceForRentExemption(connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(Batch.byteSize, commitment);
  }
  static hasCorrectByteSize(buf, offset = 0) {
    return buf.byteLength - offset === Batch.byteSize;
  }
  pretty() {
    return {
      settings: this.settings.toBase58(),
      creator: this.creator.toBase58(),
      rentCollector: this.rentCollector.toBase58(),
      index: (() => {
        const x = this.index;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      bump: this.bump,
      accountIndex: this.accountIndex,
      accountBump: this.accountBump,
      size: this.size,
      executedTransactionIndex: this.executedTransactionIndex
    };
  }
}
var batchBeet = new beet.BeetStruct([
  ["accountDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
  ["settings", beetSolana.publicKey],
  ["creator", beetSolana.publicKey],
  ["rentCollector", beetSolana.publicKey],
  ["index", beet.u64],
  ["bump", beet.u8],
  ["accountIndex", beet.u8],
  ["accountBump", beet.u8],
  ["size", beet.u32],
  ["executedTransactionIndex", beet.u32]
], Batch.fromArgs, "Batch");
// src/generated/accounts/BatchTransaction.ts
var beet5 = __toESM(require_beet(), 1);
var beetSolana4 = __toESM(require_beet_solana(), 1);
import * as web32 from "@solana/web3.js";

// src/generated/types/SmartAccountTransactionMessage.ts
var beet4 = __toESM(require_beet(), 1);
var beetSolana3 = __toESM(require_beet_solana(), 1);

// src/generated/types/SmartAccountCompiledInstruction.ts
var beet2 = __toESM(require_beet(), 1);
var smartAccountCompiledInstructionBeet = new beet2.FixableBeetArgsStruct([
  ["programIdIndex", beet2.u8],
  ["accountIndexes", beet2.bytes],
  ["data", beet2.bytes]
], "SmartAccountCompiledInstruction");

// src/generated/types/SmartAccountMessageAddressTableLookup.ts
var beetSolana2 = __toESM(require_beet_solana(), 1);
var beet3 = __toESM(require_beet(), 1);
var smartAccountMessageAddressTableLookupBeet = new beet3.FixableBeetArgsStruct([
  ["accountKey", beetSolana2.publicKey],
  ["writableIndexes", beet3.bytes],
  ["readonlyIndexes", beet3.bytes]
], "SmartAccountMessageAddressTableLookup");

// src/generated/types/SmartAccountTransactionMessage.ts
var smartAccountTransactionMessageBeet = new beet4.FixableBeetArgsStruct([
  ["numSigners", beet4.u8],
  ["numWritableSigners", beet4.u8],
  ["numWritableNonSigners", beet4.u8],
  ["accountKeys", beet4.array(beetSolana3.publicKey)],
  ["instructions", beet4.array(smartAccountCompiledInstructionBeet)],
  [
    "addressTableLookups",
    beet4.array(smartAccountMessageAddressTableLookupBeet)
  ]
], "SmartAccountTransactionMessage");

// src/generated/accounts/BatchTransaction.ts
var batchTransactionDiscriminator = [92, 20, 61, 146, 155, 62, 112, 72];

class BatchTransaction {
  bump;
  rentCollector;
  ephemeralSignerBumps;
  message;
  constructor(bump, rentCollector, ephemeralSignerBumps, message) {
    this.bump = bump;
    this.rentCollector = rentCollector;
    this.ephemeralSignerBumps = ephemeralSignerBumps;
    this.message = message;
  }
  static fromArgs(args) {
    return new BatchTransaction(args.bump, args.rentCollector, args.ephemeralSignerBumps, args.message);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return BatchTransaction.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find BatchTransaction account at ${address}`);
    }
    return BatchTransaction.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web32.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana4.GpaBuilder.fromStruct(programId, batchTransactionBeet);
  }
  static deserialize(buf, offset = 0) {
    return batchTransactionBeet.deserialize(buf, offset);
  }
  serialize() {
    return batchTransactionBeet.serialize({
      accountDiscriminator: batchTransactionDiscriminator,
      ...this
    });
  }
  static byteSize(args) {
    const instance = BatchTransaction.fromArgs(args);
    return batchTransactionBeet.toFixedFromValue({
      accountDiscriminator: batchTransactionDiscriminator,
      ...instance
    }).byteSize;
  }
  static async getMinimumBalanceForRentExemption(args, connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(BatchTransaction.byteSize(args), commitment);
  }
  pretty() {
    return {
      bump: this.bump,
      rentCollector: this.rentCollector.toBase58(),
      ephemeralSignerBumps: this.ephemeralSignerBumps,
      message: this.message
    };
  }
}
var batchTransactionBeet = new beet5.FixableBeetStruct([
  ["accountDiscriminator", beet5.uniformFixedSizeArray(beet5.u8, 8)],
  ["bump", beet5.u8],
  ["rentCollector", beetSolana4.publicKey],
  ["ephemeralSignerBumps", beet5.bytes],
  ["message", smartAccountTransactionMessageBeet]
], BatchTransaction.fromArgs, "BatchTransaction");
// src/generated/accounts/LegacyTransaction.ts
var beet6 = __toESM(require_beet(), 1);
var beetSolana5 = __toESM(require_beet_solana(), 1);
import * as web33 from "@solana/web3.js";
var legacyTransactionDiscriminator = [
  144,
  147,
  65,
  169,
  145,
  227,
  57,
  51
];

class LegacyTransaction {
  smartAccountSettings;
  creator;
  rentCollector;
  index;
  bump;
  accountIndex;
  accountBump;
  ephemeralSignerBumps;
  message;
  constructor(smartAccountSettings, creator, rentCollector, index, bump, accountIndex, accountBump, ephemeralSignerBumps, message) {
    this.smartAccountSettings = smartAccountSettings;
    this.creator = creator;
    this.rentCollector = rentCollector;
    this.index = index;
    this.bump = bump;
    this.accountIndex = accountIndex;
    this.accountBump = accountBump;
    this.ephemeralSignerBumps = ephemeralSignerBumps;
    this.message = message;
  }
  static fromArgs(args) {
    return new LegacyTransaction(args.smartAccountSettings, args.creator, args.rentCollector, args.index, args.bump, args.accountIndex, args.accountBump, args.ephemeralSignerBumps, args.message);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return LegacyTransaction.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find LegacyTransaction account at ${address}`);
    }
    return LegacyTransaction.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web33.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana5.GpaBuilder.fromStruct(programId, legacyTransactionBeet);
  }
  static deserialize(buf, offset = 0) {
    return legacyTransactionBeet.deserialize(buf, offset);
  }
  serialize() {
    return legacyTransactionBeet.serialize({
      accountDiscriminator: legacyTransactionDiscriminator,
      ...this
    });
  }
  static byteSize(args) {
    const instance = LegacyTransaction.fromArgs(args);
    return legacyTransactionBeet.toFixedFromValue({
      accountDiscriminator: legacyTransactionDiscriminator,
      ...instance
    }).byteSize;
  }
  static async getMinimumBalanceForRentExemption(args, connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(LegacyTransaction.byteSize(args), commitment);
  }
  pretty() {
    return {
      smartAccountSettings: this.smartAccountSettings.toBase58(),
      creator: this.creator.toBase58(),
      rentCollector: this.rentCollector.toBase58(),
      index: (() => {
        const x = this.index;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      bump: this.bump,
      accountIndex: this.accountIndex,
      accountBump: this.accountBump,
      ephemeralSignerBumps: this.ephemeralSignerBumps,
      message: this.message
    };
  }
}
var legacyTransactionBeet = new beet6.FixableBeetStruct([
  ["accountDiscriminator", beet6.uniformFixedSizeArray(beet6.u8, 8)],
  ["smartAccountSettings", beetSolana5.publicKey],
  ["creator", beetSolana5.publicKey],
  ["rentCollector", beetSolana5.publicKey],
  ["index", beet6.u64],
  ["bump", beet6.u8],
  ["accountIndex", beet6.u8],
  ["accountBump", beet6.u8],
  ["ephemeralSignerBumps", beet6.bytes],
  ["message", smartAccountTransactionMessageBeet]
], LegacyTransaction.fromArgs, "LegacyTransaction");
// src/generated/accounts/Policy.ts
var beet28 = __toESM(require_beet(), 1);
var beetSolana15 = __toESM(require_beet_solana(), 1);
import * as web34 from "@solana/web3.js";

// src/generated/types/SmartAccountSigner.ts
var beetSolana6 = __toESM(require_beet_solana(), 1);
var beet8 = __toESM(require_beet(), 1);

// src/generated/types/Permissions.ts
var beet7 = __toESM(require_beet(), 1);
var permissionsBeet = new beet7.BeetArgsStruct([["mask", beet7.u8]], "Permissions");

// src/generated/types/SmartAccountSigner.ts
var smartAccountSignerBeet = new beet8.BeetArgsStruct([
  ["key", beetSolana6.publicKey],
  ["permissions", permissionsBeet]
], "SmartAccountSigner");

// src/generated/types/PolicyState.ts
var beet26 = __toESM(require_beet(), 1);

// src/generated/types/InternalFundTransferPolicy.ts
var beet9 = __toESM(require_beet(), 1);
var beetSolana7 = __toESM(require_beet_solana(), 1);
var internalFundTransferPolicyBeet = new beet9.FixableBeetArgsStruct([
  ["sourceAccountMask", beet9.uniformFixedSizeArray(beet9.u8, 32)],
  ["destinationAccountMask", beet9.uniformFixedSizeArray(beet9.u8, 32)],
  ["allowedMints", beet9.array(beetSolana7.publicKey)]
], "InternalFundTransferPolicy");

// src/generated/types/SpendingLimitPolicy.ts
var beet15 = __toESM(require_beet(), 1);
var beetSolana9 = __toESM(require_beet_solana(), 1);

// src/generated/types/SpendingLimitV2.ts
var beetSolana8 = __toESM(require_beet_solana(), 1);
var beet14 = __toESM(require_beet(), 1);

// src/generated/types/TimeConstraints.ts
var beet11 = __toESM(require_beet(), 1);

// src/generated/types/PeriodV2.ts
var beet10 = __toESM(require_beet(), 1);
var isPeriodV2OneTime = (x) => x.__kind === "OneTime";
var isPeriodV2Daily = (x) => x.__kind === "Daily";
var isPeriodV2Weekly = (x) => x.__kind === "Weekly";
var isPeriodV2Monthly = (x) => x.__kind === "Monthly";
var isPeriodV2Custom = (x) => x.__kind === "Custom";
var periodV2Beet = beet10.dataEnum([
  ["OneTime", beet10.unit],
  ["Daily", beet10.unit],
  ["Weekly", beet10.unit],
  ["Monthly", beet10.unit],
  [
    "Custom",
    new beet10.BeetArgsStruct([["fields", beet10.fixedSizeTuple([beet10.i64])]], 'PeriodV2Record["Custom"]')
  ]
]);

// src/generated/types/TimeConstraints.ts
var timeConstraintsBeet = new beet11.FixableBeetArgsStruct([
  ["start", beet11.i64],
  ["expiration", beet11.coption(beet11.i64)],
  ["period", periodV2Beet],
  ["accumulateUnused", beet11.bool]
], "TimeConstraints");

// src/generated/types/QuantityConstraints.ts
var beet12 = __toESM(require_beet(), 1);
var quantityConstraintsBeet = new beet12.BeetArgsStruct([
  ["maxPerPeriod", beet12.u64],
  ["maxPerUse", beet12.u64],
  ["enforceExactQuantity", beet12.bool]
], "QuantityConstraints");

// src/generated/types/UsageState.ts
var beet13 = __toESM(require_beet(), 1);
var usageStateBeet = new beet13.BeetArgsStruct([
  ["remainingInPeriod", beet13.u64],
  ["lastReset", beet13.i64]
], "UsageState");

// src/generated/types/SpendingLimitV2.ts
var spendingLimitV2Beet = new beet14.FixableBeetArgsStruct([
  ["mint", beetSolana8.publicKey],
  ["timeConstraints", timeConstraintsBeet],
  ["quantityConstraints", quantityConstraintsBeet],
  ["usage", usageStateBeet]
], "SpendingLimitV2");

// src/generated/types/SpendingLimitPolicy.ts
var spendingLimitPolicyBeet = new beet15.FixableBeetArgsStruct([
  ["sourceAccountIndex", beet15.u8],
  ["destinations", beet15.array(beetSolana9.publicKey)],
  ["spendingLimit", spendingLimitV2Beet]
], "SpendingLimitPolicy");

// src/generated/types/SettingsChangePolicy.ts
var beet17 = __toESM(require_beet(), 1);

// src/generated/types/AllowedSettingsChange.ts
var beet16 = __toESM(require_beet(), 1);
var beetSolana10 = __toESM(require_beet_solana(), 1);
var isAllowedSettingsChangeAddSigner = (x) => x.__kind === "AddSigner";
var isAllowedSettingsChangeRemoveSigner = (x) => x.__kind === "RemoveSigner";
var isAllowedSettingsChangeChangeThreshold = (x) => x.__kind === "ChangeThreshold";
var isAllowedSettingsChangeChangeTimeLock = (x) => x.__kind === "ChangeTimeLock";
var allowedSettingsChangeBeet = beet16.dataEnum([
  [
    "AddSigner",
    new beet16.FixableBeetArgsStruct([
      ["newSigner", beet16.coption(beetSolana10.publicKey)],
      ["newSignerPermissions", beet16.coption(permissionsBeet)]
    ], 'AllowedSettingsChangeRecord["AddSigner"]')
  ],
  [
    "RemoveSigner",
    new beet16.FixableBeetArgsStruct([["oldSigner", beet16.coption(beetSolana10.publicKey)]], 'AllowedSettingsChangeRecord["RemoveSigner"]')
  ],
  ["ChangeThreshold", beet16.unit],
  [
    "ChangeTimeLock",
    new beet16.FixableBeetArgsStruct([["newTimeLock", beet16.coption(beet16.u32)]], 'AllowedSettingsChangeRecord["ChangeTimeLock"]')
  ]
]);

// src/generated/types/SettingsChangePolicy.ts
var settingsChangePolicyBeet = new beet17.FixableBeetArgsStruct([["actions", beet17.array(allowedSettingsChangeBeet)]], "SettingsChangePolicy");

// src/generated/types/ProgramInteractionPolicy.ts
var beet25 = __toESM(require_beet(), 1);

// src/generated/types/InstructionConstraint.ts
var beetSolana13 = __toESM(require_beet_solana(), 1);
var beet23 = __toESM(require_beet(), 1);

// src/generated/types/AccountConstraint.ts
var beet22 = __toESM(require_beet(), 1);
var beetSolana12 = __toESM(require_beet_solana(), 1);

// src/generated/types/AccountConstraintType.ts
var beet21 = __toESM(require_beet(), 1);
var beetSolana11 = __toESM(require_beet_solana(), 1);

// src/generated/types/DataConstraint.ts
var beet20 = __toESM(require_beet(), 1);

// src/generated/types/DataValue.ts
var beet18 = __toESM(require_beet(), 1);
var isDataValueU8 = (x) => x.__kind === "U8";
var isDataValueU16Le = (x) => x.__kind === "U16Le";
var isDataValueU32Le = (x) => x.__kind === "U32Le";
var isDataValueU64Le = (x) => x.__kind === "U64Le";
var isDataValueU128Le = (x) => x.__kind === "U128Le";
var isDataValueU8Slice = (x) => x.__kind === "U8Slice";
var dataValueBeet = beet18.dataEnum([
  [
    "U8",
    new beet18.BeetArgsStruct([["fields", beet18.fixedSizeTuple([beet18.u8])]], 'DataValueRecord["U8"]')
  ],
  [
    "U16Le",
    new beet18.BeetArgsStruct([["fields", beet18.fixedSizeTuple([beet18.u16])]], 'DataValueRecord["U16Le"]')
  ],
  [
    "U32Le",
    new beet18.BeetArgsStruct([["fields", beet18.fixedSizeTuple([beet18.u32])]], 'DataValueRecord["U32Le"]')
  ],
  [
    "U64Le",
    new beet18.BeetArgsStruct([["fields", beet18.fixedSizeTuple([beet18.u64])]], 'DataValueRecord["U64Le"]')
  ],
  [
    "U128Le",
    new beet18.BeetArgsStruct([["fields", beet18.fixedSizeTuple([beet18.u128])]], 'DataValueRecord["U128Le"]')
  ],
  [
    "U8Slice",
    new beet18.FixableBeetArgsStruct([["fields", beet18.tuple([beet18.bytes])]], 'DataValueRecord["U8Slice"]')
  ]
]);

// src/generated/types/DataOperator.ts
var beet19 = __toESM(require_beet(), 1);
var DataOperator;
((DataOperator2) => {
  DataOperator2[DataOperator2["Equals"] = 0] = "Equals";
  DataOperator2[DataOperator2["NotEquals"] = 1] = "NotEquals";
  DataOperator2[DataOperator2["GreaterThan"] = 2] = "GreaterThan";
  DataOperator2[DataOperator2["GreaterThanOrEqualTo"] = 3] = "GreaterThanOrEqualTo";
  DataOperator2[DataOperator2["LessThan"] = 4] = "LessThan";
  DataOperator2[DataOperator2["LessThanOrEqualTo"] = 5] = "LessThanOrEqualTo";
})(DataOperator ||= {});
var dataOperatorBeet = beet19.fixedScalarEnum(DataOperator);

// src/generated/types/DataConstraint.ts
var dataConstraintBeet = new beet20.FixableBeetArgsStruct([
  ["dataOffset", beet20.u64],
  ["dataValue", dataValueBeet],
  ["operator", dataOperatorBeet]
], "DataConstraint");

// src/generated/types/AccountConstraintType.ts
var isAccountConstraintTypePubkey = (x) => x.__kind === "Pubkey";
var isAccountConstraintTypeAccountData = (x) => x.__kind === "AccountData";
var accountConstraintTypeBeet = beet21.dataEnum([
  [
    "Pubkey",
    new beet21.FixableBeetArgsStruct([["fields", beet21.tuple([beet21.array(beetSolana11.publicKey)])]], 'AccountConstraintTypeRecord["Pubkey"]')
  ],
  [
    "AccountData",
    new beet21.FixableBeetArgsStruct([["fields", beet21.tuple([beet21.array(dataConstraintBeet)])]], 'AccountConstraintTypeRecord["AccountData"]')
  ]
]);

// src/generated/types/AccountConstraint.ts
var accountConstraintBeet = new beet22.FixableBeetArgsStruct([
  ["accountIndex", beet22.u8],
  ["accountConstraint", accountConstraintTypeBeet],
  ["owner", beet22.coption(beetSolana12.publicKey)]
], "AccountConstraint");

// src/generated/types/InstructionConstraint.ts
var instructionConstraintBeet = new beet23.FixableBeetArgsStruct([
  ["programId", beetSolana13.publicKey],
  ["accountConstraints", beet23.array(accountConstraintBeet)],
  ["dataConstraints", beet23.array(dataConstraintBeet)]
], "InstructionConstraint");

// src/generated/types/Hook.ts
var beet24 = __toESM(require_beet(), 1);
var beetSolana14 = __toESM(require_beet_solana(), 1);
var hookBeet = new beet24.FixableBeetArgsStruct([
  ["numExtraAccounts", beet24.u8],
  ["accountConstraints", beet24.array(accountConstraintBeet)],
  ["instructionData", beet24.bytes],
  ["programId", beetSolana14.publicKey],
  ["passInnerInstructions", beet24.bool]
], "Hook");

// src/generated/types/ProgramInteractionPolicy.ts
var programInteractionPolicyBeet = new beet25.FixableBeetArgsStruct([
  ["accountIndex", beet25.u8],
  ["instructionsConstraints", beet25.array(instructionConstraintBeet)],
  ["preHook", beet25.coption(hookBeet)],
  ["postHook", beet25.coption(hookBeet)],
  ["spendingLimits", beet25.array(spendingLimitV2Beet)]
], "ProgramInteractionPolicy");

// src/generated/types/PolicyState.ts
var isPolicyStateInternalFundTransfer = (x) => x.__kind === "InternalFundTransfer";
var isPolicyStateSpendingLimit = (x) => x.__kind === "SpendingLimit";
var isPolicyStateSettingsChange = (x) => x.__kind === "SettingsChange";
var isPolicyStateProgramInteraction = (x) => x.__kind === "ProgramInteraction";
var policyStateBeet = beet26.dataEnum([
  [
    "InternalFundTransfer",
    new beet26.FixableBeetArgsStruct([["fields", beet26.tuple([internalFundTransferPolicyBeet])]], 'PolicyStateRecord["InternalFundTransfer"]')
  ],
  [
    "SpendingLimit",
    new beet26.FixableBeetArgsStruct([["fields", beet26.tuple([spendingLimitPolicyBeet])]], 'PolicyStateRecord["SpendingLimit"]')
  ],
  [
    "SettingsChange",
    new beet26.FixableBeetArgsStruct([["fields", beet26.tuple([settingsChangePolicyBeet])]], 'PolicyStateRecord["SettingsChange"]')
  ],
  [
    "ProgramInteraction",
    new beet26.FixableBeetArgsStruct([["fields", beet26.tuple([programInteractionPolicyBeet])]], 'PolicyStateRecord["ProgramInteraction"]')
  ]
]);

// src/generated/types/PolicyExpiration.ts
var beet27 = __toESM(require_beet(), 1);
var isPolicyExpirationTimestamp = (x) => x.__kind === "Timestamp";
var isPolicyExpirationSettingsState = (x) => x.__kind === "SettingsState";
var policyExpirationBeet = beet27.dataEnum([
  [
    "Timestamp",
    new beet27.BeetArgsStruct([["fields", beet27.fixedSizeTuple([beet27.i64])]], 'PolicyExpirationRecord["Timestamp"]')
  ],
  [
    "SettingsState",
    new beet27.BeetArgsStruct([
      [
        "fields",
        beet27.fixedSizeTuple([beet27.uniformFixedSizeArray(beet27.u8, 32)])
      ]
    ], 'PolicyExpirationRecord["SettingsState"]')
  ]
]);

// src/generated/accounts/Policy.ts
var policyDiscriminator = [222, 135, 7, 163, 235, 177, 33, 68];

class Policy {
  settings;
  seed;
  bump;
  transactionIndex;
  staleTransactionIndex;
  signers;
  threshold;
  timeLock;
  policyState;
  start;
  expiration;
  rentCollector;
  constructor(settings, seed, bump, transactionIndex, staleTransactionIndex, signers, threshold, timeLock, policyState, start, expiration, rentCollector) {
    this.settings = settings;
    this.seed = seed;
    this.bump = bump;
    this.transactionIndex = transactionIndex;
    this.staleTransactionIndex = staleTransactionIndex;
    this.signers = signers;
    this.threshold = threshold;
    this.timeLock = timeLock;
    this.policyState = policyState;
    this.start = start;
    this.expiration = expiration;
    this.rentCollector = rentCollector;
  }
  static fromArgs(args) {
    return new Policy(args.settings, args.seed, args.bump, args.transactionIndex, args.staleTransactionIndex, args.signers, args.threshold, args.timeLock, args.policyState, args.start, args.expiration, args.rentCollector);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return Policy.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find Policy account at ${address}`);
    }
    return Policy.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web34.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana15.GpaBuilder.fromStruct(programId, policyBeet);
  }
  static deserialize(buf, offset = 0) {
    return policyBeet.deserialize(buf, offset);
  }
  serialize() {
    return policyBeet.serialize({
      accountDiscriminator: policyDiscriminator,
      ...this
    });
  }
  static byteSize(args) {
    const instance = Policy.fromArgs(args);
    return policyBeet.toFixedFromValue({
      accountDiscriminator: policyDiscriminator,
      ...instance
    }).byteSize;
  }
  static async getMinimumBalanceForRentExemption(args, connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(Policy.byteSize(args), commitment);
  }
  pretty() {
    return {
      settings: this.settings.toBase58(),
      seed: (() => {
        const x = this.seed;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      bump: this.bump,
      transactionIndex: (() => {
        const x = this.transactionIndex;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      staleTransactionIndex: (() => {
        const x = this.staleTransactionIndex;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      signers: this.signers,
      threshold: this.threshold,
      timeLock: this.timeLock,
      policyState: this.policyState.__kind,
      start: (() => {
        const x = this.start;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      expiration: this.expiration,
      rentCollector: this.rentCollector.toBase58()
    };
  }
}
var policyBeet = new beet28.FixableBeetStruct([
  ["accountDiscriminator", beet28.uniformFixedSizeArray(beet28.u8, 8)],
  ["settings", beetSolana15.publicKey],
  ["seed", beet28.u64],
  ["bump", beet28.u8],
  ["transactionIndex", beet28.u64],
  ["staleTransactionIndex", beet28.u64],
  ["signers", beet28.array(smartAccountSignerBeet)],
  ["threshold", beet28.u16],
  ["timeLock", beet28.u32],
  ["policyState", policyStateBeet],
  ["start", beet28.i64],
  ["expiration", beet28.coption(policyExpirationBeet)],
  ["rentCollector", beetSolana15.publicKey]
], Policy.fromArgs, "Policy");
// src/generated/accounts/ProgramConfig.ts
var beet29 = __toESM(require_beet(), 1);
var beetSolana16 = __toESM(require_beet_solana(), 1);
import * as web35 from "@solana/web3.js";
var programConfigDiscriminator = [196, 210, 90, 231, 144, 149, 140, 63];

class ProgramConfig {
  smartAccountIndex;
  authority;
  smartAccountCreationFee;
  treasury;
  reserved;
  constructor(smartAccountIndex, authority, smartAccountCreationFee, treasury, reserved) {
    this.smartAccountIndex = smartAccountIndex;
    this.authority = authority;
    this.smartAccountCreationFee = smartAccountCreationFee;
    this.treasury = treasury;
    this.reserved = reserved;
  }
  static fromArgs(args) {
    return new ProgramConfig(args.smartAccountIndex, args.authority, args.smartAccountCreationFee, args.treasury, args.reserved);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return ProgramConfig.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find ProgramConfig account at ${address}`);
    }
    return ProgramConfig.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web35.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana16.GpaBuilder.fromStruct(programId, programConfigBeet);
  }
  static deserialize(buf, offset = 0) {
    return programConfigBeet.deserialize(buf, offset);
  }
  serialize() {
    return programConfigBeet.serialize({
      accountDiscriminator: programConfigDiscriminator,
      ...this
    });
  }
  static get byteSize() {
    return programConfigBeet.byteSize;
  }
  static async getMinimumBalanceForRentExemption(connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(ProgramConfig.byteSize, commitment);
  }
  static hasCorrectByteSize(buf, offset = 0) {
    return buf.byteLength - offset === ProgramConfig.byteSize;
  }
  pretty() {
    return {
      smartAccountIndex: (() => {
        const x = this.smartAccountIndex;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      authority: this.authority.toBase58(),
      smartAccountCreationFee: (() => {
        const x = this.smartAccountCreationFee;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      treasury: this.treasury.toBase58(),
      reserved: this.reserved
    };
  }
}
var programConfigBeet = new beet29.BeetStruct([
  ["accountDiscriminator", beet29.uniformFixedSizeArray(beet29.u8, 8)],
  ["smartAccountIndex", beet29.u128],
  ["authority", beetSolana16.publicKey],
  ["smartAccountCreationFee", beet29.u64],
  ["treasury", beetSolana16.publicKey],
  ["reserved", beet29.uniformFixedSizeArray(beet29.u8, 64)]
], ProgramConfig.fromArgs, "ProgramConfig");
// src/generated/accounts/Proposal.ts
var beet31 = __toESM(require_beet(), 1);
var beetSolana17 = __toESM(require_beet_solana(), 1);
import * as web36 from "@solana/web3.js";

// src/generated/types/ProposalStatus.ts
var beet30 = __toESM(require_beet(), 1);
var isProposalStatusDraft = (x) => x.__kind === "Draft";
var isProposalStatusActive = (x) => x.__kind === "Active";
var isProposalStatusRejected = (x) => x.__kind === "Rejected";
var isProposalStatusApproved = (x) => x.__kind === "Approved";
var isProposalStatusExecuting = (x) => x.__kind === "Executing";
var isProposalStatusExecuted = (x) => x.__kind === "Executed";
var isProposalStatusCancelled = (x) => x.__kind === "Cancelled";
var proposalStatusBeet = beet30.dataEnum([
  [
    "Draft",
    new beet30.BeetArgsStruct([["timestamp", beet30.i64]], 'ProposalStatusRecord["Draft"]')
  ],
  [
    "Active",
    new beet30.BeetArgsStruct([["timestamp", beet30.i64]], 'ProposalStatusRecord["Active"]')
  ],
  [
    "Rejected",
    new beet30.BeetArgsStruct([["timestamp", beet30.i64]], 'ProposalStatusRecord["Rejected"]')
  ],
  [
    "Approved",
    new beet30.BeetArgsStruct([["timestamp", beet30.i64]], 'ProposalStatusRecord["Approved"]')
  ],
  ["Executing", beet30.unit],
  [
    "Executed",
    new beet30.BeetArgsStruct([["timestamp", beet30.i64]], 'ProposalStatusRecord["Executed"]')
  ],
  [
    "Cancelled",
    new beet30.BeetArgsStruct([["timestamp", beet30.i64]], 'ProposalStatusRecord["Cancelled"]')
  ]
]);

// src/generated/accounts/Proposal.ts
var proposalDiscriminator = [26, 94, 189, 187, 116, 136, 53, 33];

class Proposal {
  settings;
  transactionIndex;
  rentCollector;
  status;
  bump;
  approved;
  rejected;
  cancelled;
  constructor(settings, transactionIndex, rentCollector, status, bump, approved, rejected, cancelled) {
    this.settings = settings;
    this.transactionIndex = transactionIndex;
    this.rentCollector = rentCollector;
    this.status = status;
    this.bump = bump;
    this.approved = approved;
    this.rejected = rejected;
    this.cancelled = cancelled;
  }
  static fromArgs(args) {
    return new Proposal(args.settings, args.transactionIndex, args.rentCollector, args.status, args.bump, args.approved, args.rejected, args.cancelled);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return Proposal.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find Proposal account at ${address}`);
    }
    return Proposal.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web36.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana17.GpaBuilder.fromStruct(programId, proposalBeet);
  }
  static deserialize(buf, offset = 0) {
    return proposalBeet.deserialize(buf, offset);
  }
  serialize() {
    return proposalBeet.serialize({
      accountDiscriminator: proposalDiscriminator,
      ...this
    });
  }
  static byteSize(args) {
    const instance = Proposal.fromArgs(args);
    return proposalBeet.toFixedFromValue({
      accountDiscriminator: proposalDiscriminator,
      ...instance
    }).byteSize;
  }
  static async getMinimumBalanceForRentExemption(args, connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(Proposal.byteSize(args), commitment);
  }
  pretty() {
    return {
      settings: this.settings.toBase58(),
      transactionIndex: (() => {
        const x = this.transactionIndex;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      rentCollector: this.rentCollector.toBase58(),
      status: this.status.__kind,
      bump: this.bump,
      approved: this.approved,
      rejected: this.rejected,
      cancelled: this.cancelled
    };
  }
}
var proposalBeet = new beet31.FixableBeetStruct([
  ["accountDiscriminator", beet31.uniformFixedSizeArray(beet31.u8, 8)],
  ["settings", beetSolana17.publicKey],
  ["transactionIndex", beet31.u64],
  ["rentCollector", beetSolana17.publicKey],
  ["status", proposalStatusBeet],
  ["bump", beet31.u8],
  ["approved", beet31.array(beetSolana17.publicKey)],
  ["rejected", beet31.array(beetSolana17.publicKey)],
  ["cancelled", beet31.array(beetSolana17.publicKey)]
], Proposal.fromArgs, "Proposal");
// src/generated/accounts/Settings.ts
var beet32 = __toESM(require_beet(), 1);
var beetSolana18 = __toESM(require_beet_solana(), 1);
import * as web37 from "@solana/web3.js";
var settingsDiscriminator = [223, 179, 163, 190, 177, 224, 67, 173];

class Settings {
  seed;
  settingsAuthority;
  threshold;
  timeLock;
  transactionIndex;
  staleTransactionIndex;
  archivalAuthority;
  archivableAfter;
  bump;
  signers;
  accountUtilization;
  policySeed;
  reserved2;
  constructor(seed, settingsAuthority, threshold, timeLock, transactionIndex, staleTransactionIndex, archivalAuthority, archivableAfter, bump, signers, accountUtilization, policySeed, reserved2) {
    this.seed = seed;
    this.settingsAuthority = settingsAuthority;
    this.threshold = threshold;
    this.timeLock = timeLock;
    this.transactionIndex = transactionIndex;
    this.staleTransactionIndex = staleTransactionIndex;
    this.archivalAuthority = archivalAuthority;
    this.archivableAfter = archivableAfter;
    this.bump = bump;
    this.signers = signers;
    this.accountUtilization = accountUtilization;
    this.policySeed = policySeed;
    this.reserved2 = reserved2;
  }
  static fromArgs(args) {
    return new Settings(args.seed, args.settingsAuthority, args.threshold, args.timeLock, args.transactionIndex, args.staleTransactionIndex, args.archivalAuthority, args.archivableAfter, args.bump, args.signers, args.accountUtilization, args.policySeed, args.reserved2);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return Settings.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find Settings account at ${address}`);
    }
    return Settings.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web37.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana18.GpaBuilder.fromStruct(programId, settingsBeet);
  }
  static deserialize(buf, offset = 0) {
    return settingsBeet.deserialize(buf, offset);
  }
  serialize() {
    return settingsBeet.serialize({
      accountDiscriminator: settingsDiscriminator,
      ...this
    });
  }
  static byteSize(args) {
    const instance = Settings.fromArgs(args);
    return settingsBeet.toFixedFromValue({
      accountDiscriminator: settingsDiscriminator,
      ...instance
    }).byteSize;
  }
  static async getMinimumBalanceForRentExemption(args, connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(Settings.byteSize(args), commitment);
  }
  pretty() {
    return {
      seed: (() => {
        const x = this.seed;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      settingsAuthority: this.settingsAuthority.toBase58(),
      threshold: this.threshold,
      timeLock: this.timeLock,
      transactionIndex: (() => {
        const x = this.transactionIndex;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      staleTransactionIndex: (() => {
        const x = this.staleTransactionIndex;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      archivalAuthority: this.archivalAuthority,
      archivableAfter: (() => {
        const x = this.archivableAfter;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      bump: this.bump,
      signers: this.signers,
      accountUtilization: this.accountUtilization,
      policySeed: this.policySeed,
      reserved2: this.reserved2
    };
  }
}
var settingsBeet = new beet32.FixableBeetStruct([
  ["accountDiscriminator", beet32.uniformFixedSizeArray(beet32.u8, 8)],
  ["seed", beet32.u128],
  ["settingsAuthority", beetSolana18.publicKey],
  ["threshold", beet32.u16],
  ["timeLock", beet32.u32],
  ["transactionIndex", beet32.u64],
  ["staleTransactionIndex", beet32.u64],
  ["archivalAuthority", beet32.coption(beetSolana18.publicKey)],
  ["archivableAfter", beet32.u64],
  ["bump", beet32.u8],
  ["signers", beet32.array(smartAccountSignerBeet)],
  ["accountUtilization", beet32.u8],
  ["policySeed", beet32.coption(beet32.u64)],
  ["reserved2", beet32.u8]
], Settings.fromArgs, "Settings");
// src/generated/accounts/SettingsTransaction.ts
var beet44 = __toESM(require_beet(), 1);
var beetSolana23 = __toESM(require_beet_solana(), 1);
import * as web38 from "@solana/web3.js";

// src/generated/types/SettingsAction.ts
var beet43 = __toESM(require_beet(), 1);
var beetSolana22 = __toESM(require_beet_solana(), 1);

// src/generated/types/Period.ts
var beet33 = __toESM(require_beet(), 1);
var Period;
((Period2) => {
  Period2[Period2["OneTime"] = 0] = "OneTime";
  Period2[Period2["Day"] = 1] = "Day";
  Period2[Period2["Week"] = 2] = "Week";
  Period2[Period2["Month"] = 3] = "Month";
})(Period ||= {});
var periodBeet = beet33.fixedScalarEnum(Period);

// src/generated/types/PolicyCreationPayload.ts
var beet41 = __toESM(require_beet(), 1);

// src/generated/types/InternalFundTransferPolicyCreationPayload.ts
var beet34 = __toESM(require_beet(), 1);
var beetSolana19 = __toESM(require_beet_solana(), 1);
var internalFundTransferPolicyCreationPayloadBeet = new beet34.FixableBeetArgsStruct([
  ["sourceAccountIndices", beet34.bytes],
  ["destinationAccountIndices", beet34.bytes],
  ["allowedMints", beet34.array(beetSolana19.publicKey)]
], "InternalFundTransferPolicyCreationPayload");

// src/generated/types/SpendingLimitPolicyCreationPayload.ts
var beet35 = __toESM(require_beet(), 1);
var beetSolana20 = __toESM(require_beet_solana(), 1);
var spendingLimitPolicyCreationPayloadBeet = new beet35.FixableBeetArgsStruct([
  ["mint", beetSolana20.publicKey],
  ["sourceAccountIndex", beet35.u8],
  ["timeConstraints", timeConstraintsBeet],
  ["quantityConstraints", quantityConstraintsBeet],
  ["usageState", beet35.coption(usageStateBeet)],
  ["destinations", beet35.array(beetSolana20.publicKey)]
], "SpendingLimitPolicyCreationPayload");

// src/generated/types/SettingsChangePolicyCreationPayload.ts
var beet36 = __toESM(require_beet(), 1);
var settingsChangePolicyCreationPayloadBeet = new beet36.FixableBeetArgsStruct([["actions", beet36.array(allowedSettingsChangeBeet)]], "SettingsChangePolicyCreationPayload");

// src/generated/types/ProgramInteractionPolicyCreationPayload.ts
var beet40 = __toESM(require_beet(), 1);

// src/generated/types/LimitedSpendingLimit.ts
var beetSolana21 = __toESM(require_beet_solana(), 1);
var beet39 = __toESM(require_beet(), 1);

// src/generated/types/LimitedTimeConstraints.ts
var beet37 = __toESM(require_beet(), 1);
var limitedTimeConstraintsBeet = new beet37.FixableBeetArgsStruct([
  ["start", beet37.i64],
  ["expiration", beet37.coption(beet37.i64)],
  ["period", periodV2Beet]
], "LimitedTimeConstraints");

// src/generated/types/LimitedQuantityConstraints.ts
var beet38 = __toESM(require_beet(), 1);
var limitedQuantityConstraintsBeet = new beet38.BeetArgsStruct([["maxPerPeriod", beet38.u64]], "LimitedQuantityConstraints");

// src/generated/types/LimitedSpendingLimit.ts
var limitedSpendingLimitBeet = new beet39.FixableBeetArgsStruct([
  ["mint", beetSolana21.publicKey],
  ["timeConstraints", limitedTimeConstraintsBeet],
  ["quantityConstraints", limitedQuantityConstraintsBeet]
], "LimitedSpendingLimit");

// src/generated/types/ProgramInteractionPolicyCreationPayload.ts
var programInteractionPolicyCreationPayloadBeet = new beet40.FixableBeetArgsStruct([
  ["accountIndex", beet40.u8],
  ["instructionsConstraints", beet40.array(instructionConstraintBeet)],
  ["preHook", beet40.coption(hookBeet)],
  ["postHook", beet40.coption(hookBeet)],
  ["spendingLimits", beet40.array(limitedSpendingLimitBeet)]
], "ProgramInteractionPolicyCreationPayload");

// src/generated/types/PolicyCreationPayload.ts
var isPolicyCreationPayloadInternalFundTransfer = (x) => x.__kind === "InternalFundTransfer";
var isPolicyCreationPayloadSpendingLimit = (x) => x.__kind === "SpendingLimit";
var isPolicyCreationPayloadSettingsChange = (x) => x.__kind === "SettingsChange";
var isPolicyCreationPayloadProgramInteraction = (x) => x.__kind === "ProgramInteraction";
var policyCreationPayloadBeet = beet41.dataEnum([
  [
    "InternalFundTransfer",
    new beet41.FixableBeetArgsStruct([
      [
        "fields",
        beet41.tuple([internalFundTransferPolicyCreationPayloadBeet])
      ]
    ], 'PolicyCreationPayloadRecord["InternalFundTransfer"]')
  ],
  [
    "SpendingLimit",
    new beet41.FixableBeetArgsStruct([["fields", beet41.tuple([spendingLimitPolicyCreationPayloadBeet])]], 'PolicyCreationPayloadRecord["SpendingLimit"]')
  ],
  [
    "SettingsChange",
    new beet41.FixableBeetArgsStruct([["fields", beet41.tuple([settingsChangePolicyCreationPayloadBeet])]], 'PolicyCreationPayloadRecord["SettingsChange"]')
  ],
  [
    "ProgramInteraction",
    new beet41.FixableBeetArgsStruct([["fields", beet41.tuple([programInteractionPolicyCreationPayloadBeet])]], 'PolicyCreationPayloadRecord["ProgramInteraction"]')
  ]
]);

// src/generated/types/PolicyExpirationArgs.ts
var beet42 = __toESM(require_beet(), 1);
var isPolicyExpirationArgsTimestamp = (x) => x.__kind === "Timestamp";
var isPolicyExpirationArgsSettingsState = (x) => x.__kind === "SettingsState";
var policyExpirationArgsBeet = beet42.dataEnum([
  [
    "Timestamp",
    new beet42.BeetArgsStruct([["fields", beet42.fixedSizeTuple([beet42.i64])]], 'PolicyExpirationArgsRecord["Timestamp"]')
  ],
  ["SettingsState", beet42.unit]
]);

// src/generated/types/SettingsAction.ts
var isSettingsActionAddSigner = (x) => x.__kind === "AddSigner";
var isSettingsActionRemoveSigner = (x) => x.__kind === "RemoveSigner";
var isSettingsActionChangeThreshold = (x) => x.__kind === "ChangeThreshold";
var isSettingsActionSetTimeLock = (x) => x.__kind === "SetTimeLock";
var isSettingsActionAddSpendingLimit = (x) => x.__kind === "AddSpendingLimit";
var isSettingsActionRemoveSpendingLimit = (x) => x.__kind === "RemoveSpendingLimit";
var isSettingsActionSetArchivalAuthority = (x) => x.__kind === "SetArchivalAuthority";
var isSettingsActionPolicyCreate = (x) => x.__kind === "PolicyCreate";
var isSettingsActionPolicyUpdate = (x) => x.__kind === "PolicyUpdate";
var isSettingsActionPolicyRemove = (x) => x.__kind === "PolicyRemove";
var settingsActionBeet = beet43.dataEnum([
  [
    "AddSigner",
    new beet43.BeetArgsStruct([["newSigner", smartAccountSignerBeet]], 'SettingsActionRecord["AddSigner"]')
  ],
  [
    "RemoveSigner",
    new beet43.BeetArgsStruct([["oldSigner", beetSolana22.publicKey]], 'SettingsActionRecord["RemoveSigner"]')
  ],
  [
    "ChangeThreshold",
    new beet43.BeetArgsStruct([["newThreshold", beet43.u16]], 'SettingsActionRecord["ChangeThreshold"]')
  ],
  [
    "SetTimeLock",
    new beet43.BeetArgsStruct([["newTimeLock", beet43.u32]], 'SettingsActionRecord["SetTimeLock"]')
  ],
  [
    "AddSpendingLimit",
    new beet43.FixableBeetArgsStruct([
      ["seed", beetSolana22.publicKey],
      ["accountIndex", beet43.u8],
      ["mint", beetSolana22.publicKey],
      ["amount", beet43.u64],
      ["period", periodBeet],
      ["signers", beet43.array(beetSolana22.publicKey)],
      ["destinations", beet43.array(beetSolana22.publicKey)],
      ["expiration", beet43.i64]
    ], 'SettingsActionRecord["AddSpendingLimit"]')
  ],
  [
    "RemoveSpendingLimit",
    new beet43.BeetArgsStruct([["spendingLimit", beetSolana22.publicKey]], 'SettingsActionRecord["RemoveSpendingLimit"]')
  ],
  [
    "SetArchivalAuthority",
    new beet43.FixableBeetArgsStruct([["newArchivalAuthority", beet43.coption(beetSolana22.publicKey)]], 'SettingsActionRecord["SetArchivalAuthority"]')
  ],
  [
    "PolicyCreate",
    new beet43.FixableBeetArgsStruct([
      ["seed", beet43.u64],
      ["policyCreationPayload", policyCreationPayloadBeet],
      ["signers", beet43.array(smartAccountSignerBeet)],
      ["threshold", beet43.u16],
      ["timeLock", beet43.u32],
      ["startTimestamp", beet43.coption(beet43.i64)],
      ["expirationArgs", beet43.coption(policyExpirationArgsBeet)]
    ], 'SettingsActionRecord["PolicyCreate"]')
  ],
  [
    "PolicyUpdate",
    new beet43.FixableBeetArgsStruct([
      ["policy", beetSolana22.publicKey],
      ["signers", beet43.array(smartAccountSignerBeet)],
      ["threshold", beet43.u16],
      ["timeLock", beet43.u32],
      ["policyUpdatePayload", policyCreationPayloadBeet],
      ["expirationArgs", beet43.coption(policyExpirationArgsBeet)]
    ], 'SettingsActionRecord["PolicyUpdate"]')
  ],
  [
    "PolicyRemove",
    new beet43.BeetArgsStruct([["policy", beetSolana22.publicKey]], 'SettingsActionRecord["PolicyRemove"]')
  ]
]);

// src/generated/accounts/SettingsTransaction.ts
var settingsTransactionDiscriminator = [
  199,
  151,
  72,
  87,
  77,
  124,
  16,
  0
];

class SettingsTransaction {
  settings;
  creator;
  rentCollector;
  index;
  bump;
  actions;
  constructor(settings, creator, rentCollector, index, bump, actions) {
    this.settings = settings;
    this.creator = creator;
    this.rentCollector = rentCollector;
    this.index = index;
    this.bump = bump;
    this.actions = actions;
  }
  static fromArgs(args) {
    return new SettingsTransaction(args.settings, args.creator, args.rentCollector, args.index, args.bump, args.actions);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return SettingsTransaction.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find SettingsTransaction account at ${address}`);
    }
    return SettingsTransaction.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web38.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana23.GpaBuilder.fromStruct(programId, settingsTransactionBeet);
  }
  static deserialize(buf, offset = 0) {
    return settingsTransactionBeet.deserialize(buf, offset);
  }
  serialize() {
    return settingsTransactionBeet.serialize({
      accountDiscriminator: settingsTransactionDiscriminator,
      ...this
    });
  }
  static byteSize(args) {
    const instance = SettingsTransaction.fromArgs(args);
    return settingsTransactionBeet.toFixedFromValue({
      accountDiscriminator: settingsTransactionDiscriminator,
      ...instance
    }).byteSize;
  }
  static async getMinimumBalanceForRentExemption(args, connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(SettingsTransaction.byteSize(args), commitment);
  }
  pretty() {
    return {
      settings: this.settings.toBase58(),
      creator: this.creator.toBase58(),
      rentCollector: this.rentCollector.toBase58(),
      index: (() => {
        const x = this.index;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      bump: this.bump,
      actions: this.actions
    };
  }
}
var settingsTransactionBeet = new beet44.FixableBeetStruct([
  ["accountDiscriminator", beet44.uniformFixedSizeArray(beet44.u8, 8)],
  ["settings", beetSolana23.publicKey],
  ["creator", beetSolana23.publicKey],
  ["rentCollector", beetSolana23.publicKey],
  ["index", beet44.u64],
  ["bump", beet44.u8],
  ["actions", beet44.array(settingsActionBeet)]
], SettingsTransaction.fromArgs, "SettingsTransaction");
// src/generated/accounts/SpendingLimit.ts
var beet45 = __toESM(require_beet(), 1);
var beetSolana24 = __toESM(require_beet_solana(), 1);
import * as web39 from "@solana/web3.js";
var spendingLimitDiscriminator = [10, 201, 27, 160, 218, 195, 222, 152];

class SpendingLimit {
  settings;
  seed;
  accountIndex;
  mint;
  amount;
  period;
  remainingAmount;
  lastReset;
  bump;
  signers;
  destinations;
  expiration;
  constructor(settings, seed, accountIndex, mint, amount, period, remainingAmount, lastReset, bump, signers, destinations, expiration) {
    this.settings = settings;
    this.seed = seed;
    this.accountIndex = accountIndex;
    this.mint = mint;
    this.amount = amount;
    this.period = period;
    this.remainingAmount = remainingAmount;
    this.lastReset = lastReset;
    this.bump = bump;
    this.signers = signers;
    this.destinations = destinations;
    this.expiration = expiration;
  }
  static fromArgs(args) {
    return new SpendingLimit(args.settings, args.seed, args.accountIndex, args.mint, args.amount, args.period, args.remainingAmount, args.lastReset, args.bump, args.signers, args.destinations, args.expiration);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return SpendingLimit.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find SpendingLimit account at ${address}`);
    }
    return SpendingLimit.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web39.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana24.GpaBuilder.fromStruct(programId, spendingLimitBeet);
  }
  static deserialize(buf, offset = 0) {
    return spendingLimitBeet.deserialize(buf, offset);
  }
  serialize() {
    return spendingLimitBeet.serialize({
      accountDiscriminator: spendingLimitDiscriminator,
      ...this
    });
  }
  static byteSize(args) {
    const instance = SpendingLimit.fromArgs(args);
    return spendingLimitBeet.toFixedFromValue({
      accountDiscriminator: spendingLimitDiscriminator,
      ...instance
    }).byteSize;
  }
  static async getMinimumBalanceForRentExemption(args, connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(SpendingLimit.byteSize(args), commitment);
  }
  pretty() {
    return {
      settings: this.settings.toBase58(),
      seed: this.seed.toBase58(),
      accountIndex: this.accountIndex,
      mint: this.mint.toBase58(),
      amount: (() => {
        const x = this.amount;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      period: "Period." + Period[this.period],
      remainingAmount: (() => {
        const x = this.remainingAmount;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      lastReset: (() => {
        const x = this.lastReset;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      bump: this.bump,
      signers: this.signers,
      destinations: this.destinations,
      expiration: (() => {
        const x = this.expiration;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })()
    };
  }
}
var spendingLimitBeet = new beet45.FixableBeetStruct([
  ["accountDiscriminator", beet45.uniformFixedSizeArray(beet45.u8, 8)],
  ["settings", beetSolana24.publicKey],
  ["seed", beetSolana24.publicKey],
  ["accountIndex", beet45.u8],
  ["mint", beetSolana24.publicKey],
  ["amount", beet45.u64],
  ["period", periodBeet],
  ["remainingAmount", beet45.u64],
  ["lastReset", beet45.i64],
  ["bump", beet45.u8],
  ["signers", beet45.array(beetSolana24.publicKey)],
  ["destinations", beet45.array(beetSolana24.publicKey)],
  ["expiration", beet45.i64]
], SpendingLimit.fromArgs, "SpendingLimit");
// src/generated/accounts/Transaction.ts
var beet58 = __toESM(require_beet(), 1);
var beetSolana28 = __toESM(require_beet_solana(), 1);
import * as web310 from "@solana/web3.js";

// src/generated/types/Payload.ts
var beet57 = __toESM(require_beet(), 1);

// src/generated/types/TransactionPayloadDetails.ts
var beet46 = __toESM(require_beet(), 1);
var transactionPayloadDetailsBeet = new beet46.FixableBeetArgsStruct([
  ["accountIndex", beet46.u8],
  ["ephemeralSignerBumps", beet46.bytes],
  ["message", smartAccountTransactionMessageBeet]
], "TransactionPayloadDetails");

// src/generated/types/PolicyActionPayloadDetails.ts
var beet56 = __toESM(require_beet(), 1);

// src/generated/types/PolicyPayload.ts
var beet55 = __toESM(require_beet(), 1);

// src/generated/types/InternalFundTransferPayload.ts
var beet47 = __toESM(require_beet(), 1);
var beetSolana25 = __toESM(require_beet_solana(), 1);
var internalFundTransferPayloadBeet = new beet47.BeetArgsStruct([
  ["sourceIndex", beet47.u8],
  ["destinationIndex", beet47.u8],
  ["mint", beetSolana25.publicKey],
  ["decimals", beet47.u8],
  ["amount", beet47.u64]
], "InternalFundTransferPayload");

// src/generated/types/ProgramInteractionPayload.ts
var beet51 = __toESM(require_beet(), 1);

// src/generated/types/ProgramInteractionTransactionPayload.ts
var beet50 = __toESM(require_beet(), 1);

// src/generated/types/TransactionPayload.ts
var beet48 = __toESM(require_beet(), 1);
var transactionPayloadBeet = new beet48.FixableBeetArgsStruct([
  ["accountIndex", beet48.u8],
  ["ephemeralSigners", beet48.u8],
  ["transactionMessage", beet48.bytes],
  ["memo", beet48.coption(beet48.utf8String)]
], "TransactionPayload");

// src/generated/types/SyncTransactionPayloadDetails.ts
var beet49 = __toESM(require_beet(), 1);
var syncTransactionPayloadDetailsBeet = new beet49.FixableBeetArgsStruct([
  ["accountIndex", beet49.u8],
  ["instructions", beet49.bytes]
], "SyncTransactionPayloadDetails");

// src/generated/types/ProgramInteractionTransactionPayload.ts
var isProgramInteractionTransactionPayloadAsyncTransaction = (x) => x.__kind === "AsyncTransaction";
var isProgramInteractionTransactionPayloadSyncTransaction = (x) => x.__kind === "SyncTransaction";
var programInteractionTransactionPayloadBeet = beet50.dataEnum([
  [
    "AsyncTransaction",
    new beet50.FixableBeetArgsStruct([["fields", beet50.tuple([transactionPayloadBeet])]], 'ProgramInteractionTransactionPayloadRecord["AsyncTransaction"]')
  ],
  [
    "SyncTransaction",
    new beet50.FixableBeetArgsStruct([["fields", beet50.tuple([syncTransactionPayloadDetailsBeet])]], 'ProgramInteractionTransactionPayloadRecord["SyncTransaction"]')
  ]
]);

// src/generated/types/ProgramInteractionPayload.ts
var programInteractionPayloadBeet = new beet51.FixableBeetArgsStruct([
  ["instructionConstraintIndices", beet51.coption(beet51.bytes)],
  ["transactionPayload", programInteractionTransactionPayloadBeet]
], "ProgramInteractionPayload");

// src/generated/types/SpendingLimitPayload.ts
var beet52 = __toESM(require_beet(), 1);
var beetSolana26 = __toESM(require_beet_solana(), 1);
var spendingLimitPayloadBeet = new beet52.BeetArgsStruct([
  ["amount", beet52.u64],
  ["destination", beetSolana26.publicKey],
  ["decimals", beet52.u8]
], "SpendingLimitPayload");

// src/generated/types/SettingsChangePayload.ts
var beet54 = __toESM(require_beet(), 1);

// src/generated/types/LimitedSettingsAction.ts
var beetSolana27 = __toESM(require_beet_solana(), 1);
var beet53 = __toESM(require_beet(), 1);
var isLimitedSettingsActionAddSigner = (x) => x.__kind === "AddSigner";
var isLimitedSettingsActionRemoveSigner = (x) => x.__kind === "RemoveSigner";
var isLimitedSettingsActionChangeThreshold = (x) => x.__kind === "ChangeThreshold";
var isLimitedSettingsActionSetTimeLock = (x) => x.__kind === "SetTimeLock";
var limitedSettingsActionBeet = beet53.dataEnum([
  [
    "AddSigner",
    new beet53.BeetArgsStruct([["newSigner", smartAccountSignerBeet]], 'LimitedSettingsActionRecord["AddSigner"]')
  ],
  [
    "RemoveSigner",
    new beet53.BeetArgsStruct([["oldSigner", beetSolana27.publicKey]], 'LimitedSettingsActionRecord["RemoveSigner"]')
  ],
  [
    "ChangeThreshold",
    new beet53.BeetArgsStruct([["newThreshold", beet53.u16]], 'LimitedSettingsActionRecord["ChangeThreshold"]')
  ],
  [
    "SetTimeLock",
    new beet53.BeetArgsStruct([["newTimeLock", beet53.u32]], 'LimitedSettingsActionRecord["SetTimeLock"]')
  ]
]);

// src/generated/types/SettingsChangePayload.ts
var settingsChangePayloadBeet = new beet54.FixableBeetArgsStruct([
  ["actionIndex", beet54.bytes],
  ["actions", beet54.array(limitedSettingsActionBeet)]
], "SettingsChangePayload");

// src/generated/types/PolicyPayload.ts
var isPolicyPayloadInternalFundTransfer = (x) => x.__kind === "InternalFundTransfer";
var isPolicyPayloadProgramInteraction = (x) => x.__kind === "ProgramInteraction";
var isPolicyPayloadSpendingLimit = (x) => x.__kind === "SpendingLimit";
var isPolicyPayloadSettingsChange = (x) => x.__kind === "SettingsChange";
var policyPayloadBeet = beet55.dataEnum([
  [
    "InternalFundTransfer",
    new beet55.BeetArgsStruct([["fields", beet55.fixedSizeTuple([internalFundTransferPayloadBeet])]], 'PolicyPayloadRecord["InternalFundTransfer"]')
  ],
  [
    "ProgramInteraction",
    new beet55.FixableBeetArgsStruct([["fields", beet55.tuple([programInteractionPayloadBeet])]], 'PolicyPayloadRecord["ProgramInteraction"]')
  ],
  [
    "SpendingLimit",
    new beet55.BeetArgsStruct([["fields", beet55.fixedSizeTuple([spendingLimitPayloadBeet])]], 'PolicyPayloadRecord["SpendingLimit"]')
  ],
  [
    "SettingsChange",
    new beet55.FixableBeetArgsStruct([["fields", beet55.tuple([settingsChangePayloadBeet])]], 'PolicyPayloadRecord["SettingsChange"]')
  ]
]);

// src/generated/types/PolicyActionPayloadDetails.ts
var policyActionPayloadDetailsBeet = new beet56.FixableBeetArgsStruct([["payload", policyPayloadBeet]], "PolicyActionPayloadDetails");

// src/generated/types/Payload.ts
var isPayloadTransactionPayload = (x) => x.__kind === "TransactionPayload";
var isPayloadPolicyPayload = (x) => x.__kind === "PolicyPayload";
var payloadBeet = beet57.dataEnum([
  [
    "TransactionPayload",
    new beet57.FixableBeetArgsStruct([["fields", beet57.tuple([transactionPayloadDetailsBeet])]], 'PayloadRecord["TransactionPayload"]')
  ],
  [
    "PolicyPayload",
    new beet57.FixableBeetArgsStruct([["fields", beet57.tuple([policyActionPayloadDetailsBeet])]], 'PayloadRecord["PolicyPayload"]')
  ]
]);

// src/generated/accounts/Transaction.ts
var transactionDiscriminator = [11, 24, 174, 129, 203, 117, 242, 23];

class Transaction {
  consensusAccount;
  creator;
  rentCollector;
  index;
  payload;
  constructor(consensusAccount, creator, rentCollector, index, payload) {
    this.consensusAccount = consensusAccount;
    this.creator = creator;
    this.rentCollector = rentCollector;
    this.index = index;
    this.payload = payload;
  }
  static fromArgs(args) {
    return new Transaction(args.consensusAccount, args.creator, args.rentCollector, args.index, args.payload);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return Transaction.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find Transaction account at ${address}`);
    }
    return Transaction.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web310.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana28.GpaBuilder.fromStruct(programId, transactionBeet);
  }
  static deserialize(buf, offset = 0) {
    return transactionBeet.deserialize(buf, offset);
  }
  serialize() {
    return transactionBeet.serialize({
      accountDiscriminator: transactionDiscriminator,
      ...this
    });
  }
  static byteSize(args) {
    const instance = Transaction.fromArgs(args);
    return transactionBeet.toFixedFromValue({
      accountDiscriminator: transactionDiscriminator,
      ...instance
    }).byteSize;
  }
  static async getMinimumBalanceForRentExemption(args, connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(Transaction.byteSize(args), commitment);
  }
  pretty() {
    return {
      consensusAccount: this.consensusAccount.toBase58(),
      creator: this.creator.toBase58(),
      rentCollector: this.rentCollector.toBase58(),
      index: (() => {
        const x = this.index;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      payload: this.payload.__kind
    };
  }
}
var transactionBeet = new beet58.FixableBeetStruct([
  ["accountDiscriminator", beet58.uniformFixedSizeArray(beet58.u8, 8)],
  ["consensusAccount", beetSolana28.publicKey],
  ["creator", beetSolana28.publicKey],
  ["rentCollector", beetSolana28.publicKey],
  ["index", beet58.u64],
  ["payload", payloadBeet]
], Transaction.fromArgs, "Transaction");
// src/generated/accounts/TransactionBuffer.ts
var beetSolana29 = __toESM(require_beet_solana(), 1);
var beet59 = __toESM(require_beet(), 1);
import * as web311 from "@solana/web3.js";
var transactionBufferDiscriminator = [
  90,
  36,
  35,
  219,
  93,
  225,
  110,
  96
];

class TransactionBuffer {
  settings;
  creator;
  bufferIndex;
  accountIndex;
  finalBufferHash;
  finalBufferSize;
  buffer;
  constructor(settings, creator, bufferIndex, accountIndex, finalBufferHash, finalBufferSize, buffer) {
    this.settings = settings;
    this.creator = creator;
    this.bufferIndex = bufferIndex;
    this.accountIndex = accountIndex;
    this.finalBufferHash = finalBufferHash;
    this.finalBufferSize = finalBufferSize;
    this.buffer = buffer;
  }
  static fromArgs(args) {
    return new TransactionBuffer(args.settings, args.creator, args.bufferIndex, args.accountIndex, args.finalBufferHash, args.finalBufferSize, args.buffer);
  }
  static fromAccountInfo(accountInfo, offset = 0) {
    return TransactionBuffer.deserialize(accountInfo.data, offset);
  }
  static async fromAccountAddress(connection, address, commitmentOrConfig) {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig);
    if (accountInfo == null) {
      throw new Error(`Unable to find TransactionBuffer account at ${address}`);
    }
    return TransactionBuffer.fromAccountInfo(accountInfo, 0)[0];
  }
  static gpaBuilder(programId = new web311.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
    return beetSolana29.GpaBuilder.fromStruct(programId, transactionBufferBeet);
  }
  static deserialize(buf, offset = 0) {
    return transactionBufferBeet.deserialize(buf, offset);
  }
  serialize() {
    return transactionBufferBeet.serialize({
      accountDiscriminator: transactionBufferDiscriminator,
      ...this
    });
  }
  static byteSize(args) {
    const instance = TransactionBuffer.fromArgs(args);
    return transactionBufferBeet.toFixedFromValue({
      accountDiscriminator: transactionBufferDiscriminator,
      ...instance
    }).byteSize;
  }
  static async getMinimumBalanceForRentExemption(args, connection, commitment) {
    return connection.getMinimumBalanceForRentExemption(TransactionBuffer.byteSize(args), commitment);
  }
  pretty() {
    return {
      settings: this.settings.toBase58(),
      creator: this.creator.toBase58(),
      bufferIndex: this.bufferIndex,
      accountIndex: this.accountIndex,
      finalBufferHash: this.finalBufferHash,
      finalBufferSize: this.finalBufferSize,
      buffer: this.buffer
    };
  }
}
var transactionBufferBeet = new beet59.FixableBeetStruct([
  ["accountDiscriminator", beet59.uniformFixedSizeArray(beet59.u8, 8)],
  ["settings", beetSolana29.publicKey],
  ["creator", beetSolana29.publicKey],
  ["bufferIndex", beet59.u8],
  ["accountIndex", beet59.u8],
  ["finalBufferHash", beet59.uniformFixedSizeArray(beet59.u8, 32)],
  ["finalBufferSize", beet59.u16],
  ["buffer", beet59.bytes]
], TransactionBuffer.fromArgs, "TransactionBuffer");
// src/generated/accounts/index.ts
var accountProviders = {
  Batch,
  BatchTransaction,
  LegacyTransaction,
  Policy,
  ProgramConfig,
  Proposal,
  SettingsTransaction,
  Settings,
  SpendingLimit,
  TransactionBuffer,
  Transaction
};
// src/generated/errors/index.ts
var createErrorFromCodeLookup = new Map;
var createErrorFromNameLookup = new Map;

class AccountNotEmptyError extends Error {
  code = 6000;
  name = "AccountNotEmpty";
  constructor() {
    super("Account is not empty");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, AccountNotEmptyError);
    }
  }
}
createErrorFromCodeLookup.set(6000, () => new AccountNotEmptyError);
createErrorFromNameLookup.set("AccountNotEmpty", () => new AccountNotEmptyError);

class DuplicateSignerError extends Error {
  code = 6001;
  name = "DuplicateSigner";
  constructor() {
    super("Found multiple signers with the same pubkey");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, DuplicateSignerError);
    }
  }
}
createErrorFromCodeLookup.set(6001, () => new DuplicateSignerError);
createErrorFromNameLookup.set("DuplicateSigner", () => new DuplicateSignerError);

class EmptySignersError extends Error {
  code = 6002;
  name = "EmptySigners";
  constructor() {
    super("Signers array is empty");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, EmptySignersError);
    }
  }
}
createErrorFromCodeLookup.set(6002, () => new EmptySignersError);
createErrorFromNameLookup.set("EmptySigners", () => new EmptySignersError);

class TooManySignersError extends Error {
  code = 6003;
  name = "TooManySigners";
  constructor() {
    super("Too many signers, can be up to 65535");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, TooManySignersError);
    }
  }
}
createErrorFromCodeLookup.set(6003, () => new TooManySignersError);
createErrorFromNameLookup.set("TooManySigners", () => new TooManySignersError);

class InvalidThresholdError extends Error {
  code = 6004;
  name = "InvalidThreshold";
  constructor() {
    super("Invalid threshold, must be between 1 and number of signers with vote permissions");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidThresholdError);
    }
  }
}
createErrorFromCodeLookup.set(6004, () => new InvalidThresholdError);
createErrorFromNameLookup.set("InvalidThreshold", () => new InvalidThresholdError);

class UnauthorizedError extends Error {
  code = 6005;
  name = "Unauthorized";
  constructor() {
    super("Attempted to perform an unauthorized action");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, UnauthorizedError);
    }
  }
}
createErrorFromCodeLookup.set(6005, () => new UnauthorizedError);
createErrorFromNameLookup.set("Unauthorized", () => new UnauthorizedError);

class NotASignerError extends Error {
  code = 6006;
  name = "NotASigner";
  constructor() {
    super("Provided pubkey is not a signer of the smart account");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, NotASignerError);
    }
  }
}
createErrorFromCodeLookup.set(6006, () => new NotASignerError);
createErrorFromNameLookup.set("NotASigner", () => new NotASignerError);

class InvalidTransactionMessageError extends Error {
  code = 6007;
  name = "InvalidTransactionMessage";
  constructor() {
    super("TransactionMessage is malformed.");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidTransactionMessageError);
    }
  }
}
createErrorFromCodeLookup.set(6007, () => new InvalidTransactionMessageError);
createErrorFromNameLookup.set("InvalidTransactionMessage", () => new InvalidTransactionMessageError);

class StaleProposalError extends Error {
  code = 6008;
  name = "StaleProposal";
  constructor() {
    super("Proposal is stale");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, StaleProposalError);
    }
  }
}
createErrorFromCodeLookup.set(6008, () => new StaleProposalError);
createErrorFromNameLookup.set("StaleProposal", () => new StaleProposalError);

class InvalidProposalStatusError extends Error {
  code = 6009;
  name = "InvalidProposalStatus";
  constructor() {
    super("Invalid proposal status");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidProposalStatusError);
    }
  }
}
createErrorFromCodeLookup.set(6009, () => new InvalidProposalStatusError);
createErrorFromNameLookup.set("InvalidProposalStatus", () => new InvalidProposalStatusError);

class InvalidTransactionIndexError extends Error {
  code = 6010;
  name = "InvalidTransactionIndex";
  constructor() {
    super("Invalid transaction index");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidTransactionIndexError);
    }
  }
}
createErrorFromCodeLookup.set(6010, () => new InvalidTransactionIndexError);
createErrorFromNameLookup.set("InvalidTransactionIndex", () => new InvalidTransactionIndexError);

class AlreadyApprovedError extends Error {
  code = 6011;
  name = "AlreadyApproved";
  constructor() {
    super("Signer already approved the transaction");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, AlreadyApprovedError);
    }
  }
}
createErrorFromCodeLookup.set(6011, () => new AlreadyApprovedError);
createErrorFromNameLookup.set("AlreadyApproved", () => new AlreadyApprovedError);

class AlreadyRejectedError extends Error {
  code = 6012;
  name = "AlreadyRejected";
  constructor() {
    super("Signer already rejected the transaction");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, AlreadyRejectedError);
    }
  }
}
createErrorFromCodeLookup.set(6012, () => new AlreadyRejectedError);
createErrorFromNameLookup.set("AlreadyRejected", () => new AlreadyRejectedError);

class AlreadyCancelledError extends Error {
  code = 6013;
  name = "AlreadyCancelled";
  constructor() {
    super("Signer already cancelled the transaction");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, AlreadyCancelledError);
    }
  }
}
createErrorFromCodeLookup.set(6013, () => new AlreadyCancelledError);
createErrorFromNameLookup.set("AlreadyCancelled", () => new AlreadyCancelledError);

class InvalidNumberOfAccountsError extends Error {
  code = 6014;
  name = "InvalidNumberOfAccounts";
  constructor() {
    super("Wrong number of accounts provided");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidNumberOfAccountsError);
    }
  }
}
createErrorFromCodeLookup.set(6014, () => new InvalidNumberOfAccountsError);
createErrorFromNameLookup.set("InvalidNumberOfAccounts", () => new InvalidNumberOfAccountsError);

class InvalidAccountError extends Error {
  code = 6015;
  name = "InvalidAccount";
  constructor() {
    super("Invalid account provided");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidAccountError);
    }
  }
}
createErrorFromCodeLookup.set(6015, () => new InvalidAccountError);
createErrorFromNameLookup.set("InvalidAccount", () => new InvalidAccountError);

class RemoveLastSignerError extends Error {
  code = 6016;
  name = "RemoveLastSigner";
  constructor() {
    super("Cannot remove last signer");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, RemoveLastSignerError);
    }
  }
}
createErrorFromCodeLookup.set(6016, () => new RemoveLastSignerError);
createErrorFromNameLookup.set("RemoveLastSigner", () => new RemoveLastSignerError);

class NoVotersError extends Error {
  code = 6017;
  name = "NoVoters";
  constructor() {
    super("Signers don't include any voters");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, NoVotersError);
    }
  }
}
createErrorFromCodeLookup.set(6017, () => new NoVotersError);
createErrorFromNameLookup.set("NoVoters", () => new NoVotersError);

class NoProposersError extends Error {
  code = 6018;
  name = "NoProposers";
  constructor() {
    super("Signers don't include any proposers");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, NoProposersError);
    }
  }
}
createErrorFromCodeLookup.set(6018, () => new NoProposersError);
createErrorFromNameLookup.set("NoProposers", () => new NoProposersError);

class NoExecutorsError extends Error {
  code = 6019;
  name = "NoExecutors";
  constructor() {
    super("Signers don't include any executors");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, NoExecutorsError);
    }
  }
}
createErrorFromCodeLookup.set(6019, () => new NoExecutorsError);
createErrorFromNameLookup.set("NoExecutors", () => new NoExecutorsError);

class InvalidStaleTransactionIndexError extends Error {
  code = 6020;
  name = "InvalidStaleTransactionIndex";
  constructor() {
    super("`stale_transaction_index` must be <= `transaction_index`");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidStaleTransactionIndexError);
    }
  }
}
createErrorFromCodeLookup.set(6020, () => new InvalidStaleTransactionIndexError);
createErrorFromNameLookup.set("InvalidStaleTransactionIndex", () => new InvalidStaleTransactionIndexError);

class NotSupportedForControlledError extends Error {
  code = 6021;
  name = "NotSupportedForControlled";
  constructor() {
    super("Instruction not supported for controlled smart account");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, NotSupportedForControlledError);
    }
  }
}
createErrorFromCodeLookup.set(6021, () => new NotSupportedForControlledError);
createErrorFromNameLookup.set("NotSupportedForControlled", () => new NotSupportedForControlledError);

class TimeLockNotReleasedError extends Error {
  code = 6022;
  name = "TimeLockNotReleased";
  constructor() {
    super("Proposal time lock has not been released");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, TimeLockNotReleasedError);
    }
  }
}
createErrorFromCodeLookup.set(6022, () => new TimeLockNotReleasedError);
createErrorFromNameLookup.set("TimeLockNotReleased", () => new TimeLockNotReleasedError);

class NoActionsError extends Error {
  code = 6023;
  name = "NoActions";
  constructor() {
    super("Config transaction must have at least one action");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, NoActionsError);
    }
  }
}
createErrorFromCodeLookup.set(6023, () => new NoActionsError);
createErrorFromNameLookup.set("NoActions", () => new NoActionsError);

class MissingAccountError extends Error {
  code = 6024;
  name = "MissingAccount";
  constructor() {
    super("Missing account");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, MissingAccountError);
    }
  }
}
createErrorFromCodeLookup.set(6024, () => new MissingAccountError);
createErrorFromNameLookup.set("MissingAccount", () => new MissingAccountError);

class InvalidMintError extends Error {
  code = 6025;
  name = "InvalidMint";
  constructor() {
    super("Invalid mint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidMintError);
    }
  }
}
createErrorFromCodeLookup.set(6025, () => new InvalidMintError);
createErrorFromNameLookup.set("InvalidMint", () => new InvalidMintError);

class InvalidDestinationError extends Error {
  code = 6026;
  name = "InvalidDestination";
  constructor() {
    super("Invalid destination");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidDestinationError);
    }
  }
}
createErrorFromCodeLookup.set(6026, () => new InvalidDestinationError);
createErrorFromNameLookup.set("InvalidDestination", () => new InvalidDestinationError);

class SpendingLimitExceededError extends Error {
  code = 6027;
  name = "SpendingLimitExceeded";
  constructor() {
    super("Spending limit exceeded");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitExceededError);
    }
  }
}
createErrorFromCodeLookup.set(6027, () => new SpendingLimitExceededError);
createErrorFromNameLookup.set("SpendingLimitExceeded", () => new SpendingLimitExceededError);

class DecimalsMismatchError extends Error {
  code = 6028;
  name = "DecimalsMismatch";
  constructor() {
    super("Decimals don't match the mint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, DecimalsMismatchError);
    }
  }
}
createErrorFromCodeLookup.set(6028, () => new DecimalsMismatchError);
createErrorFromNameLookup.set("DecimalsMismatch", () => new DecimalsMismatchError);

class UnknownPermissionError extends Error {
  code = 6029;
  name = "UnknownPermission";
  constructor() {
    super("Signer has unknown permission");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, UnknownPermissionError);
    }
  }
}
createErrorFromCodeLookup.set(6029, () => new UnknownPermissionError);
createErrorFromNameLookup.set("UnknownPermission", () => new UnknownPermissionError);

class ProtectedAccountError extends Error {
  code = 6030;
  name = "ProtectedAccount";
  constructor() {
    super("Account is protected, it cannot be passed into a CPI as writable");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProtectedAccountError);
    }
  }
}
createErrorFromCodeLookup.set(6030, () => new ProtectedAccountError);
createErrorFromNameLookup.set("ProtectedAccount", () => new ProtectedAccountError);

class TimeLockExceedsMaxAllowedError extends Error {
  code = 6031;
  name = "TimeLockExceedsMaxAllowed";
  constructor() {
    super("Time lock exceeds the maximum allowed (90 days)");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, TimeLockExceedsMaxAllowedError);
    }
  }
}
createErrorFromCodeLookup.set(6031, () => new TimeLockExceedsMaxAllowedError);
createErrorFromNameLookup.set("TimeLockExceedsMaxAllowed", () => new TimeLockExceedsMaxAllowedError);

class IllegalAccountOwnerError extends Error {
  code = 6032;
  name = "IllegalAccountOwner";
  constructor() {
    super("Account is not owned by Smart Account program");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, IllegalAccountOwnerError);
    }
  }
}
createErrorFromCodeLookup.set(6032, () => new IllegalAccountOwnerError);
createErrorFromNameLookup.set("IllegalAccountOwner", () => new IllegalAccountOwnerError);

class RentReclamationDisabledError extends Error {
  code = 6033;
  name = "RentReclamationDisabled";
  constructor() {
    super("Rent reclamation is disabled for this smart account");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, RentReclamationDisabledError);
    }
  }
}
createErrorFromCodeLookup.set(6033, () => new RentReclamationDisabledError);
createErrorFromNameLookup.set("RentReclamationDisabled", () => new RentReclamationDisabledError);

class InvalidRentCollectorError extends Error {
  code = 6034;
  name = "InvalidRentCollector";
  constructor() {
    super("Invalid rent collector address");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidRentCollectorError);
    }
  }
}
createErrorFromCodeLookup.set(6034, () => new InvalidRentCollectorError);
createErrorFromNameLookup.set("InvalidRentCollector", () => new InvalidRentCollectorError);

class ProposalForAnotherSmartAccountError extends Error {
  code = 6035;
  name = "ProposalForAnotherSmartAccount";
  constructor() {
    super("Proposal is for another smart account");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProposalForAnotherSmartAccountError);
    }
  }
}
createErrorFromCodeLookup.set(6035, () => new ProposalForAnotherSmartAccountError);
createErrorFromNameLookup.set("ProposalForAnotherSmartAccount", () => new ProposalForAnotherSmartAccountError);

class TransactionForAnotherSmartAccountError extends Error {
  code = 6036;
  name = "TransactionForAnotherSmartAccount";
  constructor() {
    super("Transaction is for another smart account");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, TransactionForAnotherSmartAccountError);
    }
  }
}
createErrorFromCodeLookup.set(6036, () => new TransactionForAnotherSmartAccountError);
createErrorFromNameLookup.set("TransactionForAnotherSmartAccount", () => new TransactionForAnotherSmartAccountError);

class TransactionNotMatchingProposalError extends Error {
  code = 6037;
  name = "TransactionNotMatchingProposal";
  constructor() {
    super("Transaction doesn't match proposal");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, TransactionNotMatchingProposalError);
    }
  }
}
createErrorFromCodeLookup.set(6037, () => new TransactionNotMatchingProposalError);
createErrorFromNameLookup.set("TransactionNotMatchingProposal", () => new TransactionNotMatchingProposalError);

class TransactionNotLastInBatchError extends Error {
  code = 6038;
  name = "TransactionNotLastInBatch";
  constructor() {
    super("Transaction is not last in batch");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, TransactionNotLastInBatchError);
    }
  }
}
createErrorFromCodeLookup.set(6038, () => new TransactionNotLastInBatchError);
createErrorFromNameLookup.set("TransactionNotLastInBatch", () => new TransactionNotLastInBatchError);

class BatchNotEmptyError extends Error {
  code = 6039;
  name = "BatchNotEmpty";
  constructor() {
    super("Batch is not empty");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, BatchNotEmptyError);
    }
  }
}
createErrorFromCodeLookup.set(6039, () => new BatchNotEmptyError);
createErrorFromNameLookup.set("BatchNotEmpty", () => new BatchNotEmptyError);

class SpendingLimitInvalidAmountError extends Error {
  code = 6040;
  name = "SpendingLimitInvalidAmount";
  constructor() {
    super("Invalid SpendingLimit amount");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvalidAmountError);
    }
  }
}
createErrorFromCodeLookup.set(6040, () => new SpendingLimitInvalidAmountError);
createErrorFromNameLookup.set("SpendingLimitInvalidAmount", () => new SpendingLimitInvalidAmountError);

class InvalidInstructionArgsError extends Error {
  code = 6041;
  name = "InvalidInstructionArgs";
  constructor() {
    super("Invalid Instruction Arguments");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidInstructionArgsError);
    }
  }
}
createErrorFromCodeLookup.set(6041, () => new InvalidInstructionArgsError);
createErrorFromNameLookup.set("InvalidInstructionArgs", () => new InvalidInstructionArgsError);

class FinalBufferHashMismatchError extends Error {
  code = 6042;
  name = "FinalBufferHashMismatch";
  constructor() {
    super("Final message buffer hash doesnt match the expected hash");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, FinalBufferHashMismatchError);
    }
  }
}
createErrorFromCodeLookup.set(6042, () => new FinalBufferHashMismatchError);
createErrorFromNameLookup.set("FinalBufferHashMismatch", () => new FinalBufferHashMismatchError);

class FinalBufferSizeExceededError extends Error {
  code = 6043;
  name = "FinalBufferSizeExceeded";
  constructor() {
    super("Final buffer size cannot exceed 4000 bytes");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, FinalBufferSizeExceededError);
    }
  }
}
createErrorFromCodeLookup.set(6043, () => new FinalBufferSizeExceededError);
createErrorFromNameLookup.set("FinalBufferSizeExceeded", () => new FinalBufferSizeExceededError);

class FinalBufferSizeMismatchError extends Error {
  code = 6044;
  name = "FinalBufferSizeMismatch";
  constructor() {
    super("Final buffer size mismatch");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, FinalBufferSizeMismatchError);
    }
  }
}
createErrorFromCodeLookup.set(6044, () => new FinalBufferSizeMismatchError);
createErrorFromNameLookup.set("FinalBufferSizeMismatch", () => new FinalBufferSizeMismatchError);

class SmartAccountCreateDeprecatedError extends Error {
  code = 6045;
  name = "SmartAccountCreateDeprecated";
  constructor() {
    super("smart_account_create has been deprecated. Use smart_account_create_v2 instead.");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SmartAccountCreateDeprecatedError);
    }
  }
}
createErrorFromCodeLookup.set(6045, () => new SmartAccountCreateDeprecatedError);
createErrorFromNameLookup.set("SmartAccountCreateDeprecated", () => new SmartAccountCreateDeprecatedError);

class ThresholdNotReachedError extends Error {
  code = 6046;
  name = "ThresholdNotReached";
  constructor() {
    super("Signers do not reach consensus threshold");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ThresholdNotReachedError);
    }
  }
}
createErrorFromCodeLookup.set(6046, () => new ThresholdNotReachedError);
createErrorFromNameLookup.set("ThresholdNotReached", () => new ThresholdNotReachedError);

class InvalidSignerCountError extends Error {
  code = 6047;
  name = "InvalidSignerCount";
  constructor() {
    super("Invalid number of signer accounts. Must be greater or equal to the threshold");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidSignerCountError);
    }
  }
}
createErrorFromCodeLookup.set(6047, () => new InvalidSignerCountError);
createErrorFromNameLookup.set("InvalidSignerCount", () => new InvalidSignerCountError);

class MissingSignatureError extends Error {
  code = 6048;
  name = "MissingSignature";
  constructor() {
    super("Missing signature");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, MissingSignatureError);
    }
  }
}
createErrorFromCodeLookup.set(6048, () => new MissingSignatureError);
createErrorFromNameLookup.set("MissingSignature", () => new MissingSignatureError);

class InsufficientAggregatePermissionsError extends Error {
  code = 6049;
  name = "InsufficientAggregatePermissions";
  constructor() {
    super("Insufficient aggregate permissions across signing members");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InsufficientAggregatePermissionsError);
    }
  }
}
createErrorFromCodeLookup.set(6049, () => new InsufficientAggregatePermissionsError);
createErrorFromNameLookup.set("InsufficientAggregatePermissions", () => new InsufficientAggregatePermissionsError);

class InsufficientVotePermissionsError extends Error {
  code = 6050;
  name = "InsufficientVotePermissions";
  constructor() {
    super("Insufficient vote permissions across signing members");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InsufficientVotePermissionsError);
    }
  }
}
createErrorFromCodeLookup.set(6050, () => new InsufficientVotePermissionsError);
createErrorFromNameLookup.set("InsufficientVotePermissions", () => new InsufficientVotePermissionsError);

class TimeLockNotZeroError extends Error {
  code = 6051;
  name = "TimeLockNotZero";
  constructor() {
    super("Smart account must not be time locked");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, TimeLockNotZeroError);
    }
  }
}
createErrorFromCodeLookup.set(6051, () => new TimeLockNotZeroError);
createErrorFromNameLookup.set("TimeLockNotZero", () => new TimeLockNotZeroError);

class NotImplementedError extends Error {
  code = 6052;
  name = "NotImplemented";
  constructor() {
    super("Feature not implemented");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, NotImplementedError);
    }
  }
}
createErrorFromCodeLookup.set(6052, () => new NotImplementedError);
createErrorFromNameLookup.set("NotImplemented", () => new NotImplementedError);

class SpendingLimitInvalidCadenceConfigurationError extends Error {
  code = 6053;
  name = "SpendingLimitInvalidCadenceConfiguration";
  constructor() {
    super("Invalid cadence configuration");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvalidCadenceConfigurationError);
    }
  }
}
createErrorFromCodeLookup.set(6053, () => new SpendingLimitInvalidCadenceConfigurationError);
createErrorFromNameLookup.set("SpendingLimitInvalidCadenceConfiguration", () => new SpendingLimitInvalidCadenceConfigurationError);

class InvalidDataConstraintError extends Error {
  code = 6054;
  name = "InvalidDataConstraint";
  constructor() {
    super("Invalid data constraint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidDataConstraintError);
    }
  }
}
createErrorFromCodeLookup.set(6054, () => new InvalidDataConstraintError);
createErrorFromNameLookup.set("InvalidDataConstraint", () => new InvalidDataConstraintError);

class InvalidPayloadError extends Error {
  code = 6055;
  name = "InvalidPayload";
  constructor() {
    super("Invalid payload");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidPayloadError);
    }
  }
}
createErrorFromCodeLookup.set(6055, () => new InvalidPayloadError);
createErrorFromNameLookup.set("InvalidPayload", () => new InvalidPayloadError);

class ProtectedInstructionError extends Error {
  code = 6056;
  name = "ProtectedInstruction";
  constructor() {
    super("Protected instruction");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProtectedInstructionError);
    }
  }
}
createErrorFromCodeLookup.set(6056, () => new ProtectedInstructionError);
createErrorFromNameLookup.set("ProtectedInstruction", () => new ProtectedInstructionError);

class PlaceholderErrorError extends Error {
  code = 6057;
  name = "PlaceholderError";
  constructor() {
    super("Placeholder error");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PlaceholderErrorError);
    }
  }
}
createErrorFromCodeLookup.set(6057, () => new PlaceholderErrorError);
createErrorFromNameLookup.set("PlaceholderError", () => new PlaceholderErrorError);

class InvalidPolicyPayloadError extends Error {
  code = 6058;
  name = "InvalidPolicyPayload";
  constructor() {
    super("Invalid policy payload");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidPolicyPayloadError);
    }
  }
}
createErrorFromCodeLookup.set(6058, () => new InvalidPolicyPayloadError);
createErrorFromNameLookup.set("InvalidPolicyPayload", () => new InvalidPolicyPayloadError);

class InvalidEmptyPolicyError extends Error {
  code = 6059;
  name = "InvalidEmptyPolicy";
  constructor() {
    super("Invalid empty policy");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InvalidEmptyPolicyError);
    }
  }
}
createErrorFromCodeLookup.set(6059, () => new InvalidEmptyPolicyError);
createErrorFromNameLookup.set("InvalidEmptyPolicy", () => new InvalidEmptyPolicyError);

class TransactionForAnotherPolicyError extends Error {
  code = 6060;
  name = "TransactionForAnotherPolicy";
  constructor() {
    super("Transaction is for another policy");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, TransactionForAnotherPolicyError);
    }
  }
}
createErrorFromCodeLookup.set(6060, () => new TransactionForAnotherPolicyError);
createErrorFromNameLookup.set("TransactionForAnotherPolicy", () => new TransactionForAnotherPolicyError);

class ProgramInteractionAsyncPayloadNotAllowedWithSyncTransactionError extends Error {
  code = 6061;
  name = "ProgramInteractionAsyncPayloadNotAllowedWithSyncTransaction";
  constructor() {
    super("Program interaction sync payload not allowed with async transaction");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionAsyncPayloadNotAllowedWithSyncTransactionError);
    }
  }
}
createErrorFromCodeLookup.set(6061, () => new ProgramInteractionAsyncPayloadNotAllowedWithSyncTransactionError);
createErrorFromNameLookup.set("ProgramInteractionAsyncPayloadNotAllowedWithSyncTransaction", () => new ProgramInteractionAsyncPayloadNotAllowedWithSyncTransactionError);

class ProgramInteractionSyncPayloadNotAllowedWithAsyncTransactionError extends Error {
  code = 6062;
  name = "ProgramInteractionSyncPayloadNotAllowedWithAsyncTransaction";
  constructor() {
    super("Program interaction sync payload not allowed with sync transaction");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionSyncPayloadNotAllowedWithAsyncTransactionError);
    }
  }
}
createErrorFromCodeLookup.set(6062, () => new ProgramInteractionSyncPayloadNotAllowedWithAsyncTransactionError);
createErrorFromNameLookup.set("ProgramInteractionSyncPayloadNotAllowedWithAsyncTransaction", () => new ProgramInteractionSyncPayloadNotAllowedWithAsyncTransactionError);

class ProgramInteractionDataTooShortError extends Error {
  code = 6063;
  name = "ProgramInteractionDataTooShort";
  constructor() {
    super("Program interaction data constraint failed: instruction data too short");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionDataTooShortError);
    }
  }
}
createErrorFromCodeLookup.set(6063, () => new ProgramInteractionDataTooShortError);
createErrorFromNameLookup.set("ProgramInteractionDataTooShort", () => new ProgramInteractionDataTooShortError);

class ProgramInteractionInvalidNumericValueError extends Error {
  code = 6064;
  name = "ProgramInteractionInvalidNumericValue";
  constructor() {
    super("Program interaction data constraint failed: invalid numeric value");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionInvalidNumericValueError);
    }
  }
}
createErrorFromCodeLookup.set(6064, () => new ProgramInteractionInvalidNumericValueError);
createErrorFromNameLookup.set("ProgramInteractionInvalidNumericValue", () => new ProgramInteractionInvalidNumericValueError);

class ProgramInteractionInvalidByteSequenceError extends Error {
  code = 6065;
  name = "ProgramInteractionInvalidByteSequence";
  constructor() {
    super("Program interaction data constraint failed: invalid byte sequence");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionInvalidByteSequenceError);
    }
  }
}
createErrorFromCodeLookup.set(6065, () => new ProgramInteractionInvalidByteSequenceError);
createErrorFromNameLookup.set("ProgramInteractionInvalidByteSequence", () => new ProgramInteractionInvalidByteSequenceError);

class ProgramInteractionUnsupportedSliceOperatorError extends Error {
  code = 6066;
  name = "ProgramInteractionUnsupportedSliceOperator";
  constructor() {
    super("Program interaction data constraint failed: unsupported operator for byte slice");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionUnsupportedSliceOperatorError);
    }
  }
}
createErrorFromCodeLookup.set(6066, () => new ProgramInteractionUnsupportedSliceOperatorError);
createErrorFromNameLookup.set("ProgramInteractionUnsupportedSliceOperator", () => new ProgramInteractionUnsupportedSliceOperatorError);

class ProgramInteractionDataParsingErrorError extends Error {
  code = 6067;
  name = "ProgramInteractionDataParsingError";
  constructor() {
    super("Program interaction constraint failed: instruction data parsing error");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionDataParsingErrorError);
    }
  }
}
createErrorFromCodeLookup.set(6067, () => new ProgramInteractionDataParsingErrorError);
createErrorFromNameLookup.set("ProgramInteractionDataParsingError", () => new ProgramInteractionDataParsingErrorError);

class ProgramInteractionProgramIdMismatchError extends Error {
  code = 6068;
  name = "ProgramInteractionProgramIdMismatch";
  constructor() {
    super("Program interaction constraint failed: program ID mismatch");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionProgramIdMismatchError);
    }
  }
}
createErrorFromCodeLookup.set(6068, () => new ProgramInteractionProgramIdMismatchError);
createErrorFromNameLookup.set("ProgramInteractionProgramIdMismatch", () => new ProgramInteractionProgramIdMismatchError);

class ProgramInteractionAccountConstraintViolatedError extends Error {
  code = 6069;
  name = "ProgramInteractionAccountConstraintViolated";
  constructor() {
    super("Program interaction constraint violation: account constraint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionAccountConstraintViolatedError);
    }
  }
}
createErrorFromCodeLookup.set(6069, () => new ProgramInteractionAccountConstraintViolatedError);
createErrorFromNameLookup.set("ProgramInteractionAccountConstraintViolated", () => new ProgramInteractionAccountConstraintViolatedError);

class ProgramInteractionConstraintIndexOutOfBoundsError extends Error {
  code = 6070;
  name = "ProgramInteractionConstraintIndexOutOfBounds";
  constructor() {
    super("Program interaction constraint violation: instruction constraint index out of bounds");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionConstraintIndexOutOfBoundsError);
    }
  }
}
createErrorFromCodeLookup.set(6070, () => new ProgramInteractionConstraintIndexOutOfBoundsError);
createErrorFromNameLookup.set("ProgramInteractionConstraintIndexOutOfBounds", () => new ProgramInteractionConstraintIndexOutOfBoundsError);

class ProgramInteractionInstructionCountMismatchError extends Error {
  code = 6071;
  name = "ProgramInteractionInstructionCountMismatch";
  constructor() {
    super("Program interaction constraint violation: instruction count mismatch");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionInstructionCountMismatchError);
    }
  }
}
createErrorFromCodeLookup.set(6071, () => new ProgramInteractionInstructionCountMismatchError);
createErrorFromNameLookup.set("ProgramInteractionInstructionCountMismatch", () => new ProgramInteractionInstructionCountMismatchError);

class ProgramInteractionInsufficientLamportAllowanceError extends Error {
  code = 6072;
  name = "ProgramInteractionInsufficientLamportAllowance";
  constructor() {
    super("Program interaction constraint violation: insufficient remaining lamport allowance");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionInsufficientLamportAllowanceError);
    }
  }
}
createErrorFromCodeLookup.set(6072, () => new ProgramInteractionInsufficientLamportAllowanceError);
createErrorFromNameLookup.set("ProgramInteractionInsufficientLamportAllowance", () => new ProgramInteractionInsufficientLamportAllowanceError);

class ProgramInteractionInsufficientTokenAllowanceError extends Error {
  code = 6073;
  name = "ProgramInteractionInsufficientTokenAllowance";
  constructor() {
    super("Program interaction constraint violation: insufficient remaining token allowance");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionInsufficientTokenAllowanceError);
    }
  }
}
createErrorFromCodeLookup.set(6073, () => new ProgramInteractionInsufficientTokenAllowanceError);
createErrorFromNameLookup.set("ProgramInteractionInsufficientTokenAllowance", () => new ProgramInteractionInsufficientTokenAllowanceError);

class ProgramInteractionModifiedIllegalBalanceError extends Error {
  code = 6074;
  name = "ProgramInteractionModifiedIllegalBalance";
  constructor() {
    super("Program interaction constraint violation: modified illegal balance");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionModifiedIllegalBalanceError);
    }
  }
}
createErrorFromCodeLookup.set(6074, () => new ProgramInteractionModifiedIllegalBalanceError);
createErrorFromNameLookup.set("ProgramInteractionModifiedIllegalBalance", () => new ProgramInteractionModifiedIllegalBalanceError);

class ProgramInteractionIllegalTokenAccountModificationError extends Error {
  code = 6075;
  name = "ProgramInteractionIllegalTokenAccountModification";
  constructor() {
    super("Program interaction constraint violation: illegal token account modification");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionIllegalTokenAccountModificationError);
    }
  }
}
createErrorFromCodeLookup.set(6075, () => new ProgramInteractionIllegalTokenAccountModificationError);
createErrorFromNameLookup.set("ProgramInteractionIllegalTokenAccountModification", () => new ProgramInteractionIllegalTokenAccountModificationError);

class ProgramInteractionDuplicateSpendingLimitError extends Error {
  code = 6076;
  name = "ProgramInteractionDuplicateSpendingLimit";
  constructor() {
    super("Program interaction invariant violation: duplicate spending limit for the same mint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionDuplicateSpendingLimitError);
    }
  }
}
createErrorFromCodeLookup.set(6076, () => new ProgramInteractionDuplicateSpendingLimitError);
createErrorFromNameLookup.set("ProgramInteractionDuplicateSpendingLimit", () => new ProgramInteractionDuplicateSpendingLimitError);

class ProgramInteractionTooManyInstructionConstraintsError extends Error {
  code = 6077;
  name = "ProgramInteractionTooManyInstructionConstraints";
  constructor() {
    super("Program interaction constraint violation: too many instruction constraints. Max is 20");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionTooManyInstructionConstraintsError);
    }
  }
}
createErrorFromCodeLookup.set(6077, () => new ProgramInteractionTooManyInstructionConstraintsError);
createErrorFromNameLookup.set("ProgramInteractionTooManyInstructionConstraints", () => new ProgramInteractionTooManyInstructionConstraintsError);

class ProgramInteractionTooManySpendingLimitsError extends Error {
  code = 6078;
  name = "ProgramInteractionTooManySpendingLimits";
  constructor() {
    super("Program interaction constraint violation: too many spending limits. Max is 10");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionTooManySpendingLimitsError);
    }
  }
}
createErrorFromCodeLookup.set(6078, () => new ProgramInteractionTooManySpendingLimitsError);
createErrorFromNameLookup.set("ProgramInteractionTooManySpendingLimits", () => new ProgramInteractionTooManySpendingLimitsError);

class ProgramInteractionTemplateHookErrorError extends Error {
  code = 6079;
  name = "ProgramInteractionTemplateHookError";
  constructor() {
    super("Program interaction hook violation: template hook error");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionTemplateHookErrorError);
    }
  }
}
createErrorFromCodeLookup.set(6079, () => new ProgramInteractionTemplateHookErrorError);
createErrorFromNameLookup.set("ProgramInteractionTemplateHookError", () => new ProgramInteractionTemplateHookErrorError);

class ProgramInteractionHookAuthorityCannotBePartOfHookAccountsError extends Error {
  code = 6080;
  name = "ProgramInteractionHookAuthorityCannotBePartOfHookAccounts";
  constructor() {
    super("Program interaction hook violation: hook authority cannot be part of hook accounts");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ProgramInteractionHookAuthorityCannotBePartOfHookAccountsError);
    }
  }
}
createErrorFromCodeLookup.set(6080, () => new ProgramInteractionHookAuthorityCannotBePartOfHookAccountsError);
createErrorFromNameLookup.set("ProgramInteractionHookAuthorityCannotBePartOfHookAccounts", () => new ProgramInteractionHookAuthorityCannotBePartOfHookAccountsError);

class SpendingLimitNotActiveError extends Error {
  code = 6081;
  name = "SpendingLimitNotActive";
  constructor() {
    super("Spending limit is not active");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitNotActiveError);
    }
  }
}
createErrorFromCodeLookup.set(6081, () => new SpendingLimitNotActiveError);
createErrorFromNameLookup.set("SpendingLimitNotActive", () => new SpendingLimitNotActiveError);

class SpendingLimitExpiredError extends Error {
  code = 6082;
  name = "SpendingLimitExpired";
  constructor() {
    super("Spending limit is expired");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitExpiredError);
    }
  }
}
createErrorFromCodeLookup.set(6082, () => new SpendingLimitExpiredError);
createErrorFromNameLookup.set("SpendingLimitExpired", () => new SpendingLimitExpiredError);

class SpendingLimitPolicyInvariantAccumulateUnusedError extends Error {
  code = 6083;
  name = "SpendingLimitPolicyInvariantAccumulateUnused";
  constructor() {
    super("Spending limit policy invariant violation: usage state cannot be Some() if accumulate_unused is true");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitPolicyInvariantAccumulateUnusedError);
    }
  }
}
createErrorFromCodeLookup.set(6083, () => new SpendingLimitPolicyInvariantAccumulateUnusedError);
createErrorFromNameLookup.set("SpendingLimitPolicyInvariantAccumulateUnused", () => new SpendingLimitPolicyInvariantAccumulateUnusedError);

class SpendingLimitViolatesExactQuantityConstraintError extends Error {
  code = 6084;
  name = "SpendingLimitViolatesExactQuantityConstraint";
  constructor() {
    super("Amount violates exact quantity constraint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitViolatesExactQuantityConstraintError);
    }
  }
}
createErrorFromCodeLookup.set(6084, () => new SpendingLimitViolatesExactQuantityConstraintError);
createErrorFromNameLookup.set("SpendingLimitViolatesExactQuantityConstraint", () => new SpendingLimitViolatesExactQuantityConstraintError);

class SpendingLimitViolatesMaxPerUseConstraintError extends Error {
  code = 6085;
  name = "SpendingLimitViolatesMaxPerUseConstraint";
  constructor() {
    super("Amount violates max per use constraint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitViolatesMaxPerUseConstraintError);
    }
  }
}
createErrorFromCodeLookup.set(6085, () => new SpendingLimitViolatesMaxPerUseConstraintError);
createErrorFromNameLookup.set("SpendingLimitViolatesMaxPerUseConstraint", () => new SpendingLimitViolatesMaxPerUseConstraintError);

class SpendingLimitInsufficientRemainingAmountError extends Error {
  code = 6086;
  name = "SpendingLimitInsufficientRemainingAmount";
  constructor() {
    super("Spending limit is insufficient");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInsufficientRemainingAmountError);
    }
  }
}
createErrorFromCodeLookup.set(6086, () => new SpendingLimitInsufficientRemainingAmountError);
createErrorFromNameLookup.set("SpendingLimitInsufficientRemainingAmount", () => new SpendingLimitInsufficientRemainingAmountError);

class SpendingLimitInvariantMaxPerPeriodZeroError extends Error {
  code = 6087;
  name = "SpendingLimitInvariantMaxPerPeriodZero";
  constructor() {
    super("Spending limit invariant violation: max per period must be non-zero");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantMaxPerPeriodZeroError);
    }
  }
}
createErrorFromCodeLookup.set(6087, () => new SpendingLimitInvariantMaxPerPeriodZeroError);
createErrorFromNameLookup.set("SpendingLimitInvariantMaxPerPeriodZero", () => new SpendingLimitInvariantMaxPerPeriodZeroError);

class SpendingLimitInvariantStartTimePositiveError extends Error {
  code = 6088;
  name = "SpendingLimitInvariantStartTimePositive";
  constructor() {
    super("Spending limit invariant violation: start time must be positive");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantStartTimePositiveError);
    }
  }
}
createErrorFromCodeLookup.set(6088, () => new SpendingLimitInvariantStartTimePositiveError);
createErrorFromNameLookup.set("SpendingLimitInvariantStartTimePositive", () => new SpendingLimitInvariantStartTimePositiveError);

class SpendingLimitInvariantExpirationSmallerThanStartError extends Error {
  code = 6089;
  name = "SpendingLimitInvariantExpirationSmallerThanStart";
  constructor() {
    super("Spending limit invariant violation: expiration must be greater than start");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantExpirationSmallerThanStartError);
    }
  }
}
createErrorFromCodeLookup.set(6089, () => new SpendingLimitInvariantExpirationSmallerThanStartError);
createErrorFromNameLookup.set("SpendingLimitInvariantExpirationSmallerThanStart", () => new SpendingLimitInvariantExpirationSmallerThanStartError);

class SpendingLimitInvariantOverflowEnabledMustHaveExpirationError extends Error {
  code = 6090;
  name = "SpendingLimitInvariantOverflowEnabledMustHaveExpiration";
  constructor() {
    super("Spending limit invariant violation: overflow enabled must have expiration");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantOverflowEnabledMustHaveExpirationError);
    }
  }
}
createErrorFromCodeLookup.set(6090, () => new SpendingLimitInvariantOverflowEnabledMustHaveExpirationError);
createErrorFromNameLookup.set("SpendingLimitInvariantOverflowEnabledMustHaveExpiration", () => new SpendingLimitInvariantOverflowEnabledMustHaveExpirationError);

class SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabledError extends Error {
  code = 6091;
  name = "SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabled";
  constructor() {
    super("Spending limit invariant violation: one time period cannot have overflow enabled");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabledError);
    }
  }
}
createErrorFromCodeLookup.set(6091, () => new SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabledError);
createErrorFromNameLookup.set("SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabled", () => new SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabledError);

class SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmountError extends Error {
  code = 6092;
  name = "SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmount";
  constructor() {
    super("Spending limit invariant violation: remaining amount must be less than max amount");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmountError);
    }
  }
}
createErrorFromCodeLookup.set(6092, () => new SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmountError);
createErrorFromNameLookup.set("SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmount", () => new SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmountError);

class SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriodError extends Error {
  code = 6093;
  name = "SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriod";
  constructor() {
    super("Spending limit invariant violation: remaining amount must be less than or equal to max per period");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriodError);
    }
  }
}
createErrorFromCodeLookup.set(6093, () => new SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriodError);
createErrorFromNameLookup.set("SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriod", () => new SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriodError);

class SpendingLimitInvariantExactQuantityMaxPerUseZeroError extends Error {
  code = 6094;
  name = "SpendingLimitInvariantExactQuantityMaxPerUseZero";
  constructor() {
    super("Spending limit invariant violation: exact quantity must have max per use non-zero");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantExactQuantityMaxPerUseZeroError);
    }
  }
}
createErrorFromCodeLookup.set(6094, () => new SpendingLimitInvariantExactQuantityMaxPerUseZeroError);
createErrorFromNameLookup.set("SpendingLimitInvariantExactQuantityMaxPerUseZero", () => new SpendingLimitInvariantExactQuantityMaxPerUseZeroError);

class SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriodError extends Error {
  code = 6095;
  name = "SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriod";
  constructor() {
    super("Spending limit invariant violation: max per use must be less than or equal to max per period");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriodError);
    }
  }
}
createErrorFromCodeLookup.set(6095, () => new SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriodError);
createErrorFromNameLookup.set("SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriod", () => new SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriodError);

class SpendingLimitInvariantCustomPeriodNegativeError extends Error {
  code = 6096;
  name = "SpendingLimitInvariantCustomPeriodNegative";
  constructor() {
    super("Spending limit invariant violation: custom period must be positive");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantCustomPeriodNegativeError);
    }
  }
}
createErrorFromCodeLookup.set(6096, () => new SpendingLimitInvariantCustomPeriodNegativeError);
createErrorFromNameLookup.set("SpendingLimitInvariantCustomPeriodNegative", () => new SpendingLimitInvariantCustomPeriodNegativeError);

class SpendingLimitPolicyInvariantDuplicateDestinationsError extends Error {
  code = 6097;
  name = "SpendingLimitPolicyInvariantDuplicateDestinations";
  constructor() {
    super("Spending limit policy invariant violation: cannot have duplicate destinations for the same mint");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitPolicyInvariantDuplicateDestinationsError);
    }
  }
}
createErrorFromCodeLookup.set(6097, () => new SpendingLimitPolicyInvariantDuplicateDestinationsError);
createErrorFromNameLookup.set("SpendingLimitPolicyInvariantDuplicateDestinations", () => new SpendingLimitPolicyInvariantDuplicateDestinationsError);

class SpendingLimitInvariantLastResetOutOfBoundsError extends Error {
  code = 6098;
  name = "SpendingLimitInvariantLastResetOutOfBounds";
  constructor() {
    super("Spending limit invariant violation: last reset must be between start and expiration");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantLastResetOutOfBoundsError);
    }
  }
}
createErrorFromCodeLookup.set(6098, () => new SpendingLimitInvariantLastResetOutOfBoundsError);
createErrorFromNameLookup.set("SpendingLimitInvariantLastResetOutOfBounds", () => new SpendingLimitInvariantLastResetOutOfBoundsError);

class SpendingLimitInvariantLastResetSmallerThanStartError extends Error {
  code = 6099;
  name = "SpendingLimitInvariantLastResetSmallerThanStart";
  constructor() {
    super("Spending limit invariant violation: last reset must be greater than start");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SpendingLimitInvariantLastResetSmallerThanStartError);
    }
  }
}
createErrorFromCodeLookup.set(6099, () => new SpendingLimitInvariantLastResetSmallerThanStartError);
createErrorFromNameLookup.set("SpendingLimitInvariantLastResetSmallerThanStart", () => new SpendingLimitInvariantLastResetSmallerThanStartError);

class InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowedError extends Error {
  code = 6100;
  name = "InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowed";
  constructor() {
    super("Internal fund transfer policy invariant violation: source account index is not allowed");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowedError);
    }
  }
}
createErrorFromCodeLookup.set(6100, () => new InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowedError);
createErrorFromNameLookup.set("InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowed", () => new InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowedError);

class InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowedError extends Error {
  code = 6101;
  name = "InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowed";
  constructor() {
    super("Internal fund transfer policy invariant violation: destination account index is not allowed");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowedError);
    }
  }
}
createErrorFromCodeLookup.set(6101, () => new InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowedError);
createErrorFromNameLookup.set("InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowed", () => new InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowedError);

class InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSameError extends Error {
  code = 6102;
  name = "InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSame";
  constructor() {
    super("Internal fund transfer policy invariant violation: source and destination cannot be the same");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSameError);
    }
  }
}
createErrorFromCodeLookup.set(6102, () => new InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSameError);
createErrorFromNameLookup.set("InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSame", () => new InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSameError);

class InternalFundTransferPolicyInvariantMintNotAllowedError extends Error {
  code = 6103;
  name = "InternalFundTransferPolicyInvariantMintNotAllowed";
  constructor() {
    super("Internal fund transfer policy invariant violation: mint is not allowed");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InternalFundTransferPolicyInvariantMintNotAllowedError);
    }
  }
}
createErrorFromCodeLookup.set(6103, () => new InternalFundTransferPolicyInvariantMintNotAllowedError);
createErrorFromNameLookup.set("InternalFundTransferPolicyInvariantMintNotAllowed", () => new InternalFundTransferPolicyInvariantMintNotAllowedError);

class InternalFundTransferPolicyInvariantAmountZeroError extends Error {
  code = 6104;
  name = "InternalFundTransferPolicyInvariantAmountZero";
  constructor() {
    super("Internal fund transfer policy invariant violation: amount must be greater than 0");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InternalFundTransferPolicyInvariantAmountZeroError);
    }
  }
}
createErrorFromCodeLookup.set(6104, () => new InternalFundTransferPolicyInvariantAmountZeroError);
createErrorFromNameLookup.set("InternalFundTransferPolicyInvariantAmountZero", () => new InternalFundTransferPolicyInvariantAmountZeroError);

class InternalFundTransferPolicyInvariantDuplicateMintsError extends Error {
  code = 6105;
  name = "InternalFundTransferPolicyInvariantDuplicateMints";
  constructor() {
    super("Internal fund transfer policy invariant violation: cannot have duplicate mints");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, InternalFundTransferPolicyInvariantDuplicateMintsError);
    }
  }
}
createErrorFromCodeLookup.set(6105, () => new InternalFundTransferPolicyInvariantDuplicateMintsError);
createErrorFromNameLookup.set("InternalFundTransferPolicyInvariantDuplicateMints", () => new InternalFundTransferPolicyInvariantDuplicateMintsError);

class ConsensusAccountNotSettingsError extends Error {
  code = 6106;
  name = "ConsensusAccountNotSettings";
  constructor() {
    super("Consensus account is not a settings");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ConsensusAccountNotSettingsError);
    }
  }
}
createErrorFromCodeLookup.set(6106, () => new ConsensusAccountNotSettingsError);
createErrorFromNameLookup.set("ConsensusAccountNotSettings", () => new ConsensusAccountNotSettingsError);

class ConsensusAccountNotPolicyError extends Error {
  code = 6107;
  name = "ConsensusAccountNotPolicy";
  constructor() {
    super("Consensus account is not a policy");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, ConsensusAccountNotPolicyError);
    }
  }
}
createErrorFromCodeLookup.set(6107, () => new ConsensusAccountNotPolicyError);
createErrorFromNameLookup.set("ConsensusAccountNotPolicy", () => new ConsensusAccountNotPolicyError);

class SettingsChangePolicyActionsMustBeNonZeroError extends Error {
  code = 6108;
  name = "SettingsChangePolicyActionsMustBeNonZero";
  constructor() {
    super("Settings change policy invariant violation: actions must be non-zero");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangePolicyActionsMustBeNonZeroError);
    }
  }
}
createErrorFromCodeLookup.set(6108, () => new SettingsChangePolicyActionsMustBeNonZeroError);
createErrorFromNameLookup.set("SettingsChangePolicyActionsMustBeNonZero", () => new SettingsChangePolicyActionsMustBeNonZeroError);

class SettingsChangeInvalidSettingsKeyError extends Error {
  code = 6109;
  name = "SettingsChangeInvalidSettingsKey";
  constructor() {
    super("Settings change policy violation: submitted settings account must match policy settings key");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangeInvalidSettingsKeyError);
    }
  }
}
createErrorFromCodeLookup.set(6109, () => new SettingsChangeInvalidSettingsKeyError);
createErrorFromNameLookup.set("SettingsChangeInvalidSettingsKey", () => new SettingsChangeInvalidSettingsKeyError);

class SettingsChangeInvalidSettingsAccountError extends Error {
  code = 6110;
  name = "SettingsChangeInvalidSettingsAccount";
  constructor() {
    super("Settings change policy violation: submitted settings account must be writable");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangeInvalidSettingsAccountError);
    }
  }
}
createErrorFromCodeLookup.set(6110, () => new SettingsChangeInvalidSettingsAccountError);
createErrorFromNameLookup.set("SettingsChangeInvalidSettingsAccount", () => new SettingsChangeInvalidSettingsAccountError);

class SettingsChangeInvalidRentPayerError extends Error {
  code = 6111;
  name = "SettingsChangeInvalidRentPayer";
  constructor() {
    super("Settings change policy violation: rent payer must be writable and signer");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangeInvalidRentPayerError);
    }
  }
}
createErrorFromCodeLookup.set(6111, () => new SettingsChangeInvalidRentPayerError);
createErrorFromNameLookup.set("SettingsChangeInvalidRentPayer", () => new SettingsChangeInvalidRentPayerError);

class SettingsChangeInvalidSystemProgramError extends Error {
  code = 6112;
  name = "SettingsChangeInvalidSystemProgram";
  constructor() {
    super("Settings change policy violation: system program must be the system program");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangeInvalidSystemProgramError);
    }
  }
}
createErrorFromCodeLookup.set(6112, () => new SettingsChangeInvalidSystemProgramError);
createErrorFromNameLookup.set("SettingsChangeInvalidSystemProgram", () => new SettingsChangeInvalidSystemProgramError);

class SettingsChangeAddSignerViolationError extends Error {
  code = 6113;
  name = "SettingsChangeAddSignerViolation";
  constructor() {
    super("Settings change policy violation: signer does not match allowed signer");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangeAddSignerViolationError);
    }
  }
}
createErrorFromCodeLookup.set(6113, () => new SettingsChangeAddSignerViolationError);
createErrorFromNameLookup.set("SettingsChangeAddSignerViolation", () => new SettingsChangeAddSignerViolationError);

class SettingsChangeAddSignerPermissionsViolationError extends Error {
  code = 6114;
  name = "SettingsChangeAddSignerPermissionsViolation";
  constructor() {
    super("Settings change policy violation: signer permissions does not match allowed signer permissions");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangeAddSignerPermissionsViolationError);
    }
  }
}
createErrorFromCodeLookup.set(6114, () => new SettingsChangeAddSignerPermissionsViolationError);
createErrorFromNameLookup.set("SettingsChangeAddSignerPermissionsViolation", () => new SettingsChangeAddSignerPermissionsViolationError);

class SettingsChangeRemoveSignerViolationError extends Error {
  code = 6115;
  name = "SettingsChangeRemoveSignerViolation";
  constructor() {
    super("Settings change policy violation: signer removal does not mach allowed signer removal");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangeRemoveSignerViolationError);
    }
  }
}
createErrorFromCodeLookup.set(6115, () => new SettingsChangeRemoveSignerViolationError);
createErrorFromNameLookup.set("SettingsChangeRemoveSignerViolation", () => new SettingsChangeRemoveSignerViolationError);

class SettingsChangeChangeTimelockViolationError extends Error {
  code = 6116;
  name = "SettingsChangeChangeTimelockViolation";
  constructor() {
    super("Settings change policy violation: time lock does not match allowed time lock");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangeChangeTimelockViolationError);
    }
  }
}
createErrorFromCodeLookup.set(6116, () => new SettingsChangeChangeTimelockViolationError);
createErrorFromNameLookup.set("SettingsChangeChangeTimelockViolation", () => new SettingsChangeChangeTimelockViolationError);

class SettingsChangeActionMismatchError extends Error {
  code = 6117;
  name = "SettingsChangeActionMismatch";
  constructor() {
    super("Settings change policy violation: action does not match allowed action");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangeActionMismatchError);
    }
  }
}
createErrorFromCodeLookup.set(6117, () => new SettingsChangeActionMismatchError);
createErrorFromNameLookup.set("SettingsChangeActionMismatch", () => new SettingsChangeActionMismatchError);

class SettingsChangePolicyInvariantDuplicateActionsError extends Error {
  code = 6118;
  name = "SettingsChangePolicyInvariantDuplicateActions";
  constructor() {
    super("Settings change policy invariant violation: cannot have duplicate actions");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangePolicyInvariantDuplicateActionsError);
    }
  }
}
createErrorFromCodeLookup.set(6118, () => new SettingsChangePolicyInvariantDuplicateActionsError);
createErrorFromNameLookup.set("SettingsChangePolicyInvariantDuplicateActions", () => new SettingsChangePolicyInvariantDuplicateActionsError);

class SettingsChangePolicyInvariantActionIndicesActionsLengthMismatchError extends Error {
  code = 6119;
  name = "SettingsChangePolicyInvariantActionIndicesActionsLengthMismatch";
  constructor() {
    super("Settings change policy invariant violation: action indices must match actions length");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangePolicyInvariantActionIndicesActionsLengthMismatchError);
    }
  }
}
createErrorFromCodeLookup.set(6119, () => new SettingsChangePolicyInvariantActionIndicesActionsLengthMismatchError);
createErrorFromNameLookup.set("SettingsChangePolicyInvariantActionIndicesActionsLengthMismatch", () => new SettingsChangePolicyInvariantActionIndicesActionsLengthMismatchError);

class SettingsChangePolicyInvariantActionIndexOutOfBoundsError extends Error {
  code = 6120;
  name = "SettingsChangePolicyInvariantActionIndexOutOfBounds";
  constructor() {
    super("Settings change policy invariant violation: action index out of bounds");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, SettingsChangePolicyInvariantActionIndexOutOfBoundsError);
    }
  }
}
createErrorFromCodeLookup.set(6120, () => new SettingsChangePolicyInvariantActionIndexOutOfBoundsError);
createErrorFromNameLookup.set("SettingsChangePolicyInvariantActionIndexOutOfBounds", () => new SettingsChangePolicyInvariantActionIndexOutOfBoundsError);

class PolicyNotActiveYetError extends Error {
  code = 6121;
  name = "PolicyNotActiveYet";
  constructor() {
    super("Policy is not active yet");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PolicyNotActiveYetError);
    }
  }
}
createErrorFromCodeLookup.set(6121, () => new PolicyNotActiveYetError);
createErrorFromNameLookup.set("PolicyNotActiveYet", () => new PolicyNotActiveYetError);

class PolicyInvariantInvalidExpirationError extends Error {
  code = 6122;
  name = "PolicyInvariantInvalidExpiration";
  constructor() {
    super("Policy invariant violation: invalid policy expiration");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PolicyInvariantInvalidExpirationError);
    }
  }
}
createErrorFromCodeLookup.set(6122, () => new PolicyInvariantInvalidExpirationError);
createErrorFromNameLookup.set("PolicyInvariantInvalidExpiration", () => new PolicyInvariantInvalidExpirationError);

class PolicyExpirationViolationPolicySettingsKeyMismatchError extends Error {
  code = 6123;
  name = "PolicyExpirationViolationPolicySettingsKeyMismatch";
  constructor() {
    super("Policy expiration violation: submitted settings key does not match policy settings key");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PolicyExpirationViolationPolicySettingsKeyMismatchError);
    }
  }
}
createErrorFromCodeLookup.set(6123, () => new PolicyExpirationViolationPolicySettingsKeyMismatchError);
createErrorFromNameLookup.set("PolicyExpirationViolationPolicySettingsKeyMismatch", () => new PolicyExpirationViolationPolicySettingsKeyMismatchError);

class PolicyExpirationViolationSettingsAccountNotPresentError extends Error {
  code = 6124;
  name = "PolicyExpirationViolationSettingsAccountNotPresent";
  constructor() {
    super("Policy expiration violation: state expiration requires the settings to be submitted");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PolicyExpirationViolationSettingsAccountNotPresentError);
    }
  }
}
createErrorFromCodeLookup.set(6124, () => new PolicyExpirationViolationSettingsAccountNotPresentError);
createErrorFromNameLookup.set("PolicyExpirationViolationSettingsAccountNotPresent", () => new PolicyExpirationViolationSettingsAccountNotPresentError);

class PolicyExpirationViolationHashExpiredError extends Error {
  code = 6125;
  name = "PolicyExpirationViolationHashExpired";
  constructor() {
    super("Policy expiration violation: state hash has expired");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PolicyExpirationViolationHashExpiredError);
    }
  }
}
createErrorFromCodeLookup.set(6125, () => new PolicyExpirationViolationHashExpiredError);
createErrorFromNameLookup.set("PolicyExpirationViolationHashExpired", () => new PolicyExpirationViolationHashExpiredError);

class PolicyExpirationViolationTimestampExpiredError extends Error {
  code = 6126;
  name = "PolicyExpirationViolationTimestampExpired";
  constructor() {
    super("Policy expiration violation: timestamp has expired");
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, PolicyExpirationViolationTimestampExpiredError);
    }
  }
}
createErrorFromCodeLookup.set(6126, () => new PolicyExpirationViolationTimestampExpiredError);
createErrorFromNameLookup.set("PolicyExpirationViolationTimestampExpired", () => new PolicyExpirationViolationTimestampExpiredError);
function errorFromCode(code2) {
  const createError = createErrorFromCodeLookup.get(code2);
  return createError != null ? createError() : null;
}
function errorFromName(name) {
  const createError = createErrorFromNameLookup.get(name);
  return createError != null ? createError() : null;
}
// src/generated/instructions/activateProposal.ts
var beet60 = __toESM(require_beet(), 1);
import * as web312 from "@solana/web3.js";
var activateProposalStruct = new beet60.BeetArgsStruct([["instructionDiscriminator", beet60.uniformFixedSizeArray(beet60.u8, 8)]], "ActivateProposalInstructionArgs");
var activateProposalInstructionDiscriminator = [
  90,
  186,
  203,
  234,
  70,
  185,
  191,
  21
];
function createActivateProposalInstruction(accounts, programId = new web312.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = activateProposalStruct.serialize({
    instructionDiscriminator: activateProposalInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.signer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web312.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/addSignerAsAuthority.ts
var beet62 = __toESM(require_beet(), 1);
import * as web313 from "@solana/web3.js";

// src/generated/types/AddSignerArgs.ts
var beet61 = __toESM(require_beet(), 1);
var addSignerArgsBeet = new beet61.FixableBeetArgsStruct([
  ["newSigner", smartAccountSignerBeet],
  ["memo", beet61.coption(beet61.utf8String)]
], "AddSignerArgs");

// src/generated/instructions/addSignerAsAuthority.ts
var addSignerAsAuthorityStruct = new beet62.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet62.uniformFixedSizeArray(beet62.u8, 8)],
  ["args", addSignerArgsBeet]
], "AddSignerAsAuthorityInstructionArgs");
var addSignerAsAuthorityInstructionDiscriminator = [
  80,
  198,
  228,
  154,
  7,
  234,
  99,
  56
];
function createAddSignerAsAuthorityInstruction(accounts, args, programId = new web313.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = addSignerAsAuthorityStruct.serialize({
    instructionDiscriminator: addSignerAsAuthorityInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.settingsAuthority,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer ?? programId,
      isWritable: accounts.rentPayer != null,
      isSigner: accounts.rentPayer != null
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web313.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/addSpendingLimitAsAuthority.ts
var beet64 = __toESM(require_beet(), 1);
import * as web314 from "@solana/web3.js";

// src/generated/types/AddSpendingLimitArgs.ts
var beet63 = __toESM(require_beet(), 1);
var beetSolana30 = __toESM(require_beet_solana(), 1);
var addSpendingLimitArgsBeet = new beet63.FixableBeetArgsStruct([
  ["seed", beetSolana30.publicKey],
  ["accountIndex", beet63.u8],
  ["mint", beetSolana30.publicKey],
  ["amount", beet63.u64],
  ["period", periodBeet],
  ["signers", beet63.array(beetSolana30.publicKey)],
  ["destinations", beet63.array(beetSolana30.publicKey)],
  ["expiration", beet63.i64],
  ["memo", beet63.coption(beet63.utf8String)]
], "AddSpendingLimitArgs");

// src/generated/instructions/addSpendingLimitAsAuthority.ts
var addSpendingLimitAsAuthorityStruct = new beet64.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet64.uniformFixedSizeArray(beet64.u8, 8)],
  ["args", addSpendingLimitArgsBeet]
], "AddSpendingLimitAsAuthorityInstructionArgs");
var addSpendingLimitAsAuthorityInstructionDiscriminator = [
  169,
  189,
  84,
  54,
  30,
  244,
  223,
  212
];
function createAddSpendingLimitAsAuthorityInstruction(accounts, args, programId = new web314.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = addSpendingLimitAsAuthorityStruct.serialize({
    instructionDiscriminator: addSpendingLimitAsAuthorityInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.settingsAuthority,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.spendingLimit,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.rentPayer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.systemProgram ?? web314.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web314.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/addTransactionToBatch.ts
var beet66 = __toESM(require_beet(), 1);
import * as web315 from "@solana/web3.js";

// src/generated/types/AddTransactionToBatchArgs.ts
var beet65 = __toESM(require_beet(), 1);
var addTransactionToBatchArgsBeet = new beet65.FixableBeetArgsStruct([
  ["ephemeralSigners", beet65.u8],
  ["transactionMessage", beet65.bytes]
], "AddTransactionToBatchArgs");

// src/generated/instructions/addTransactionToBatch.ts
var addTransactionToBatchStruct = new beet66.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet66.uniformFixedSizeArray(beet66.u8, 8)],
  ["args", addTransactionToBatchArgsBeet]
], "AddTransactionToBatchInstructionArgs");
var addTransactionToBatchInstructionDiscriminator = [
  147,
  75,
  197,
  227,
  20,
  149,
  150,
  113
];
function createAddTransactionToBatchInstruction(accounts, args, programId = new web315.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = addTransactionToBatchStruct.serialize({
    instructionDiscriminator: addTransactionToBatchInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.proposal,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.batch,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.signer,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.systemProgram ?? web315.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web315.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/approveProposal.ts
var beet68 = __toESM(require_beet(), 1);
import * as web316 from "@solana/web3.js";

// src/generated/types/VoteOnProposalArgs.ts
var beet67 = __toESM(require_beet(), 1);
var voteOnProposalArgsBeet = new beet67.FixableBeetArgsStruct([["memo", beet67.coption(beet67.utf8String)]], "VoteOnProposalArgs");

// src/generated/instructions/approveProposal.ts
var approveProposalStruct = new beet68.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet68.uniformFixedSizeArray(beet68.u8, 8)],
  ["args", voteOnProposalArgsBeet]
], "ApproveProposalInstructionArgs");
var approveProposalInstructionDiscriminator = [
  136,
  108,
  102,
  85,
  98,
  114,
  7,
  147
];
function createApproveProposalInstruction(accounts, args, programId = new web316.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = approveProposalStruct.serialize({
    instructionDiscriminator: approveProposalInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.signer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web316.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/cancelProposal.ts
var beet69 = __toESM(require_beet(), 1);
import * as web317 from "@solana/web3.js";
var cancelProposalStruct = new beet69.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet69.uniformFixedSizeArray(beet69.u8, 8)],
  ["args", voteOnProposalArgsBeet]
], "CancelProposalInstructionArgs");
var cancelProposalInstructionDiscriminator = [
  106,
  74,
  128,
  146,
  19,
  65,
  39,
  23
];
function createCancelProposalInstruction(accounts, args, programId = new web317.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = cancelProposalStruct.serialize({
    instructionDiscriminator: cancelProposalInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.signer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web317.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/changeThresholdAsAuthority.ts
var beet71 = __toESM(require_beet(), 1);
import * as web318 from "@solana/web3.js";

// src/generated/types/ChangeThresholdArgs.ts
var beet70 = __toESM(require_beet(), 1);
var changeThresholdArgsBeet = new beet70.FixableBeetArgsStruct([
  ["newThreshold", beet70.u16],
  ["memo", beet70.coption(beet70.utf8String)]
], "ChangeThresholdArgs");

// src/generated/instructions/changeThresholdAsAuthority.ts
var changeThresholdAsAuthorityStruct = new beet71.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet71.uniformFixedSizeArray(beet71.u8, 8)],
  ["args", changeThresholdArgsBeet]
], "ChangeThresholdAsAuthorityInstructionArgs");
var changeThresholdAsAuthorityInstructionDiscriminator = [
  51,
  141,
  78,
  133,
  70,
  47,
  95,
  124
];
function createChangeThresholdAsAuthorityInstruction(accounts, args, programId = new web318.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = changeThresholdAsAuthorityStruct.serialize({
    instructionDiscriminator: changeThresholdAsAuthorityInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.settingsAuthority,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer ?? programId,
      isWritable: accounts.rentPayer != null,
      isSigner: accounts.rentPayer != null
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web318.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/closeBatch.ts
var beet72 = __toESM(require_beet(), 1);
import * as web319 from "@solana/web3.js";
var closeBatchStruct = new beet72.BeetArgsStruct([["instructionDiscriminator", beet72.uniformFixedSizeArray(beet72.u8, 8)]], "CloseBatchInstructionArgs");
var closeBatchInstructionDiscriminator = [
  166,
  174,
  35,
  253,
  209,
  211,
  181,
  28
];
function createCloseBatchInstruction(accounts, programId = new web319.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = closeBatchStruct.serialize({
    instructionDiscriminator: closeBatchInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.batch,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.proposalRentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.batchRentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.systemProgram ?? web319.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web319.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/closeBatchTransaction.ts
var beet73 = __toESM(require_beet(), 1);
import * as web320 from "@solana/web3.js";
var closeBatchTransactionStruct = new beet73.BeetArgsStruct([["instructionDiscriminator", beet73.uniformFixedSizeArray(beet73.u8, 8)]], "CloseBatchTransactionInstructionArgs");
var closeBatchTransactionInstructionDiscriminator = [
  86,
  144,
  133,
  225,
  45,
  209,
  62,
  251
];
function createCloseBatchTransactionInstruction(accounts, programId = new web320.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = closeBatchTransactionStruct.serialize({
    instructionDiscriminator: closeBatchTransactionInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.proposal,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.batch,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transactionRentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.systemProgram ?? web320.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web320.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/closeEmptyPolicyTransaction.ts
var beet74 = __toESM(require_beet(), 1);
import * as web321 from "@solana/web3.js";
var closeEmptyPolicyTransactionStruct = new beet74.BeetArgsStruct([["instructionDiscriminator", beet74.uniformFixedSizeArray(beet74.u8, 8)]], "CloseEmptyPolicyTransactionInstructionArgs");
var closeEmptyPolicyTransactionInstructionDiscriminator = [
  183,
  66,
  199,
  226,
  42,
  87,
  146,
  77
];
function createCloseEmptyPolicyTransactionInstruction(accounts, programId = new web321.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = closeEmptyPolicyTransactionStruct.serialize({
    instructionDiscriminator: closeEmptyPolicyTransactionInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.programConfig,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.emptyPolicy,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.proposalRentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transactionRentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.systemProgram ?? web321.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web321.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/closeSettingsTransaction.ts
var beet75 = __toESM(require_beet(), 1);
import * as web322 from "@solana/web3.js";
var closeSettingsTransactionStruct = new beet75.BeetArgsStruct([["instructionDiscriminator", beet75.uniformFixedSizeArray(beet75.u8, 8)]], "CloseSettingsTransactionInstructionArgs");
var closeSettingsTransactionInstructionDiscriminator = [
  251,
  112,
  34,
  108,
  214,
  13,
  41,
  116
];
function createCloseSettingsTransactionInstruction(accounts, programId = new web322.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = closeSettingsTransactionStruct.serialize({
    instructionDiscriminator: closeSettingsTransactionInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.proposalRentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transactionRentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.systemProgram ?? web322.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web322.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/closeTransaction.ts
var beet76 = __toESM(require_beet(), 1);
import * as web323 from "@solana/web3.js";
var closeTransactionStruct = new beet76.BeetArgsStruct([["instructionDiscriminator", beet76.uniformFixedSizeArray(beet76.u8, 8)]], "CloseTransactionInstructionArgs");
var closeTransactionInstructionDiscriminator = [
  97,
  46,
  152,
  170,
  42,
  215,
  192,
  218
];
function createCloseTransactionInstruction(accounts, programId = new web323.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = closeTransactionStruct.serialize({
    instructionDiscriminator: closeTransactionInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.proposalRentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transactionRentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.systemProgram ?? web323.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web323.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/closeTransactionBuffer.ts
var beet77 = __toESM(require_beet(), 1);
import * as web324 from "@solana/web3.js";
var closeTransactionBufferStruct = new beet77.BeetArgsStruct([["instructionDiscriminator", beet77.uniformFixedSizeArray(beet77.u8, 8)]], "CloseTransactionBufferInstructionArgs");
var closeTransactionBufferInstructionDiscriminator = [
  224,
  221,
  123,
  213,
  0,
  204,
  5,
  191
];
function createCloseTransactionBufferInstruction(accounts, programId = new web324.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = closeTransactionBufferStruct.serialize({
    instructionDiscriminator: closeTransactionBufferInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.transactionBuffer,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.creator,
      isWritable: false,
      isSigner: true
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web324.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/createBatch.ts
var beet79 = __toESM(require_beet(), 1);
import * as web325 from "@solana/web3.js";

// src/generated/types/CreateBatchArgs.ts
var beet78 = __toESM(require_beet(), 1);
var createBatchArgsBeet = new beet78.FixableBeetArgsStruct([
  ["accountIndex", beet78.u8],
  ["memo", beet78.coption(beet78.utf8String)]
], "CreateBatchArgs");

// src/generated/instructions/createBatch.ts
var createBatchStruct = new beet79.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet79.uniformFixedSizeArray(beet79.u8, 8)],
  ["args", createBatchArgsBeet]
], "CreateBatchInstructionArgs");
var createBatchInstructionDiscriminator = [
  159,
  198,
  248,
  43,
  248,
  31,
  235,
  86
];
function createCreateBatchInstruction(accounts, args, programId = new web325.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = createBatchStruct.serialize({
    instructionDiscriminator: createBatchInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.batch,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.creator,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.systemProgram ?? web325.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web325.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/createProposal.ts
var beet81 = __toESM(require_beet(), 1);
import * as web326 from "@solana/web3.js";

// src/generated/types/CreateProposalArgs.ts
var beet80 = __toESM(require_beet(), 1);
var createProposalArgsBeet = new beet80.BeetArgsStruct([
  ["transactionIndex", beet80.u64],
  ["draft", beet80.bool]
], "CreateProposalArgs");

// src/generated/instructions/createProposal.ts
var createProposalStruct = new beet81.BeetArgsStruct([
  ["instructionDiscriminator", beet81.uniformFixedSizeArray(beet81.u8, 8)],
  ["args", createProposalArgsBeet]
], "CreateProposalInstructionArgs");
var createProposalInstructionDiscriminator = [
  132,
  116,
  68,
  174,
  216,
  160,
  198,
  22
];
function createCreateProposalInstruction(accounts, args, programId = new web326.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = createProposalStruct.serialize({
    instructionDiscriminator: createProposalInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.creator,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.systemProgram ?? web326.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web326.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/createSettingsTransaction.ts
var beet83 = __toESM(require_beet(), 1);
import * as web327 from "@solana/web3.js";

// src/generated/types/CreateSettingsTransactionArgs.ts
var beet82 = __toESM(require_beet(), 1);
var createSettingsTransactionArgsBeet = new beet82.FixableBeetArgsStruct([
  ["actions", beet82.array(settingsActionBeet)],
  ["memo", beet82.coption(beet82.utf8String)]
], "CreateSettingsTransactionArgs");

// src/generated/instructions/createSettingsTransaction.ts
var createSettingsTransactionStruct = new beet83.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet83.uniformFixedSizeArray(beet83.u8, 8)],
  ["args", createSettingsTransactionArgsBeet]
], "CreateSettingsTransactionInstructionArgs");
var createSettingsTransactionInstructionDiscriminator = [
  101,
  168,
  254,
  203,
  222,
  102,
  95,
  192
];
function createCreateSettingsTransactionInstruction(accounts, args, programId = new web327.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = createSettingsTransactionStruct.serialize({
    instructionDiscriminator: createSettingsTransactionInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.creator,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.systemProgram ?? web327.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web327.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/createSmartAccount.ts
var beet85 = __toESM(require_beet(), 1);
import * as web328 from "@solana/web3.js";

// src/generated/types/CreateSmartAccountArgs.ts
var beet84 = __toESM(require_beet(), 1);
var beetSolana31 = __toESM(require_beet_solana(), 1);
var createSmartAccountArgsBeet = new beet84.FixableBeetArgsStruct([
  ["settingsAuthority", beet84.coption(beetSolana31.publicKey)],
  ["threshold", beet84.u16],
  ["signers", beet84.array(smartAccountSignerBeet)],
  ["timeLock", beet84.u32],
  ["rentCollector", beet84.coption(beetSolana31.publicKey)],
  ["memo", beet84.coption(beet84.utf8String)]
], "CreateSmartAccountArgs");

// src/generated/instructions/createSmartAccount.ts
var createSmartAccountStruct = new beet85.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet85.uniformFixedSizeArray(beet85.u8, 8)],
  ["args", createSmartAccountArgsBeet]
], "CreateSmartAccountInstructionArgs");
var createSmartAccountInstructionDiscriminator = [
  197,
  102,
  253,
  231,
  77,
  84,
  50,
  17
];
function createCreateSmartAccountInstruction(accounts, args, programId = new web328.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = createSmartAccountStruct.serialize({
    instructionDiscriminator: createSmartAccountInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.programConfig,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.treasury,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.creator,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.systemProgram ?? web328.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web328.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/createTransaction.ts
var beet87 = __toESM(require_beet(), 1);
import * as web329 from "@solana/web3.js";

// src/generated/types/CreateTransactionArgs.ts
var beet86 = __toESM(require_beet(), 1);
var isCreateTransactionArgsTransactionPayload = (x) => x.__kind === "TransactionPayload";
var isCreateTransactionArgsPolicyPayload = (x) => x.__kind === "PolicyPayload";
var createTransactionArgsBeet = beet86.dataEnum([
  [
    "TransactionPayload",
    new beet86.FixableBeetArgsStruct([["fields", beet86.tuple([transactionPayloadBeet])]], 'CreateTransactionArgsRecord["TransactionPayload"]')
  ],
  [
    "PolicyPayload",
    new beet86.FixableBeetArgsStruct([["payload", policyPayloadBeet]], 'CreateTransactionArgsRecord["PolicyPayload"]')
  ]
]);

// src/generated/instructions/createTransaction.ts
var createTransactionStruct = new beet87.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet87.uniformFixedSizeArray(beet87.u8, 8)],
  ["args", createTransactionArgsBeet]
], "CreateTransactionInstructionArgs");
var createTransactionInstructionDiscriminator = [
  227,
  193,
  53,
  239,
  55,
  126,
  112,
  105
];
function createCreateTransactionInstruction(accounts, args, programId = new web329.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = createTransactionStruct.serialize({
    instructionDiscriminator: createTransactionInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.creator,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.systemProgram ?? web329.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web329.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/createTransactionBuffer.ts
var beet89 = __toESM(require_beet(), 1);
import * as web330 from "@solana/web3.js";

// src/generated/types/CreateTransactionBufferArgs.ts
var beet88 = __toESM(require_beet(), 1);
var createTransactionBufferArgsBeet = new beet88.FixableBeetArgsStruct([
  ["bufferIndex", beet88.u8],
  ["accountIndex", beet88.u8],
  ["finalBufferHash", beet88.uniformFixedSizeArray(beet88.u8, 32)],
  ["finalBufferSize", beet88.u16],
  ["buffer", beet88.bytes]
], "CreateTransactionBufferArgs");

// src/generated/instructions/createTransactionBuffer.ts
var createTransactionBufferStruct = new beet89.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet89.uniformFixedSizeArray(beet89.u8, 8)],
  ["args", createTransactionBufferArgsBeet]
], "CreateTransactionBufferInstructionArgs");
var createTransactionBufferInstructionDiscriminator = [
  57,
  97,
  250,
  156,
  59,
  211,
  32,
  208
];
function createCreateTransactionBufferInstruction(accounts, args, programId = new web330.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = createTransactionBufferStruct.serialize({
    instructionDiscriminator: createTransactionBufferInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.transactionBuffer,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.creator,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.systemProgram ?? web330.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web330.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/createTransactionFromBuffer.ts
var beet90 = __toESM(require_beet(), 1);
import * as web331 from "@solana/web3.js";
var createTransactionFromBufferStruct = new beet90.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet90.uniformFixedSizeArray(beet90.u8, 8)],
  ["args", createTransactionArgsBeet]
], "CreateTransactionFromBufferInstructionArgs");
var createTransactionFromBufferInstructionDiscriminator = [
  53,
  192,
  39,
  239,
  124,
  84,
  43,
  249
];
function createCreateTransactionFromBufferInstruction(accounts, args, programId = new web331.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = createTransactionFromBufferStruct.serialize({
    instructionDiscriminator: createTransactionFromBufferInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.transactionCreateItemConsensusAccount,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transactionCreateItemTransaction,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transactionCreateItemCreator,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.transactionCreateItemRentPayer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.transactionCreateItemSystemProgram,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.transactionCreateItemProgram,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.transactionBuffer,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.creator,
      isWritable: true,
      isSigner: true
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web331.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/executeBatchTransaction.ts
var beet91 = __toESM(require_beet(), 1);
import * as web332 from "@solana/web3.js";
var executeBatchTransactionStruct = new beet91.BeetArgsStruct([["instructionDiscriminator", beet91.uniformFixedSizeArray(beet91.u8, 8)]], "ExecuteBatchTransactionInstructionArgs");
var executeBatchTransactionInstructionDiscriminator = [
  237,
  67,
  201,
  173,
  33,
  130,
  88,
  134
];
function createExecuteBatchTransactionInstruction(accounts, programId = new web332.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = executeBatchTransactionStruct.serialize({
    instructionDiscriminator: executeBatchTransactionInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.signer,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.batch,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web332.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/executeSettingsTransaction.ts
var beet92 = __toESM(require_beet(), 1);
import * as web333 from "@solana/web3.js";
var executeSettingsTransactionStruct = new beet92.BeetArgsStruct([["instructionDiscriminator", beet92.uniformFixedSizeArray(beet92.u8, 8)]], "ExecuteSettingsTransactionInstructionArgs");
var executeSettingsTransactionInstructionDiscriminator = [
  131,
  210,
  27,
  88,
  27,
  204,
  143,
  189
];
function createExecuteSettingsTransactionInstruction(accounts, programId = new web333.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = executeSettingsTransactionStruct.serialize({
    instructionDiscriminator: executeSettingsTransactionInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.signer,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.rentPayer ?? programId,
      isWritable: accounts.rentPayer != null,
      isSigner: accounts.rentPayer != null
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web333.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/executeSettingsTransactionSync.ts
var beet94 = __toESM(require_beet(), 1);
import * as web334 from "@solana/web3.js";

// src/generated/types/SyncSettingsTransactionArgs.ts
var beet93 = __toESM(require_beet(), 1);
var syncSettingsTransactionArgsBeet = new beet93.FixableBeetArgsStruct([
  ["numSigners", beet93.u8],
  ["actions", beet93.array(settingsActionBeet)],
  ["memo", beet93.coption(beet93.utf8String)]
], "SyncSettingsTransactionArgs");

// src/generated/instructions/executeSettingsTransactionSync.ts
var executeSettingsTransactionSyncStruct = new beet94.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet94.uniformFixedSizeArray(beet94.u8, 8)],
  ["args", syncSettingsTransactionArgsBeet]
], "ExecuteSettingsTransactionSyncInstructionArgs");
var executeSettingsTransactionSyncInstructionDiscriminator = [
  138,
  209,
  64,
  163,
  79,
  67,
  233,
  76
];
function createExecuteSettingsTransactionSyncInstruction(accounts, args, programId = new web334.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = executeSettingsTransactionSyncStruct.serialize({
    instructionDiscriminator: executeSettingsTransactionSyncInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.rentPayer ?? programId,
      isWritable: accounts.rentPayer != null,
      isSigner: accounts.rentPayer != null
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web334.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/executeTransaction.ts
var beet95 = __toESM(require_beet(), 1);
import * as web335 from "@solana/web3.js";
var executeTransactionStruct = new beet95.BeetArgsStruct([["instructionDiscriminator", beet95.uniformFixedSizeArray(beet95.u8, 8)]], "ExecuteTransactionInstructionArgs");
var executeTransactionInstructionDiscriminator = [
  231,
  173,
  49,
  91,
  235,
  24,
  68,
  19
];
function createExecuteTransactionInstruction(accounts, programId = new web335.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = executeTransactionStruct.serialize({
    instructionDiscriminator: executeTransactionInstructionDiscriminator
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.transaction,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.signer,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web335.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/executeTransactionSync.ts
var beet97 = __toESM(require_beet(), 1);
import * as web336 from "@solana/web3.js";

// src/generated/types/LegacySyncTransactionArgs.ts
var beet96 = __toESM(require_beet(), 1);
var legacySyncTransactionArgsBeet = new beet96.FixableBeetArgsStruct([
  ["accountIndex", beet96.u8],
  ["numSigners", beet96.u8],
  ["instructions", beet96.bytes]
], "LegacySyncTransactionArgs");

// src/generated/instructions/executeTransactionSync.ts
var executeTransactionSyncStruct = new beet97.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet97.uniformFixedSizeArray(beet97.u8, 8)],
  ["args", legacySyncTransactionArgsBeet]
], "ExecuteTransactionSyncInstructionArgs");
var executeTransactionSyncInstructionDiscriminator = [
  43,
  102,
  248,
  89,
  231,
  97,
  104,
  134
];
function createExecuteTransactionSyncInstruction(accounts, args, programId = new web336.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = executeTransactionSyncStruct.serialize({
    instructionDiscriminator: executeTransactionSyncInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web336.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/executeTransactionSyncV2.ts
var beet100 = __toESM(require_beet(), 1);
import * as web337 from "@solana/web3.js";

// src/generated/types/SyncTransactionArgs.ts
var beet99 = __toESM(require_beet(), 1);

// src/generated/types/SyncPayload.ts
var beet98 = __toESM(require_beet(), 1);
var isSyncPayloadTransaction = (x) => x.__kind === "Transaction";
var isSyncPayloadPolicy = (x) => x.__kind === "Policy";
var syncPayloadBeet = beet98.dataEnum([
  [
    "Transaction",
    new beet98.FixableBeetArgsStruct([["fields", beet98.tuple([beet98.bytes])]], 'SyncPayloadRecord["Transaction"]')
  ],
  [
    "Policy",
    new beet98.FixableBeetArgsStruct([["fields", beet98.tuple([policyPayloadBeet])]], 'SyncPayloadRecord["Policy"]')
  ]
]);

// src/generated/types/SyncTransactionArgs.ts
var syncTransactionArgsBeet = new beet99.FixableBeetArgsStruct([
  ["accountIndex", beet99.u8],
  ["numSigners", beet99.u8],
  ["payload", syncPayloadBeet]
], "SyncTransactionArgs");

// src/generated/instructions/executeTransactionSyncV2.ts
var executeTransactionSyncV2Struct = new beet100.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet100.uniformFixedSizeArray(beet100.u8, 8)],
  ["args", syncTransactionArgsBeet]
], "ExecuteTransactionSyncV2InstructionArgs");
var executeTransactionSyncV2InstructionDiscriminator = [
  90,
  81,
  187,
  81,
  39,
  70,
  128,
  78
];
function createExecuteTransactionSyncV2Instruction(accounts, args, programId = new web337.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = executeTransactionSyncV2Struct.serialize({
    instructionDiscriminator: executeTransactionSyncV2InstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web337.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/extendTransactionBuffer.ts
var beet102 = __toESM(require_beet(), 1);
import * as web338 from "@solana/web3.js";

// src/generated/types/ExtendTransactionBufferArgs.ts
var beet101 = __toESM(require_beet(), 1);
var extendTransactionBufferArgsBeet = new beet101.FixableBeetArgsStruct([["buffer", beet101.bytes]], "ExtendTransactionBufferArgs");

// src/generated/instructions/extendTransactionBuffer.ts
var extendTransactionBufferStruct = new beet102.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet102.uniformFixedSizeArray(beet102.u8, 8)],
  ["args", extendTransactionBufferArgsBeet]
], "ExtendTransactionBufferInstructionArgs");
var extendTransactionBufferInstructionDiscriminator = [
  190,
  86,
  246,
  95,
  231,
  154,
  229,
  91
];
function createExtendTransactionBufferInstruction(accounts, args, programId = new web338.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = extendTransactionBufferStruct.serialize({
    instructionDiscriminator: extendTransactionBufferInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.transactionBuffer,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.creator,
      isWritable: false,
      isSigner: true
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web338.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/initializeProgramConfig.ts
var beet104 = __toESM(require_beet(), 1);
import * as web339 from "@solana/web3.js";

// src/generated/types/InitProgramConfigArgs.ts
var beet103 = __toESM(require_beet(), 1);
var beetSolana32 = __toESM(require_beet_solana(), 1);
var initProgramConfigArgsBeet = new beet103.BeetArgsStruct([
  ["authority", beetSolana32.publicKey],
  ["smartAccountCreationFee", beet103.u64],
  ["treasury", beetSolana32.publicKey]
], "InitProgramConfigArgs");

// src/generated/instructions/initializeProgramConfig.ts
var initializeProgramConfigStruct = new beet104.BeetArgsStruct([
  ["instructionDiscriminator", beet104.uniformFixedSizeArray(beet104.u8, 8)],
  ["args", initProgramConfigArgsBeet]
], "InitializeProgramConfigInstructionArgs");
var initializeProgramConfigInstructionDiscriminator = [
  6,
  131,
  61,
  237,
  40,
  110,
  83,
  124
];
function createInitializeProgramConfigInstruction(accounts, args, programId = new web339.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = initializeProgramConfigStruct.serialize({
    instructionDiscriminator: initializeProgramConfigInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.programConfig,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.initializer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.systemProgram ?? web339.SystemProgram.programId,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web339.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/logEvent.ts
var beet106 = __toESM(require_beet(), 1);
import * as web340 from "@solana/web3.js";

// src/generated/types/LogEventArgsV2.ts
var beet105 = __toESM(require_beet(), 1);
var logEventArgsV2Beet = new beet105.FixableBeetArgsStruct([["event", beet105.bytes]], "LogEventArgsV2");

// src/generated/instructions/logEvent.ts
var logEventStruct = new beet106.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet106.uniformFixedSizeArray(beet106.u8, 8)],
  ["args", logEventArgsV2Beet]
], "LogEventInstructionArgs");
var logEventInstructionDiscriminator = [
  5,
  9,
  90,
  141,
  223,
  134,
  57,
  217
];
function createLogEventInstruction(accounts, args, programId = new web340.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = logEventStruct.serialize({
    instructionDiscriminator: logEventInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.logAuthority,
      isWritable: false,
      isSigner: true
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web340.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/rejectProposal.ts
var beet107 = __toESM(require_beet(), 1);
import * as web341 from "@solana/web3.js";
var rejectProposalStruct = new beet107.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet107.uniformFixedSizeArray(beet107.u8, 8)],
  ["args", voteOnProposalArgsBeet]
], "RejectProposalInstructionArgs");
var rejectProposalInstructionDiscriminator = [
  114,
  162,
  164,
  82,
  191,
  11,
  102,
  25
];
function createRejectProposalInstruction(accounts, args, programId = new web341.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = rejectProposalStruct.serialize({
    instructionDiscriminator: rejectProposalInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.consensusAccount,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.signer,
      isWritable: true,
      isSigner: true
    },
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web341.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/removeSignerAsAuthority.ts
var beet109 = __toESM(require_beet(), 1);
import * as web342 from "@solana/web3.js";

// src/generated/types/RemoveSignerArgs.ts
var beet108 = __toESM(require_beet(), 1);
var beetSolana33 = __toESM(require_beet_solana(), 1);
var removeSignerArgsBeet = new beet108.FixableBeetArgsStruct([
  ["oldSigner", beetSolana33.publicKey],
  ["memo", beet108.coption(beet108.utf8String)]
], "RemoveSignerArgs");

// src/generated/instructions/removeSignerAsAuthority.ts
var removeSignerAsAuthorityStruct = new beet109.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet109.uniformFixedSizeArray(beet109.u8, 8)],
  ["args", removeSignerArgsBeet]
], "RemoveSignerAsAuthorityInstructionArgs");
var removeSignerAsAuthorityInstructionDiscriminator = [
  58,
  19,
  149,
  16,
  181,
  16,
  125,
  148
];
function createRemoveSignerAsAuthorityInstruction(accounts, args, programId = new web342.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = removeSignerAsAuthorityStruct.serialize({
    instructionDiscriminator: removeSignerAsAuthorityInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.settingsAuthority,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer ?? programId,
      isWritable: accounts.rentPayer != null,
      isSigner: accounts.rentPayer != null
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web342.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/removeSpendingLimitAsAuthority.ts
var beet111 = __toESM(require_beet(), 1);
import * as web343 from "@solana/web3.js";

// src/generated/types/RemoveSpendingLimitArgs.ts
var beet110 = __toESM(require_beet(), 1);
var removeSpendingLimitArgsBeet = new beet110.FixableBeetArgsStruct([["memo", beet110.coption(beet110.utf8String)]], "RemoveSpendingLimitArgs");

// src/generated/instructions/removeSpendingLimitAsAuthority.ts
var removeSpendingLimitAsAuthorityStruct = new beet111.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet111.uniformFixedSizeArray(beet111.u8, 8)],
  ["args", removeSpendingLimitArgsBeet]
], "RemoveSpendingLimitAsAuthorityInstructionArgs");
var removeSpendingLimitAsAuthorityInstructionDiscriminator = [
  94,
  32,
  68,
  127,
  251,
  44,
  145,
  7
];
function createRemoveSpendingLimitAsAuthorityInstruction(accounts, args, programId = new web343.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = removeSpendingLimitAsAuthorityStruct.serialize({
    instructionDiscriminator: removeSpendingLimitAsAuthorityInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.settingsAuthority,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.spendingLimit,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.rentCollector,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web343.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/setArchivalAuthorityAsAuthority.ts
var beet113 = __toESM(require_beet(), 1);
import * as web344 from "@solana/web3.js";

// src/generated/types/SetArchivalAuthorityArgs.ts
var beet112 = __toESM(require_beet(), 1);
var beetSolana34 = __toESM(require_beet_solana(), 1);
var setArchivalAuthorityArgsBeet = new beet112.FixableBeetArgsStruct([
  ["newArchivalAuthority", beet112.coption(beetSolana34.publicKey)],
  ["memo", beet112.coption(beet112.utf8String)]
], "SetArchivalAuthorityArgs");

// src/generated/instructions/setArchivalAuthorityAsAuthority.ts
var setArchivalAuthorityAsAuthorityStruct = new beet113.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet113.uniformFixedSizeArray(beet113.u8, 8)],
  ["args", setArchivalAuthorityArgsBeet]
], "SetArchivalAuthorityAsAuthorityInstructionArgs");
var setArchivalAuthorityAsAuthorityInstructionDiscriminator = [
  178,
  199,
  4,
  13,
  237,
  234,
  152,
  202
];
function createSetArchivalAuthorityAsAuthorityInstruction(accounts, args, programId = new web344.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = setArchivalAuthorityAsAuthorityStruct.serialize({
    instructionDiscriminator: setArchivalAuthorityAsAuthorityInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.settingsAuthority,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer ?? programId,
      isWritable: accounts.rentPayer != null,
      isSigner: accounts.rentPayer != null
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web344.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/setNewSettingsAuthorityAsAuthority.ts
var beet115 = __toESM(require_beet(), 1);
import * as web345 from "@solana/web3.js";

// src/generated/types/SetNewSettingsAuthorityArgs.ts
var beet114 = __toESM(require_beet(), 1);
var beetSolana35 = __toESM(require_beet_solana(), 1);
var setNewSettingsAuthorityArgsBeet = new beet114.FixableBeetArgsStruct([
  ["newSettingsAuthority", beetSolana35.publicKey],
  ["memo", beet114.coption(beet114.utf8String)]
], "SetNewSettingsAuthorityArgs");

// src/generated/instructions/setNewSettingsAuthorityAsAuthority.ts
var setNewSettingsAuthorityAsAuthorityStruct = new beet115.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet115.uniformFixedSizeArray(beet115.u8, 8)],
  ["args", setNewSettingsAuthorityArgsBeet]
], "SetNewSettingsAuthorityAsAuthorityInstructionArgs");
var setNewSettingsAuthorityAsAuthorityInstructionDiscriminator = [
  221,
  112,
  133,
  229,
  146,
  58,
  90,
  56
];
function createSetNewSettingsAuthorityAsAuthorityInstruction(accounts, args, programId = new web345.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = setNewSettingsAuthorityAsAuthorityStruct.serialize({
    instructionDiscriminator: setNewSettingsAuthorityAsAuthorityInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.settingsAuthority,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer ?? programId,
      isWritable: accounts.rentPayer != null,
      isSigner: accounts.rentPayer != null
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web345.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/setProgramConfigAuthority.ts
var beet117 = __toESM(require_beet(), 1);
import * as web346 from "@solana/web3.js";

// src/generated/types/ProgramConfigSetAuthorityArgs.ts
var beetSolana36 = __toESM(require_beet_solana(), 1);
var beet116 = __toESM(require_beet(), 1);
var programConfigSetAuthorityArgsBeet = new beet116.BeetArgsStruct([["newAuthority", beetSolana36.publicKey]], "ProgramConfigSetAuthorityArgs");

// src/generated/instructions/setProgramConfigAuthority.ts
var setProgramConfigAuthorityStruct = new beet117.BeetArgsStruct([
  ["instructionDiscriminator", beet117.uniformFixedSizeArray(beet117.u8, 8)],
  ["args", programConfigSetAuthorityArgsBeet]
], "SetProgramConfigAuthorityInstructionArgs");
var setProgramConfigAuthorityInstructionDiscriminator = [
  130,
  40,
  234,
  111,
  237,
  155,
  246,
  203
];
function createSetProgramConfigAuthorityInstruction(accounts, args, programId = new web346.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = setProgramConfigAuthorityStruct.serialize({
    instructionDiscriminator: setProgramConfigAuthorityInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.programConfig,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.authority,
      isWritable: false,
      isSigner: true
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web346.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/setProgramConfigSmartAccountCreationFee.ts
var beet119 = __toESM(require_beet(), 1);
import * as web347 from "@solana/web3.js";

// src/generated/types/ProgramConfigSetSmartAccountCreationFeeArgs.ts
var beet118 = __toESM(require_beet(), 1);
var programConfigSetSmartAccountCreationFeeArgsBeet = new beet118.BeetArgsStruct([["newSmartAccountCreationFee", beet118.u64]], "ProgramConfigSetSmartAccountCreationFeeArgs");

// src/generated/instructions/setProgramConfigSmartAccountCreationFee.ts
var setProgramConfigSmartAccountCreationFeeStruct = new beet119.BeetArgsStruct([
  ["instructionDiscriminator", beet119.uniformFixedSizeArray(beet119.u8, 8)],
  ["args", programConfigSetSmartAccountCreationFeeArgsBeet]
], "SetProgramConfigSmartAccountCreationFeeInstructionArgs");
var setProgramConfigSmartAccountCreationFeeInstructionDiscriminator = [
  222,
  30,
  134,
  176,
  131,
  113,
  195,
  202
];
function createSetProgramConfigSmartAccountCreationFeeInstruction(accounts, args, programId = new web347.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = setProgramConfigSmartAccountCreationFeeStruct.serialize({
    instructionDiscriminator: setProgramConfigSmartAccountCreationFeeInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.programConfig,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.authority,
      isWritable: false,
      isSigner: true
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web347.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/setProgramConfigTreasury.ts
var beet121 = __toESM(require_beet(), 1);
import * as web348 from "@solana/web3.js";

// src/generated/types/ProgramConfigSetTreasuryArgs.ts
var beetSolana37 = __toESM(require_beet_solana(), 1);
var beet120 = __toESM(require_beet(), 1);
var programConfigSetTreasuryArgsBeet = new beet120.BeetArgsStruct([["newTreasury", beetSolana37.publicKey]], "ProgramConfigSetTreasuryArgs");

// src/generated/instructions/setProgramConfigTreasury.ts
var setProgramConfigTreasuryStruct = new beet121.BeetArgsStruct([
  ["instructionDiscriminator", beet121.uniformFixedSizeArray(beet121.u8, 8)],
  ["args", programConfigSetTreasuryArgsBeet]
], "SetProgramConfigTreasuryInstructionArgs");
var setProgramConfigTreasuryInstructionDiscriminator = [
  244,
  119,
  192,
  190,
  182,
  101,
  227,
  189
];
function createSetProgramConfigTreasuryInstruction(accounts, args, programId = new web348.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = setProgramConfigTreasuryStruct.serialize({
    instructionDiscriminator: setProgramConfigTreasuryInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.programConfig,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.authority,
      isWritable: false,
      isSigner: true
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web348.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/setTimeLockAsAuthority.ts
var beet123 = __toESM(require_beet(), 1);
import * as web349 from "@solana/web3.js";

// src/generated/types/SetTimeLockArgs.ts
var beet122 = __toESM(require_beet(), 1);
var setTimeLockArgsBeet = new beet122.FixableBeetArgsStruct([
  ["timeLock", beet122.u32],
  ["memo", beet122.coption(beet122.utf8String)]
], "SetTimeLockArgs");

// src/generated/instructions/setTimeLockAsAuthority.ts
var setTimeLockAsAuthorityStruct = new beet123.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet123.uniformFixedSizeArray(beet123.u8, 8)],
  ["args", setTimeLockArgsBeet]
], "SetTimeLockAsAuthorityInstructionArgs");
var setTimeLockAsAuthorityInstructionDiscriminator = [
  2,
  234,
  93,
  93,
  40,
  92,
  31,
  234
];
function createSetTimeLockAsAuthorityInstruction(accounts, args, programId = new web349.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = setTimeLockAsAuthorityStruct.serialize({
    instructionDiscriminator: setTimeLockAsAuthorityInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.settingsAuthority,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.rentPayer ?? programId,
      isWritable: accounts.rentPayer != null,
      isSigner: accounts.rentPayer != null
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web349.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/instructions/useSpendingLimit.ts
var beet125 = __toESM(require_beet(), 1);
import * as web350 from "@solana/web3.js";

// src/generated/types/UseSpendingLimitArgs.ts
var beet124 = __toESM(require_beet(), 1);
var useSpendingLimitArgsBeet = new beet124.FixableBeetArgsStruct([
  ["amount", beet124.u64],
  ["decimals", beet124.u8],
  ["memo", beet124.coption(beet124.utf8String)]
], "UseSpendingLimitArgs");

// src/generated/instructions/useSpendingLimit.ts
var useSpendingLimitStruct = new beet125.FixableBeetArgsStruct([
  ["instructionDiscriminator", beet125.uniformFixedSizeArray(beet125.u8, 8)],
  ["args", useSpendingLimitArgsBeet]
], "UseSpendingLimitInstructionArgs");
var useSpendingLimitInstructionDiscriminator = [
  41,
  179,
  70,
  5,
  194,
  147,
  239,
  158
];
function createUseSpendingLimitInstruction(accounts, args, programId = new web350.PublicKey("SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG")) {
  const [data] = useSpendingLimitStruct.serialize({
    instructionDiscriminator: useSpendingLimitInstructionDiscriminator,
    ...args
  });
  const keys = [
    {
      pubkey: accounts.settings,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.signer,
      isWritable: false,
      isSigner: true
    },
    {
      pubkey: accounts.spendingLimit,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.smartAccount,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.destination,
      isWritable: true,
      isSigner: false
    },
    {
      pubkey: accounts.systemProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.mint ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.smartAccountTokenAccount ?? programId,
      isWritable: accounts.smartAccountTokenAccount != null,
      isSigner: false
    },
    {
      pubkey: accounts.destinationTokenAccount ?? programId,
      isWritable: accounts.destinationTokenAccount != null,
      isSigner: false
    },
    {
      pubkey: accounts.tokenProgram ?? programId,
      isWritable: false,
      isSigner: false
    },
    {
      pubkey: accounts.program,
      isWritable: false,
      isSigner: false
    }
  ];
  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc);
    }
  }
  const ix = new web350.TransactionInstruction({
    programId,
    keys,
    data
  });
  return ix;
}
// src/generated/types/ConsensusAccountType.ts
var beet126 = __toESM(require_beet(), 1);
var ConsensusAccountType;
((ConsensusAccountType2) => {
  ConsensusAccountType2[ConsensusAccountType2["Settings"] = 0] = "Settings";
  ConsensusAccountType2[ConsensusAccountType2["Policy"] = 1] = "Policy";
})(ConsensusAccountType ||= {});
var consensusAccountTypeBeet = beet126.fixedScalarEnum(ConsensusAccountType);
// src/generated/types/LogEventArgs.ts
var beet127 = __toESM(require_beet(), 1);
var logEventArgsBeet = new beet127.FixableBeetArgsStruct([
  ["accountSeeds", beet127.array(beet127.bytes)],
  ["bump", beet127.u8],
  ["event", beet127.bytes]
], "LogEventArgs");
// src/generated/types/PolicyEventType.ts
var beet128 = __toESM(require_beet(), 1);
var PolicyEventType;
((PolicyEventType2) => {
  PolicyEventType2[PolicyEventType2["Create"] = 0] = "Create";
  PolicyEventType2[PolicyEventType2["Update"] = 1] = "Update";
  PolicyEventType2[PolicyEventType2["UpdateDuringExecution"] = 2] = "UpdateDuringExecution";
  PolicyEventType2[PolicyEventType2["Remove"] = 3] = "Remove";
})(PolicyEventType ||= {});
var policyEventTypeBeet = beet128.fixedScalarEnum(PolicyEventType);
// src/generated/types/PolicyExecutionContext.ts
var beet129 = __toESM(require_beet(), 1);
var PolicyExecutionContext;
((PolicyExecutionContext2) => {
  PolicyExecutionContext2[PolicyExecutionContext2["Synchronous"] = 0] = "Synchronous";
  PolicyExecutionContext2[PolicyExecutionContext2["Asynchronous"] = 1] = "Asynchronous";
})(PolicyExecutionContext ||= {});
var policyExecutionContextBeet = beet129.fixedScalarEnum(PolicyExecutionContext);
// src/generated/types/ProposalEventType.ts
var beet130 = __toESM(require_beet(), 1);
var ProposalEventType;
((ProposalEventType2) => {
  ProposalEventType2[ProposalEventType2["Create"] = 0] = "Create";
  ProposalEventType2[ProposalEventType2["Approve"] = 1] = "Approve";
  ProposalEventType2[ProposalEventType2["Reject"] = 2] = "Reject";
  ProposalEventType2[ProposalEventType2["Cancel"] = 3] = "Cancel";
  ProposalEventType2[ProposalEventType2["Execute"] = 4] = "Execute";
  ProposalEventType2[ProposalEventType2["Close"] = 5] = "Close";
})(ProposalEventType ||= {});
var proposalEventTypeBeet = beet130.fixedScalarEnum(ProposalEventType);
// src/generated/types/SynchronousTransactionEventPayload.ts
var beet131 = __toESM(require_beet(), 1);
var isSynchronousTransactionEventPayloadTransactionPayload = (x) => x.__kind === "TransactionPayload";
var isSynchronousTransactionEventPayloadPolicyPayload = (x) => x.__kind === "PolicyPayload";
var synchronousTransactionEventPayloadBeet = beet131.dataEnum([
  [
    "TransactionPayload",
    new beet131.FixableBeetArgsStruct([
      ["accountIndex", beet131.u8],
      ["instructions", beet131.array(smartAccountCompiledInstructionBeet)]
    ], 'SynchronousTransactionEventPayloadRecord["TransactionPayload"]')
  ],
  [
    "PolicyPayload",
    new beet131.FixableBeetArgsStruct([["policyPayload", policyPayloadBeet]], 'SynchronousTransactionEventPayloadRecord["PolicyPayload"]')
  ]
]);
// src/generated/types/TransactionEventType.ts
var beet132 = __toESM(require_beet(), 1);
var TransactionEventType;
((TransactionEventType2) => {
  TransactionEventType2[TransactionEventType2["Create"] = 0] = "Create";
  TransactionEventType2[TransactionEventType2["Execute"] = 1] = "Execute";
  TransactionEventType2[TransactionEventType2["Close"] = 2] = "Close";
})(TransactionEventType ||= {});
var transactionEventTypeBeet = beet132.fixedScalarEnum(TransactionEventType);
// src/generated/types/Vote.ts
var beet133 = __toESM(require_beet(), 1);
var Vote;
((Vote2) => {
  Vote2[Vote2["Approve"] = 0] = "Approve";
  Vote2[Vote2["Reject"] = 1] = "Reject";
  Vote2[Vote2["Cancel"] = 2] = "Cancel";
})(Vote ||= {});
var voteBeet = beet133.fixedScalarEnum(Vote);
// src/generated/index.ts
var PROGRAM_ADDRESS = "SMRTzfY6DfH5ik3TKiyLFfXexV8uSG3d2UksSCYdunG";
var PROGRAM_ID = new PublicKey51(PROGRAM_ADDRESS);
// src/pda.ts
var exports_pda = {};
__export(exports_pda, {
  getTransactionPda: () => getTransactionPda,
  getTransactionBufferPda: () => getTransactionBufferPda,
  getSpendingLimitPda: () => getSpendingLimitPda,
  getSmartAccountPda: () => getSmartAccountPda,
  getSettingsPda: () => getSettingsPda,
  getProposalPda: () => getProposalPda,
  getProgramConfigPda: () => getProgramConfigPda,
  getPolicyPda: () => getPolicyPda,
  getEphemeralSignerPda: () => getEphemeralSignerPda,
  getBatchTransactionPda: () => getBatchTransactionPda,
  PDA_REGISTRY: () => PDA_REGISTRY
});

// src/core/pda/index.ts
var import_invariant = __toESM(require_browser3(), 1);
import { PublicKey as PublicKey52 } from "@solana/web3.js";
// src/spec/pda-registry.ts
var PDA_REGISTRY = {
  programConfig: {
    seeds: ["smart_account", "program_config"]
  },
  settings: {
    seeds: ["smart_account", "settings", "accountIndex:u128"]
  },
  smartAccount: {
    seeds: [
      "smart_account",
      "settingsPda:pubkey",
      "smart_account",
      "accountIndex:u8"
    ]
  },
  transaction: {
    seeds: [
      "smart_account",
      "settingsPda:pubkey",
      "transaction",
      "transactionIndex:u64"
    ]
  },
  proposal: {
    seeds: [
      "smart_account",
      "settingsPda:pubkey",
      "transaction",
      "transactionIndex:u64",
      "proposal"
    ]
  },
  batchTransaction: {
    seeds: [
      "smart_account",
      "settingsPda:pubkey",
      "transaction",
      "batchIndex:u64",
      "batch_transaction",
      "transactionIndex:u32"
    ]
  },
  ephemeralSigner: {
    seeds: [
      "smart_account",
      "transactionPda:pubkey",
      "ephemeral_signer",
      "ephemeralSignerIndex:u8"
    ]
  },
  spendingLimit: {
    seeds: [
      "smart_account",
      "settingsPda:pubkey",
      "spending_limit",
      "seed:pubkey"
    ]
  },
  transactionBuffer: {
    seeds: [
      "smart_account",
      "consensusPda:pubkey",
      "transaction_buffer",
      "creator:pubkey",
      "bufferIndex:u8"
    ]
  },
  policy: {
    seeds: ["smart_account", "policy", "settingsPda:pubkey", "policySeed:u64"]
  }
};
// src/core/codecs/primitives.ts
var import_beet = __toESM(require_beet(), 1);
init_buffer();
function toUtfBytes(str) {
  return new TextEncoder().encode(str);
}
function toU8Bytes(num) {
  const bytes21 = Buffer2.alloc(1);
  import_beet.u8.write(bytes21, 0, num);
  return bytes21;
}
function toU32Bytes(num) {
  const bytes21 = Buffer2.alloc(4);
  import_beet.u32.write(bytes21, 0, num);
  return bytes21;
}
function toU64Bytes(num) {
  const bytes21 = Buffer2.alloc(8);
  import_beet.u64.write(bytes21, 0, num);
  return bytes21;
}
function toU128Bytes(num) {
  const bytes21 = Buffer2.alloc(16);
  import_beet.u128.write(bytes21, 0, num);
  return bytes21;
}

// src/core/pda/index.ts
var STATIC_SEED_CACHE = new Map;
function getStaticSeed(value) {
  const cached = STATIC_SEED_CACHE.get(value);
  if (cached) {
    return cached;
  }
  const seed = toUtfBytes(value);
  STATIC_SEED_CACHE.set(value, seed);
  return seed;
}
function derivePda(seeds, programId) {
  return PublicKey52.findProgramAddressSync(seeds, programId);
}
function getProgramConfigPda({
  programId = PROGRAM_ID
}) {
  return derivePda(PDA_REGISTRY.programConfig.seeds.map((seed) => getStaticSeed(seed)), programId);
}
function getSettingsPda({
  accountIndex,
  programId = PROGRAM_ID
}) {
  return derivePda([getStaticSeed("smart_account"), getStaticSeed("settings"), toU128Bytes(accountIndex)], programId);
}
function getSmartAccountPda({
  settingsPda,
  accountIndex,
  programId = PROGRAM_ID
}) {
  import_invariant.default(accountIndex >= 0 && accountIndex < 256, "Invalid vault index");
  return derivePda([
    getStaticSeed("smart_account"),
    settingsPda.toBytes(),
    getStaticSeed("smart_account"),
    toU8Bytes(accountIndex)
  ], programId);
}
function getEphemeralSignerPda({
  transactionPda,
  ephemeralSignerIndex,
  programId = PROGRAM_ID
}) {
  return derivePda([
    getStaticSeed("smart_account"),
    transactionPda.toBytes(),
    getStaticSeed("ephemeral_signer"),
    toU8Bytes(ephemeralSignerIndex)
  ], programId);
}
function getTransactionPda({
  settingsPda,
  transactionIndex,
  programId = PROGRAM_ID
}) {
  return derivePda([
    getStaticSeed("smart_account"),
    settingsPda.toBytes(),
    getStaticSeed("transaction"),
    toU64Bytes(transactionIndex)
  ], programId);
}
function getProposalPda({
  settingsPda,
  transactionIndex,
  programId = PROGRAM_ID
}) {
  return derivePda([
    getStaticSeed("smart_account"),
    settingsPda.toBytes(),
    getStaticSeed("transaction"),
    toU64Bytes(transactionIndex),
    getStaticSeed("proposal")
  ], programId);
}
function getBatchTransactionPda({
  settingsPda,
  batchIndex,
  transactionIndex,
  programId = PROGRAM_ID
}) {
  return derivePda([
    getStaticSeed("smart_account"),
    settingsPda.toBytes(),
    getStaticSeed("transaction"),
    toU64Bytes(batchIndex),
    getStaticSeed("batch_transaction"),
    toU32Bytes(transactionIndex)
  ], programId);
}
function getSpendingLimitPda({
  settingsPda,
  seed,
  programId = PROGRAM_ID
}) {
  return derivePda([
    getStaticSeed("smart_account"),
    settingsPda.toBytes(),
    getStaticSeed("spending_limit"),
    seed.toBytes()
  ], programId);
}
function getTransactionBufferPda({
  consensusPda,
  creator,
  bufferIndex,
  programId = PROGRAM_ID
}) {
  return derivePda([
    getStaticSeed("smart_account"),
    consensusPda.toBytes(),
    getStaticSeed("transaction_buffer"),
    creator.toBytes(),
    toU8Bytes(bufferIndex)
  ], programId);
}
function getPolicyPda({
  settingsPda,
  policySeed,
  programId = PROGRAM_ID
}) {
  return derivePda([
    getStaticSeed("smart_account"),
    getStaticSeed("policy"),
    settingsPda.toBytes(),
    toU64Bytes(BigInt(policySeed))
  ], programId);
}
// src/codecs.ts
var exports_codecs = {};
__export(exports_codecs, {
  transactionMessageToMultisigTransactionMessageBytes: () => transactionMessageToMultisigTransactionMessageBytes,
  transactionMessageBeet: () => transactionMessageBeet,
  toUtfBytes: () => toUtfBytes2,
  toU8Bytes: () => toU8Bytes2,
  toU64Bytes: () => toU64Bytes2,
  toU32Bytes: () => toU32Bytes2,
  toU128Bytes: () => toU128Bytes2,
  toBigInt: () => toBigInt,
  smallArray: () => smallArray,
  messageAddressTableLookupBeet: () => messageAddressTableLookupBeet,
  isStaticWritableIndex: () => isStaticWritableIndex,
  isSignerIndex: () => isSignerIndex,
  isSettingsActionSetTimeLock: () => isSettingsActionSetTimeLock,
  isSettingsActionRemoveSpendingLimit: () => isSettingsActionRemoveSpendingLimit,
  isSettingsActionRemoveSigner: () => isSettingsActionRemoveSigner,
  isSettingsActionChangeThreshold: () => isSettingsActionChangeThreshold,
  isSettingsActionAddSpendingLimit: () => isSettingsActionAddSpendingLimit,
  isSettingsActionAddSigner: () => isSettingsActionAddSigner,
  isProposalStatusRejected: () => isProposalStatusRejected,
  isProposalStatusExecuted: () => isProposalStatusExecuted,
  isProposalStatusCancelled: () => isProposalStatusCancelled,
  isProposalStatusApproved: () => isProposalStatusApproved,
  isProposalStatusActive: () => isProposalStatusActive,
  instructionsToSynchronousTransactionDetailsV2WithHooks: () => instructionsToSynchronousTransactionDetailsV2WithHooks,
  instructionsToSynchronousTransactionDetailsV2: () => instructionsToSynchronousTransactionDetailsV2,
  instructionsToSynchronousTransactionDetails: () => instructionsToSynchronousTransactionDetails,
  getAvailableMemoSize: () => getAvailableMemoSize,
  fixedSizeSmallArray: () => fixedSizeSmallArray,
  compiledMsInstructionBeet: () => compiledMsInstructionBeet,
  compileToWrappedMessageV0: () => compileToWrappedMessageV0,
  compileToSynchronousMessageAndAccountsV2WithHooks: () => compileToSynchronousMessageAndAccountsV2WithHooks,
  compileToSynchronousMessageAndAccountsV2: () => compileToSynchronousMessageAndAccountsV2,
  compileToSynchronousMessageAndAccounts: () => compileToSynchronousMessageAndAccounts,
  accountsForTransactionExecute: () => accountsForTransactionExecute,
  Permissions: () => Permissions4,
  Permission: () => Permission,
  CompiledKeys: () => CompiledKeys
});

// src/types.ts
var beet134 = __toESM(require_beet(), 1);
var beetSolana38 = __toESM(require_beet_solana(), 1);
var import_invariant2 = __toESM(require_browser3(), 1);
var Permission = {
  Initiate: 1,
  Vote: 2,
  Execute: 4
};

class Permissions4 {
  mask;
  constructor(mask) {
    this.mask = mask;
  }
  static fromPermissions(permissions) {
    return new Permissions4(permissions.reduce((mask, permission) => mask | permission, 0));
  }
  static all() {
    return new Permissions4(Object.values(Permission).reduce((mask, permission) => mask | permission, 0));
  }
  static has(permissions, permission) {
    return (permissions.mask & permission) === permission;
  }
}
function fixedSizeSmallArray(lengthBeet, elements, elementsByteSize) {
  const len2 = elements.length;
  const firstElement = len2 === 0 ? "<EMPTY>" : elements[0].description;
  return {
    write: function(buf, offset, value) {
      import_invariant2.default(value.length === len2, `array length ${value.length} should match len ${len2}`);
      lengthBeet.write(buf, offset, len2);
      let cursor = offset + lengthBeet.byteSize;
      for (let i2 = 0;i2 < len2; i2++) {
        const element = elements[i2];
        element.write(buf, cursor, value[i2]);
        cursor += element.byteSize;
      }
    },
    read: function(buf, offset) {
      const size = lengthBeet.read(buf, offset);
      import_invariant2.default(size === len2, "invalid byte size");
      let cursor = offset + lengthBeet.byteSize;
      const arr = new Array(len2);
      for (let i2 = 0;i2 < len2; i2++) {
        const element = elements[i2];
        arr[i2] = element.read(buf, cursor);
        cursor += element.byteSize;
      }
      return arr;
    },
    byteSize: lengthBeet.byteSize + elementsByteSize,
    length: len2,
    description: `Array<${firstElement}>(${len2})[ ${lengthBeet.byteSize} + ${elementsByteSize} ]`
  };
}
function smallArray(lengthBeet, element) {
  return {
    toFixedFromData(buf, offset) {
      const len2 = lengthBeet.read(buf, offset);
      const cursorStart = offset + lengthBeet.byteSize;
      let cursor = cursorStart;
      const fixedElements = new Array(len2);
      for (let i2 = 0;i2 < len2; i2++) {
        const fixedElement = beet134.fixBeetFromData(element, buf, cursor);
        fixedElements[i2] = fixedElement;
        cursor += fixedElement.byteSize;
      }
      return fixedSizeSmallArray(lengthBeet, fixedElements, cursor - cursorStart);
    },
    toFixedFromValue(vals) {
      import_invariant2.default(Array.isArray(vals), `${vals} should be an array`);
      let elementsSize = 0;
      const fixedElements = new Array(vals.length);
      for (let i2 = 0;i2 < vals.length; i2++) {
        const fixedElement = beet134.fixBeetFromValue(element, vals[i2]);
        fixedElements[i2] = fixedElement;
        elementsSize += fixedElement.byteSize;
      }
      return fixedSizeSmallArray(lengthBeet, fixedElements, elementsSize);
    },
    description: `smallArray`
  };
}
var compiledMsInstructionBeet = new beet134.FixableBeetArgsStruct([
  ["programIdIndex", beet134.u8],
  ["accountIndexes", smallArray(beet134.u8, beet134.u8)],
  ["data", smallArray(beet134.u16, beet134.u8)]
], "CompiledMsInstruction");
var messageAddressTableLookupBeet = new beet134.FixableBeetArgsStruct([
  ["accountKey", beetSolana38.publicKey],
  ["writableIndexes", smallArray(beet134.u8, beet134.u8)],
  ["readonlyIndexes", smallArray(beet134.u8, beet134.u8)]
], "MessageAddressTableLookup");
var transactionMessageBeet = new beet134.FixableBeetArgsStruct([
  ["numSigners", beet134.u8],
  ["numWritableSigners", beet134.u8],
  ["numWritableNonSigners", beet134.u8],
  ["accountKeys", smallArray(beet134.u8, beetSolana38.publicKey)],
  ["instructions", smallArray(beet134.u8, compiledMsInstructionBeet)],
  [
    "addressTableLookups",
    smallArray(beet134.u8, messageAddressTableLookupBeet)
  ]
], "TransactionMessage");
// src/utils.ts
var import_beet2 = __toESM(require_beet(), 1);
init_buffer();
var import_invariant3 = __toESM(require_browser3(), 1);

// src/utils/compiled-keys.ts
init_assert();
import {
  PublicKey as PublicKey53
} from "@solana/web3.js";

class CompiledKeys {
  payer;
  keyMetaMap;
  constructor(payer, keyMetaMap) {
    this.payer = payer;
    this.keyMetaMap = keyMetaMap;
  }
  static compile(instructions2, payer) {
    const keyMetaMap = new Map;
    const getOrInsertDefault = (pubkey) => {
      const address = pubkey.toBase58();
      let keyMeta = keyMetaMap.get(address);
      if (keyMeta === undefined) {
        keyMeta = {
          isSigner: false,
          isWritable: false,
          isInvoked: false
        };
        keyMetaMap.set(address, keyMeta);
      }
      return keyMeta;
    };
    const payerKeyMeta = getOrInsertDefault(payer);
    payerKeyMeta.isSigner = true;
    payerKeyMeta.isWritable = true;
    for (const ix of instructions2) {
      getOrInsertDefault(ix.programId).isInvoked = false;
      for (const accountMeta of ix.keys) {
        const keyMeta = getOrInsertDefault(accountMeta.pubkey);
        keyMeta.isSigner ||= accountMeta.isSigner;
        keyMeta.isWritable ||= accountMeta.isWritable;
      }
    }
    return new CompiledKeys(payer, keyMetaMap);
  }
  static compileWithoutPayer(instructions2) {
    const keyMetaMap = new Map;
    const getOrInsertDefault = (pubkey) => {
      const address = pubkey.toBase58();
      let keyMeta = keyMetaMap.get(address);
      if (keyMeta === undefined) {
        keyMeta = {
          isSigner: false,
          isWritable: false,
          isInvoked: false
        };
        keyMetaMap.set(address, keyMeta);
      }
      return keyMeta;
    };
    for (const ix of instructions2) {
      getOrInsertDefault(ix.programId).isInvoked = false;
      for (const accountMeta of ix.keys) {
        const keyMeta = getOrInsertDefault(accountMeta.pubkey);
        keyMeta.isSigner ||= accountMeta.isSigner;
        keyMeta.isWritable ||= accountMeta.isWritable;
      }
    }
    return new CompiledKeys(undefined, keyMetaMap);
  }
  getMessageComponents() {
    const mapEntries = [...this.keyMetaMap.entries()];
    assert_default(mapEntries.length <= 256, "Max static account keys length exceeded");
    const writableSigners = mapEntries.filter(([, meta]) => meta.isSigner && meta.isWritable);
    const readonlySigners = mapEntries.filter(([, meta]) => meta.isSigner && !meta.isWritable);
    const writableNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && meta.isWritable);
    const readonlyNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && !meta.isWritable);
    const header = {
      numRequiredSignatures: writableSigners.length + readonlySigners.length,
      numReadonlySignedAccounts: readonlySigners.length,
      numReadonlyUnsignedAccounts: readonlyNonSigners.length
    };
    {
      assert_default(writableSigners.length > 0, "Expected at least one writable signer key");
      const [payerAddress] = writableSigners[0];
      if (this.payer) {
        assert_default(payerAddress === this.payer.toBase58(), "Expected first writable signer key to be the fee payer");
      }
    }
    const staticAccountKeys = [
      ...writableSigners.map(([address]) => new PublicKey53(address)),
      ...readonlySigners.map(([address]) => new PublicKey53(address)),
      ...writableNonSigners.map(([address]) => new PublicKey53(address)),
      ...readonlyNonSigners.map(([address]) => new PublicKey53(address))
    ];
    return [header, staticAccountKeys];
  }
  extractTableLookup(lookupTable) {
    const [writableIndexes, drainedWritableKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, (keyMeta) => !keyMeta.isSigner && !keyMeta.isInvoked && keyMeta.isWritable);
    const [readonlyIndexes, drainedReadonlyKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, (keyMeta) => !keyMeta.isSigner && !keyMeta.isInvoked && !keyMeta.isWritable);
    if (writableIndexes.length === 0 && readonlyIndexes.length === 0) {
      return;
    }
    return [
      {
        accountKey: lookupTable.key,
        writableIndexes,
        readonlyIndexes
      },
      {
        writable: drainedWritableKeys,
        readonly: drainedReadonlyKeys
      }
    ];
  }
  drainKeysFoundInLookupTable(lookupTableEntries, keyMetaFilter) {
    const lookupTableIndexes = new Array;
    const drainedKeys = new Array;
    for (const [address, keyMeta] of this.keyMetaMap.entries()) {
      if (keyMetaFilter(keyMeta)) {
        const key = new PublicKey53(address);
        const lookupTableIndex = lookupTableEntries.findIndex((entry) => entry.equals(key));
        if (lookupTableIndex >= 0) {
          assert_default(lookupTableIndex < 256, "Max lookup table index exceeded");
          lookupTableIndexes.push(lookupTableIndex);
          drainedKeys.push(key);
          this.keyMetaMap.delete(address);
        }
      }
    }
    return [lookupTableIndexes, drainedKeys];
  }
}

// src/utils/compileToSynchronousMessage.ts
function compileToSynchronousMessageAndAccounts({
  vaultPda,
  members,
  instructions: instructions2
}) {
  const compiledKeys = CompiledKeys.compileWithoutPayer(instructions2);
  const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
  const remainingAccounts = [];
  members.forEach((member) => {
    remainingAccounts.unshift({
      pubkey: member,
      isSigner: true,
      isWritable: false
    });
  });
  staticAccountKeys.forEach((key, index) => {
    remainingAccounts.push({
      pubkey: key,
      isSigner: index < header.numRequiredSignatures,
      isWritable: index < header.numRequiredSignatures - header.numReadonlySignedAccounts || index >= header.numRequiredSignatures && index < staticAccountKeys.length - header.numReadonlyUnsignedAccounts
    });
  });
  if (remainingAccounts.find((acc) => acc.pubkey.equals(vaultPda))) {
    remainingAccounts.find((acc) => acc.pubkey.equals(vaultPda)).isSigner = false;
  }
  let args_buffer = Buffer.alloc(0);
  args_buffer = Buffer.concat([Buffer.from([instructions2.length])]);
  instructions2.forEach((ix) => {
    const accounts2 = ix.keys.map((key) => {
      const index = remainingAccounts.findIndex((acc) => acc.pubkey.equals(key.pubkey));
      if (index === -1) {
        throw new Error(`Account ${key.pubkey.toBase58()} not found in remaining accounts`);
      }
      return index;
    });
    const programIdIndex = remainingAccounts.findIndex((id) => id.pubkey.equals(ix.programId));
    if (programIdIndex === -1) {
      throw new Error(`ProgramId ${ix.programId.toBase58()} not found in remaining accounts`);
    }
    const serialized_ix = serializeCompiledInstruction({
      programIdIndex,
      accountIndexes: accounts2,
      data: ix.data
    });
    args_buffer = Buffer.concat([args_buffer, serialized_ix]);
  });
  return {
    instructions: args_buffer,
    accounts: remainingAccounts
  };
}
function serializeCompiledInstruction(ix) {
  let buffer = Buffer.alloc(0);
  buffer = Buffer.concat([buffer, Buffer.from([ix.programIdIndex])]);
  buffer = Buffer.concat([
    buffer,
    Buffer.from([ix.accountIndexes.length]),
    Buffer.from(ix.accountIndexes)
  ]);
  buffer = Buffer.concat([
    buffer,
    Buffer.from(new Uint16Array([ix.data.length]).buffer),
    ix.data
  ]);
  return Uint8Array.from(buffer);
}

// src/utils/compileToWrappedMessageV0.ts
import {
  MessageAccountKeys,
  MessageV0
} from "@solana/web3.js";
function compileToWrappedMessageV0({
  payerKey,
  recentBlockhash,
  instructions: instructions2,
  addressLookupTableAccounts
}) {
  const compiledKeys = CompiledKeys.compile(instructions2, payerKey);
  const addressTableLookups = new Array;
  const accountKeysFromLookups = {
    writable: [],
    readonly: []
  };
  const lookupTableAccounts = addressLookupTableAccounts || [];
  for (const lookupTable of lookupTableAccounts) {
    const extractResult = compiledKeys.extractTableLookup(lookupTable);
    if (extractResult !== undefined) {
      const [addressTableLookup, { writable, readonly }] = extractResult;
      addressTableLookups.push(addressTableLookup);
      accountKeysFromLookups.writable.push(...writable);
      accountKeysFromLookups.readonly.push(...readonly);
    }
  }
  const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
  const accountKeys = new MessageAccountKeys(staticAccountKeys, accountKeysFromLookups);
  const compiledInstructions = accountKeys.compileInstructions(instructions2);
  return new MessageV0({
    header,
    staticAccountKeys,
    recentBlockhash,
    compiledInstructions,
    addressTableLookups
  });
}

// src/utils/compileToSynchronousMessageV2.ts
function compileToSynchronousMessageAndAccountsV2({
  vaultPda,
  members,
  instructions: instructions2
}) {
  const compiledKeys = CompiledKeys.compileWithoutPayer(instructions2);
  const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
  const remainingAccounts = [];
  staticAccountKeys.forEach((key, index) => {
    remainingAccounts.push({
      pubkey: key,
      isSigner: index < header.numRequiredSignatures,
      isWritable: index < header.numRequiredSignatures - header.numReadonlySignedAccounts || index >= header.numRequiredSignatures && index < staticAccountKeys.length - header.numReadonlyUnsignedAccounts
    });
  });
  if (remainingAccounts.find((acc) => acc.pubkey.equals(vaultPda))) {
    remainingAccounts.find((acc) => acc.pubkey.equals(vaultPda)).isSigner = false;
  }
  let args_buffer = Buffer.alloc(0);
  args_buffer = Buffer.concat([Buffer.from([instructions2.length])]);
  instructions2.forEach((ix) => {
    const accounts2 = ix.keys.map((key) => {
      const index = remainingAccounts.findIndex((acc) => acc.pubkey.equals(key.pubkey));
      if (index === -1) {
        throw new Error(`Account ${key.pubkey.toBase58()} not found in remaining accounts`);
      }
      return index;
    });
    const programIdIndex = remainingAccounts.findIndex((id) => id.pubkey.equals(ix.programId));
    if (programIdIndex === -1) {
      throw new Error(`ProgramId ${ix.programId.toBase58()} not found in remaining accounts`);
    }
    const serialized_ix = serializeCompiledInstruction2({
      programIdIndex,
      accountIndexes: accounts2,
      data: ix.data
    });
    args_buffer = Buffer.concat([args_buffer, serialized_ix]);
    members.forEach((member) => {
      remainingAccounts.unshift({
        pubkey: member,
        isSigner: true,
        isWritable: false
      });
    });
  });
  return {
    instructions: args_buffer,
    accounts: remainingAccounts
  };
}
function compileToSynchronousMessageAndAccountsV2WithHooks({
  vaultPda,
  members,
  preHookAccounts,
  postHookAccounts,
  instructions: instructions2
}) {
  const compiledKeys = CompiledKeys.compileWithoutPayer(instructions2);
  const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
  const remainingAccounts = [];
  staticAccountKeys.forEach((key, index) => {
    remainingAccounts.push({
      pubkey: key,
      isSigner: index < header.numRequiredSignatures,
      isWritable: index < header.numRequiredSignatures - header.numReadonlySignedAccounts || index >= header.numRequiredSignatures && index < staticAccountKeys.length - header.numReadonlyUnsignedAccounts
    });
  });
  if (remainingAccounts.find((acc) => acc.pubkey.equals(vaultPda))) {
    remainingAccounts.find((acc) => acc.pubkey.equals(vaultPda)).isSigner = false;
  }
  let args_buffer = Buffer.alloc(0);
  args_buffer = Buffer.concat([Buffer.from([instructions2.length])]);
  instructions2.forEach((ix) => {
    const accounts2 = ix.keys.map((key) => {
      const index = remainingAccounts.findIndex((acc) => acc.pubkey.equals(key.pubkey));
      if (index === -1) {
        throw new Error(`Account ${key.pubkey.toBase58()} not found in remaining accounts`);
      }
      return index;
    });
    const programIdIndex = remainingAccounts.findIndex((id) => id.pubkey.equals(ix.programId));
    if (programIdIndex === -1) {
      throw new Error(`ProgramId ${ix.programId.toBase58()} not found in remaining accounts`);
    }
    const serialized_ix = serializeCompiledInstruction2({
      programIdIndex,
      accountIndexes: accounts2,
      data: ix.data
    });
    args_buffer = Buffer.concat([args_buffer, serialized_ix]);
    members.forEach((member) => {
      remainingAccounts.unshift({
        pubkey: member,
        isSigner: true,
        isWritable: false
      });
    });
    remainingAccounts.splice(members.length, 0, ...preHookAccounts);
    remainingAccounts.splice(members.length + preHookAccounts.length, 0, ...postHookAccounts);
  });
  return {
    instructions: args_buffer,
    accounts: remainingAccounts
  };
}
function serializeCompiledInstruction2(ix) {
  let buffer = Buffer.alloc(0);
  buffer = Buffer.concat([buffer, Buffer.from([ix.programIdIndex])]);
  buffer = Buffer.concat([
    buffer,
    Buffer.from([ix.accountIndexes.length]),
    Buffer.from(ix.accountIndexes)
  ]);
  buffer = Buffer.concat([
    buffer,
    Buffer.from(new Uint16Array([ix.data.length]).buffer),
    ix.data
  ]);
  return Uint8Array.from(buffer);
}

// src/utils.ts
function toUtfBytes2(str) {
  return new TextEncoder().encode(str);
}
function toU8Bytes2(num) {
  const bytes21 = Buffer2.alloc(1);
  import_beet2.u8.write(bytes21, 0, num);
  return bytes21;
}
function toU32Bytes2(num) {
  const bytes21 = Buffer2.alloc(4);
  import_beet2.u32.write(bytes21, 0, num);
  return bytes21;
}
function toU64Bytes2(num) {
  const bytes21 = Buffer2.alloc(8);
  import_beet2.u64.write(bytes21, 0, num);
  return bytes21;
}
function toU128Bytes2(num) {
  const bytes21 = Buffer2.alloc(16);
  import_beet2.u128.write(bytes21, 0, num);
  return bytes21;
}
function toBigInt(number) {
  return BigInt(number.toString());
}
var MAX_TX_SIZE_BYTES = 1232;
var STRING_LEN_SIZE = 4;
function getAvailableMemoSize(txWithoutMemo) {
  const txSize = txWithoutMemo.serialize().length;
  return MAX_TX_SIZE_BYTES - txSize - STRING_LEN_SIZE - 1;
}
function isStaticWritableIndex(message, index) {
  const numAccountKeys = message.accountKeys.length;
  const { numSigners, numWritableSigners, numWritableNonSigners } = message;
  if (index >= numAccountKeys) {
    return false;
  }
  if (index < numWritableSigners) {
    return true;
  }
  if (index >= numSigners) {
    const indexIntoNonSigners = index - numSigners;
    return indexIntoNonSigners < numWritableNonSigners;
  }
  return false;
}
function isSignerIndex(message, index) {
  return index < message.numSigners;
}
function transactionMessageToMultisigTransactionMessageBytes({
  message,
  addressLookupTableAccounts,
  smartAccountPda
}) {
  const compiledMessage = compileToWrappedMessageV0({
    payerKey: message.payerKey,
    recentBlockhash: message.recentBlockhash,
    instructions: message.instructions,
    addressLookupTableAccounts
  });
  const [transactionMessageBytes] = transactionMessageBeet.serialize({
    numSigners: compiledMessage.header.numRequiredSignatures,
    numWritableSigners: compiledMessage.header.numRequiredSignatures - compiledMessage.header.numReadonlySignedAccounts,
    numWritableNonSigners: compiledMessage.staticAccountKeys.length - compiledMessage.header.numRequiredSignatures - compiledMessage.header.numReadonlyUnsignedAccounts,
    accountKeys: compiledMessage.staticAccountKeys,
    instructions: compiledMessage.compiledInstructions.map((ix) => {
      return {
        programIdIndex: ix.programIdIndex,
        accountIndexes: ix.accountKeyIndexes,
        data: Array.from(ix.data)
      };
    }),
    addressTableLookups: compiledMessage.addressTableLookups
  });
  return {
    transactionMessageBytes,
    compiledMessage
  };
}
function instructionsToSynchronousTransactionDetails({
  vaultPda,
  members,
  transaction_instructions
}) {
  const { instructions: instructions2, accounts: accounts2 } = compileToSynchronousMessageAndAccounts({
    vaultPda,
    members,
    instructions: transaction_instructions
  });
  return {
    instructions: instructions2,
    accounts: accounts2
  };
}
function instructionsToSynchronousTransactionDetailsV2({
  vaultPda,
  members,
  transaction_instructions
}) {
  const { instructions: instructions2, accounts: accounts2 } = compileToSynchronousMessageAndAccountsV2({
    vaultPda,
    members,
    instructions: transaction_instructions
  });
  return {
    instructions: instructions2,
    accounts: accounts2
  };
}
function instructionsToSynchronousTransactionDetailsV2WithHooks({
  vaultPda,
  members,
  preHookAccounts,
  postHookAccounts,
  transaction_instructions
}) {
  const { instructions: instructions2, accounts: accounts2 } = compileToSynchronousMessageAndAccountsV2WithHooks({
    vaultPda,
    members,
    preHookAccounts,
    postHookAccounts,
    instructions: transaction_instructions
  });
  return {
    instructions: instructions2,
    accounts: accounts2
  };
}
async function accountsForTransactionExecute({
  connection,
  transactionPda,
  smartAccountPda,
  message,
  ephemeralSignerBumps,
  programId
}) {
  const ephemeralSignerPdas = ephemeralSignerBumps.map((_, additionalSignerIndex) => {
    return getEphemeralSignerPda({
      transactionPda,
      ephemeralSignerIndex: additionalSignerIndex,
      programId
    })[0];
  });
  const addressLookupTableKeys = message.addressTableLookups.map(({ accountKey }) => accountKey);
  const addressLookupTableAccounts = new Map(await Promise.all(addressLookupTableKeys.map(async (key) => {
    const { value } = await connection.getAddressLookupTable(key);
    if (!value) {
      throw new Error(`Address lookup table account ${key.toBase58()} not found`);
    }
    return [key.toBase58(), value];
  })));
  const accountMetas = [];
  accountMetas.push(...addressLookupTableKeys.map((key) => {
    return { pubkey: key, isSigner: false, isWritable: false };
  }));
  for (const [accountIndex, accountKey] of message.accountKeys.entries()) {
    accountMetas.push({
      pubkey: accountKey,
      isWritable: isStaticWritableIndex(message, accountIndex),
      isSigner: isSignerIndex(message, accountIndex) && !accountKey.equals(smartAccountPda) && !ephemeralSignerPdas.find((k) => accountKey.equals(k))
    });
  }
  for (const lookup2 of message.addressTableLookups) {
    const lookupTableAccount = addressLookupTableAccounts.get(lookup2.accountKey.toBase58());
    import_invariant3.default(lookupTableAccount, `Address lookup table account ${lookup2.accountKey.toBase58()} not found`);
    for (const accountIndex of lookup2.writableIndexes) {
      const pubkey = lookupTableAccount.state.addresses[accountIndex];
      import_invariant3.default(pubkey, `Address lookup table account ${lookup2.accountKey.toBase58()} does not contain address at index ${accountIndex}`);
      accountMetas.push({
        pubkey,
        isWritable: true,
        isSigner: false
      });
    }
    for (const accountIndex of lookup2.readonlyIndexes) {
      const pubkey = lookupTableAccount.state.addresses[accountIndex];
      import_invariant3.default(pubkey, `Address lookup table account ${lookup2.accountKey.toBase58()} does not contain address at index ${accountIndex}`);
      accountMetas.push({
        pubkey,
        isWritable: false,
        isSigner: false
      });
    }
  }
  return {
    accountMetas,
    lookupTableAccounts: [...addressLookupTableAccounts.values()]
  };
}
// src/errors.ts
var exports_errors = {};
__export(exports_errors, {
  translateAndThrowAnchorError: () => translateAndThrowAnchorError,
  isErrorWithLogs: () => isErrorWithLogs,
  errorFromName: () => errorFromName,
  errorFromCode: () => errorFromCode,
  UnknownPermissionError: () => UnknownPermissionError,
  UnauthorizedError: () => UnauthorizedError,
  TransactionNotMatchingProposalError: () => TransactionNotMatchingProposalError,
  TransactionNotLastInBatchError: () => TransactionNotLastInBatchError,
  TransactionForAnotherSmartAccountError: () => TransactionForAnotherSmartAccountError,
  TransactionForAnotherPolicyError: () => TransactionForAnotherPolicyError,
  TooManySignersError: () => TooManySignersError,
  TimeLockNotZeroError: () => TimeLockNotZeroError,
  TimeLockNotReleasedError: () => TimeLockNotReleasedError,
  TimeLockExceedsMaxAllowedError: () => TimeLockExceedsMaxAllowedError,
  ThresholdNotReachedError: () => ThresholdNotReachedError,
  StaleProposalError: () => StaleProposalError,
  SpendingLimitViolatesMaxPerUseConstraintError: () => SpendingLimitViolatesMaxPerUseConstraintError,
  SpendingLimitViolatesExactQuantityConstraintError: () => SpendingLimitViolatesExactQuantityConstraintError,
  SpendingLimitPolicyInvariantDuplicateDestinationsError: () => SpendingLimitPolicyInvariantDuplicateDestinationsError,
  SpendingLimitPolicyInvariantAccumulateUnusedError: () => SpendingLimitPolicyInvariantAccumulateUnusedError,
  SpendingLimitNotActiveError: () => SpendingLimitNotActiveError,
  SpendingLimitInvariantStartTimePositiveError: () => SpendingLimitInvariantStartTimePositiveError,
  SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriodError: () => SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriodError,
  SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmountError: () => SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmountError,
  SpendingLimitInvariantOverflowEnabledMustHaveExpirationError: () => SpendingLimitInvariantOverflowEnabledMustHaveExpirationError,
  SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabledError: () => SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabledError,
  SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriodError: () => SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriodError,
  SpendingLimitInvariantMaxPerPeriodZeroError: () => SpendingLimitInvariantMaxPerPeriodZeroError,
  SpendingLimitInvariantLastResetSmallerThanStartError: () => SpendingLimitInvariantLastResetSmallerThanStartError,
  SpendingLimitInvariantLastResetOutOfBoundsError: () => SpendingLimitInvariantLastResetOutOfBoundsError,
  SpendingLimitInvariantExpirationSmallerThanStartError: () => SpendingLimitInvariantExpirationSmallerThanStartError,
  SpendingLimitInvariantExactQuantityMaxPerUseZeroError: () => SpendingLimitInvariantExactQuantityMaxPerUseZeroError,
  SpendingLimitInvariantCustomPeriodNegativeError: () => SpendingLimitInvariantCustomPeriodNegativeError,
  SpendingLimitInvalidCadenceConfigurationError: () => SpendingLimitInvalidCadenceConfigurationError,
  SpendingLimitInvalidAmountError: () => SpendingLimitInvalidAmountError,
  SpendingLimitInsufficientRemainingAmountError: () => SpendingLimitInsufficientRemainingAmountError,
  SpendingLimitExpiredError: () => SpendingLimitExpiredError,
  SpendingLimitExceededError: () => SpendingLimitExceededError,
  SmartAccountCreateDeprecatedError: () => SmartAccountCreateDeprecatedError,
  SettingsChangeRemoveSignerViolationError: () => SettingsChangeRemoveSignerViolationError,
  SettingsChangePolicyInvariantDuplicateActionsError: () => SettingsChangePolicyInvariantDuplicateActionsError,
  SettingsChangePolicyInvariantActionIndicesActionsLengthMismatchError: () => SettingsChangePolicyInvariantActionIndicesActionsLengthMismatchError,
  SettingsChangePolicyInvariantActionIndexOutOfBoundsError: () => SettingsChangePolicyInvariantActionIndexOutOfBoundsError,
  SettingsChangePolicyActionsMustBeNonZeroError: () => SettingsChangePolicyActionsMustBeNonZeroError,
  SettingsChangeInvalidSystemProgramError: () => SettingsChangeInvalidSystemProgramError,
  SettingsChangeInvalidSettingsKeyError: () => SettingsChangeInvalidSettingsKeyError,
  SettingsChangeInvalidSettingsAccountError: () => SettingsChangeInvalidSettingsAccountError,
  SettingsChangeInvalidRentPayerError: () => SettingsChangeInvalidRentPayerError,
  SettingsChangeChangeTimelockViolationError: () => SettingsChangeChangeTimelockViolationError,
  SettingsChangeAddSignerViolationError: () => SettingsChangeAddSignerViolationError,
  SettingsChangeAddSignerPermissionsViolationError: () => SettingsChangeAddSignerPermissionsViolationError,
  SettingsChangeActionMismatchError: () => SettingsChangeActionMismatchError,
  RentReclamationDisabledError: () => RentReclamationDisabledError,
  RemoveLastSignerError: () => RemoveLastSignerError,
  ProtectedInstructionError: () => ProtectedInstructionError,
  ProtectedAccountError: () => ProtectedAccountError,
  ProposalForAnotherSmartAccountError: () => ProposalForAnotherSmartAccountError,
  ProgramInteractionUnsupportedSliceOperatorError: () => ProgramInteractionUnsupportedSliceOperatorError,
  ProgramInteractionTooManySpendingLimitsError: () => ProgramInteractionTooManySpendingLimitsError,
  ProgramInteractionTooManyInstructionConstraintsError: () => ProgramInteractionTooManyInstructionConstraintsError,
  ProgramInteractionTemplateHookErrorError: () => ProgramInteractionTemplateHookErrorError,
  ProgramInteractionSyncPayloadNotAllowedWithAsyncTransactionError: () => ProgramInteractionSyncPayloadNotAllowedWithAsyncTransactionError,
  ProgramInteractionProgramIdMismatchError: () => ProgramInteractionProgramIdMismatchError,
  ProgramInteractionModifiedIllegalBalanceError: () => ProgramInteractionModifiedIllegalBalanceError,
  ProgramInteractionInvalidNumericValueError: () => ProgramInteractionInvalidNumericValueError,
  ProgramInteractionInvalidByteSequenceError: () => ProgramInteractionInvalidByteSequenceError,
  ProgramInteractionInsufficientTokenAllowanceError: () => ProgramInteractionInsufficientTokenAllowanceError,
  ProgramInteractionInsufficientLamportAllowanceError: () => ProgramInteractionInsufficientLamportAllowanceError,
  ProgramInteractionInstructionCountMismatchError: () => ProgramInteractionInstructionCountMismatchError,
  ProgramInteractionIllegalTokenAccountModificationError: () => ProgramInteractionIllegalTokenAccountModificationError,
  ProgramInteractionHookAuthorityCannotBePartOfHookAccountsError: () => ProgramInteractionHookAuthorityCannotBePartOfHookAccountsError,
  ProgramInteractionDuplicateSpendingLimitError: () => ProgramInteractionDuplicateSpendingLimitError,
  ProgramInteractionDataTooShortError: () => ProgramInteractionDataTooShortError,
  ProgramInteractionDataParsingErrorError: () => ProgramInteractionDataParsingErrorError,
  ProgramInteractionConstraintIndexOutOfBoundsError: () => ProgramInteractionConstraintIndexOutOfBoundsError,
  ProgramInteractionAsyncPayloadNotAllowedWithSyncTransactionError: () => ProgramInteractionAsyncPayloadNotAllowedWithSyncTransactionError,
  ProgramInteractionAccountConstraintViolatedError: () => ProgramInteractionAccountConstraintViolatedError,
  PolicyNotActiveYetError: () => PolicyNotActiveYetError,
  PolicyInvariantInvalidExpirationError: () => PolicyInvariantInvalidExpirationError,
  PolicyExpirationViolationTimestampExpiredError: () => PolicyExpirationViolationTimestampExpiredError,
  PolicyExpirationViolationSettingsAccountNotPresentError: () => PolicyExpirationViolationSettingsAccountNotPresentError,
  PolicyExpirationViolationPolicySettingsKeyMismatchError: () => PolicyExpirationViolationPolicySettingsKeyMismatchError,
  PolicyExpirationViolationHashExpiredError: () => PolicyExpirationViolationHashExpiredError,
  PlaceholderErrorError: () => PlaceholderErrorError,
  NotSupportedForControlledError: () => NotSupportedForControlledError,
  NotImplementedError: () => NotImplementedError,
  NotASignerError: () => NotASignerError,
  NoVotersError: () => NoVotersError,
  NoProposersError: () => NoProposersError,
  NoExecutorsError: () => NoExecutorsError,
  NoActionsError: () => NoActionsError,
  MissingSignatureError: () => MissingSignatureError,
  MissingAccountError: () => MissingAccountError,
  InvalidTransactionMessageError: () => InvalidTransactionMessageError,
  InvalidTransactionIndexError: () => InvalidTransactionIndexError,
  InvalidThresholdError: () => InvalidThresholdError,
  InvalidStaleTransactionIndexError: () => InvalidStaleTransactionIndexError,
  InvalidSignerCountError: () => InvalidSignerCountError,
  InvalidRentCollectorError: () => InvalidRentCollectorError,
  InvalidProposalStatusError: () => InvalidProposalStatusError,
  InvalidPolicyPayloadError: () => InvalidPolicyPayloadError,
  InvalidPayloadError: () => InvalidPayloadError,
  InvalidNumberOfAccountsError: () => InvalidNumberOfAccountsError,
  InvalidMintError: () => InvalidMintError,
  InvalidInstructionArgsError: () => InvalidInstructionArgsError,
  InvalidEmptyPolicyError: () => InvalidEmptyPolicyError,
  InvalidDestinationError: () => InvalidDestinationError,
  InvalidDataConstraintError: () => InvalidDataConstraintError,
  InvalidAccountError: () => InvalidAccountError,
  InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSameError: () => InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSameError,
  InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowedError: () => InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowedError,
  InternalFundTransferPolicyInvariantMintNotAllowedError: () => InternalFundTransferPolicyInvariantMintNotAllowedError,
  InternalFundTransferPolicyInvariantDuplicateMintsError: () => InternalFundTransferPolicyInvariantDuplicateMintsError,
  InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowedError: () => InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowedError,
  InternalFundTransferPolicyInvariantAmountZeroError: () => InternalFundTransferPolicyInvariantAmountZeroError,
  InsufficientVotePermissionsError: () => InsufficientVotePermissionsError,
  InsufficientAggregatePermissionsError: () => InsufficientAggregatePermissionsError,
  IllegalAccountOwnerError: () => IllegalAccountOwnerError,
  FinalBufferSizeMismatchError: () => FinalBufferSizeMismatchError,
  FinalBufferSizeExceededError: () => FinalBufferSizeExceededError,
  FinalBufferHashMismatchError: () => FinalBufferHashMismatchError,
  EmptySignersError: () => EmptySignersError,
  DuplicateSignerError: () => DuplicateSignerError,
  DecimalsMismatchError: () => DecimalsMismatchError,
  ConsensusAccountNotSettingsError: () => ConsensusAccountNotSettingsError,
  ConsensusAccountNotPolicyError: () => ConsensusAccountNotPolicyError,
  BatchNotEmptyError: () => BatchNotEmptyError,
  AlreadyRejectedError: () => AlreadyRejectedError,
  AlreadyCancelledError: () => AlreadyCancelledError,
  AlreadyApprovedError: () => AlreadyApprovedError,
  AccountNotEmptyError: () => AccountNotEmptyError
});

// src/core/errors/index.ts
var import_cusper = __toESM(require_cusper(), 1);
var cusper = import_cusper.initCusper(errorFromCode);
function translateAndThrowAnchorError(err) {
  if (!isErrorWithLogs(err)) {
    throw err;
  }
  const translatedError = cusper.errorFromProgramLogs(err.logs) ?? err;
  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(translatedError, translateAndThrowAnchorError);
  }
  translatedError.logs = err.logs;
  throw translatedError;
}
var isErrorWithLogs = (err) => {
  return Boolean(err && typeof err === "object" && "logs" in err && Array.isArray(err.logs));
};
// src/accounts.ts
var exports_accounts = {};
__export(exports_accounts, {
  transactionDiscriminator: () => transactionDiscriminator,
  transactionBufferDiscriminator: () => transactionBufferDiscriminator,
  transactionBufferBeet: () => transactionBufferBeet,
  transactionBeet: () => transactionBeet,
  spendingLimitDiscriminator: () => spendingLimitDiscriminator,
  spendingLimitBeet: () => spendingLimitBeet,
  settingsTransactionDiscriminator: () => settingsTransactionDiscriminator,
  settingsTransactionBeet: () => settingsTransactionBeet,
  settingsDiscriminator: () => settingsDiscriminator,
  settingsBeet: () => settingsBeet,
  proposalDiscriminator: () => proposalDiscriminator,
  proposalBeet: () => proposalBeet,
  programConfigDiscriminator: () => programConfigDiscriminator,
  programConfigBeet: () => programConfigBeet,
  policyDiscriminator: () => policyDiscriminator,
  policyBeet: () => policyBeet,
  legacyTransactionDiscriminator: () => legacyTransactionDiscriminator,
  legacyTransactionBeet: () => legacyTransactionBeet,
  batchTransactionDiscriminator: () => batchTransactionDiscriminator,
  batchTransactionBeet: () => batchTransactionBeet,
  batchDiscriminator: () => batchDiscriminator,
  batchBeet: () => batchBeet,
  accountProviders: () => accountProviders,
  TransactionBuffer: () => TransactionBuffer,
  Transaction: () => Transaction,
  SpendingLimit: () => SpendingLimit,
  SettingsTransaction: () => SettingsTransaction,
  Settings: () => Settings,
  Proposal: () => Proposal,
  ProgramConfig: () => ProgramConfig,
  Policy: () => Policy,
  LegacyTransaction: () => LegacyTransaction,
  BatchTransaction: () => BatchTransaction,
  Batch: () => Batch
});
// src/spec/index.ts
var exports_spec = {};
__export(exports_spec, {
  getOperationsForFeature: () => getOperationsForFeature,
  findOperationCoverageIssues: () => findOperationCoverageIssues,
  REQUIRED_INSTRUCTIONS: () => REQUIRED_INSTRUCTIONS,
  REQUIRED_ACCOUNTS: () => REQUIRED_ACCOUNTS,
  PUBLIC_FEATURE_EXPORTS: () => PUBLIC_FEATURE_EXPORTS,
  PDA_REGISTRY: () => PDA_REGISTRY,
  OPERATION_REGISTRY: () => OPERATION_REGISTRY,
  OPERATION_NAMES: () => OPERATION_NAMES,
  IGNORED_IDL_TYPES: () => IGNORED_IDL_TYPES,
  FEATURE_INSTRUCTION_COVERAGE: () => FEATURE_INSTRUCTION_COVERAGE,
  FEATURE_EXPORTS_FROM_REGISTRY: () => FEATURE_EXPORTS_FROM_REGISTRY,
  EXTRA_FEATURE_ACTIONS: () => EXTRA_FEATURE_ACTIONS
});

// src/spec/features.ts
var FEATURE_INSTRUCTION_COVERAGE = {
  programConfig: [
    "initializeProgramConfig",
    "setProgramConfigAuthority",
    "setProgramConfigSmartAccountCreationFee",
    "setProgramConfigTreasury"
  ],
  smartAccounts: [
    "createSmartAccount",
    "addSignerAsAuthority",
    "removeSignerAsAuthority",
    "setTimeLockAsAuthority",
    "changeThresholdAsAuthority",
    "setNewSettingsAuthorityAsAuthority",
    "setArchivalAuthorityAsAuthority",
    "createSettingsTransaction",
    "closeSettingsTransaction"
  ],
  proposals: [
    "createProposal",
    "activateProposal",
    "approveProposal",
    "rejectProposal",
    "cancelProposal"
  ],
  transactions: [
    "createTransaction",
    "createTransactionBuffer",
    "closeTransactionBuffer",
    "extendTransactionBuffer",
    "createTransactionFromBuffer",
    "closeTransaction",
    "logEvent"
  ],
  batches: [
    "createBatch",
    "addTransactionToBatch",
    "closeBatchTransaction",
    "closeBatch"
  ],
  policies: ["closeEmptyPolicyTransaction"],
  spendingLimits: [
    "addSpendingLimitAsAuthority",
    "removeSpendingLimitAsAuthority",
    "useSpendingLimit"
  ],
  execution: [
    "executeSettingsTransaction",
    "executeTransaction",
    "executeBatchTransaction",
    "executeTransactionSync",
    "executeTransactionSyncV2",
    "executeSettingsTransactionSync"
  ]
};
var EXTRA_FEATURE_ACTIONS = {
  policies: ["createPolicyTransaction"],
  execution: ["executePolicyTransaction", "executePolicyPayloadSync"]
};
var PUBLIC_FEATURE_EXPORTS = [
  "programConfig",
  "smartAccounts",
  "proposals",
  "transactions",
  "batches",
  "policies",
  "spendingLimits",
  "execution"
];
// src/spec/idl.ts
var REQUIRED_INSTRUCTIONS = [
  "initializeProgramConfig",
  "setProgramConfigAuthority",
  "setProgramConfigSmartAccountCreationFee",
  "setProgramConfigTreasury",
  "createSmartAccount",
  "addSignerAsAuthority",
  "removeSignerAsAuthority",
  "setTimeLockAsAuthority",
  "changeThresholdAsAuthority",
  "setNewSettingsAuthorityAsAuthority",
  "setArchivalAuthorityAsAuthority",
  "addSpendingLimitAsAuthority",
  "removeSpendingLimitAsAuthority",
  "createSettingsTransaction",
  "executeSettingsTransaction",
  "createTransaction",
  "createTransactionBuffer",
  "closeTransactionBuffer",
  "extendTransactionBuffer",
  "createTransactionFromBuffer",
  "executeTransaction",
  "createBatch",
  "addTransactionToBatch",
  "executeBatchTransaction",
  "createProposal",
  "activateProposal",
  "approveProposal",
  "rejectProposal",
  "cancelProposal",
  "useSpendingLimit",
  "closeSettingsTransaction",
  "closeTransaction",
  "closeEmptyPolicyTransaction",
  "closeBatchTransaction",
  "closeBatch",
  "executeTransactionSync",
  "executeTransactionSyncV2",
  "executeSettingsTransactionSync",
  "logEvent"
];
var REQUIRED_ACCOUNTS = [
  "Batch",
  "BatchTransaction",
  "LegacyTransaction",
  "Policy",
  "ProgramConfig",
  "Proposal",
  "Settings",
  "SettingsTransaction",
  "SpendingLimit",
  "Transaction",
  "TransactionBuffer"
];
var IGNORED_IDL_TYPES = [
  "Permission",
  "TransactionMessage",
  "CompiledInstruction",
  "MessageAddressTableLookup",
  "CreateSmartAccountEvent",
  "SynchronousTransactionEvent",
  "SynchronousSettingsTransactionEvent",
  "AddSpendingLimitEvent",
  "RemoveSpendingLimitEvent",
  "UseSpendingLimitEvent",
  "TransactionEvent",
  "ProposalEvent",
  "SettingsChangePolicyEvent",
  "SmartAccountEvent",
  "ConsensusAccount",
  "SynchronousTransactionEventV2",
  "AuthoritySettingsEvent",
  "AuthorityChangeEvent",
  "TransactionContent"
];
// src/spec/operation-registry.ts
var featureInstructionCoverage = FEATURE_INSTRUCTION_COVERAGE;
var extraFeatureActions = EXTRA_FEATURE_ACTIONS;
var OPERATION_REGISTRY = {
  initializeProgramConfig: {
    feature: "programConfig",
    instruction: "initializeProgramConfig",
    exportName: "initialize",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "initializer"]
  },
  setProgramConfigAuthority: {
    feature: "programConfig",
    instruction: "setProgramConfigAuthority",
    exportName: "setAuthority",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "authority"]
  },
  setProgramConfigSmartAccountCreationFee: {
    feature: "programConfig",
    instruction: "setProgramConfigSmartAccountCreationFee",
    exportName: "setSmartAccountCreationFee",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "authority"]
  },
  setProgramConfigTreasury: {
    feature: "programConfig",
    instruction: "setProgramConfigTreasury",
    exportName: "setTreasury",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "authority"]
  },
  createSmartAccount: {
    feature: "smartAccounts",
    instruction: "createSmartAccount",
    exportName: "create",
    phase: "offline",
    payerRole: "creator",
    signerRoles: ["creator"]
  },
  addSignerAsAuthority: {
    feature: "smartAccounts",
    instruction: "addSignerAsAuthority",
    exportName: "addSigner",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "rentPayer"]
  },
  removeSignerAsAuthority: {
    feature: "smartAccounts",
    instruction: "removeSignerAsAuthority",
    exportName: "removeSigner",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  setTimeLockAsAuthority: {
    feature: "smartAccounts",
    instruction: "setTimeLockAsAuthority",
    exportName: "setTimeLock",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  changeThresholdAsAuthority: {
    feature: "smartAccounts",
    instruction: "changeThresholdAsAuthority",
    exportName: "changeThreshold",
    phase: "offline",
    payerRole: "settingsAuthority",
    signerRoles: ["settingsAuthority", "rentPayer"]
  },
  setNewSettingsAuthorityAsAuthority: {
    feature: "smartAccounts",
    instruction: "setNewSettingsAuthorityAsAuthority",
    exportName: "setNewSettingsAuthority",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  setArchivalAuthorityAsAuthority: {
    feature: "smartAccounts",
    instruction: "setArchivalAuthorityAsAuthority",
    exportName: "setArchivalAuthority",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  createSettingsTransaction: {
    feature: "smartAccounts",
    instruction: "createSettingsTransaction",
    exportName: "createSettingsTransaction",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  closeSettingsTransaction: {
    feature: "smartAccounts",
    instruction: "closeSettingsTransaction",
    exportName: "closeSettingsTransaction",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  createProposal: {
    feature: "proposals",
    instruction: "createProposal",
    exportName: "create",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "creator", "rentPayer"],
    defaultsRentPayerToActor: true
  },
  activateProposal: {
    feature: "proposals",
    instruction: "activateProposal",
    exportName: "activate",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signer"]
  },
  approveProposal: {
    feature: "proposals",
    instruction: "approveProposal",
    exportName: "approve",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signer"]
  },
  rejectProposal: {
    feature: "proposals",
    instruction: "rejectProposal",
    exportName: "reject",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signer"]
  },
  cancelProposal: {
    feature: "proposals",
    instruction: "cancelProposal",
    exportName: "cancel",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signer"]
  },
  createTransaction: {
    feature: "transactions",
    instruction: "createTransaction",
    exportName: "create",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  createTransactionBuffer: {
    feature: "transactions",
    instruction: "createTransactionBuffer",
    exportName: "createBuffer",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "creator", "rentPayer"],
    defaultsRentPayerToActor: true
  },
  closeTransactionBuffer: {
    feature: "transactions",
    instruction: "closeTransactionBuffer",
    exportName: "closeBuffer",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "creator"]
  },
  extendTransactionBuffer: {
    feature: "transactions",
    instruction: "extendTransactionBuffer",
    exportName: "extendBuffer",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "creator"]
  },
  createTransactionFromBuffer: {
    feature: "transactions",
    instruction: "createTransactionFromBuffer",
    exportName: "createFromBuffer",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "creator", "rentPayer"],
    defaultsRentPayerToActor: true
  },
  closeTransaction: {
    feature: "transactions",
    instruction: "closeTransaction",
    exportName: "close",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  logEvent: {
    feature: "transactions",
    instruction: "logEvent",
    exportName: "logEvent",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "logAuthority"]
  },
  createBatch: {
    feature: "batches",
    instruction: "createBatch",
    exportName: "create",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "creator", "rentPayer"],
    defaultsRentPayerToActor: true
  },
  addTransactionToBatch: {
    feature: "batches",
    instruction: "addTransactionToBatch",
    exportName: "addTransaction",
    phase: "online",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signer", "rentPayer"],
    defaultsRentPayerToActor: true,
    requiresLookupTables: true
  },
  closeBatchTransaction: {
    feature: "batches",
    instruction: "closeBatchTransaction",
    exportName: "closeTransaction",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  closeBatch: {
    feature: "batches",
    instruction: "closeBatch",
    exportName: "close",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  createPolicyTransaction: {
    feature: "policies",
    instruction: "createPolicyTransaction",
    exportName: "createTransaction",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  closeEmptyPolicyTransaction: {
    feature: "policies",
    instruction: "closeEmptyPolicyTransaction",
    exportName: "closeEmptyTransaction",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  addSpendingLimitAsAuthority: {
    feature: "spendingLimits",
    instruction: "addSpendingLimitAsAuthority",
    exportName: "add",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "settingsAuthority", "rentPayer"]
  },
  removeSpendingLimitAsAuthority: {
    feature: "spendingLimits",
    instruction: "removeSpendingLimitAsAuthority",
    exportName: "remove",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  useSpendingLimit: {
    feature: "spendingLimits",
    instruction: "useSpendingLimit",
    exportName: "use",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signer"]
  },
  executeSettingsTransaction: {
    feature: "execution",
    instruction: "executeSettingsTransaction",
    exportName: "executeSettingsTransaction",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signer", "rentPayer"],
    requiresConfirmation: true
  },
  executeTransaction: {
    feature: "execution",
    instruction: "executeTransaction",
    exportName: "executeTransaction",
    phase: "online",
    payerRole: "feePayer",
    signerRoles: ["feePayer"],
    requiresLookupTables: true,
    requiresConfirmation: true
  },
  executeBatchTransaction: {
    feature: "execution",
    instruction: "executeBatchTransaction",
    exportName: "executeBatchTransaction",
    phase: "online",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signer"],
    requiresLookupTables: true,
    requiresConfirmation: true
  },
  executeTransactionSync: {
    feature: "execution",
    instruction: "executeTransactionSync",
    exportName: "executeTransactionSync",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signers"]
  },
  executeTransactionSyncV2: {
    feature: "execution",
    instruction: "executeTransactionSyncV2",
    exportName: "executeTransactionSyncV2",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  executeSettingsTransactionSync: {
    feature: "execution",
    instruction: "executeSettingsTransactionSync",
    exportName: "executeSettingsTransactionSync",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer", "signers"]
  },
  executePolicyTransaction: {
    feature: "execution",
    instruction: "executePolicyTransaction",
    exportName: "executePolicyTransaction",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  },
  executePolicyPayloadSync: {
    feature: "execution",
    instruction: "executePolicyPayloadSync",
    exportName: "executePolicyPayloadSync",
    phase: "offline",
    payerRole: "feePayer",
    signerRoles: ["feePayer"]
  }
};
var OPERATION_NAMES = Object.keys(OPERATION_REGISTRY);
var FEATURE_EXPORTS_FROM_REGISTRY = Object.fromEntries(Object.entries(OPERATION_REGISTRY).map(([operation, metadata]) => [
  operation,
  metadata.exportName
]));
function getOperationsForFeature(feature) {
  return OPERATION_NAMES.filter((operation) => OPERATION_REGISTRY[operation].feature === feature);
}
function findOperationCoverageIssues() {
  const missingMappings = [
    ...Object.values(featureInstructionCoverage).flat(),
    ...Object.values(extraFeatureActions).flat()
  ].filter((instruction) => !OPERATION_NAMES.includes(instruction));
  const duplicateExports = Object.values(OPERATION_REGISTRY).reduce((accumulator, metadata) => {
    const key = `${metadata.feature}:${metadata.exportName}`;
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
  return {
    missingMappings,
    duplicateExports: Object.entries(duplicateExports).filter(([, count]) => count > 1).map(([key]) => key)
  };
}
// src/core/transport/index.ts
import {
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
function createTransport(config) {
  return {
    connection: config.connection,
    programId: config.programId ?? PROGRAM_ID,
    defaultCommitment: config.defaultCommitment,
    sendPrepared: config.sendPrepared,
    confirm: config.confirm
  };
}
function freezePreparedOperation(operation) {
  return Object.freeze({
    ...operation,
    instructions: Object.freeze([...operation.instructions]),
    lookupTableAccounts: Object.freeze([...operation.lookupTableAccounts])
  });
}
function compilePreparedOperation(args) {
  const message = new TransactionMessage({
    payerKey: args.prepared.payer,
    recentBlockhash: args.blockhash,
    instructions: [...args.prepared.instructions]
  }).compileToV0Message([...args.prepared.lookupTableAccounts]);
  return new VersionedTransaction(message);
}
async function sendPreparedOperation(args) {
  const { transport, prepared, signers, sendOptions } = args;
  const latestBlockhash = await transport.connection.getLatestBlockhash(transport.defaultCommitment);
  try {
    const compileUnsignedTransaction = () => compilePreparedOperation({
      prepared,
      blockhash: latestBlockhash.blockhash
    });
    const signature = transport.sendPrepared ? await transport.sendPrepared(prepared, signers, {
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      commitment: transport.defaultCommitment,
      sendOptions,
      compileUnsignedTransaction
    }) : await (async () => {
      const transaction = compileUnsignedTransaction();
      transaction.sign(signers);
      return transport.connection.sendTransaction(transaction, sendOptions);
    })();
    if (transport.confirm) {
      await transport.confirm(signature, {
        prepared,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        commitment: transport.defaultCommitment
      });
    }
    return signature;
  } catch (error) {
    translateAndThrowAnchorError(error);
    throw error;
  }
}
export {
  translateAndThrowAnchorError,
  transactionMessageToMultisigTransactionMessageBytes,
  transactionMessageBeet,
  transactionDiscriminator,
  transactionBufferDiscriminator,
  transactionBufferBeet,
  transactionBeet,
  toUtfBytes2 as toUtfBytes,
  toU8Bytes2 as toU8Bytes,
  toU64Bytes2 as toU64Bytes,
  toU32Bytes2 as toU32Bytes,
  toU128Bytes2 as toU128Bytes,
  toBigInt,
  spendingLimitDiscriminator,
  spendingLimitBeet,
  exports_spec as spec,
  smallArray,
  settingsTransactionDiscriminator,
  settingsTransactionBeet,
  settingsDiscriminator,
  settingsBeet,
  sendPreparedOperation,
  proposalDiscriminator,
  proposalBeet,
  programConfigDiscriminator,
  programConfigBeet,
  policyDiscriminator,
  policyBeet,
  exports_pda as pda,
  messageAddressTableLookupBeet,
  legacyTransactionDiscriminator,
  legacyTransactionBeet,
  isStaticWritableIndex,
  isSignerIndex,
  isSettingsActionSetTimeLock,
  isSettingsActionRemoveSpendingLimit,
  isSettingsActionRemoveSigner,
  isSettingsActionChangeThreshold,
  isSettingsActionAddSpendingLimit,
  isSettingsActionAddSigner,
  isProposalStatusRejected,
  isProposalStatusExecuted,
  isProposalStatusCancelled,
  isProposalStatusApproved,
  isProposalStatusActive,
  isErrorWithLogs,
  instructionsToSynchronousTransactionDetailsV2WithHooks,
  instructionsToSynchronousTransactionDetailsV2,
  instructionsToSynchronousTransactionDetails,
  getTransactionPda,
  getTransactionBufferPda,
  getSpendingLimitPda,
  getSmartAccountPda,
  getSettingsPda,
  getProposalPda,
  getProgramConfigPda,
  getPolicyPda,
  getOperationsForFeature,
  getEphemeralSignerPda,
  getBatchTransactionPda,
  getAvailableMemoSize,
  exports_generated as generated,
  freezePreparedOperation,
  fixedSizeSmallArray,
  findOperationCoverageIssues,
  exports_errors as errors,
  errorFromName,
  errorFromCode,
  createTransport,
  compiledMsInstructionBeet,
  compilePreparedOperation,
  exports_codecs as codecs,
  batchTransactionDiscriminator,
  batchTransactionBeet,
  batchDiscriminator,
  batchBeet,
  accountsForTransactionExecute,
  exports_accounts as accounts,
  accountProviders,
  UnknownPermissionError,
  UnauthorizedError,
  TransactionNotMatchingProposalError,
  TransactionNotLastInBatchError,
  TransactionForAnotherSmartAccountError,
  TransactionForAnotherPolicyError,
  TransactionBuffer,
  Transaction,
  TooManySignersError,
  TimeLockNotZeroError,
  TimeLockNotReleasedError,
  TimeLockExceedsMaxAllowedError,
  ThresholdNotReachedError,
  StaleProposalError,
  SpendingLimitViolatesMaxPerUseConstraintError,
  SpendingLimitViolatesExactQuantityConstraintError,
  SpendingLimitPolicyInvariantDuplicateDestinationsError,
  SpendingLimitPolicyInvariantAccumulateUnusedError,
  SpendingLimitNotActiveError,
  SpendingLimitInvariantStartTimePositiveError,
  SpendingLimitInvariantRemainingAmountGreaterThanMaxPerPeriodError,
  SpendingLimitInvariantOverflowRemainingAmountGreaterThanMaxAmountError,
  SpendingLimitInvariantOverflowEnabledMustHaveExpirationError,
  SpendingLimitInvariantOneTimePeriodCannotHaveOverflowEnabledError,
  SpendingLimitInvariantMaxPerUseGreaterThanMaxPerPeriodError,
  SpendingLimitInvariantMaxPerPeriodZeroError,
  SpendingLimitInvariantLastResetSmallerThanStartError,
  SpendingLimitInvariantLastResetOutOfBoundsError,
  SpendingLimitInvariantExpirationSmallerThanStartError,
  SpendingLimitInvariantExactQuantityMaxPerUseZeroError,
  SpendingLimitInvariantCustomPeriodNegativeError,
  SpendingLimitInvalidCadenceConfigurationError,
  SpendingLimitInvalidAmountError,
  SpendingLimitInsufficientRemainingAmountError,
  SpendingLimitExpiredError,
  SpendingLimitExceededError,
  SpendingLimit,
  SmartAccountCreateDeprecatedError,
  SettingsTransaction,
  SettingsChangeRemoveSignerViolationError,
  SettingsChangePolicyInvariantDuplicateActionsError,
  SettingsChangePolicyInvariantActionIndicesActionsLengthMismatchError,
  SettingsChangePolicyInvariantActionIndexOutOfBoundsError,
  SettingsChangePolicyActionsMustBeNonZeroError,
  SettingsChangeInvalidSystemProgramError,
  SettingsChangeInvalidSettingsKeyError,
  SettingsChangeInvalidSettingsAccountError,
  SettingsChangeInvalidRentPayerError,
  SettingsChangeChangeTimelockViolationError,
  SettingsChangeAddSignerViolationError,
  SettingsChangeAddSignerPermissionsViolationError,
  SettingsChangeActionMismatchError,
  Settings,
  RentReclamationDisabledError,
  RemoveLastSignerError,
  REQUIRED_INSTRUCTIONS,
  REQUIRED_ACCOUNTS,
  ProtectedInstructionError,
  ProtectedAccountError,
  ProposalForAnotherSmartAccountError,
  Proposal,
  ProgramInteractionUnsupportedSliceOperatorError,
  ProgramInteractionTooManySpendingLimitsError,
  ProgramInteractionTooManyInstructionConstraintsError,
  ProgramInteractionTemplateHookErrorError,
  ProgramInteractionSyncPayloadNotAllowedWithAsyncTransactionError,
  ProgramInteractionProgramIdMismatchError,
  ProgramInteractionModifiedIllegalBalanceError,
  ProgramInteractionInvalidNumericValueError,
  ProgramInteractionInvalidByteSequenceError,
  ProgramInteractionInsufficientTokenAllowanceError,
  ProgramInteractionInsufficientLamportAllowanceError,
  ProgramInteractionInstructionCountMismatchError,
  ProgramInteractionIllegalTokenAccountModificationError,
  ProgramInteractionHookAuthorityCannotBePartOfHookAccountsError,
  ProgramInteractionDuplicateSpendingLimitError,
  ProgramInteractionDataTooShortError,
  ProgramInteractionDataParsingErrorError,
  ProgramInteractionConstraintIndexOutOfBoundsError,
  ProgramInteractionAsyncPayloadNotAllowedWithSyncTransactionError,
  ProgramInteractionAccountConstraintViolatedError,
  ProgramConfig,
  PolicyNotActiveYetError,
  PolicyInvariantInvalidExpirationError,
  PolicyExpirationViolationTimestampExpiredError,
  PolicyExpirationViolationSettingsAccountNotPresentError,
  PolicyExpirationViolationPolicySettingsKeyMismatchError,
  PolicyExpirationViolationHashExpiredError,
  Policy,
  PlaceholderErrorError,
  Permissions4 as Permissions,
  Permission,
  PUBLIC_FEATURE_EXPORTS,
  PROGRAM_ID,
  PROGRAM_ADDRESS,
  PDA_REGISTRY,
  OPERATION_REGISTRY,
  OPERATION_NAMES,
  NotSupportedForControlledError,
  NotImplementedError,
  NotASignerError,
  NoVotersError,
  NoProposersError,
  NoExecutorsError,
  NoActionsError,
  MissingSignatureError,
  MissingAccountError,
  LegacyTransaction,
  InvalidTransactionMessageError,
  InvalidTransactionIndexError,
  InvalidThresholdError,
  InvalidStaleTransactionIndexError,
  InvalidSignerCountError,
  InvalidRentCollectorError,
  InvalidProposalStatusError,
  InvalidPolicyPayloadError,
  InvalidPayloadError,
  InvalidNumberOfAccountsError,
  InvalidMintError,
  InvalidInstructionArgsError,
  InvalidEmptyPolicyError,
  InvalidDestinationError,
  InvalidDataConstraintError,
  InvalidAccountError,
  InternalFundTransferPolicyInvariantSourceAndDestinationCannotBeTheSameError,
  InternalFundTransferPolicyInvariantSourceAccountIndexNotAllowedError,
  InternalFundTransferPolicyInvariantMintNotAllowedError,
  InternalFundTransferPolicyInvariantDuplicateMintsError,
  InternalFundTransferPolicyInvariantDestinationAccountIndexNotAllowedError,
  InternalFundTransferPolicyInvariantAmountZeroError,
  InsufficientVotePermissionsError,
  InsufficientAggregatePermissionsError,
  IllegalAccountOwnerError,
  IGNORED_IDL_TYPES,
  FinalBufferSizeMismatchError,
  FinalBufferSizeExceededError,
  FinalBufferHashMismatchError,
  FEATURE_INSTRUCTION_COVERAGE,
  FEATURE_EXPORTS_FROM_REGISTRY,
  EmptySignersError,
  EXTRA_FEATURE_ACTIONS,
  DuplicateSignerError,
  DecimalsMismatchError,
  ConsensusAccountNotSettingsError,
  ConsensusAccountNotPolicyError,
  BatchTransaction,
  BatchNotEmptyError,
  Batch,
  AlreadyRejectedError,
  AlreadyCancelledError,
  AlreadyApprovedError,
  AccountNotEmptyError
};
