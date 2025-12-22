import type { IPluginContext } from "@tarojs/service";
import type { AppConfig } from "@tarojs/taro";

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
}

/**
 * 根据规则过滤主包页面
 */
function filterMainPackagePages(
  pages: string[],
  packageName: string,
  rules: FilterRule[]
): string[] {
  // 找到匹配该分包名称的规则
  const matchedRules = rules.filter((rule) => rule[0] === packageName);

  if (matchedRules.length === 0) {
    return pages; // 没有匹配的规则，保留所有页面
  }

  // 收集所有需要保留的页面
  const allowedPages = new Set<string>();

  for (const rule of matchedRules) {
    const pageList = rule[1];
    if (!pageList || pageList.length === 0) {
      // 空数组或省略，表示整个分包的所有页面
      pages.forEach((page) => allowedPages.add(page));
    } else {
      // 只保留指定的页面
      pageList.forEach((page) => {
        // 找到匹配的页面（支持前缀匹配）
        pages.forEach((p) => {
          if (p === page || p.startsWith(page + "/")) {
            allowedPages.add(p);
          }
        });
      });
    }
  }

  return Array.from(allowedPages);
}

/**
 * 根据规则过滤分包页面
 */
function filterSubPackagePages(
  pages: string[],
  subPackageRoot: string,
  rules: FilterRule[]
): string[] {
  // 找到匹配该分包名称的规则
  const matchedRules = rules.filter((rule) => rule[0] === subPackageRoot);

  if (matchedRules.length === 0) {
    return pages; // 没有匹配的规则，保留所有页面
  }

  // 收集所有需要保留的页面
  const allowedPages = new Set<string>();

  for (const rule of matchedRules) {
    const pageList = rule[1];
    if (!pageList || pageList.length === 0) {
      // 空数组或省略，表示整个分包的所有页面
      pages.forEach((page) => allowedPages.add(page));
    } else {
      // 只保留指定的页面
      pageList.forEach((page) => {
        // 找到匹配的页面（支持前缀匹配）
        pages.forEach((p) => {
          if (p === page || p.startsWith(page + "/")) {
            allowedPages.add(p);
          }
        });
      });
    }
  }

  return Array.from(allowedPages);
}

/**
 * Taro 页面过滤插件
 * 根据配置项过滤 app.config 文件中的页面
 */
