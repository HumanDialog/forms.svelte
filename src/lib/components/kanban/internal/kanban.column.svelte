<script lang="ts">
    import {getContext, afterUpdate, tick, onMount} from 'svelte'
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../../../stores'
    import {getActive, activateItem, editable, isActive, isSelected, selectable, startEditing, isDeviceSmallerThan } from '../../../utils.js'
    import Card from './kanban.card.svelte'
    import {KanbanColumnTop, KanbanColumnBottom} from '../Kanban'
    import Inserter from './kanban.inserter.svelte'
    import {FaPlus, FaCheck} from 'svelte-icons/fa'
    import type{rKanban_definition, rKanban_column } from '../Kanban'
	import Icon from '$lib/components/r.icon.svelte';

    export let currentColumnIdx :number
    export let onInsert: Function;
    export let definition: rKanban_definition

    let column_element: HTMLElement;
    export function getHeight()
    {
        if(!column_element)
            return 0;

        return column_element.getBoundingClientRect().height
    }

    let titleElement;
    export function editName(onFinish: Function|undefined = undefined)
    {
        startEditing(titleElement, onFinish)
    }

    export const SET_LEFT = 0;
    export const SET_RIGHT = 1;
    export const CLEAR_LEFT = 2;
    export const CLEAR_RIGHT = 3;
    export function setBorder(what_to_do: number)
    {
        if(!column_element)
            return;

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

    //let definition :rKanban_definition = getContext("rKanban-definition");
    let columnDef: rKanban_column = definition.columns[currentColumnIdx];

    let     column_items :object[] | undefined = undefined;

    $: setup_data();

    $: is_row_active = calculate_active($contextItemsStore)
    $: is_row_selected = selected($contextItemsStore)
    $: selected_class = is_row_selected ? "!border-blue-300 dark:!border-blue-300/50" : "";
    $: focused_class = is_row_active ? "bg-stone-100 dark:bg-stone-800" : "";
    

    $: force_rerender($data_tick_store, $contextItemsStore)

    let is_visible = false

    export function reload()
    {
        columnDef = definition.columns[currentColumnIdx]
        if(!columnDef)
        {   
            is_visible = false
            return
        }
        
        let allItems = definition.getItems();
        if(definition.stateAttrib)
        {
            if(columnDef.state <0 )
            {
                const isExplicitState = (e) => {
                    const elementState = e[definition.stateAttrib];
                    const colsNo = definition.columns.length;
                    for(let i=0; i<colsNo; i++)
                    {
                        const def: rKanban_column = definition.columns[i];
                        if((def.state >= 0) && (def.state == elementState))
                            return true;
                    }
                    return false;
                }

                column_items = allItems.filter( e => !isExplicitState(e))
            }
            else
                column_items = allItems.filter( e => e[definition.stateAttrib] == columnDef.state)
        }

        is_visible = isVisible() 
    }

    export function isVisible()
    {
        if( columnDef.state < 0)
        {
            if(column_items && column_items.length > 0)
                return true;
            else
                return false;
        }
        else
            return !columnDef.notVisible;

    }

    function setup_data(...args)
    {
        reload();
    }

    function force_rerender(...args)
    {
        column_items = [...column_items];
    }

    function calculate_active(...args)
    {
        if(!!columnDef.operations)
            return isActive('props', columnDef)
        else
            return false;
    }

    function selected(...args)
    {
        if(!!columnDef.operations)
            return isSelected(columnDef)
        else
            return false;
    }

    let cards = [];
    export function findCardByItem(item: object): any
    {
        if(!cards)
            return null;

        const itemIdx = column_items?.findIndex( i => i == item)
        if(itemIdx >= 0)
        {
            return cards[itemIdx]
        }
        else
            return null;
    }

    export function activateByItemId(id: number)
    {
        const itemIdx = column_items?.findIndex(e => e.Id == id)
        if(itemIdx >= 0)
        {
            const card = cards[itemIdx]
            card.activate()
        }
    }



    let inserter;
    const None = 0
    let showInserterAfterId :number = None
    let activateAfterDomUpdate :object|null = null;
    let lastActivatedElement :object|null = null;

    export async function add(after :object|number = KanbanColumnTop)
    {
        if(!definition.onAdd)
            return;

        if(after === KanbanColumnTop || after === KanbanColumnBottom)
            showInserterAfterId = after;
        else
            showInserterAfterId = after.Id;
        //showInserterAfterId = after.Id ?? KanbanColumnTop;

        if(activateAfterDomUpdate)
            activateAfterDomUpdate = null;

        lastActivatedElement = getActive('props');
        let fakeItem = {};
        activateItem('props', fakeItem)

        await tick();

        if(!inserter)
            return;

        inserter.run( async (detail) => {

            if(detail.softEnter)
                return;

            showInserterAfterId = None;

            if(detail.cancel)
                activateAfterDomUpdate = lastActivatedElement;
            else
            {
                if(false && detail.incremental)
                {
                    let currentActive = activateAfterDomUpdate ?? getActive('props');
                    if(currentActive)
                        await add(currentActive);
                }
            }
        } );
    }

    /*async function insert(title :string, after :object | number)
    {
        let newElement = {
            [definition.titleAttrib]: title
        }

        const oa = definition.orderAttrib

        if(after && )
        {

        }


        // =============

        let newElement = await definition.onAdd(title, currentColumnIdx, after);
        if(!newElement)
            return;

        activateAfterDomUpdate = newElement;
    }
    */

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

    function onTitleChanged(text: string)
    {
        if(columnDef.onTitleChanged)
            columnDef.onTitleChanged(text)
    }

    let headerElement;
    export function activate(e)
    {
        if(e)
            e.stopPropagation();

        if(!columnDef)
            return;

        if(!columnDef.operations)
            return;

        if(isActive('props', columnDef))
        {
            return;
        }

        activateItem('props', columnDef, columnDef.operations);

        if(!e)
            headerElement?.scrollIntoView(
                {
                    block: "nearest",
                    inline: "nearest"
                }
            )
    }

    onMount( () => {
        window.addEventListener('resize', onResizeWindow)
        return () => {
            window.removeEventListener('resize', onResizeWindow)
        }
    })

    let styleWidth :string = getWidthStyle();
    function onResizeWindow()
    {
        styleWidth = getWidthStyle();
    }

    function getWidthStyle()
    {
        const container = document.getElementById("__hd_svelte_main_content_container")
        const containerRect = container?.getBoundingClientRect();

        const assumed_space = containerRect.width
        const columns_no = definition.visibleColumnsNo();
        const default_column_width = Math.floor( assumed_space / columns_no );
        const column_width = Math.min(columnDef.width ? columnDef.width : default_column_width, 640)


        if(window.innerWidth >= 640)
            return `width: ${column_width}px; min-width: 200px; max-width: ${column_width}px;`
        else
            return 'width: 92%;'

    }

    let columnContainerElement;
    async function dblclick(e :MouseEvent)
    {
        // empty space
        if((e.target == column_element) || (e.target == columnContainerElement))
        {
            await add(KanbanColumnBottom);
        }
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

{#if is_visible}

<div class="    snap-center
                xsm:snap-start
                flex-none

                w-full
                sm:w-1/2
                lg:w-1/3
                2xl:w-1/4

                sm:px-4

                xbg-stone-900


                {selected_class} {focused_class}"

        bind:this={columnContainerElement}

        use:selectable={columnDef}
        on:click={activate}
        on:dblclick={dblclick}>
    <figure bind:this={headerElement}>
        <figcaption class = "text-right">
            <div class="w-full flex flex-row justify-between">
                <span></span>
                <span></span>
                <div class="flex flex-row text-orange-800 dark:text-orange-200">
                    {#if columnDef.state >= 1000}
                        <span><Icon icon="barcode" s/></span>
                        <span>{Number(columnDef.state/1000)}</span>
                    {/if}
                </div>

            </div>
        </figcaption>

        <h3 class=" text-center whitespace-nowrap relative">
            <span
                use:editable={{
                    action: (text) => onTitleChanged(text),
                    active: false
                }}
                bind:this={titleElement}>
                {columnDef.title}
            </span>

            {#if columnDef.finishing}
                <div class="inline-block text-green-600">
                    <Icon icon="check" s/>
                </div>
            {/if}



            <!--button class="absolute right-2 w-4 sm:w-2.5"
                    on:click|stopPropagation={(e) => add(KanbanColumnTop)}>
                <FaPlus/>
            </button-->
        </h3>
    </figure>
    <div class="w-full pb-0" bind:this={column_element}>
        {#if showInserterAfterId === KanbanColumnTop}
            <Inserter   onInsert={async (title, summary) => {await onInsert(currentColumnIdx, title, summary, KanbanColumnTop)}}
                        bind:this={inserter} />
        {/if}

        {#if column_items && column_items.length > 0}
            {#each column_items as element, item_idx (getItemKey(element))}
                <Card   item={element}
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

                {#if showInserterAfterId == element.Id}
                    <Inserter   onInsert={async (title, summary) => {await onInsert(currentColumnIdx, title, summary, showInserterAfterId)}}
                                bind:this={inserter} />
                {/if}
            {/each}
        {/if}

        {#if showInserterAfterId === KanbanColumnBottom}
            <Inserter   onInsert={async (title, summary) => {await onInsert(currentColumnIdx, title, summary, KanbanColumnBottom)}}
                        bind:this={inserter} />
        {/if}

            </div>
</div>
{/if}
