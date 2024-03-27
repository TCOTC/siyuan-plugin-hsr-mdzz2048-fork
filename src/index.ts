import { Plugin, getFrontend, getBackend } from "siyuan";
import { createApp } from "vue";
import { onMounted } from 'vue';
import SearchVue from "./Search.vue";
import "./index.scss";

const CLASS_NAME = "highlight-search-result";

const SearchComponent = {
    setup() {
        onMounted(() => {
            const inputElement = document.querySelector('.highlight-search-result .search-dialog .b3-text-field');
            if (inputElement) {
                inputElement.focus();
                inputElement.select();
            }
        });

        return {};
    }
};

export default class PluginHighlight extends Plugin {

    addSearchElement(edit) {
        const existingElement = edit.querySelector(`.${CLASS_NAME}`);

        if (!existingElement) {
            const element = document.createElement("div");
            element.className = CLASS_NAME;
            edit.appendChild(element);
            console.log(element, edit);

            createApp(SearchVue, {
                data: edit,
                element: element,
            }).component('search-component', SearchComponent).mount(element);
        }
    }

    onload() {
        this.addTopBar({
            icon: "iconMark",
            title: this.i18n.topBarTitle,
            position: "right",
            callback: () => {
                const edits = document.querySelectorAll(".layout__center [data-type='wnd'] > .layout-tab-container");
                edits.forEach(edit => {
                    this.addSearchElement(edit);
                });
            }
        });

        this.addCommand({
            langKey: "showDialog",
            hotkey: "⌥⇧⌘F",
            callback: () => {
                const edits = document.querySelectorAll(".layout__center [data-type='wnd'] > .layout-tab-container");
                edits.forEach(edit => {
                    this.addSearchElement(edit);
                });
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
}