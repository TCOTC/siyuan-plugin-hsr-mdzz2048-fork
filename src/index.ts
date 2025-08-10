// import { Plugin, getFrontend, getBackend } from "siyuan";
import { Plugin } from "siyuan";
import { createApp } from "vue";
import SearchVue from "./Search.vue";
import "./index.scss"

export const CLASS_NAME = "highlight-search-result";

// 判断是否为移动端
export const isMobile = () => {
    return !!(window as any).siyuan?.mobile;
};

export default class PluginHighlight extends Plugin {
    icon: string = `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.29289 1.29289C9.48043 1.10536 9.73478 1 10 1H18C19.6569 1 21 2.34315 21 4V8C21 8.55228 20.5523 9 20 9C19.4477 9 19 8.55228 19 8V4C19 3.44772 18.5523 3 18 3H11V8C11 8.55228 10.5523 9 10 9H5V20C5 20.5523 5.44772 21 6 21H10C10.5523 21 11 21.4477 11 22C11 22.5523 10.5523 23 10 23H6C4.34315 23 3 21.6569 3 20V8C3 7.73478 3.10536 7.48043 3.29289 7.29289L9.29289 1.29289ZM6.41421 7H9V4.41421L6.41421 7ZM20.1716 18.7574C20.6951 17.967 21 17.0191 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C17.0191 21 17.967 20.6951 18.7574 20.1716L21.2929 22.7071C21.6834 23.0976 22.3166 23.0976 22.7071 22.7071C23.0976 22.3166 23.0976 21.6834 22.7071 21.2929L20.1716 18.7574ZM13 16C13 14.3431 14.3431 13 16 13C17.6569 13 19 14.3431 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16Z"/></svg>`
    
    // 存储所有搜索组件的回调函数
    private searchComponentCallbacks: Set<(event: CustomEvent) => void> = new Set();
    
    // 存储多个 Vue 应用实例，用于正确销毁组件
    private searchApps: Map<Element, any> = new Map();
    
    // 跟踪活跃的搜索组件数量
    private activeSearchComponentsCount: number = 0;
    
    // 记录最后执行 CSS.highlights.set 的组件
    private lastHighlightComponent: Element | null = null;
    
    // 拖拽相关状态
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private initialLeft: number = 0;
    private initialTop: number = 0;
    private currentDraggingElement: HTMLElement | null = null;
    
    // 清理定时器
    private cleanupTimer: number | null = null;
    
    // 更新最后执行 CSS.highlights.set 的组件记录
    updateLastHighlightComponent(element: Element) {
        this.lastHighlightComponent = element;
    }
    
    // 获取最后执行 CSS.highlights.set 的组件
    getLastHighlightComponent(): Element | null {
        return this.lastHighlightComponent;
    }
    
    // 检查指定组件是否为最后执行 CSS.highlights.set 的组件
    isLastHighlightComponent(element: Element): boolean {
        return this.lastHighlightComponent === element;
    }
    
    // 清理无效的组件引用
    private cleanupInvalidComponents() {
        // 检查 searchApps 中的元素是否仍然存在于 DOM 中
        const invalidElements: Element[] = [];
        this.searchApps.forEach((_, element) => {
            if (!document.contains(element)) {
                invalidElements.push(element);
            }
        });
        
        // 清理无效的元素
        if (invalidElements.length > 0) {
            console.warn("Component element detected as unexpectedly removed, cleaning up...");
        }
        
        invalidElements.forEach(element => {
            const app = this.searchApps.get(element);
            if (app) {
                try {
                    app.unmount();
                } catch (error) {
                    console.error("Error unmounting Vue app:", error);
                }
            }
            this.searchApps.delete(element);
            
            // 减少活跃组件计数
            this.activeSearchComponentsCount = Math.max(0, this.activeSearchComponentsCount - 1);
        });
        
        // 如果所有组件都被清理了，重置状态
        if (this.activeSearchComponentsCount === 0) {
            this.searchComponentCallbacks.clear();
            this.eventBusOff();
            this.removeGlobalDragListeners();
            this.lastHighlightComponent = null;
        }
        
        // 清理无效的回调函数（这里可以根据需要添加更复杂的清理逻辑）
        // 由于回调函数是组件级别的，当组件被意外移除时，对应的回调也会失效
        // 但这里我们暂时保留，因为回调函数本身不会造成内存泄漏
    }
    
