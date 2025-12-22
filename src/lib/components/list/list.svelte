<script lang="ts">
    import {setContext, getContext, afterUpdate, tick, onMount} from 'svelte'
    import {data_tick_store, contextItemsStore, contextTypesStore } from '../../stores'
    import {activateItem, getActive, clearActiveItem, parseWidthDirective, getPrev, getNext, swapElements, getLast, insertAfter, getActiveCount, addActiveItem, getFirst, insertAt, remove as removeFrom} from '../../utils'
    import Icon from '../icon.svelte'
    import {FaRegCircle, FaRegCheckCircle} from 'svelte-icons/fa/'

    import {rList_definition} from './List'
    import ListElement from './internal/list.element.svelte'
    import Inserter from './internal/list.inserter.svelte'
	import { informModification, pushChanges } from '$lib/updates';

    export let title    :string = ''
    export let list_properties:  object | undefined = undefined;
    export let self     :object | null = null;
    export let a        :string = '';

    export let objects  :object[] | undefined = undefined;

    export let orderAttrib: string | undefined = undefined;

    export let context  :string = ""
    export let typename :string = '';
    export let c = '';

    export let toolbarOperations = undefined;
    export let contextMenu = undefined;
    export let multiselectOperations = (items) => []

    export let key: string = '';
    export let selectionKey = 'props'
    export let multiselect: boolean = false

    export let component_id: string

    // reload selection parameter
    export const CLEAR_SELECTION = 0;
    export const KEEP_SELECTION = -1;
    export const SELECT_PREVIOUS = -2;
    export const SELECT_NEXT = -3;
    export const KEEP_OR_SELECT_NEXT = -4;

    export const ORDER_STEP = 64;
    export const MIN_ORDER = 0;


    let definition :rList_definition = new rList_definition;
    setContext('rList-definition', definition);
    setContext('rIs-table-component', true);

    definition.name = `List ${a}`


    let     item  :object | null = null
    let     items :object[] | undefined = undefined;
    let     ctx   :string = context ? context : getContext('ctx');

    let     cs =  c ? parseWidthDirective(c) : 'w-full min-w-full';

    let show_insertion_row_after_element :object | null = null;
    const END_OF_LIST = {}

    let rows = [];
    let activate_after_dom_update :object | null =null;

    let inserter;

    if(toolbarOperations)
        clearActiveItem(selectionKey)

    let  last_tick = -1
    $: setup($data_tick_store, $contextItemsStore);

    function setup(...args)
    {
        last_tick = $data_tick_store
        item = self ?? $contextItemsStore[ctx];

        items = undefined;

        if(objects)
        {
            items = objects;
        }
        else if(item && a )
            items = item[a];

        if(items == undefined)
            items = [];

        if(!typename)
            typename = $contextTypesStore[ctx];
    }

    function getItemKey(item: object): string | number
    {
        if(key)
            return item[key];
        else if(item.$ref)
            return item.$ref;
        else if(item.Id)
            return item.Id;
        else
            return 0;
    }

    afterUpdate(() => {
        if(activate_after_dom_update)
        {
            let row_to_activate_idx = items.findIndex( e => e == activate_after_dom_update);
            activate_after_dom_update = null;
            if(row_to_activate_idx >= 0)
            {
                let row = rows[row_to_activate_idx];
                row?.activate();
            }
        }
    })

    export function rereder()
    {
        setup();
    }

    export function reload(data: object|object[], selectElement=KEEP_SELECTION)
    {
        let currentSelectedItem = getActive(selectionKey);
        let currentSelectedItemKey = currentSelectedItem ? getItemKey(currentSelectedItem) : null
        let selectElementId: string|number|null = null;
        let altSelectElementId: string|number|null = null;

        //console.log('reload', currentSelectedItemKey, selectElement)

        switch(selectElement)
        {
        case CLEAR_SELECTION:
            selectElementId = 0;
            break;
        case KEEP_SELECTION:
            selectElementId = currentSelectedItemKey;
            break;
        case SELECT_PREVIOUS:
            if(currentSelectedItem)
            {
                const selectedItemIdx = items?.findIndex(e => getItemKey(e) == currentSelectedItemKey)
                if(selectedItemIdx!= undefined && selectedItemIdx > 0)
                    selectElementId = getItemKey(items[selectedItemIdx-1]) ?? null;
            }
            break;

        case SELECT_NEXT:
            if(currentSelectedItem)
            {
                const selectedItemIdx = items?.findIndex(e => getItemKey(e) == currentSelectedItemKey)
                if(selectedItemIdx != undefined && selectedItemIdx >= 0 && selectedItemIdx < items.length-1)
                    selectElementId = getItemKey(items[selectedItemIdx+1]) ?? null;
            }
            break;

        case KEEP_OR_SELECT_NEXT:
            {
                if(currentSelectedItem)
                {
                    selectElementId = currentSelectedItemKey;
                    const selectedItemIdx = items?.findIndex(e => getItemKey(e) == currentSelectedItemKey)
                    if(selectedItemIdx != undefined && selectedItemIdx >= 0 && selectedItemIdx < items.length-1)
                        altSelectElementId = getItemKey(items[selectedItemIdx+1]) ?? null;
                }

            }
            break;

        default:
            if( typeof selectElement === 'object' &&
                !Array.isArray(selectElement) &&
                selectElement !== null)
                selectElementId = getItemKey(selectElement);
            else
                selectElementId = selectElement;
        }

        if(Array.isArray(data))
            objects = data;
        else
            self = data;


        rereder();


        if(selectElementId != null)
        {
            //console.log('reload items', items)
            let itemToActivate = items?.find(e => getItemKey(e) == selectElementId);
            if(itemToActivate)
            {
               // console.log('activate_after_dom_update', selectElementId)
                activate_after_dom_update = itemToActivate;
            }
            else if(altSelectElementId != null)
            {
                itemToActivate = items?.find(e => getItemKey(e) == altSelectElementId);
                if(itemToActivate)
                {
                    activate_after_dom_update = itemToActivate;
                }
            }
        }
        else
            clearActiveItem(selectionKey)

        //if(!activate_after_dom_update)
        //    activateItem(selectionKey, null, [])
    }

    export async function moveUp(element: object)
    {
        if(!orderAttrib)
            return;

        let prev = getPrev(items, element);
        if(!prev)
            return;

        items = swapElements(items, element, prev);

        [element[orderAttrib], prev[orderAttrib]] = [prev[orderAttrib], element[orderAttrib]]

        await tick();
        scrollToSelectedElement()

        informModification(element, orderAttrib)
        informModification(prev, orderAttrib)
        pushChanges()
    }

    export async function moveDown(element: object)
    {
        if(!orderAttrib)
            return;

        let next = getNext(items, element);
        if(!next)
            return;

        items = swapElements(items, element, next);

        [element[orderAttrib], next[orderAttrib]] = [next[orderAttrib], element[orderAttrib]]

        await tick();
        scrollToSelectedElement()

        informModification(element, orderAttrib)
        informModification(next, orderAttrib)
        pushChanges();
    }

    export async function moveTop(element: object)
    {
        if(!orderAttrib)
            return;

        let current = getFirst(items);

        if(current == element)
            return;

        const firstOrder = current[orderAttrib];

        while(current != element)
        {
            const next = getNext(items, current);
            const nextOrder = next[orderAttrib];

            current[orderAttrib] = nextOrder;
            informModification(current, orderAttrib);

            current = next;
        }

        element[orderAttrib] = firstOrder
        informModification(element, orderAttrib);

        items = removeFrom(items, element);
        items = insertAt(items, 0, element);

        await tick();
        scrollToSelectedElement()

        pushChanges()
    }

    export async function moveBottom(element: object)
    {

    }

    let last_activated_element :object | null = null;
    export async function addRowAfter(after :object|null = null)
    {
        if(!definition.can_insert)
            return;

        show_insertion_row_after_element = after ?? END_OF_LIST;

        last_activated_element = getActive(selectionKey);
        let fake_item = {};
        activateItem(selectionKey, fake_item)

        await tick();

        if(!inserter)
            return;

        inserter.run( async (detail) => {

            if(detail.softEnter)
                return;

            show_insertion_row_after_element = null;

            if(detail.cancel)
                activate_after_dom_update = last_activated_element;
            else
            {
                if(detail.incremental && definition.insert_incremental)
                {
                    let current_active = getActive(selectionKey);
                    await addRowAfter(current_active);
                }
            }
        } );
    }

    function scrollToSelectedElement()
    {
        const activeItem = getActive(selectionKey);
        if(!activeItem)
            return;

        const activeItemKey = getItemKey(activeItem)

        const activeIdx = items?.findIndex(i => getItemKey(i) == activeItemKey)
        if(activeIdx >= 0)
            rows[activeIdx].scrollToView()
    }


    export function remove(element :object)
    {
        let removing_idx = items?.findIndex( e => e == element)
        if(removing_idx < 0)
            return;

        let active_element = getActive(selectionKey);

        if(active_element == element)
        {
            if(removing_idx + 1 < items.length)
                rows[removing_idx+1].activate();
            else
                activateItem(selectionKey, null, []);
        }

        items = items.filter( t => t != element)
    }

    export function edit(element :object, property_name :string)
    {
        let editing_idx = items?.findIndex( e => e == element)
        if(editing_idx < 0)
            return;

        rows[editing_idx].editProperty(property_name);
    }

    export function toggleMultiselection()
    {
        multiselect = !multiselect

        if(multiselect)
        {
            let lastSelectedItem = getActive(selectionKey)
            if(lastSelectedItem)
            {
                let ops = []
                if(multiselectOperations)
                    ops = multiselectOperations

                activateItem(selectionKey, lastSelectedItem, ops)
            }
            else
            {
                clearActiveItem(selectionKey)
            }
        }
        else
        {
            let lastSelectedItem = getActive(selectionKey)
            if(lastSelectedItem)
            {
                let ops = []
                if(toolbarOperations)
                    ops = toolbarOperations(lastSelectedItem)
                activateItem(selectionKey, lastSelectedItem, ops)
            }
            else
                clearActiveItem(selectionKey)
        }


    }

    export function isMultiselectionEnabled()
    {
        return multiselect
    }

    function reorderElements(items: object[], from :object | null = null)
    {
        let fromIdx;
        let fromOrder;
        if(from)
        {
            fromOrder = from[orderAttrib];
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

            el[orderAttrib] = order;
            informModification(el, orderAttrib)

            order += ORDER_STEP;
        }

        pushChanges();
    }

    export function assignOrder(after: object | null): number
    {
        if(!orderAttrib)
            return 0;

        if(after)
        {
            const leftElement = after;
            const leftOrder = leftElement[orderAttrib];
            const rightElement = getNext(items, leftElement)
            if(rightElement)
            {
                let rightOrder = rightElement[orderAttrib];
                if(rightOrder - leftOrder >= 2)
                    return leftOrder + Math.floor((rightOrder - leftOrder)/2);
                else
                {
                    reorderElements(items, leftElement)
                    rightOrder = rightElement[orderAttrib];
                    return leftOrder + Math.floor((rightOrder - leftOrder)/2);
                }
            }
            else
                return leftOrder + ORDER_STEP;
        }
        else
        {
            const lastElement = getLast(items)
            if(lastElement)
            {
                const lastOrder = lastElement[orderAttrib];
                return lastOrder + ORDER_STEP;
            }
            else
                return MIN_ORDER;
        }
    }

    async function insert(title :string, summary: string, after :object | null)
    {
        let newElement = {
            [definition.title]: title,
            [definition.summary]: summary
        }

        if(orderAttrib)
            newElement[orderAttrib] = assignOrder(after)

        await definition.onInsert(newElement);
        return;
        let insertedElement = await definition.onInsert(newElement);
        if(!insertedElement)
            return;

        if(after)
            items = insertAfter(items, after, insertedElement)
        else
            items = [...items, insertedElement];


        /*if(objects)
        {
            if(after)
                insertAfter(objects, after, insertedElement)
            else
                objects.push(insertedElement);
        }
        else if(item && a )
        {
            item = self ?? $contextItemsStore[ctx];
            if(after)
                insertAfter(item[a], after, insertedElement)
            else
                item[a].push(insertedElement);
        }
        */

        activate_after_dom_update = insertedElement;

        //rereder();
    }

    const SELECT_ALL = 0
    const UNSELECT_ALL = 1
    function calcMultiSelectionMode(...args)
    {
        const multiselectionCount = getActiveCount(selectionKey)
        if(multiselectionCount > 0)
            return UNSELECT_ALL
        else
            return SELECT_ALL
    }

    $: multiselectionMode = calcMultiSelectionMode($contextItemsStore)

    export function toggleSelectAll(e)
    {
        if(multiselectionMode == UNSELECT_ALL)
            clearActiveItem(selectionKey)
        else
        {
            const operations = multiselectOperations(items);
            items?.forEach(itm => addActiveItem(selectionKey, itm, operations))
        }

        if(e)
            e.stopPropagation()
    }

