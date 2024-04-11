<script lang="ts">
    import {getContext, afterUpdate, tick} from 'svelte'
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../../../stores'
    import {getActive, activateItem } from '../../../utils.js'
    import Card from './kanban.card.svelte'
    import {KanbanColumnTop, KanbanColumnBottom} from '../Kanban'
    import Inserter from './kanban.inserter.svelte'
    import {FaPlus} from 'svelte-icons/fa'
    import type{rKanban_definition, rKanban_column } from '../Kanban'
    import {getNext, getPrev, getFirst, getLast, swapElements} from '../../../utils.js'
    import {informModification, pushChanges} from '../../../updates.js'


    export let currentColumnIdx :number
    
    export let showMoveOperationsForItem: Function | undefined = undefined;
    export let scrollViewToCard: Function | undefined = undefined;
    export let onReplace: Function;
    export let onMoveUp: Function;
    export let onMoveDown: Function;

    let column_element: HTMLElement;
    export function getHeight()
    {
        return column_element.getBoundingClientRect().height
    }

    export const SET_LEFT = 0;
    export const SET_RIGHT = 1;
    export const CLEAR_LEFT = 2;
    export const CLEAR_RIGHT = 3;
    export function setBorder(what_to_do: number)
    {
        switch(what_to_do)
        {
            case SET_LEFT:
                column_element.classList.add('border-l')
                break;
            case SET_RIGHT:
                column_element.classList.add('border-r')
                break;
            case CLEAR_LEFT:
                column_element.classList.remove('border-l')
                break;
            case CLEAR_RIGHT:
                column_element.classList.remove('border-r')
                break;
        }
    }

    let definition :rKanban_definition = getContext("rKanban-definition");
    let column_def: rKanban_column = definition.columns[currentColumnIdx];

    let     column_items :object[] | undefined = undefined;
    
    let width_class = column_def.width ? `w-11/12 sm:${column_def.width}` : 'w-11/12 sm:w-[240px]'

    $: setup_data();
    $: force_rerender($data_tick_store, $contextItemsStore)

    export function reload()
    {
        if(definition.stateAttrib)
            column_items = definition.getItems().filter( e => e[definition.stateAttrib] == column_def.state)
    }

    function setup_data(...args)
    {
        reload();
    }

    function force_rerender(...args)
    {
        column_items = [...column_items];
    }


    let cards = [];
    export function findCardByItem(item: object): any
    {
        if(!cards)
            return null;

        const item_idx = column_items?.findIndex( i => i == item)
        if(item_idx >= 0)
        {
            return cards[item_idx]
        }
        else
            return null;
    }

    

    let inserter;
    const None = 0
    let showInserterAfter :object|number = None
    let activateAfterDomUpdate :object|null = null;
    let lastActivatedElement :object|null = null;

    export async function add(after :object|number = KanbanColumnTop)
    {
        if(!definition.onAdd)
            return;

        showInserterAfter = after ?? KanbanColumnTop;

        if(activateAfterDomUpdate)
            activateAfterDomUpdate = null;

        lastActivatedElement = getActive('props');
        let fakeItem = {};
        activateItem('props', fakeItem)

        await tick();

        if(!inserter)
            return;

        inserter.run( async (detail) => {
            showInserterAfter = None;

            if(detail.cancel)
                activateAfterDomUpdate = lastActivatedElement;
            else  
            {
                if(detail.incremental)
                {
                    let currentActive = activateAfterDomUpdate ?? getActive('props');
                    await add(currentActive);
                }
            }
        } );
    }

    async function insert(title :string, after :object | number)
    {
        let newElement = await definition.onAdd(title, currentColumnIdx, after);
        if(!newElement)
            return;

        activateAfterDomUpdate = newElement;
    }

    afterUpdate(() => {
        if(activateAfterDomUpdate)
        {
            let activateAfterDomUpdateIdx = column_items.findIndex( e => e == activateAfterDomUpdate);
            activateAfterDomUpdate = null;
            if(activateAfterDomUpdateIdx >= 0)
            {
                cards[activateAfterDomUpdateIdx].activate();
            }
        }
    })

    function getItemKey(item: object): string | number
    {
        if(definition.key)
            return item[definition.key];
        else if(item.Id)
            return item.Id;
        else if(item.$ref)
            return item.$ref;
        else 
            return 0;
    }
    
</script>


<section class="flex-none sm:flex-1 sm:min-w-[180px] sm:max-w-[240px] {width_class}">
    <header>
        <h2 class="mb-2 text-lg sm:text-xs uppercase w-full text-center whitespace-nowrap relative">{column_def.title}
            <button class="absolute right-2 w-4 sm:w-2.5"
                    on:click={(e) => add(KanbanColumnTop)}>
                <FaPlus/>
            </button>
        </h2>
    </header>
    <ul class="w-full border-stone-700" bind:this={column_element}>
        {#if showInserterAfter === KanbanColumnTop}
            <Inserter   onInsert={async (text) => {await insert(text, KanbanColumnTop)}}
                        bind:this={inserter} />
        {/if}

        {#if column_items && column_items.length > 0}
            {#each column_items as element, item_idx (getItemKey(element))}
                <Card   item={element} 
                        {showMoveOperationsForItem}
                        {scrollViewToCard}
                        {onMoveUp}
                        {onMoveDown}
                        {onReplace}
                        runInserter={add}
                        bind:this={cards[item_idx]}>
                    <svelte:fragment slot="kanbanCardTopProps" let:element>
                        <slot name="kanbanCardTopProps" {element}/>
                    </svelte:fragment>
                
                    <svelte:fragment slot="kanbanCardMiddleProps" let:element>
                        <slot name="kanbanCardMiddleProps" {element}/>
                    </svelte:fragment>
                
                    <svelte:fragment slot="kanbanCardBottomProps" let:element>
                        <slot name="kanbanCardBottomProps" {element}/>
                    </svelte:fragment>
                </Card>

                {#if showInserterAfter == element}
                    <Inserter   onInsert={async (text) => {await insert(text, showInserterAfter)}}
                                bind:this={inserter} />
                {/if}
            {/each}
        {/if}

        {#if showInserterAfter === KanbanColumnBottom}
            <Inserter   onInsert={async (text) => {await insert(text, KanbanColumnBottom)}}
                        bind:this={inserter} />
        {/if}

    </ul>
</section>