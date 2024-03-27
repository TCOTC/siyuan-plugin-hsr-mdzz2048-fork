import { Plugin, getFrontend, getBackend } from "siyuan";
import { createApp } from "vue";
import { onMounted } from 'vue';
import SearchVue from "./Search.vue";
import "./index.scss"

const CLASS_NAME = "highlight-search-result"

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

    // addSearchElement() {
    //     const edits = document.querySelectorAll(".layout__center [data-type='wnd'] > .layout-tab-container")
    //     console.log(edits)
    //     edits.forEach(edit => {
    //         let element: Element

    //         const lastElementChild = edit.lastElementChild
    //         const classList = lastElementChild.classList
    //         const isExist = classList.contains(CLASS_NAME)
    //         console.log(isExist, lastElementChild)
            
    //         if (!isExist) {
    //             element = document.createElement("div")
    //             element.className = CLASS_NAME
    //             edit.appendChild(element)
    //             console.log(element, edit)
    //         } else {
    //             element = lastElementChild
    //         }

    //         createApp(SearchVue, {
    //             document: edit,
    //             element: element,
    //         }).mount(element)
    //     })
    // }
    // 在编辑区域寻找具有类名 layout-tab-container 的元素，然后检查该元素下是否存在类名为 highlight-search-result 的子元素。
    // 如果不存在，则创建一个并将 Vue 应用挂载在新创建的元素上
    addSearchElement() {
        const edits = document.querySelectorAll(".layout__center [data-type='wnd'] > .layout-tab-container");
        console.log(edits);
        edits.forEach(edit => {
            const existingElement = edit.querySelector(`.${CLASS_NAME}`);
    
            if (!existingElement) {
                const element = document.createElement("div");
                element.className = CLASS_NAME;
                edit.appendChild(element);
                console.log(element, edit);
    
                createApp(SearchVue, {
                    document: edit,
                    element: element,
                }).mount(element);
            } else {
                const inputElement = existingElement.querySelector('.highlight-search-result .search-dialog .b3-text-field');
                if (inputElement) {
                    onMounted(() => {
                        inputElement.focus();
                        inputElement.select();
                    });
                }
            }
        });
    }
}