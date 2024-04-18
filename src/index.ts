import { Plugin, getFrontend, getBackend } from "siyuan";
import { createApp } from "vue";
import { onMounted } from 'vue';
import SearchVue from "./Search.vue";
import "./index.scss"

const CLASS_NAME = "highlight-search-result"

const SearchComponent = {
    setup() {
      onMounted(() => {
        const rootElement = document.querySelector(`.layout__center [data-type="wnd"].layout__wnd--active > .layout-tab-container`);
        if (rootElement) {
          const inputElement = rootElement.querySelector(`.${CLASS_NAME} .search-dialog .b3-text-field`);
          if (inputElement) {
            setTimeout(() => { // 等待一小段时间确保元素加载完全
              inputElement.focus();
              inputElement.select();
            }, 100);
          }
        }
      });
      return {};
    }
  };

export default class PluginHighlight extends Plugin {

    onload() {

        this.addTopBar({
            icon: "iconMark",
            title: this.i18n.topBarTitle,
            position: "right",
            callback: () => {
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

    onLayoutReady() {
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
    }

    uninstall() {
        console.log("uninstall");
    }

    addSearchElement() {
        const edits = document.querySelectorAll(".layout__center [data-type='wnd'].layout__wnd--active > .layout-tab-container");
        console.log(edits);
        edits.forEach(edit => {
            const existingElement = edit.querySelector(`.${CLASS_NAME}`);
    
            // 如果不存在具有 CLASS_NAME 类名的元素，则创建一个新的元素并挂载 SearchVue 组件
            if (!existingElement) {
                const element = document.createElement("div");
                element.className = CLASS_NAME;
                edit.appendChild(element); // 将新元素添加到编辑区域中
                console.log(element, edit); // 打印新元素和编辑区域元素

                // 创建 Vue 应用并挂载 SearchComponent 组件到新创建的元素中
                createApp(SearchVue, {
                    document: edit,
                    element: element,
                }).component('search-component', SearchComponent).mount(element);
            } else {
                // 如果存在具有 CLASS_NAME 类名的元素，则执行以下操作
                const rootElement = existingElement; // 将已存在的元素作为根元素
                // 查找具有 CLASS_NAME 类名的根元素
                const inputElement = rootElement.querySelector('.search-dialog .b3-text-field');
                if (inputElement) {
                    // 等待一小段时间确保元素加载完全，然后聚焦到输入框并选中其中的文本
                    setTimeout(() => {
                        inputElement.focus();
                        inputElement.select();
                    }, 100);
                }
            }
        });
    }
}