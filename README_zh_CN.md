[English](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/blob/main/README.md)

# 思源笔记 高亮搜索结果Ⅱ 插件

[原仓库](https://github.com/mdzz2048/siyuan-plugin-hsr) 作者暂停维护插件，所以我 fork 了一份稍作修改

变化：

- 提高显示层级，不再被其他主题和插件覆盖
- 高亮结果文本滚动到页面中央，兼容数据库文本高亮
- 搜索结果索引计数可以循环
- 文本框在 1 秒内无编辑则自动搜索

修复：

- 每次搜索自动重置搜索结果索引计数为 0
- 只搜索在文档区域内的文本（不包含界面和文档标题）
- 不再搜索到不可视的文本