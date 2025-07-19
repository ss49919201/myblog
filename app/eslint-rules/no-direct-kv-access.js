/**
 * ESLint カスタムルール: no-direct-kv-access
 * KVデータ操作は必ず ./src/query を経由する必要がある
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "KVデータ操作は必ず ./src/query を経由する必要があります",
      category: "Best Practices",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noDirectKvAccess: "KVデータへの直接アクセスは禁止されています。./src/query のモジュールを使用してください。",
      noCloudflareContextAccess: "getCloudflareContext()の直接使用は禁止されています。./src/query のモジュールを使用してください。",
    },
  },

  create(context) {
    const filename = context.getFilename();
    const isQueryModule = filename.includes('/src/query/') || filename.includes('\\src\\query\\');
    
    // src/query 内のファイルは除外
    if (isQueryModule) {
      return {};
    }

    return {
      // getCloudflareContext() の直接呼び出しを検知
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'getCloudflareContext'
        ) {
          context.report({
            node,
            messageId: 'noCloudflareContextAccess',
          });
        }
      },

      // KV_POST などの env アクセスを検知
      MemberExpression(node) {
        // env.KV_POST のようなアクセスパターンを検知
        if (
          node.object &&
          node.object.type === 'MemberExpression' &&
          node.object.property &&
          node.object.property.name === 'env' &&
          node.property &&
          node.property.name &&
          node.property.name.startsWith('KV_')
        ) {
          context.report({
            node,
            messageId: 'noDirectKvAccess',
          });
        }

        // context.env.KV_POST のようなアクセスパターンを検知
        if (
          node.object &&
          node.object.type === 'MemberExpression' &&
          node.object.object &&
          node.object.object.name === 'context' &&
          node.object.property &&
          node.object.property.name === 'env' &&
          node.property &&
          node.property.name &&
          node.property.name.startsWith('KV_')
        ) {
          context.report({
            node,
            messageId: 'noDirectKvAccess',
          });
        }
      },

      // import/require でCloudflareContextを直接インポートすることを検知
      ImportDeclaration(node) {
        if (
          node.source.value === '@opennextjs/cloudflare' &&
          node.specifiers.some(spec => 
            spec.imported && spec.imported.name === 'getCloudflareContext'
          )
        ) {
          context.report({
            node,
            messageId: 'noCloudflareContextAccess',
          });
        }
      },

      // require('...').getCloudflareContext の検知
      VariableDeclarator(node) {
        if (
          node.init &&
          node.init.type === 'MemberExpression' &&
          node.init.object &&
          node.init.object.type === 'CallExpression' &&
          node.init.object.callee &&
          node.init.object.callee.name === 'require' &&
          node.init.object.arguments &&
          node.init.object.arguments[0] &&
          node.init.object.arguments[0].value === '@opennextjs/cloudflare' &&
          node.init.property &&
          node.init.property.name === 'getCloudflareContext'
        ) {
          context.report({
            node,
            messageId: 'noCloudflareContextAccess',
          });
        }
      },
    };
  },
};