</script>

<slot/> <!-- Launch definition settings -->


{#if title}
    <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">##ListTitle: {title}</p>
    <!--hr class="hidden sm:block w-full"-->
{/if}


<!--div class="w-full h-full overflow-y-auto overscroll-contain"-->


    {#if items && items.length > 0 }
    <!--
        {#if false && multiselect}
            {@const icon = (multiselectionMode == SELECT_ALL) ? FaRegCircle : FaRegCheckCircle}
            <Icon component={icon} class="h-5 w-5 sm:h-4 sm:w-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 mr-3"
                    on:click={toggleSelectAll}/>
        {/if}
    -->

        {#each items as element, i (getItemKey(element))}

            <ListElement   item={element}
                            {list_properties}
                            {toolbarOperations}
                            {contextMenu}
                            {key}
                            {multiselect}
                            {multiselectOperations}
                            {selectionKey}
                            bind:this={rows[i]}
                            >

                <span slot="left" let:element>
                    <slot name="left" {element}/>
                </span>
            </ListElement>

            {#if show_insertion_row_after_element == element}
                <Inserter   onInsert={async (title, summary) => {await insert(title, summary, show_insertion_row_after_element)}}
                            icon={definition.inserter_icon}
                            bind:this={inserter}    />
            {/if}
        {/each}
    {/if}

    {#if show_insertion_row_after_element == END_OF_LIST}
        <Inserter   onInsert={async (title, summary) => {await insert(title, summary, null)}}
                    icon={definition.inserter_icon}
                    bind:this={inserter}    />
    {/if}


<!--/div-->
