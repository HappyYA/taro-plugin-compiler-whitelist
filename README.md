# taro-plugin-compiler-whitelist

> Taro 插件：根据配置项过滤 app.config 文件中的页面

## 功能特性

- ✅ 支持白名单模式：只保留匹配的页面
- ✅ 支持黑名单模式：排除匹配的页面
- ✅ 支持按分包和页面组合过滤：可以精确控制每个分包保留哪些页面
- ✅ 支持整个分包过滤：空数组或省略页面数组表示整个分包的所有页面
- ✅ 自动过滤主包和子包（subPackages）中的页面
- ✅ 支持过滤日志输出，方便调试

## 安装

```bash
npm i taro-plugin-compiler-whitelist -D
# 或
pnpm add taro-plugin-compiler-whitelist -D
# 或
yarn add taro-plugin-compiler-whitelist -D
```

## 使用方法

在 Taro 项目配置文件 `/config/index.js` 中引入插件：

### 配置格式说明

配置项为二维数组格式：`[分包名称, 页面数组?]`
- **第一个值**：分包名称，主包为 `"app"`，其他为 `subPackage.root`
- **第二个值**：页面数组（可选）
  - 空数组 `[]` 或省略：表示整个分包的所有页面
  - 有值：只保留指定的页面（支持前缀匹配）

### 基础用法 - 白名单模式

只保留主包的特定页面：

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        whitelist: [
          ['app', ['pages/index/index', 'pages/user/index']], // 主包的特定页面
        ],
        verbose: true,
      },
    ],
  ],
}
```

只保留整个主包：

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        whitelist: [
          ['app'], // 或 ['app', []]，表示主包的所有页面
        ],
        verbose: true,
      },
    ],
  ],
}
```

只保留特定分包的特定页面：

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        whitelist: [
          ['app', ['pages/index/index']], // 主包的特定页面
          ['packageA', ['pages/product/index']], // packageA 分包的特定页面
          ['packageB'], // packageB 分包的所有页面
        ],
        verbose: true,
      },
    ],
  ],
}
```

### 黑名单模式

排除主包的特定页面：

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        blacklist: [
          ['app', ['pages/debug/index', 'pages/test/index']], // 排除主包的特定页面
        ],
        verbose: true,
      },
    ],
  ],
}
```

排除整个分包：

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        blacklist: [
          ['packageTest'], // 或 ['packageTest', []]，排除整个测试分包
        ],
        verbose: true,
      },
    ],
  ],
}
```

### 同时使用白名单和黑名单

先应用白名单，再应用黑名单：

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        whitelist: [
          ['app'], // 先保留主包的所有页面
          ['packageA'], // 先保留 packageA 的所有页面
        ],
        blacklist: [
          ['app', ['pages/debug/index']], // 再从主包中排除 debug 页面
        ],
        verbose: true,
      },
    ],
  ],
}
```

## 配置选项

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `whitelist` | `[string, string[]?][]` | 否 | 白名单：只保留匹配的页面。格式：`[[分包名称, 页面数组?], ...]` |
| `blacklist` | `[string, string[]?][]` | 否 | 黑名单：排除匹配的页面。格式：`[[分包名称, 页面数组?], ...]` |
| `verbose` | `boolean` | 否 | 是否显示过滤日志，默认 `true` |

## 配置规则说明

### 配置格式

```typescript
type FilterRule = [string, string[]?] | [string];
```

- **第一个值（必填）**：分包名称
  - 主包：使用 `"app"`
  - 分包：使用 `subPackage.root` 的值
- **第二个值（可选）**：页面数组
  - 省略或空数组 `[]`：表示整个分包的所有页面
  - 有值：只保留指定的页面（支持前缀匹配）

### 页面匹配规则

- **精确匹配**：`'pages/index/index'` 只匹配该页面
- **前缀匹配**：`'pages/index'` 会匹配所有以 `pages/index` 开头的页面，如：
  - `pages/index/index`
  - `pages/index/detail`
  - `pages/index/list`

## 注意事项

1. **白名单行为**：如果配置了白名单，只有白名单中的分包/页面会被保留，其他都会被过滤
2. **黑名单行为**：如果只配置了黑名单（没有白名单），黑名单中的分包/页面会被排除，其他都保留
3. **组合使用**：如果同时配置了白名单和黑名单，会先应用白名单，再应用黑名单
4. **空分包处理**：如果子包（subPackages）中的所有页面都被过滤，该子包也会被移除
5. **日志输出**：建议在开发环境使用 `verbose: true` 查看过滤结果，生产环境可设置为 `false`

## 示例场景

### 场景 1：开发环境只编译主包的特定页面

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        whitelist: [
          ['app', ['pages/index/index', 'pages/user/index']],
        ],
        verbose: true,
      },
    ],
  ],
}
```

### 场景 2：排除主包的测试和调试页面

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        blacklist: [
          ['app', ['pages/test/index', 'pages/debug/index']],
        ],
        verbose: true,
      },
    ],
  ],
}
```

### 场景 3：多环境配置

```js
const isDev = process.env.NODE_ENV === 'development'

const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        // 开发环境只编译主包的首页，生产环境编译所有页面
        whitelist: isDev ? [['app', ['pages/index/index']]] : undefined,
        verbose: true,
      },
    ],
  ],
}
```

### 场景 4：只保留特定分包的所有页面

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        whitelist: [
          ['packageA'], // packageA 的所有页面
          ['packageB'], // packageB 的所有页面
        ],
        verbose: true,
      },
    ],
  ],
}
```

### 场景 5：排除测试分包，但保留其他分包

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        blacklist: [
          ['packageTest'], // 排除整个测试分包
          ['packageDebug'], // 排除整个调试分包
        ],
        verbose: true,
      },
    ],
  ],
}
```

### 场景 6：复杂组合场景

```js
const config = {
  plugins: [
    [
      'taro-plugin-compiler-whitelist',
      {
        whitelist: [
          ['app', ['pages/index/index']], // 主包只保留首页
          ['packageA', ['pages/product/index']], // packageA 只保留产品页
          ['packageB'], // packageB 保留所有页面
        ],
        blacklist: [
          ['packageB', ['pages/test/index']], // 从 packageB 中排除测试页
        ],
        verbose: true,
      },
    ],
  ],
}
```