export default (ctx: IPluginContext, pluginOpts: PluginOptions = {}) => {
  const options: PluginOptions = {
    verbose: true,
    ...pluginOpts,
  };

  // 参数校验
  if (options.whitelist && options.blacklist) {
    console.warn(
      "[taro-plugin-compiler-whitelist] 警告：同时配置了 whitelist 和 blacklist，将先应用白名单再应用黑名单"
    );
  }

  if (!options.whitelist && !options.blacklist) {
    console.warn(
      "[taro-plugin-compiler-whitelist] 警告：未配置 whitelist 或 blacklist，插件将不会过滤任何页面或分包"
    );
  }

  // 修改 App 配置，过滤页面
  ctx.modifyAppConfig(({ appConfig }: { appConfig: AppConfig }) => {
    const { whitelist = [], blacklist = [] } = options;

    // 处理主包页面
    if (appConfig.pages && Array.isArray(appConfig.pages)) {
      const originalPages = [...appConfig.pages];
      let filteredPages = originalPages;

      // 先应用白名单
      if (whitelist.length > 0) {
        const mainPackageRules = whitelist.filter((rule) => rule[0] === "app");
        if (mainPackageRules.length > 0) {
          filteredPages = filterMainPackagePages(
            filteredPages,
            "app",
            mainPackageRules
          );
        } else {
          // 如果白名单中没有主包规则，且白名单不为空，则主包所有页面都被过滤
          filteredPages = [];
        }
      }

      // 再应用黑名单
      if (blacklist.length > 0) {
        const mainPackageBlackRules = blacklist.filter(
          (rule) => rule[0] === "app"
        );
        if (mainPackageBlackRules.length > 0) {
          // 对于黑名单，需要排除匹配的页面
          const pagesToExclude = new Set<string>();
          for (const rule of mainPackageBlackRules) {
            const pageList = rule[1];
            if (!pageList || pageList.length === 0) {
              // 整个主包都被排除
              filteredPages = [];
              break;
            } else {
              // 排除指定的页面
              pageList.forEach((page) => {
                filteredPages.forEach((p) => {
                  if (p === page || p.startsWith(page + "/")) {
                    pagesToExclude.add(p);
                  }
                });
              });
            }
          }
          filteredPages = filteredPages.filter(
            (page) => !pagesToExclude.has(page)
          );
        }
      }

      if (options.verbose && originalPages.length !== filteredPages.length) {
        const removedPages = originalPages.filter(
          (page) => !filteredPages.includes(page)
        );
        console.log(`[taro-plugin-compiler-whitelist] 主包页面过滤完成：`);
        console.log(
          `  原始页面数: ${originalPages.length}, 过滤后: ${filteredPages.length}`
        );
        if (removedPages.length > 0) {
          console.log(`  已移除的页面:`, removedPages);
        }
      }

      appConfig.pages = filteredPages;
    }

    // 处理分包
    const subPackages = appConfig.subPackages || (appConfig as any).subpackages;
    if (subPackages && Array.isArray(subPackages)) {
      const originalSubPackages = [...subPackages];
      let filteredSubPackages = originalSubPackages;

      // 先根据白名单过滤分包
      if (whitelist.length > 0) {
        // 收集白名单中的分包名称
        const allowedSubPackageNames = new Set<string>();
        whitelist.forEach((rule) => {
          if (rule[0] !== "app") {
            allowedSubPackageNames.add(rule[0]);
          }
        });

        if (allowedSubPackageNames.size > 0) {
          // 只保留白名单中的分包
          filteredSubPackages = filteredSubPackages.filter((subPackage) =>
            allowedSubPackageNames.has(subPackage.root || "")
          );
        } else {
          // 如果白名单中没有分包规则，且白名单不为空，则所有分包都被过滤
          filteredSubPackages = [];
        }
      }

      // ... 这里的逻辑保持不变 ...

      // 再根据黑名单排除分包（只排除整个分包的情况）
      if (blacklist.length > 0) {
        const excludedSubPackageNames = new Set<string>();
        blacklist.forEach((rule) => {
          if (rule[0] !== "app") {
            const pageList = rule[1];
            // 如果页面数组为空或省略，表示整个分包都被排除
            if (!pageList || pageList.length === 0) {
              excludedSubPackageNames.add(rule[0]);
            }
          }
        });

        if (excludedSubPackageNames.size > 0) {
          filteredSubPackages = filteredSubPackages.filter(
            (subPackage) => !excludedSubPackageNames.has(subPackage.root || "")
          );
        }
      }

      // 记录分包过滤结果
      if (
        options.verbose &&
        originalSubPackages.length !== filteredSubPackages.length
      ) {
        const removedSubPackages = originalSubPackages.filter(
          (subPackage) =>
            !filteredSubPackages.some((sp) => sp.root === subPackage.root)
        );
        console.log(`[taro-plugin-compiler-whitelist] 分包过滤完成：`);
        console.log(
          `  原始分包数: ${originalSubPackages.length}, 过滤后: ${filteredSubPackages.length}`
        );
        if (removedSubPackages.length > 0) {
          console.log(
            `  已移除的分包:`,
            removedSubPackages.map((sp) => sp.root)
          );
        }
      }

      // 对每个分包内的页面进行过滤
      const finalSubPackages = filteredSubPackages
        .map((subPackage) => {
          if (subPackage.pages && Array.isArray(subPackage.pages)) {
            const subPackageRoot = subPackage.root || "";
            const originalSubPages = [...subPackage.pages];
            let filteredSubPages = originalSubPages;

            // 先应用白名单
            if (whitelist.length > 0) {
              const subPackageRules = whitelist.filter(
                (rule) => rule[0] === subPackageRoot
              );
              if (subPackageRules.length > 0) {
                filteredSubPages = filterSubPackagePages(
                  filteredSubPages,
                  subPackageRoot,
                  subPackageRules
                );
              } else {
                // 如果白名单中没有该分包的规则，且白名单不为空，则该分包所有页面都被过滤
                filteredSubPages = [];
              }
            }

            // 再应用黑名单
            if (blacklist.length > 0) {
              const subPackageBlackRules = blacklist.filter(
                (rule) => rule[0] === subPackageRoot
              );
              if (subPackageBlackRules.length > 0) {
                const pagesToExclude = new Set<string>();
                for (const rule of subPackageBlackRules) {
                  const pageList = rule[1];
                  if (!pageList || pageList.length === 0) {
                    // 整个分包都被排除（这种情况应该在上面的分包过滤中已经处理）
                    filteredSubPages = [];
                    break;
                  } else {
                    // 排除指定的页面
                    pageList.forEach((page) => {
                      filteredSubPages.forEach((p) => {
                        if (p === page || p.startsWith(page + "/")) {
                          pagesToExclude.add(p);
                        }
                      });
                    });
                  }
                }
                filteredSubPages = filteredSubPages.filter(
                  (page) => !pagesToExclude.has(page)
                );
              }
            }

            if (
              options.verbose &&
              originalSubPages.length !== filteredSubPages.length
            ) {
              const removedSubPages = originalSubPages.filter(
                (page) => !filteredSubPages.includes(page)
              );
              console.log(
                `[taro-plugin-compiler-whitelist] 子包 "${subPackageRoot}" 页面过滤：`
              );
              console.log(
                `  原始页面数: ${originalSubPages.length}, 过滤后: ${filteredSubPages.length}`
              );
              if (removedSubPages.length > 0) {
                console.log(`  已移除的页面:`, removedSubPages);
              }
            }

            return {
              ...subPackage,
              pages: filteredSubPages,
            };
          }
          return subPackage;
        })
        .filter((subPackage) => {
          // 移除空的子包
          return (
            subPackage.pages &&
            Array.isArray(subPackage.pages) &&
            subPackage.pages.length > 0
          );
        });

      // 更新分包配置，同时兼容两种写法
      if (appConfig.subPackages) {
        appConfig.subPackages = finalSubPackages;
      }
      if ((appConfig as any).subpackages) {
        (appConfig as any).subpackages = finalSubPackages;
      }
    }
    console.log("appConfig", appConfig);
  });
};