    // 启动定期清理
    private startCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        // 每 30 秒检查一次
        this.cleanupTimer = window.setInterval(() => {
            this.cleanupInvalidComponents();
        }, 30000);
    }
    
    // 停止定期清理
    private stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
    
    // 手动清理无效组件（供外部调用）
    public manualCleanup() {
        this.cleanupInvalidComponents();
    }
    
    onload() {
        this.addTopBar({
            icon: this.icon,
            title: this.i18n.topBarTitle,
            position: "right",
            callback: () => {
                this.closePanel();
                this.addSearchElement(true); // 传递 true 表示来自顶栏按钮
            }
        });

        this.addCommand({
            langKey: "showDialog",
            hotkey: "⌥⇧⌘F",
            callback: () => {
                this.addSearchElement(false); // 传递 false 表示来自快捷键
            },
        });

        // 测试清理机制是否正常工作
        setTimeout(() => {
            console.log("Plugin loaded successfully, cleanup mechanism activated");
        }, 1000);

        console.log(this.i18n.helloPlugin);
    }

    // 设置全局拖拽事件监听器
    private setupGlobalDragListeners() {
        document.addEventListener('mousemove', this.handleGlobalMouseMove);
        document.addEventListener('mouseup', this.handleGlobalMouseUp);
    }

    // 移除全局拖拽事件监听器
    private removeGlobalDragListeners() {
        document.removeEventListener('mousemove', this.handleGlobalMouseMove);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);
    }

    // 监听事件总线事件
    private eventBusOn() {
        this.eventBus.on("ws-main", this.handleEventBusEvent);
        this.eventBus.on("loaded-protyle-dynamic", this.handleEventBusEvent); // 动态加载之后需要刷新搜索结果并高亮，但不要滚动
        this.eventBus.on("loaded-protyle-static", this.handleEventBusEvent); // 浮窗查看上下文会重新加载编辑器，此时需要刷新搜索结果并高亮，但不要滚动
        this.eventBus.on("switch-protyle", this.handleEventBusEvent); // 切换页签之后需要刷新搜索结果并高亮，但不要滚动
        // TODO功能: 监听编辑器模式切换，然后刷新搜索结果并高亮，依赖 https://github.com/siyuan-note/siyuan/issues/15516
    }

    // 移除事件总线事件监听器
    private eventBusOff() {
        this.eventBus.off("ws-main", this.handleEventBusEvent);
        this.eventBus.off("loaded-protyle-dynamic", this.handleEventBusEvent); // 移除动态加载事件监听器
        this.eventBus.off("loaded-protyle-static", this.handleEventBusEvent); // 移除静态加载事件监听器
        this.eventBus.off("switch-protyle", this.handleEventBusEvent); // 移除切换页签事件监听器
    }

    // 全局鼠标移动处理
    private handleGlobalMouseMove = (event: MouseEvent) => {
        // console.log("handleGlobalMouseMove: ", this.currentDraggingElement);
        if (!this.isDragging || !this.currentDraggingElement) return;
        
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;
        
        this.currentDraggingElement.style.position = 'fixed';
        this.currentDraggingElement.style.left = (this.initialLeft + deltaX) + 'px';
        this.currentDraggingElement.style.top = (this.initialTop + deltaY) + 'px';
        this.currentDraggingElement.style.zIndex = '9999';
    }

    // 全局鼠标释放处理
    private handleGlobalMouseUp = () => {
        this.isDragging = false;
        this.currentDraggingElement = null;
    }

    // 开始拖拽（供组件调用）
    startDragging(element: HTMLElement, startX: number, startY: number) {
        // console.log("startDragging: ", element);
        // 只在桌面端支持拖拽
        // if (isMobile()) return;
        
        this.isDragging = true;
        this.dragStartX = startX;
        this.dragStartY = startY;
        this.currentDraggingElement = element;
        
        const rect = element.getBoundingClientRect();
        this.initialLeft = rect.left;
        this.initialTop = rect.top;
    }

    // 重置组件位置（供组件调用）
    resetComponentPosition(element: HTMLElement) {
        // // 只在桌面端支持位置重置
        // if (isMobile()) return;
        
        // 清除所有定位样式，让组件回到默认位置
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.zIndex = '';
    }

    // 当搜索组件挂载时调用
    onSearchComponentMounted(callback: (event: CustomEvent) => void) {
        // console.log("onSearchComponentMounted");
        this.searchComponentCallbacks.add(callback);
        
        // 增加活跃组件计数
        this.activeSearchComponentsCount++;
        
        // 如果是第一个组件，开始监听事件
        if (this.activeSearchComponentsCount === 1) {
            // console.log("开始监听事件总线");
            this.eventBusOn();
            // 只在桌面端开始监听全局拖拽事件
            if (!isMobile()) {
                this.setupGlobalDragListeners();
            }
            // 启动定期清理
            this.startCleanupTimer();
        }
    }

    // 当搜索组件卸载时调用
    onSearchComponentUnmounted(callback?: (event: CustomEvent) => void) {
        // console.log("onSearchComponentUnmounted");
        
        // 如果提供了回调函数，从 Set 中移除它
        if (callback) {
            this.searchComponentCallbacks.delete(callback);
        }
        
        // 减少活跃组件计数
        this.activeSearchComponentsCount--;
        
        // 如果是最后一个组件，取消事件监听
        if (this.activeSearchComponentsCount === 0) {
            // console.log("取消监听事件总线");
            this.eventBusOff();
            // 移除全局拖拽事件监听器
            this.removeGlobalDragListeners();
            // 停止定期清理
            this.stopCleanupTimer();
        }
    }

    // 处理事件总线事件
    private handleEventBusEvent = (event: CustomEvent) => {
        // console.log("handleEventBusEvent:", event);
        // 遍历所有回调函数并调用它们
        this.searchComponentCallbacks.forEach(callback => {
            callback(event);
        });
    }

    // 关闭搜索对话框
    closeSearchDialog() {
        // console.log("closeSearchDialog");
        // 销毁所有 Vue 应用实例
        this.searchApps.forEach((app) => {
            try {
                app.unmount();
            } catch (error) {
                console.error("Error unmounting Vue app:", error);
            }
        });
        this.searchApps.clear();
        
        // 重置活跃组件计数
        this.activeSearchComponentsCount = 0;
        
        // 移除所有 DOM 元素
        const existingElements = document.querySelectorAll(`.${CLASS_NAME}`);
        existingElements.forEach(element => {
            try {
                element.remove();
            } catch (error) {
                console.error("Error removing DOM element:", error);
            }
        });
    }

    // 关闭特定的搜索对话框
    closeCurrentSearchDialog(element: Element) {
        // console.log("closeCurrentSearchDialog");
        // 销毁特定的 Vue 应用实例
        const app = this.searchApps.get(element);
        if (app) {
            try {
                app.unmount();
            } catch (error) {
                console.error("Error unmounting Vue app:", error);
            }
            this.searchApps.delete(element);
        }
        
        // 减少活跃组件计数（因为组件卸载时会调用 onSearchComponentUnmounted）
        // 这里不需要手动减少计数，因为 Vue 组件的 onUnmounted 钩子会自动调用 onSearchComponentUnmounted
        
        // 移除特定的 DOM 元素
        try {
            element.remove();
        } catch (error) {
            console.error("Error removing DOM element:", error);
        }
    }

    onLayoutReady() {
        // console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        this.closeSearchDialog();
        this.removeGlobalDragListeners();
        this.stopCleanupTimer(); // 在插件卸载时停止清理
        console.log(this.i18n.byePlugin);
    }

    uninstall() {
        this.closeSearchDialog();
        this.removeGlobalDragListeners();
        this.stopCleanupTimer(); // 在插件卸载时停止清理
        console.log("siyuan-plugin-hsr-mdzz2048-fork uninstall");
    }

    // Mobile
    closePanel() {
        if (!isMobile()) return;

        const menuElement = document.getElementById("menu");
        const sidebarElement = document.getElementById("sidebar");
        const modelElement = document.getElementById("model");
        if (menuElement) menuElement.style.transform = "";
        if (sidebarElement) sidebarElement.style.transform = "";
        if (modelElement) modelElement.style.transform = "";

        const maskElement = document.querySelector(".side-mask") as HTMLElement;
        if (maskElement) {
            maskElement.classList.add("fn__none");
            maskElement.style.opacity = "";
        }

        (window as any).siyuan?.menus?.menu.remove();
    };

    addSearchElement(isFromTopBar: boolean = false) {
        // 在创建新组件前先清理无效的组件
        this.cleanupInvalidComponents();
        
        let mobile = isMobile();
        let edits = mobile ? document.querySelectorAll("#editor") : document.querySelectorAll(".layout__wnd--active > .layout-tab-container");
        // console.log(edits);
        if (edits.length === 0) {
            // // 一个浮窗多个编辑器
            // edits = [document.activeElement?.closest('.block__popover')?.querySelector('.block__content')] as any;
            if (document.activeElement.classList.contains('protyle-wysiwyg')) {
                edits = [document.activeElement.closest('.protyle')] as any;
            }
        }
        if (edits.length === 0) {
            console.error("no edits found");
            return;
        }
        edits.forEach((edit: { querySelector: (arg0: string) => any; insertAdjacentElement: (arg0: string, arg1: HTMLDivElement) => void; appendChild: (arg0: HTMLDivElement) => void; }) => {
            let existingElement: any;
            if (mobile) {
                existingElement = document.querySelector(`.${CLASS_NAME}`);
            } else {
                existingElement = edit.querySelector(`.${CLASS_NAME}`);
            }
    
            // 如果不存在具有 CLASS_NAME 类名的元素，则创建一个新的元素并挂载 SearchVue 组件
            if (!existingElement) {
                const element = document.createElement("div");
                element.className = `${CLASS_NAME} ${mobile ? CLASS_NAME + "--mobile" : ""}`;

                // 将新元素添加到编辑区域中
                if (mobile) {
                    edit.insertAdjacentElement("afterend", element);
                } else {
                    edit.appendChild(element);
                }
                // console.log(element, edit); // 打印新元素和编辑区域元素
                
                // 检查是否有选中的文本
                const selectedText = this.getSelectedText();
                if (selectedText) {
                    // 如果有选中文本，通过 data 属性传递预设文本
                    element.setAttribute('data-preset-text', selectedText);
                }

                // 创建 Vue 应用并挂载 SearchVue 组件到新创建的元素中
                const app = createApp(SearchVue, {
                    edit: edit,
                    element: element,
                    plugin: this, // 传递插件实例
                });
                app.mount(element);
                // 保存应用实例到 Map 中
                this.searchApps.set(element, app);
            } else {
                // 在具有 CLASS_NAME 类名的元素中查找输入框
                const inputElement = existingElement.querySelector('.search-dialog .b3-text-field') as HTMLInputElement;
                if (inputElement) {
                    // 只有来自顶栏按钮时才重置位置
                    if (isFromTopBar) {
                        // console.log("existingElement:", existingElement);
                        // 只有来自顶栏按钮时才重置位置
                        this.resetComponentPosition((existingElement as HTMLElement).querySelector('.search-dialog'));
                    }
                    
                    // 检查是否有选中的文本
                    const selectedText = this.getSelectedText();
                    if (selectedText) {
                        // 如果有选中文本，设置到输入框并搜索
                        inputElement.value = selectedText;
                        // 触发 input 事件以更新 Vue 的响应式数据
                        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                        // 聚焦输入框
                        inputElement.focus();
                        // 延迟执行搜索，确保输入框值已更新
                        setTimeout(() => {
                            // 通过 Vue 组件实例触发搜索
                            const vueApp = this.searchApps.get(existingElement);
                            if (vueApp) {
                                // 获取组件实例并调用搜索方法
                                const componentInstance = vueApp._instance?.exposed;
                                if (componentInstance && componentInstance.highlightHitResult) {
                                    componentInstance.highlightHitResult(selectedText, true);
                                }
                            }
                        }, 50);
                    } else {
                        // 如果没有选中文本，按照原来的逻辑聚焦并全选输入框内容
                        inputElement.focus();
                        inputElement.select();
                    }
                }
            }
        });
    }
    
    // 获取当前选中的文本
    private getSelectedText(): string {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return '';
        }
        
        return selection.getRangeAt(0).toString().trim() || '';
    }
}