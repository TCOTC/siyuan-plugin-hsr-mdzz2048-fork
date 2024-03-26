<template>
    <div class="search-dialog">
        <div class="b3-form__icon search-input">
            <Svg icon="#iconSearch" class="b3-form__icon-icon"></Svg>
            <input
                type="text"
                class="b3-text-field b3-form__icon-input fn__size200"
                :placeholder="placeholder"
                v-model="searchText"
                @change="highlightHitResult(searchText)"
                @keyup.enter="highlightHitResult(searchText)"
            />
        </div>
        {{ resultIndex + "/" + resultCount }}
        <div class="search-tools">
            <div @click="clickLast">
                <Svg icon="#iconUp" class="icon--14_14"></Svg>
            </div>
            <div @click="clickNext">
                <Svg icon="#iconDown" class="icon--14_14"></Svg>
            </div>
            <div @click="clickClose">
                <Svg icon="#iconClose" class="icon--14_14" id="search-tools-close"></Svg>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Svg from "./Svg.vue"
// import { showToolTip } from "./utils/showtips";

const searchText = ref("")
const resultCount = ref(0)
const resultIndex = ref(0)
const resultRange = ref()
const placeholder = "Enter"

const props = defineProps<{
    document: Element,
    element: Element,
}>()

// REF: https://juejin.cn/post/7199438741533376573
// 使用 [CSS 自定义高亮 API - Web API 接口参考 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/CSS_Custom_Highlight_API)
// 兼容性：Chrome、Edge (105+), Safari (17.2+), firefox (寄), Electron (思源使用的版本 > 28.0, 可以使用这个 API)
function highlightHitResult(value: string) {
    // 自动重置搜索结果索引计数为 0
    resultIndex.value = 0


    // 首先，选取所有符合条件的元素
    const elements = document.querySelectorAll('.protyle-wysiwyg [data-node-id]');

    // 准备一个数组来保存所有文本节点
    const allTextNodes = [];

    // 定义一个辅助函数，用于检查一个元素是否是另一个元素的后代
    function isDescendant(parent, child) {
        let node = child.parentNode;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    // 判断元素是否可见
    function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
    }

    // 对每个符合条件的元素，首先检查它是否是已选元素的后代，如果不是，则使用 createTreeWalker 遍历其文本节点
    elements.forEach(element => {
        // 检查当前元素是否是任何其他已选元素的后代
        const isNested = Array.from(elements).some(otherElement => otherElement !== element && isDescendant(otherElement, element));
        
        // 如果当前元素不是其他元素的后代，则遍历其文本节点
        if (!isNested && isElementVisible(element)) { // 判断元素是否可见
            const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            let currentNode = treeWalker.nextNode();
            while (currentNode) {
                allTextNodes.push(currentNode);
                currentNode = treeWalker.nextNode();
            }
        }
    });
    // 此时，allTextNodes 数组包含了所有符合条件元素内的文本节点，且避免了重复计数


    // 清除上个高亮
    CSS.highlights.clear()
    
    // 为空判断
    const str = value.trim().toLowerCase()
    if (!str) return
    
/*
    // 查找所有文本节点是否包含搜索词
    const ranges = allTextNodes
        .map((el) => {
            return { el, text: el.textContent.toLowerCase() }
        })
        .map(({ el, text }) => {
            const indices = []
            let startPos = 0
            while (startPos < text.length) {
                const index = text.indexOf(str, startPos)
                if (index === -1) break
                indices.push(index)
                startPos = index + str.length
            }
    
            // 根据搜索词的位置创建选区
            return indices.map((index) => {
                const range = new Range()
                range.setStart(el, index)
                range.setEnd(el, index + str.length)
                return range
            })
        })
*/
// 替换为：
    // 查找所有文本节点是否包含搜索词，并创建对应的 Range 对象
    let ranges = [];
    allTextNodes.forEach((node) => {
        const textContent = node.textContent.toLowerCase();
        let startIndex = 0;
        while ((startIndex = textContent.indexOf(str, startIndex)) !== -1) {
            const range = document.createRange();
            try {
                range.setStart(node, startIndex);
                range.setEnd(node, startIndex + str.length);
                ranges.push(range);
            } catch (error) {
                console.error("Error setting range in node:", node, error);
            }
            startIndex += str.length;
        }
    });





    // 创建高亮对象
    const searchResultsHighlight = new Highlight(...ranges.flat())
    resultCount.value = ranges.flat().length
    resultRange.value = ranges.flat()
    console.log(ranges.flat())

    // 注册高亮
    CSS.highlights.set("search-results", searchResultsHighlight)

    // 滚动页面
    // scroollIntoRanges(resultIndex.value)
}
function scroollIntoRanges(index: number) {
    const ranges = resultRange.value as Range[]
    const range = ranges[index]
    const parent = range.commonAncestorContainer.parentElement
    parent.scrollIntoView({ behavior: 'smooth', block: "center" })

    CSS.highlights.set("search-focus", new Highlight(range))
}
function clickLast() {
    if (resultIndex.value > 1) {
        resultIndex.value = resultIndex.value - 1
    }
    else if (resultIndex.value <= 1) {
        resultIndex.value = resultCount.value
    }
    scroollIntoRanges(resultIndex.value -1)
}
function clickNext() {
    if (resultIndex.value < resultCount.value) {
        resultIndex.value = resultIndex.value + 1
    }
    else if (resultIndex.value >= resultCount.value || resultCount.value != 0) {
        resultIndex.value = 1
    }
    else if (resultCount.value = 0) {
        resultIndex.value = 0
    }
    scroollIntoRanges(resultIndex.value -1)
}
function clickClose() {
    props.element.remove()
    // 清除高亮
    CSS.highlights.clear()
}
</script>

<style scoped>
.search-dialog {
    display: flex;
    align-items: center;
    margin-top: 5px;
}
.search-input {
margin-right: 10px;
}
.search-tools {
    display: flex;
    align-items: center;
    margin-left: 5px;
}
.search-tools > div {
    display: flex;
}
.icon--14_14 {
    width: 14px;
    height: 14px;
    margin: 5px;
}
</style>