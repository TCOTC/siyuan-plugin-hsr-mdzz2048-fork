import { Plugin, getFrontend, getBackend } from "siyuan";
import { createApp } from "vue";
import { onMounted } from 'vue';
import SearchVue from "./Search.vue";
import "./index.scss"

const CLASS_NAME = "highlight-search-result"

const SearchComponent = {
    setup() {
      onMounted(() => {
        const rootElement = document.querySelector(`.${CLASS_NAME}`);
        if (rootElement) {
          const inputElement = rootElement.querySelector('.search-dialog .b3-text-field');
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
    icon: string = `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.29289 1.29289C9.48043 1.10536 9.73478 1 10 1H18C19.6569 1 21 2.34315 21 4V8C21 8.55228 20.5523 9 20 9C19.4477 9 19 8.55228 19 8V4C19 3.44772 18.5523 3 18 3H11V8C11 8.55228 10.5523 9 10 9H5V20C5 20.5523 5.44772 21 6 21H10C10.5523 21 11 21.4477 11 22C11 22.5523 10.5523 23 10 23H6C4.34315 23 3 21.6569 3 20V8C3 7.73478 3.10536 7.48043 3.29289 7.29289L9.29289 1.29289ZM6.41421 7H9V4.41421L6.41421 7ZM20.1716 18.7574C20.6951 17.967 21 17.0191 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C17.0191 21 17.967 20.6951 18.7574 20.1716L21.2929 22.7071C21.6834 23.0976 22.3166 23.0976 22.7071 22.7071C23.0976 22.3166 23.0976 21.6834 22.7071 21.2929L20.1716 18.7574ZM13 16C13 14.3431 14.3431 13 16 13C17.6569 13 19 14.3431 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16Z"/></svg>`
    onload() {

        this.addTopBar({
            icon: this.icon,
            title: this.i18n.topBarTitle,
            position: "right",
            callback: () => {
                this.closeMobileMenu();
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
        // console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
    }

    uninstall() {
        console.log("siyuan-plugin-hsr-mdzz2048-fork uninstall");
    }

    closeMobileMenu() {
        const menu = document.getElementById('menu');
        if (menu)
            menu.removeAttribute('style');

        const sideMask = document.querySelector('.side-mask');
        if (sideMask)
            sideMask.classList.add('fn__none');
    }

    addSearchElement() {
        const edits = document.querySelectorAll(".protyle");
        // console.log(edits);
        edits.forEach(edit => {
            const existingElement = edit.querySelector(`.${CLASS_NAME}`);
    
            // 如果不存在具有 CLASS_NAME 类名的元素，则创建一个新的元素并挂载 SearchVue 组件
            if (!existingElement) {
                const element = document.createElement("div");
                element.className = CLASS_NAME;
                edit.appendChild(element); // 将新元素添加到编辑区域中
                // console.log(element, edit); // 打印新元素和编辑区域元素

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