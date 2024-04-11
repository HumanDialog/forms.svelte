<script lang="ts">
    import {setContext, getContext, afterUpdate} from 'svelte'
    import {KanbanColumnBottom, KanbanColumnTop, rKanban_definition} from './Kanban'
    import {parseWidthDirective, clearActiveItem, getPrev, getNext, remove, insertAt, insertAfter, swapElements} from '../../utils' 
    import {contextItemsStore, contextTypesStore, data_tick_store } from '../../stores'
    import Column from './internal/kanban.column.svelte'
	import { informModification, pushChanges } from '$lib/updates';
    
    export let title:               string = ''
    
    export let c = '';

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
        
    
    export function reredner()
    {
        
    }

    export function reload()
    {
        definition.items = null;
    }

    export function getColumnIdx(item)
    {
        return definition.columns.findIndex( c => c.state == item[definition.stateAttrib]);
    }

    let columns = []

    afterUpdate( () =>
    {
        for(let i=1; i<columns.length; i++)
        {
            let left_column = columns[i-1];
            let right_column = columns[i];
            const left_column_height = left_column.getHeight()
            const right_column_height = right_column.getHeight()
            if(left_column_height > right_column_height)
            {
                left_column.setBorder(left_column.SET_RIGHT)
                right_column.setBorder(right_column.CLEAR_LEFT)
            }
            else
            {
                left_column.setBorder(left_column.CLEAR_RIGHT)
                right_column.setBorder(right_column.SET_LEFT)
            }

        }
    })

    export function showMoveOperationsForItem(item)
    {
        columns.forEach( c => {
            const card = c.findCardByItem(item)
            if(card)
                card.showMoveOperations()
        })
    }

    export function scrollViewToCard(item)
    {
        columns.forEach( c => {
            const card = c.findCardByItem(item)
            if(card)
                card._scrollViewToCard()
        })
    }

    function onMoveUp(item: object)
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

    function onMoveDown(item: object)
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
    function reorderElements(items: object[], from :object | null = null)
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

        pushChanges();
    }

    function onReplace(item, toColumnIdx, afterElement) 
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

        switch(afterElement)
        {
        case KanbanColumnTop:
            if((!toListTop) || (toListTop[oa] > item[oa]))
            {
                item[sa] = toColumnState
                informModification(item, sa)
            }
            else
            {
                const prevItem = getPrev(allItems, toListTop)
                if(!prevItem)
                {
                    item[sa] = toColumnState;
                    item[oa] = toListTop[oa] - ORDER_STEP;
                    informModification(item, sa);
                    informModification(item, oa);

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
                        reorderElements(allItems, prevItem)
                        prevOrder = prevItem[oa];
                        nextOrder = toListTop[oa];
                        orderSpace = nextOrder - prevOrder;
                    }
                
                    item[sa] = toColumnState;
                    item[oa] = prevOrder + Math.floor(orderSpace / 2);
                    informModification(item, sa);
                    informModification(item, oa);

                    
                    remove(allItems, item)
                    insertAfter(allItems, prevItem, item);
                }
            }
            pushChanges();
            fromColumn.reload()
            toColumn.reload()
            return;

        case KanbanColumnBottom:
        default:
            if((!toListBottom) || (item[oa] > toListBottom[oa]))
            {
                item[sa] = toColumnState;
                informModification(item, sa)
            }
            else
            {
                const nextItem = getNext(allItems, toListBottom)
                if(!nextItem)
                {
                    item[sa] = toColumnState;
                    item[oa] = toListBottom[oa] + ORDER_STEP;
                    informModification(item, sa);
                    informModification(item, oa);

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
                        reorderElements(allItems, toListBottom)
                        prevOrder = toListBottom[oa];
                        nextOrder = nextItem[oa];
                        orderSpace = nextOrder - prevOrder;
                    }
                    
                    item[sa] = toColumnState;
                    item[oa] = prevOrder + Math.floor(orderSpace / 2);
                    informModification(item, sa);
                    informModification(item, oa);

                    remove(allItems, item)
                    insertAfter(allItems, toListBottom, item)
                }
            }
            pushChanges();

            fromColumn.reload()
            toColumn.reload()

            return;
        }
	}

</script>

<slot/> <!-- Launch definition settings -->

{#if title}
    <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">{title}</p>
    <!--hr class="hidden sm:block w-full"-->
{/if}

<section class="h-full mt-5 flex flex-row no-wrap  sm:justify-center  overflow-x-auto {user_class}">
    {#each definition.columns as column, idx (column.id)}
        <Column currentColumnIdx={idx}
                {showMoveOperationsForItem}
                {scrollViewToCard}
                {onReplace}
                {onMoveUp}
                {onMoveDown}
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
            
        </Column>
    {/each}
</section>

<style>
    .grid-1
    {
        display: grid;
        grid-template-columns: 100%;
    }

    .grid-2
    {
        display: grid;
        grid-template-columns: 50% 50%;
    }

    .grid-3
    {
        display: grid;
        grid-template-columns: 33% 33% 33%;
    }

    .grid-4
    {
        display: grid;
        grid-template-columns: 25% 25% 25% 25%;
    }
    .grid-5
    {
        display: grid;
        grid-template-columns: 20% 20% 20% 20% 20%;
    }
    .grid-6
    {
        display: grid;
        grid-template-columns: 16.6% 16.6% 16.6% 16.6% 16.6% 16.6;
    }
    .grid-7
    {
        display: grid;
        grid-template-columns: 14.3% 14.3% 14.3% 14.3% 14.3% 14.3% 14.3%;
    }
    .grid-8
    {
        display: grid;
        grid-template-columns: 12.5% 12.5% 12.5% 12.5% 12.5% 12.5% 12.5% 12.5%;
    }

</style>
