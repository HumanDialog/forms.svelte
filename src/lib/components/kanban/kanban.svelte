<script lang="ts">
    import {setContext, getContext, afterUpdate, tick} from 'svelte'
    import {KanbanColumnBottom, KanbanColumnTop, rKanban_definition} from './Kanban'
    import {parseWidthDirective, clearActiveItem, getPrev, getNext, remove, insertAt, insertAfter, swapElements, getActive} from '../../utils'
    import {contextItemsStore, contextTypesStore, data_tick_store } from '../../stores'
    import KanbanColumn from './internal/kanban.column.svelte'
	import { informModification, pushChanges } from '$lib/updates';
    import {Editable, focusEditable} from '$lib'
    export let self                 = null;
    export let title:               string = ''
    export let summary:             string = ''
    export let c = '';

    // reload selection parameter
    export const CLEAR_SELECTION = 0;
    export const KEEP_SELECTION = -1;
    export const SELECT_PREVIOUS = -2;
    export const SELECT_NEXT = -3;
    export const KEEP_OR_SELECT_NEXT = -4;

    let user_class = $$props.class ?? ''
    let definition :rKanban_definition = new rKanban_definition;
    setContext('rKanban-definition', definition);
    setContext('rIs-table-component', true);

    let     cs =  c ? parseWidthDirective(c) : 'w-full min-w-full';

    clearActiveItem('props')

    $: setup();

    function setup(...args)
    {

    }

    let renderToken = 0;
    export async function rerender(selectColumnIdx: number = -1, selectCardId :number = -1)
    {
        definition.clear();
        renderToken += 1;

        await tick();

        if(selectColumnIdx >= 0)
        {
            if(selectCardId >= 0)
            {
                columns[selectColumnIdx].activateByItemId(selectCardId)
            }
            else
            {
                columns[selectColumnIdx].activate();
            }
        }
    }

    export async function reload(data: object|object[], selectElement=KEEP_SELECTION)
    {
        let currentSelectedItem = getActive('props');
        let selectElementId = 0;
        let altSelectElementId = 0;
        let selectedColumnIdx = -1;

        const oa = definition.orderAttrib
        const sa = definition.stateAttrib
        let allItems = definition.getItems();

        switch(selectElement)
        {
        case CLEAR_SELECTION:
            selectElementId = 0;
            break;
        case KEEP_SELECTION:
            if(currentSelectedItem)
            {
                selectElementId = currentSelectedItem.Id ?? 0;
                selectedColumnIdx = definition.columns.findIndex(c => c.state == currentSelectedItem[sa])
            }
            break;
        case SELECT_PREVIOUS:
            if(currentSelectedItem)
            {
                const currentItemState = currentSelectedItem[sa]
                selectedColumnIdx = definition.columns.findIndex(c => c.state == currentItemState)

                const columnItems = allItems.filter(e => e[sa] == currentItemState)
                const columnSelected = columnItems.find(e => e.Id == currentSelectedItem.Id)
                const prevSelected = getPrev(columnItems, columnSelected)
                if(prevSelected)
                    selectElementId = prevSelected.Id
            }
            break;

        case SELECT_NEXT:
            if(currentSelectedItem)
            {
                const currentItemState = currentSelectedItem[sa]
                selectedColumnIdx = definition.columns.findIndex(c => c.state == currentItemState)

                const columnItems = allItems.filter(e => e[sa] == currentItemState)
                const columnSelected = columnItems.find(e => e.Id == currentSelectedItem.Id)
                const nextSelected = getNext(columnItems, columnSelected);
                if(nextSelected)
                    selectElementId = nextSelected.Id;
            }
            break;

        case KEEP_OR_SELECT_NEXT:
            {
                if(currentSelectedItem)
                {
                    selectElementId = currentSelectedItem.Id ?? 0;

                    const currentItemState = currentSelectedItem[sa]
                    selectedColumnIdx = definition.columns.findIndex(c => c.state == currentItemState)

                    const columnItems = allItems.filter(e => e[sa] == currentItemState)
                    const columnSelected = columnItems.find(e => e.Id == currentSelectedItem.Id)
                    const nextSelected = getNext(columnItems, columnSelected);
                    if(nextSelected)
                        altSelectElementId = nextSelected.Id;
                }

            }
            break;

        default:
            if( typeof selectElement === 'object' &&
                !Array.isArray(selectElement) &&
                selectElement !== null)
                selectElementId = selectElement.Id;
            else
                selectElementId = selectElement;
        }

        // ===================================================
        if(Array.isArray(data))
            definition.objects = data;
        else
            definition.self = data;

        definition.items = null;
        columns.forEach( c => c.reload())

        // ====================================================

        await tick();

        allItems = definition.getItems();
        if(selectElementId > 0)
        {

            if(selectedColumnIdx < 0)
            {
                let selectedElement = allItems.find(e => e.Id == selectElementId)
                if(selectedElement)
                {
                    selectedColumnIdx = getColumnIdx(selectedElement)
                    columns[selectedColumnIdx].activateByItemId(selectElementId)
                }
            }
            else
            {
                const columnState = definition.columns[selectedColumnIdx].state;
                const columnItems = allItems.filter(e => e[sa] == columnState)
                let selectedElement = allItems.find(e => e.Id == selectElementId)

                if(selectedElement == undefined)
                {
                    if(altSelectElementId > 0)
                    {
                        selectedElement = columnItems.find(e => e.Id == altSelectElementId)
                        if(selectedElement)
                            columns[selectedColumnIdx].activateByItemId(altSelectElementId)
                    }
                }
                else
                    columns[selectedColumnIdx].activateByItemId(selectElementId)
            }
        }
    }

    export function getColumnIdx(item)
    {
        let idx = definition.columns.findIndex( c => c.state == item[definition.stateAttrib]);
        if(idx >= 0)
            return idx;
        else
        {
            return definition.columns.findIndex(c => c.state < 0)
        }
    }

    export function edit(item: object, field: string)
    {
        const columnIdx = getColumnIdx(item)
        if(columnIdx >=0)
        {
            const column = columns[columnIdx];
            const card = column.findCardByItem(item);
            if(card)
                card.editProperty(field)
        }
    }

    export function editTitle()
    {
        focusEditable(title)
    }

    export function editSummary()
    {
        focusEditable(summary)
    }

    let columns = []


    export function scrollViewToCard(item)
    {
        columns.forEach( c => {
            const card = c.findCardByItem(item)
            if(card)
                card._scrollViewToCard()
        })
    }

    export function moveUp(item: object)
    {
        const columnIdx = getColumnIdx(item)
        let allItems = definition.getItems();

        const oa = definition.orderAttrib
        const sa = definition.stateAttrib
        const column = columns[columnIdx]
        const columnState = definition.columns[columnIdx].state

        let prev = allItems.findLast(e => e[sa] == columnState && e[oa] < item[oa])
        if(!prev)
            return;

        swapElements(allItems, item, prev);
        [item[oa], prev[oa]] = [prev[oa], item[oa]]

        informModification(item, oa)
        informModification(prev, oa)
        pushChanges()

        column.reload()
    }

    export function moveDown(item: object)
    {
        const columnIdx = getColumnIdx(item)
        let allItems = definition.getItems();

        const oa = definition.orderAttrib
        const sa = definition.stateAttrib
        const column = columns[columnIdx]
        const columnState = definition.columns[columnIdx].state

        let next = allItems.find(e => e[sa] == columnState && e[oa] > item[oa])
        if(!next)
            return;

        swapElements(allItems, item, next);
        [item[oa], next[oa]] = [next[oa], item[oa]]

        informModification(item, oa)
        informModification(next, oa)
        pushChanges();

        column.reload();
    }

    const ORDER_STEP = 64;
    const MIN_ORDER = 0;
    function reorderElements(items: object[], from :object | null = null, pushImediatelly=true)
    {
        const oa = definition.orderAttrib
        let fromIdx;
        let fromOrder;
        if(from)
        {
            fromOrder = from[oa];
            fromIdx = items.findIndex(e => e == from);
        }
        else
        {
            fromOrder = MIN_ORDER;
            fromIdx = 0;
        }

        let order = fromOrder;
        for(let i=fromIdx; i<items.length; i++)
        {
            let el = items[i];

            el[oa] = order;
            informModification(el, oa)

            order += ORDER_STEP;
        }

        if(pushImediatelly)
            pushChanges();
    }

    export async function replace(item, toColumnIdx, afterElement)
    {

        const fromColumnIdx = getColumnIdx(item)
        let allItems = definition.getItems();

        const oa = definition.orderAttrib
        const sa = definition.stateAttrib
        const toColumnState = definition.columns[toColumnIdx].state

        const toListTop = allItems.find(e => e[sa] == toColumnState)
        const toListBottom = allItems.findLast(e => e[sa] == toColumnState)

        const fromColumn = columns[fromColumnIdx]
        const toColumn = columns[toColumnIdx];

        const propsChanges = {
            order: -1,
            state: -1
        }

        switch(afterElement)
        {
        case KanbanColumnTop:
            if((!toListTop) || (toListTop[oa] > item[oa]))
            {
                //item[sa] = toColumnState
                //informModification(item, sa)

                propsChanges.state = toColumnState
            }
            else
            {
                const prevItem = getPrev(allItems, toListTop)
                if(!prevItem)
                {
                    //item[sa] = toColumnState;
                    //informModification(item, sa);

                    item[oa] = toListTop[oa] - ORDER_STEP;
                    informModification(item, oa);
                    propsChanges.state = toColumnState;
                    propsChanges.order = item[oa];

                    remove(allItems, item);
                    insertAt(allItems, 0, item);
                }
                else
                {
                    let prevOrder = prevItem[oa];
                    let nextOrder = toListTop[oa];
                    let orderSpace = nextOrder - prevOrder;
                    if(orderSpace < 2)
                    {
                        reorderElements(allItems, prevItem, false)
                        prevOrder = prevItem[oa];
                        nextOrder = toListTop[oa];
                        orderSpace = nextOrder - prevOrder;
                    }

                    //item[sa] = toColumnState;
                    //informModification(item, sa);

                    item[oa] = prevOrder + Math.floor(orderSpace / 2);
                    informModification(item, oa);
                    propsChanges.state = toColumnState
                    propsChanges.order = item[oa];


                    remove(allItems, item)
                    insertAfter(allItems, prevItem, item);
                }
            }
            //pushChanges();
            //fromColumn.reload()
            //toColumn.reload()
            break;

        case KanbanColumnBottom:
        default:
            if((!toListBottom) || (item[oa] > toListBottom[oa]))
            {
                //item[sa] = toColumnState;
                //informModification(item, sa)
                propsChanges.state = toColumnState
            }
            else
            {
                const nextItem = getNext(allItems, toListBottom)
                if(!nextItem)
                {
                    //item[sa] = toColumnState;
                    //informModification(item, sa);

                    item[oa] = toListBottom[oa] + ORDER_STEP;
                    informModification(item, oa);

                    propsChanges.state = toColumnState
                    propsChanges.order = item[oa];

                    remove(allItems, item);
                    insertAfter(allItems, toListBottom, item)
                }
                else
                {
                    let nextOrder = nextItem[oa];
                    let prevOrder = toListBottom[oa];
                    let orderSpace = nextOrder - prevOrder;
                    if(orderSpace < 2)
                    {
                        reorderElements(allItems, toListBottom, false)
                        prevOrder = toListBottom[oa];
                        nextOrder = nextItem[oa];
                        orderSpace = nextOrder - prevOrder;
                    }

                    //item[sa] = toColumnState;
                    //informModification(item, sa);

                    item[oa] = prevOrder + Math.floor(orderSpace / 2);
                    informModification(item, oa);

                    propsChanges.state = toColumnState
                    propsChanges.order = item[oa]

                    remove(allItems, item)
                    insertAfter(allItems, toListBottom, item)
                }
            }
            //pushChanges();

            //fromColumn.reload()
            //toColumn.reload()

            break;
        }

        if(definition.onReplace)
        {
            // there was some changes in order, mayby even reorderElements
            if(propsChanges.state >= 0)
            {
                pushChanges();
            }

            const req = {
                [sa]: propsChanges.state,
                item: item,
                toColumn: toColumnIdx
            }

            await definition.onReplace(req)
        }
        else
        {
            if(propsChanges.state >= 0)
            {
                item[sa] = propsChanges.state
                informModification(item, sa)
            }

            pushChanges();
            fromColumn.reload()
            toColumn.reload()
        }
	}

    async function onInsert(columnIdx: number, title: string, summary: string, afterId: number)
    {
        const columnState = definition.columns[columnIdx].state;
        const oa = definition.orderAttrib
        const sa = definition.stateAttrib

        const allItems = definition.getItems();

        const columnTop = allItems.find(e => e[sa] == columnState)
        const columnBottom = allItems.findLast(e => e[sa] == columnState)

        let newElement = {
            [definition.titleAttrib]: title,
            [definition.summaryAttrib]: summary,
            [sa]: columnState
        }

        if(afterId == KanbanColumnTop)
        {
            if(!columnTop)
            {
                let maxOrder = 0;
                if(allItems.length > 0)
                {
                    const lastItem = allItems[allItems.length-1]
                    maxOrder = lastItem[oa]
                }

                newElement[oa] = maxOrder + ORDER_STEP
            }
            else
            {
                const prevItem = getPrev(allItems, columnTop);
                if(prevItem)
                {
                    let prevOrder = prevItem[oa];
                    let nextOrder = columnTop[oa];
                    let orderSpace = nextOrder - prevOrder;
                    if(orderSpace < 2)
                    {
                        reorderElements(allItems, prevItem);
                        prevOrder = prevItem[oa];
                        nextOrder = columnTop[oa];
                        orderSpace = nextOrder - prevOrder;
                    }
                    const newOrder = prevOrder + Math.floor(orderSpace / 2)
                    newElement[oa] = newOrder
                }
                else
                {
                    newElement[oa] = columnTop[oa] - ORDER_STEP
                }
            }
        }
        else if(afterId == KanbanColumnBottom)
        {
            if(!columnBottom)
            {
                let maxOrder = 0;
                if(allItems.length > 0)
                {
                    const lastItem = allItems[allItems.length-1]
                    maxOrder = lastItem[oa]
                }

                newElement[oa] = maxOrder + ORDER_STEP
            }
            else
            {
                const nextItem = getNext(allItems, columnBottom);
                if(nextItem)
                {
                    let nextOrder = nextItem[oa];
                    let prevOrder = columnBottom[oa];
                    let orderSpace = nextOrder - prevOrder;
                    if(orderSpace < 2)
                    {
                        reorderElements(allItems, columnBottom)
                        nextOrder = nextItem[oa];
                        prevOrder = columnBottom[oa];
                        orderSpace = nextOrder - prevOrder;
                    }
                    const newOrder = prevOrder + Math.floor(orderSpace / 2);
                    newElement[oa] = newOrder
                }
                else
                {
                    newElement[oa] = columnBottom[oa] + ORDER_STEP
                }
            }
        }
        else
        {
            const prevItem = allItems.find(e => e.Id == afterId)
            if(!prevItem)
            {
                let maxOrder = 0;
                if(allItems.length > 0)
                {
                    const lastItem = allItems[allItems.length-1]
                    maxOrder = lastItem[oa]
                }

                newElement[oa] = maxOrder + ORDER_STEP
            }
            else
            {
                const nextItem = getNext(allItems, prevItem)
                if(nextItem)
                {
                    let nextOrder = nextItem[oa];
                    let prevOrder = prevItem[oa];
                    let orderSpace = nextOrder - prevOrder;
                    if(orderSpace < 2)
                    {
                        reorderElements(allItems, prevItem)
                        nextOrder = nextItem[oa];
                        prevOrder = prevItem[oa];
                        orderSpace = nextOrder - prevOrder;
                    }
                    const newOrder = prevOrder + Math.floor(orderSpace / 2);
                    newElement[oa] = newOrder
                }
                else
                {
                    newElement[oa] = prevItem[oa] + ORDER_STEP
                }
            }

        }

        // ======================
        if(definition.onAdd)
            await definition.onAdd(newElement, columnIdx)
    }

    export function activateColumn(columnIdx: number)
    {
        columns[columnIdx].activate();
    }

    export function editColumnName(columnIdx: number, onFinish: Function|undefined = undefined)
    {
        columns[columnIdx].editName(onFinish)
    }

    export function moveCardsTo(items: object[], toColumnIdx: number)
    {
        items.forEach(item =>
            replace(item, toColumnIdx, KanbanColumnBottom)
        )
    }

    export function setCardsState(items: object[], state: number)
    {
        const sa = definition.stateAttrib
        items.forEach(item => {
                item[sa] = state
                informModification(item, sa)
            })

        pushChanges();
    }

    export function add(item: object|number, columnIdx: number = -1)
    {
        if(columnIdx < 0)
            columnIdx = getColumnIdx(item)
        columns[columnIdx].add(item)
    }

