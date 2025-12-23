import type { IPluginContext } from "@tarojs/service";
/**
 * 过滤规则项
 * [分包名称, 页面数组?]
 * - 第一个值：分包名称，主包为 "app"
 * - 第二个值：页面数组，空数组或省略表示整个分包的所有页面
 */
export type FilterRule = [string, string[]?] | [string];
/**
 * 插件配置选项
 */
export interface PluginOptions {
    /**
     * 白名单模式：只保留匹配的页面
     * 格式：[[分包名称, 页面数组?], ...]
     * - 分包名称：主包为 "app"，其他为 subPackage.root
     * - 页面数组：空数组或省略表示整个分包的所有页面
     */
    whitelist?: FilterRule[];
    /**
     * 黑名单模式：排除匹配的页面
     * 格式：[[分包名称, 页面数组?], ...]
     * - 分包名称：主包为 "app"，其他为 subPackage.root
     * - 页面数组：空数组或省略表示整个分包的所有页面
     */
    blacklist?: FilterRule[];
    /**
     * 是否显示过滤日志
     * @default true
     */
    verbose?: boolean;
    /**
     * 是否启用代码压缩
     * @default false
     */
    compress?: boolean;
    /**
     * 指定需要压缩的文件名列表（支持字符串，内部会处理为正则）
     * @default ['common', 'taro', 'vendors', 'app']
     */
    compressFiles?: string[];
}
/**
 * Taro 页面过滤插件
 * 根据配置项过滤 app.config 文件中的页面
 */
declare const _default: (ctx: IPluginContext, pluginOpts?: PluginOptions) => void;
export default _default;
