<script lang="ts">
    import {setContext, getContext, afterUpdate, tick, onMount} from 'svelte'
    import {data_tick_store, contextItemsStore, contextTypesStore, page_title } from '../../stores'
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

    export let toolbarOperations;
    export let contextMenu;

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
    

    let     item  :object | null = null
    let     items :object[] | undefined = undefined;
    let     ctx   :string = context ? context : getContext('ctx');

    let     cs =  c ? parseWidthDirective(c) : 'w-full min-w-full';

    let show_insertion_row_after_element :object | null = null;
    const END_OF_LIST = {}

    let rows = [];
    let activate_after_dom_update :object | null =null;

    let inserter;
    let item_key :string = '';
    let item_type: string = '';

    clearActiveItem('props')

    let  last_tick = -1   
    $: setup($data_tick_store, $contextItemsStore);

    function setup(...args)
    {
        //console.log('list setup', objects)
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

        if(items.length > 0)
        {
            let first_element = items[0];
            let keys = Object.keys(first_element);
            if(key)
                item_key = key;
            else if(keys.includes('Id'))
                item_key = 'Id';
            else if(keys.includes('$ref'))
                item_key = '$ref';
            else if(keys.length > 0)
                item_key = keys[0];
            else
                item_key = '';
        }

        if(!typename)
            typename = $contextTypesStore[ctx];
    }

    afterUpdate(() => {
        if(activate_after_dom_update)
        {
            let row_to_activate_idx = items.findIndex( e => e == activate_after_dom_update);
            activate_after_dom_update = null;
            if(row_to_activate_idx >= 0)
            {
                rows[row_to_activate_idx].activate();
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
        let selectElementId = 0;
        let altSelectElementId = 0;
        switch(selectElement)
        {
        case CLEAR_SELECTION:
            selectElementId = 0;
            break;
        case KEEP_SELECTION:
            selectElementId = currentSelectedItem.Id ?? 0;
            break;
        case SELECT_PREVIOUS:
            if(currentSelectedItem)
            {
                const selectedItemIdx = items?.findIndex(e => e == currentSelectedItem)
                if(selectedItemIdx && selectedItemIdx > 0)
                    selectElementId = items[selectedItemIdx-1].Id ?? 0;
            }
            break;

        case SELECT_NEXT:
            if(currentSelectedItem)
            {
                const selectedItemIdx = items?.findIndex(e => e == currentSelectedItem)
                if(selectedItemIdx && selectedItemIdx < items.length-1)
                    selectElementId = items[selectedItemIdx+1].Id ?? 0;
            }
            break;

        case KEEP_OR_SELECT_NEXT:
            {
                selectElementId = currentSelectedItem.Id ?? 0;
                if(currentSelectedItem)
                {
                    const selectedItemIdx = items?.findIndex(e => e == currentSelectedItem)
                    if(selectedItemIdx && selectedItemIdx < items.length-1)
                        altSelectElementId = items[selectedItemIdx+1].Id ?? 0;
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

        if(Array.isArray(data))
            objects = data;
        else
            self = data;

        rereder();

        if(selectElementId > 0)
        {
            let itemToActivate = items?.find(e => e.Id == selectElementId);
            if(itemToActivate)
            {
                activate_after_dom_update = itemToActivate;
            }
            else if(altSelectElementId > 0)
            {
                itemToActivate = items?.find(e => e.Id == altSelectElementId);
                if(itemToActivate)
                {
                    activate_after_dom_update = itemToActivate;
                }
            }       
        }

        if(!activate_after_dom_update)
            activateItem('props', null, [])
    }

    export function moveUp(element: object)
    {
        if(!orderAttrib)
            return;

        let prev = getPrev(items, element);
        if(!prev)
            return;

        items = swapElements(items, element, prev);
        
        [element[orderAttrib], prev[orderAttrib]] = [prev[orderAttrib], element[orderAttrib]]

        informModification(element, orderAttrib)
        informModification(prev, orderAttrib)
        pushChanges()
    }

    export function moveDown(element: object)
    {
        if(!orderAttrib)
            return;
        
        let next = getNext(items, element);
        if(!next)
            return;

        items = swapElements(items, element, next);
        
        [element[orderAttrib], next[orderAttrib]] = [next[orderAttrib], element[orderAttrib]]

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
        console.log(from)

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

        console.log('reorder: ', fromOrder, fromIdx, items)

        let order = fromOrder;
        for(let i=fromIdx; i<items.length; i++)
        {
            let el = items[i];
            console.log('reoder el: ', el, order, i)

            el[orderAttrib] = order;
            informModification(el, orderAttrib)
            

            order += ORDER_STEP;
        }

        pushChanges();
    }

    async function insert(title :string, after :object | null)
    {
        let newElement = {
            [definition.title]: title
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

        let insertedElement = await definition.onInsert(newElement);
        if(!insertedElement)
            return;

        if(after)
            insertAfter(items, after, insertedElement)
        else
            items.push(insertedElement)

        activate_after_dom_update = insertedElement;
        
        rereder();
    }

</script>

<slot/> <!-- Launch definition settings -->


{#if title}
    <p class="hidden sm:block mt-3 ml-3 pb-5 text-lg text-left">{title}</p>
    <!--hr class="hidden sm:block w-full"-->
{/if}

<!--div class="w-full h-full overflow-y-auto"-->

{#if items && items.length > 0 && !!item_key }
    {#each items as element, i (element[item_key])}
        
        <List_element   item={element} 
                        {toolbarOperations}
                        {contextMenu}
                        bind:this={rows[i]}
                        >
          
            <span slot="left" let:element>
                <slot name="left" {element}/>
            </span>
        </List_element>
        
        {#if show_insertion_row_after_element == element}
            <Inserter   onInsert={async (text) => {await insert(text, show_insertion_row_after_element)}}
                        icon={definition.inserter_icon}
                        bind:this={inserter}    />
        {/if}
    {/each}
{/if}

{#if show_insertion_row_after_element == END_OF_LIST}
    <Inserter   onInsert={async (text) => {await insert(text, null)}}
                icon={definition.inserter_icon}
                bind:this={inserter}    />
{/if}

<!--/div-->

