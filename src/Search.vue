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
        <span class="search-count" 
              :class="{ 'search-count--draggable': !isMobile() }"
              @mousedown="handleMouseDown">{{ resultIndex + "/" + resultCount }}</span>
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
import { ref, onMounted, onUnmounted, defineProps } from "vue";
import Svg from "./Svg.vue"
import { isMobile } from "./index"

const searchText = ref("")
const resultCount = ref(0)
const resultIndex = ref(0)
const resultRange = ref()
const placeholder = "🔍︎ (Shift) + Enter"

const props = defineProps<{
    edit: Element,
    element: Element,
    plugin: any, // 插件实例
}>()

// 设置焦点到输入框，并全选内容
onMounted(() => {
    const inputElement = props.element.querySelector('.search-dialog .b3-text-field') as HTMLInputElement;
    if (inputElement) {
        // 检查是否有预设的文本值（通过 data 属性传递）
        const presetText = props.element.getAttribute('data-preset-text');
        if (presetText) {
            props.element.removeAttribute('data-preset-text');
            // 如果有预设文本，设置到输入框并执行搜索
            searchText.value = presetText;
            inputElement.value = presetText;
            inputElement.focus();
            highlightHitResult(presetText, true);
        } else {
            // 没有预设文本，按照原来的逻辑
            inputElement.focus();
            inputElement.select();
        }
    }
    
    // 通知插件类组件已挂载
    props.plugin?.onSearchComponentMounted?.(eventBusHandle);
});

// 组件卸载时通知插件类
onUnmounted(() => {
    props.plugin?.onSearchComponentUnmounted?.(eventBusHandle);
});

// 拖拽处理函数
function handleMouseDown(event: MouseEvent) {
    if (isMobile()) return;
    // console.log("handleMouseDown: ", event);
    // 获取整个搜索对话框元素
    const searchDialog = (event.currentTarget as HTMLElement).closest('.search-dialog') as HTMLElement;
    
    // 使用插件提供的全局拖拽功能
    props.plugin?.startDragging?.(searchDialog, event.clientX, event.clientY);
    
    // 防止文本选择
    event.preventDefault();
}

function eventBusHandle(event: CustomEvent) {
    // console.log("event.detail: ", event.detail);
    // console.log("resultIndex.value: ", resultIndex.value);
    if (["savedoc", "rename"].includes(event.detail.cmd)) {
        // console.log("eventBusHandle");
        // savedoc 之后可能有嵌入块更新，需要等一会
        clearTimeout(typingTimer);
        typingTimer = window.setTimeout(() => {
            // 这里不判断编辑的是否是当前文档才刷新高亮，因为别的文档更新可能影响当前文档的嵌入块
            // event.detail.data.rootID
            if (props.plugin?.isLastHighlightComponent?.(props.element)) {
                // 只有当前组件是最后执行 CSS.highlights.set 的组件时才执行高亮操作
                highlightHitResult(searchText.value, false);
                if (resultIndex.value >= 1) {
                    scroollIntoRanges(resultIndex.value - 1, false);
                }
            } else {
                // 不是最后高亮组件时，仅更新数字不执行高亮
                calculateSearchResults(searchText.value, false);
            }
        }, doneTypingInterval);
    } else if (["loaded-protyle-dynamic", "loaded-protyle-static", "switch-protyle"].includes(event.type)) {
        // 动态加载、静态加载、切换页签后需要刷新搜索结果并高亮，并重置 resultIndex
        clearTimeout(typingTimer);
        typingTimer = window.setTimeout(() => {
            // 这里无论是否为最后高亮组件，都重置 resultIndex，避免索引错位
            resultIndex.value = 0; // 文档加载或切换后重置索引
            if (props.plugin?.isLastHighlightComponent?.(props.element)) {
                // 只有当前组件是最后执行 CSS.highlights.set 的组件时才执行高亮操作
                highlightHitResult(searchText.value, false);
            } else {
                // 不是最后高亮组件时，仅更新数字不执行高亮
                calculateSearchResults(searchText.value, false);
            }
        }, doneTypingInterval);
    }
}

// 当文本框内容变动后超过0.4秒没有再次变动时，会触发 highlightHitResult 函数
let typingTimer: number | undefined; // 更新这里，初始化为 undefined
const doneTypingInterval = 400; // 0.4秒

function handleInput() {
    clearTimeout(typingTimer); // 清除之前的定时器
    typingTimer = window.setTimeout(() => { // 使用 window.setTimeout 并更新这里
        highlightHitResult(searchText.value, true); // 使用 .value 访问响应式变量的值
    }, doneTypingInterval);
}

