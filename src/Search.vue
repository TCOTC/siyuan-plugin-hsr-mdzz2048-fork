<template>
    <div class="search-dialog">
        <div class="b3-form__icon search-input">
            <input
                type="text"
                class="b3-text-field fn__size200"
                spellcheck="false"
                :placeholder="placeholder"
                v-model="searchText"
                @keydown.enter.exact="clickNext()"
                @keydown.shift.enter="clickLast()"
                @keydown.esc.exact="clickClose()"
                @input="handleInput"
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
                <Svg icon="#iconClose" class="icon--14_14"></Svg>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onMounted } from 'vue';
import { defineProps } from 'vue';
import Svg from "./Svg.vue"

const searchText = ref("")
const resultCount = ref(0)
const resultIndex = ref(0)
const resultRange = ref()
const placeholder = "🔍︎ (Shift) + Enter"

const props = defineProps<{
    document: Element,
    element: Element,
}>()

// 设置焦点到输入框，并全选内容
onMounted(() => {
  const inputElement = document.querySelector('.highlight-search-result .search-dialog .b3-text-field');
  if (inputElement) {
    inputElement.focus();
    inputElement.select();
  }
});

// 当文本框内容变动后超过0.4秒没有再次变动时，会触发 highlightHitResult 函数
let typingTimer: number | undefined; // 更新这里，初始化为 undefined
const doneTypingInterval = 400; // 0.4秒

function handleInput() {
    clearTimeout(typingTimer); // 清除之前的定时器
    typingTimer = window.setTimeout(() => { // 使用 window.setTimeout 并更新这里
        highlightHitResult(searchText.value, true); // 使用 .value 访问响应式变量的值
    }, doneTypingInterval);
}

function highlightHitResult(value: string, change: boolean) { // 搜索并高亮结果

    // 如果文本框内容改变，搜索结果和索引计数都立刻清零
    if (change == true) {
        resultIndex.value = 0
        resultCount.value = 0
    }

    // 首先，选取所有符合条件的元素
    // const elements = document.querySelectorAll('.layout-tab-container > div:not(.fn__none) .protyle-wysiwyg [data-node-id]');
    // 获取文档根,后续直接对全文档文本进行搜索,
    const docRoot = props.document.querySelector('.layout-tab-container > div:not(.fn__none) .protyle-wysiwyg') as HTMLElement;
    //console.log("docRoot:")
    //console.log(docRoot)
    const docText=docRoot.textContent.toLowerCase();
    const docLen=docText.length;

    // 准备一个数组来保存所有文本节点
    const allTextNodes = [];
    let incr_lens = [];
    let cur_len0=0;

    const treeWalker = document.createTreeWalker(docRoot, NodeFilter.SHOW_TEXT);
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
        allTextNodes.push(currentNode);
        cur_len0+=currentNode.textContent.length
        incr_lens.push(cur_len0);
        currentNode = treeWalker.nextNode();
    }

    // 清除上个高亮
    CSS.highlights.clear()

    // 为空判断
    const str = value.trim().toLowerCase()
    if (!str) return
    let textNodeCnt=allTextNodes.length
    let cur_nodeIdx=0;
    let txtNode
    // 查找所有文本节点是否包含搜索词，并创建对应的 Range 对象
    // 把全局匹配索引转换为文本节点的索引和offset,使得range可以跨多个文本节点
    let ranges = [];
    let startIndex = 0;
    let endIndex=0;
    while ((startIndex = docText.indexOf(str, startIndex)) !== -1) {
        const range = document.createRange();
        endIndex=startIndex + str.length
        // console.log(`开始结束索引:${startIndex}-${endIndex}`)
        try {
            while (cur_nodeIdx<textNodeCnt-1 && incr_lens[cur_nodeIdx]<=startIndex){
              cur_nodeIdx++
            }
            txtNode= allTextNodes[cur_nodeIdx]
            let startOffset=startIndex-incr_lens[cur_nodeIdx]+txtNode.textContent.length;
            // console.log(`cur_nodeIdx:${cur_nodeIdx}|offset:${startOffset}|txtNode:${txtNode.textContent}`)
            range.setStart(txtNode, startOffset);

            while (cur_nodeIdx<textNodeCnt-1 && incr_lens[cur_nodeIdx]<endIndex){
              cur_nodeIdx++
            }
            txtNode= allTextNodes[cur_nodeIdx]
            let endOffset=endIndex-incr_lens[cur_nodeIdx]+txtNode.textContent.length;
            range.setEnd(txtNode,endOffset);
            ranges.push(range);
        } catch (error) {
            console.error("Error setting range in node:", error);
        }
        startIndex = endIndex;
    }
    // 创建高亮对象
    const searchResultsHighlight = new Highlight(...ranges.flat())
    resultCount.value = ranges.flat().length
    resultRange.value = ranges.flat()
    // console.log(ranges.flat())

    // 注册高亮
    CSS.highlights.set("search-results", searchResultsHighlight)
    // 滚动页面
    // scroollIntoRanges(resultIndex.value)
}
function scroollIntoRanges(index: number) {
    const ranges = resultRange.value as Range[]
    const range = ranges[index]
    // const parent = range.commonAncestorContainer.parentElement
    // parent.scrollIntoView({ behavior: 'smooth', block: "center" })

    const docContentElement  = props.document.querySelector('.layout-tab-container > div:not(.fn__none) >.protyle-content') as HTMLElement;
    let doc_rect=docContentElement.getBoundingClientRect()
    let mid_y=doc_rect.top+doc_rect.height/2
    let range_rect = range.getBoundingClientRect();
    docContentElement.scrollBy(0,range_rect.y-mid_y)
  
    CSS.highlights.set("search-focus", new Highlight(range))
}
function clickLast() { // 上一个
    highlightHitResult(searchText.value, false)
    if ((resultIndex.value > 1 && resultIndex.value <= resultCount.value) && resultCount.value != 0) {
        resultIndex.value = resultIndex.value - 1
    }
    else if ((resultIndex.value <= 1 || resultIndex.value > resultCount.value) && resultCount.value != 0) {
        resultIndex.value = resultCount.value
    }
    else if (resultCount.value == 0) {
        resultIndex.value = 0
    }
    scroollIntoRanges(resultIndex.value -1)
}
function clickNext() { // 下一个
    highlightHitResult(searchText.value, false)
    if (resultIndex.value < resultCount.value) {
        resultIndex.value = resultIndex.value + 1
    }
    else if (resultIndex.value >= resultCount.value && resultCount.value != 0) {
        resultIndex.value = 1
    }
    else if (resultCount.value == 0) {
        resultIndex.value = 0
    }
    scroollIntoRanges(resultIndex.value -1)
}
function clickClose() { // 关闭
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
margin-right: 5px;
}
.search-tools {
    display: flex;
    align-items: center;
}
.search-tools > div {
    display: flex;
    margin-left: 5px;
    align-items: center;
}
.icon--14_14 {
    width: 14px;
    height: 14px;
    margin: 5px;
}
</style>