<script lang="ts">
    import {setContext, getContext, afterUpdate, tick, onMount} from 'svelte'
    import {data_tick_store, contextItemsStore, contextTypesStore, page_title } from '../../stores'
    import {activateItem, getActive, clearActiveItem, parseWidthDirective} from '../../utils' 
    
    import {rList_definition} from './List'
    import List_element from './internal/list.element.svelte'
    import Inserter from './internal/list.inserter.svelte'
    
    export let title    :string = ''
    
    export let self     :object | null = null;
    export let a        :string = '';

    export let objects  :object[] | undefined = undefined;

    export let context  :string = ""
    export let typename :string = '';
    export let c = '';

    export let toolbarOperations;
    export let contextMenu;

    export let key: string = '';


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

    export function refresh()
    {
        setup();
    }

    export function updateObjects(_objects :object[])
    {
        objects = _objects;

        setup();
    }
    
    export function updateSelf(_self :object)
    {
        self = _self;
        setup();
    }

    let last_activated_element :object | null = null;
    export async function add(after :object|null = null)
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
                    await add(current_active);
                }
            }
        } );
    }

    async function insert(title :string, after :object | null)
    {
        let new_element = await definition.onInsert(title, after);
        if(!new_element)
            return;

        activate_after_dom_update = new_element;
        
        refresh();
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