// 计算搜索结果并更新数字，不执行高亮操作
function calculateSearchResults(value: string, change: boolean) {
    // 为空判断
    const str = value.trim().toLowerCase()
    if (!str) {
        // 当搜索文本为空时，清除已有的高亮
        // 但不需要重置计数，方便撤回文本框编辑的时候恢复索引位置
        CSS.highlights.clear();
        return [];
    }

    // 如果文本框内容改变，搜索结果和索引计数都立刻清零
    if (change == true) {
        resultIndex.value = 0
        resultCount.value = 0
    }

    // 获取文档根,后续直接对全文档文本进行搜索
    const docRoot = props.edit.querySelector('.protyle:not(.fn__none) :is(.protyle-content:not(.fn__none) .protyle-wysiwyg, .protyle-preview:not(.fn__none) .b3-typography)') as HTMLElement;
    const docText = docRoot.textContent.toLowerCase();

    // 准备一个数组来保存所有文本节点
    const allTextNodes = [];
    let incr_lens = [];
    let cur_len0 = 0;

    const treeWalker = document.createTreeWalker(docRoot, NodeFilter.SHOW_TEXT);
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
        allTextNodes.push(currentNode);
        cur_len0 += currentNode.textContent.length
        incr_lens.push(cur_len0);
        currentNode = treeWalker.nextNode();
    }

    let textNodeCnt = allTextNodes.length
    let cur_nodeIdx = 0;
    let txtNode
    // 查找所有文本节点是否包含搜索词，并创建对应的 Range 对象
    // 把全局匹配索引转换为文本节点的索引和offset,使得range可以跨多个文本节点
    let ranges = [];
    let startIndex = 0;
    let endIndex = 0;
    while ((startIndex = docText.indexOf(str, startIndex)) !== -1) {
        const range = document.createRange();
        endIndex = startIndex + str.length
        try {
            while (cur_nodeIdx < textNodeCnt - 1 && incr_lens[cur_nodeIdx] <= startIndex) {
                cur_nodeIdx++
            }
            txtNode = allTextNodes[cur_nodeIdx]
            let startOffset = startIndex - incr_lens[cur_nodeIdx] + txtNode.textContent.length;
            range.setStart(txtNode, startOffset);

            while (cur_nodeIdx < textNodeCnt - 1 && incr_lens[cur_nodeIdx] < endIndex) {
                cur_nodeIdx++
            }
            txtNode = allTextNodes[cur_nodeIdx]
            let endOffset = endIndex - incr_lens[cur_nodeIdx] + txtNode.textContent.length;
            range.setEnd(txtNode, endOffset);
            
            // 排除 style 元素内的搜索结果
            // TODO: 试试改用 innerText 的效果 https://developer.mozilla.org/zh-CN/docs/Web/API/Node/textContent#与_innertext_的区别
            if (range.commonAncestorContainer.parentElement?.tagName?.toLowerCase() !== 'style') {
                ranges.push(range);
            }
        } catch (error) {
            console.error("Error setting range in node:", error);
        }
        startIndex = endIndex;
    }

    // 更新结果计数和范围
    resultCount.value = ranges.flat().length
    resultRange.value = ranges.flat()
    
    return ranges.flat()
}

// 执行高亮操作
function highlightHitResult(value: string, change: boolean) {
    const ranges = calculateSearchResults(value, change)
    
    if (ranges.length === 0) {
        // 当没有搜索结果时，清除高亮
        CSS.highlights.clear();
        return;
    }

    // 清除上个高亮
    CSS.highlights.clear()

    // 创建高亮对象
    const searchResultsHighlight = new Highlight(...ranges)
    
    // 注册高亮
    CSS.highlights.set("search-results", searchResultsHighlight)
    
    // 更新最后执行 CSS.highlights.set 的组件记录
    props.plugin?.updateLastHighlightComponent?.(props.element);
}

// 暴露函数给外部调用
defineExpose({
    highlightHitResult
});
function scroollIntoRanges(index: number, scroll: boolean = true) {
    const ranges = resultRange.value as Range[]
    if (!ranges || ranges.length === 0) {
        return
    }
    const range = ranges[index]
    // const parent = range.commonAncestorContainer.parentElement
    // parent.scrollIntoView({ behavior: 'smooth', block: "center" })

    if (scroll) {
        console.log("scrollIntoRanges: ", props.edit)
        const docContentElement = props.edit.querySelector('.protyle:not(.fn__none) :is(.protyle-content:not(.fn__none), .protyle-preview:not(.fn__none))') as HTMLElement;
        let doc_rect=docContentElement.getBoundingClientRect()
        let mid_y=doc_rect.top+doc_rect.height/2
        let range_rect = range.getBoundingClientRect();
        docContentElement.scrollBy(0,range_rect.y-mid_y)
    }
  
    CSS.highlights.set("search-focus", new Highlight(range))
    
    // 输出当前聚焦的 range 对应的元素信息
    // console.log("当前聚焦的 range 信息:", {
    //     range: range,
    //     startContainer: range.startContainer,
    //     endContainer: range.endContainer,
    //     startOffset: range.startOffset,
    //     endOffset: range.endOffset,
    //     textContent: range.toString(),
    //     commonAncestorContainer: range.commonAncestorContainer,
    //     parentElement: range.commonAncestorContainer.parentElement
    // });
    // console.log("range parentElement:", range.commonAncestorContainer.parentElement)

    // 更新最后执行 CSS.highlights.set 的组件记录
    props.plugin?.updateLastHighlightComponent?.(props.element);
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
    scroollIntoRanges(resultIndex.value - 1)
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
    scroollIntoRanges(resultIndex.value - 1)
}
function clickClose() { // 关闭
    // 清除高亮
    CSS.highlights.clear()
    // 销毁当前组件实例
    props.plugin?.closeCurrentSearchDialog?.(props.element);
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
.search-count {
    min-width: 35px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch; /* 让元素拉伸到父容器高度 */
}
.search-count--draggable {
    cursor: move; /* 显示可拖拽光标 */
    user-select: none; /* 防止文本选择 */
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