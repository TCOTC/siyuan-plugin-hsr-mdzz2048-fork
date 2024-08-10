[English](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/blob/main/README.md)

# 思源笔记 文档高亮搜索 插件

> 注意：如果更新后无法打开搜索框，请重启一次思源笔记
>
> 具体更新内容见页面最后

#### 如何使用

启用后会在顶栏右边添加一个按钮，点击即可打开搜索。

另外还添加了快捷键 `Ctrl+Shift+Alt+F`，可以在快捷键设置自行修改。

只搜索当前页签内的文本，不包含界面和文档标题。

#### 其他信息

[原仓库](https://github.com/mdzz2048/siyuan-plugin-hsr) 作者暂停维护插件，所以我 fork 了一份稍作修改。但仍有部分问题，欢迎 PR。

变化：

- 提高浮窗显示层级，不被其他主题或插件覆盖
- 高亮文本滚动到页面中央，以兼容数据库文本高亮
- 搜索结果索引计数可以循环
- 文本框在 0.4 秒内无编辑则自动搜索
- 只搜索在文档区域内的文本，不包含界面和文档标题

#### 更新

##### 2024-03-27

- 调整元素样式、优化交互，体验更接近浏览器
- 每次点击箭头时重新搜索 [#1](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/issues/1)
- 不再搜索到其他打开过的页签中的内容 [#3](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/issues/3)
- 点击顶栏按钮或使用快捷键时不重复创建元素 [#5](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/issues/5)
- 在输入框内，按下 `Enter` 跳转下一项，按下 `Shift+Enter` 跳转上一项 [#6](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/issues/6)

##### 2024-03-31

- 优化元素样式，提升使用体验
- 在文本框内按下 Esc 即可关闭
- 如果没有搜索结果，搜索结果和索引计数都清零

##### 2024-04-08

- 更改插件名称
- 更新插件预览图
- 优化部分描述

##### 2024-04-17

- 改进暗黑模式下的颜色
- 支持带文本样式和超链接的搜索 [#11](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/pull/11)
- 如果搜索框已弹出，再次点击顶栏按钮或快捷键时，会重新将焦点移动到当前聚焦的页签中的搜索框并全选内容 [#9](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/issues/9)

##### 2024-04-18

- 分屏时在当前聚焦页签打开搜索框，支持在不同的页签中单独搜索 [#14](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/pull/14)
- 代码块内无语法高亮的文本在搜索时可以移动到界面中央了 [#14](https://github.com/TCOTC/siyuan-plugin-hsr-mdzz2048-fork/pull/14)

##### 2024-08-10

- 更换了顶栏按钮的图标，不再复用「标记」图标