</script>

{#key renderToken}
<slot/> <!-- Launch definition settings -->

    <figure class="px-0 sm:px-4">
    <h1><Editable self={self} a={title}/></h1>
    <figcaption><Editable self={self} a={summary}/></figcaption>
    </figure>

    <!--hr class="hidden sm:block w-full"-->

<section    id="__hd_svelte_kanban_columns_container"
            class="h-full flex flex-row no-wrap
                overflow-x-auto snap-x snap-mandatory
                sm: space-x-0
                sm:divide-x
                divide-stone-500 dark:divide-stone-700
                pb-20
                "> <!--sm:justify-center -->
    {#each definition.columns as column, idx (column.id)}
        <KanbanColumn currentColumnIdx={idx}
                {onInsert}
                bind:this={columns[idx]}>


            <svelte:fragment slot="kanbanCardTopProps" let:element>
                <slot name="kanbanCardTopProps" {element}/>
            </svelte:fragment>

            <svelte:fragment slot="kanbanCardMiddleProps" let:element>
                <slot name="kanbanCardMiddleProps" {element}/>
            </svelte:fragment>

            <svelte:fragment slot="kanbanCardBottomProps" let:element>
                <slot name="kanbanCardBottomProps" {element}/>
            </svelte:fragment>

        </KanbanColumn>
    {/each}
</section>
{/key}
