<script lang="ts">
    import {setContext, getContext, afterUpdate, tick, onMount} from 'svelte'
    import {data_tick_store, contextItemsStore, contextTypesStore } from '../../stores'
    import {activateItem, getActive, clearActiveItem, parseWidthDirective, getPrev, getNext, swapElements, getLast, insertAfter} from '../../utils' 
    
    import {rList_definition} from './List'
    import List_element from './internal/list.element.svelte'
    import Inserter from './internal/list.inserter.svelte'
	import { informModification, pushChanges } from '$lib/updates';
    
    export let title    :string = ''
    
    export let self     :object | null = null;
    export let a        :string = '';

    export let objects  :object[] | undefined = undefined;

    export let orderAttrib: string | undefined = undefined;

    export let context  :string = ""
    export let typename :string = '';
    export let c = '';

    export let toolbarOperations = undefined;
    export let contextMenu = undefined;

    export let key: string = '';

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
        clearActiveItem('props')

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
        let currentSelectedItem = getActive('props');
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

        //if(!activate_after_dom_update)
        //    activateItem('props', null, [])
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

    let last_activated_element :object | null = null;
    export async function addRowAfter(after :object|null = null)
    {
        if(!definition.can_insert)
            return;
        
        show_insertion_row_after_element = after ?? END_OF_LIST;

        last_activated_element = getActive('props');
        let fake_item = {};
        activateItem('props', fake_item)

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
                if(detail.incremental)
                {
                    let current_active = getActive('props');
                    await addRowAfter(current_active);
                }
            }
        } );
    }

    function scrollToSelectedElement()
    {
        const activeItem = getActive('props');
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

        let active_element = getActive('props');
        
        if(active_element == element)
        {
            if(removing_idx + 1 < items.length)
                rows[removing_idx+1].activate();
            else
                activateItem('props', null, []);
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

    async function insert(title :string, summary: string, after :object | null)
    {
        let newElement = {
            [definition.title]: title,
            [definition.summary]: summary
        }

        if(after && orderAttrib)
        {
            const leftElement = after;
            const leftOrder = leftElement[orderAttrib];
            const rightElement = getNext(items, leftElement)
            if(rightElement)
            {
                let rightOrder = rightElement[orderAttrib];
                if(rightOrder - leftOrder >= 2)
                    newElement[orderAttrib] = leftOrder + Math.floor((rightOrder - leftOrder)/2);
                else
                {
                    reorderElements(items, leftElement)
                    rightOrder = rightElement[orderAttrib];
                    newElement[orderAttrib] = leftOrder + Math.floor((rightOrder - leftOrder)/2);
                }
            }
            else
                newElement[orderAttrib] = leftOrder + ORDER_STEP;
        }
        else if(orderAttrib)
        {
            const lastElement = getLast(items)
            if(lastElement)
            {
                const lastOrder = lastElement[orderAttrib];
                newElement[orderAttrib] = lastOrder + ORDER_STEP;
            }
            else 
                newElement[orderAttrib] = MIN_ORDER;
        }

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

</script>

<slot/> <!-- Launch definition settings -->


{#if title}
    <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">{title}</p>
    <!--hr class="hidden sm:block w-full"-->
{/if}

<!--div class="w-full h-full overflow-y-auto"-->


    {#if items && items.length > 0 }
        {#each items as element, i (getItemKey(element))}
            
            <List_element   item={element} 
                            {toolbarOperations}
                            {contextMenu}
                            {key}
                            bind:this={rows[i]}
                            >
            
                <span slot="left" let:element>
                    <slot name="left" {element}/>
                </span>
            </List_element>
            
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

