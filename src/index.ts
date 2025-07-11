// import { Plugin, getFrontend, getBackend } from "siyuan";
import { Plugin } from "siyuan";
import { createApp } from "vue";
import SearchVue from "./Search.vue";
import "./index.scss"

export const CLASS_NAME = "highlight-search-result";

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
    
    onload() {
        this.addTopBar({
            icon: this.icon,
            title: this.i18n.topBarTitle,
            position: "right",
            callback: () => {
                this.closePanel();
                this.addSearchElement();
            }
        });

        this.addCommand({
            langKey: "showDialog",
            hotkey: "⌥⇧⌘F",
            callback: () => {
                this.addSearchElement();
            },
        });

        console.log(this.i18n.helloPlugin);
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
            this.eventBus.on("ws-main", this.handleEventBusEvent);
            // this.eventBus.on("loaded-protyle-static", this.handleEventBusEvent);
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
            this.eventBus.off("ws-main", this.handleEventBusEvent);
            // this.eventBus.off("loaded-protyle-static", this.handleEventBusEvent);
        }
    }

    // 处理事件总线事件
    private handleEventBusEvent = (event: CustomEvent) => {
        // console.log("handleEventBusEvent");
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
            app.unmount();
        });
        this.searchApps.clear();
        
        // 重置活跃组件计数
        this.activeSearchComponentsCount = 0;
        
        // 移除所有 DOM 元素
        const existingElements = document.querySelectorAll(`.${CLASS_NAME}`);
        existingElements.forEach(element => {
            element.remove();
        });
    }

    // 关闭特定的搜索对话框
    closeCurrentSearchDialog(element: Element) {
        // console.log("closeCurrentSearchDialog");
        // 销毁特定的 Vue 应用实例
        const app = this.searchApps.get(element);
        if (app) {
            app.unmount();
            this.searchApps.delete(element);
        }
        
        // 减少活跃组件计数（因为组件卸载时会调用 onSearchComponentUnmounted）
        // 这里不需要手动减少计数，因为 Vue 组件的 onUnmounted 钩子会自动调用 onSearchComponentUnmounted
        
        // 移除特定的 DOM 元素
        element.remove();
    }

    onLayoutReady() {
        // console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        this.closeSearchDialog();
        console.log(this.i18n.byePlugin);
    }

    uninstall() {
        this.closeSearchDialog();
        console.log("siyuan-plugin-hsr-mdzz2048-fork uninstall");
    }

    isMobile() {
        return !!(window as any).siyuan?.mobile;
    };

    // Mobile
    closePanel() {
        if (!this.isMobile()) return;

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

    addSearchElement() {
        let isMobile = this.isMobile();
        const edits = isMobile ? document.querySelectorAll("#editor") : document.querySelectorAll(".layout__wnd--active > .layout-tab-container");
        // console.log(edits);
        edits.forEach((edit: { querySelector: (arg0: string) => any; insertAdjacentElement: (arg0: string, arg1: HTMLDivElement) => void; appendChild: (arg0: HTMLDivElement) => void; }) => {
            let existingElement: any;
            if (isMobile) {
                existingElement = document.querySelector(`.${CLASS_NAME}`);
            } else {
                existingElement = edit.querySelector(`.${CLASS_NAME}`);
            }
    
            // 如果不存在具有 CLASS_NAME 类名的元素，则创建一个新的元素并挂载 SearchVue 组件
            if (!existingElement) {
                const element = document.createElement("div");
                element.className = `${CLASS_NAME} ${isMobile ? CLASS_NAME + "--mobile" : ""}`;

                // 将新元素添加到编辑区域中
                if (isMobile) {
                    edit.insertAdjacentElement("afterend", element);
                } else {
                    edit.appendChild(element);
                }
                // console.log(element, edit); // 打印新元素和编辑区域元素

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
                    inputElement.focus();
                    inputElement.select();
                }
            }
        });
    }
}