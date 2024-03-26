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
            <div @click="clickLast" @mouseover.stop="showToolTip($event, '上一个')">
                <Svg icon="#iconBack" class="icon--14_14"></Svg>
            </div>
            <div @click="clickNext" @mouseover.stop="showToolTip($event, '下一个')">
                <Svg icon="#iconForward" class="icon--14_14"></Svg>
            </div>
            <div @click="clickClose" @mouseover.stop="showToolTip($event, '关闭')">
                <Svg icon="#iconClose" class="icon--14_14"></Svg>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Svg from "./Svg.vue"
import { showToolTip } from "./utils/showtips";

const searchText = ref("")
const resultCount = ref(0)
const resultIndex = ref(0)
const resultRange = ref()
const placeholder = "搜索"

const props = defineProps<{
    document: Element,
    element: Element,
}>()

// REF: https://juejin.cn/post/7199438741533376573
// 使用 [CSS 自定义高亮 API - Web API 接口参考 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/CSS_Custom_Highlight_API)
// 兼容性：Chrome、Edge (105+), Safari (17.2+), firefox (寄), Electron (思源使用的版本 > 28.0, 可以使用这个 API)
function highlightHitResult(value: string) {
    
    // 创建 createTreeWalker 迭代器，用于遍历文本节点，保存到一个数组
    const treeWalker = document.createTreeWalker(props.document, NodeFilter.SHOW_TEXT)
    const allTextNodes: Node[] = []
    let currentNode = treeWalker.nextNode()
    while (currentNode) {
        allTextNodes.push(currentNode)
        currentNode = treeWalker.nextNode()
    }

    // todo: 过滤非内容块节点
    // console.log(allTextNodes)
    // allTextNodes.map(node => {
        
    // })
    
    // 清除上个高亮
    CSS.highlights.clear()
    
    // 为空判断
    const str = value.trim().toLowerCase()
    if (!str) return
    
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
    
    // 创建高亮对象
    const searchResultsHighlight = new Highlight(...ranges.flat())
    resultCount.value = ranges.flat().length
    resultRange.value = ranges.flat()
    console.log(ranges.flat())

    // 注册高亮
    CSS.highlights.set("search-results", searchResultsHighlight)
}
function scroollIntoRanges(index: number) {
    const ranges = resultRange.value as Range[]
    const range = ranges[index]
    const parent = range.commonAncestorContainer.parentElement
    parent.scrollIntoView({ behavior: 'smooth', inline: "center" })

    CSS.highlights.set("search-focus", new Highlight(range))
}
function clickLast() {
    if (resultIndex.value > 1) {
        resultIndex.value = resultIndex.value - 1
    }
    scroollIntoRanges(resultIndex.value -1)
}
function clickNext() {
    if (resultIndex.value < resultCount.value) {
        resultIndex.value = resultIndex.value + 1
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