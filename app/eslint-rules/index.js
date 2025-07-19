/**
 * カスタムESLintルール集
 */

const noDirectKvAccess = require("./no-direct-kv-access");

module.exports = {
  rules: {
    "no-direct-kv-access": noDirectKvAccess,
  },
};

// ES Module export for compatibility
module.exports.default = module.exports;
