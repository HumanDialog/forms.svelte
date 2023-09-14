<script lang="ts">
    import {data_tick_store, context_items_store, context_info_store, context_types_store } from '../../stores.js'
    import {getContext, setContext, onDestroy} from 'svelte';
    import { rTable_definition } from './table';
    import {parse_width_directive} from '../../utils.js'

    export let context = ""
    export let collection = ""
    export let self = null
    export let objects = null;
    export let headers = [];
    export let fields = [];
    export let select = "sel"
    export let cinfo = 'default'
    export let focus = true
    export let nav = true
    export let c = '';
    export let typename = '';
    
    let definition :rTable_definition = new rTable_definition;
    setContext('rTable-definition', definition);
    setContext('rIs-table-component', true);
        
    let ctx :string = context ? context : getContext('ctx');
    let items = null;
    let item = null 
    let last_tick   :number = -1
    let selected_item;

    let cs =  c ? parse_width_directive(c) : 'w-full min-w-full';
    
    $:{ 
        if($data_tick_store > last_tick)
            refresh();
    }

    
    $: selected_item = $context_items_store[select]

    onDestroy( () => {
        select_item(null, null);
    });

    export function refresh()
    {
        last_tick = $data_tick_store            
        item = self ?? $context_items_store[ctx];
        
        if(objects)
            items = objects;
        else if(item && collection )
            items = item[collection];
        else
            items = [];

        if(!typename)
            typename = $context_types_store[ctx];

        //if(definition)
        //    definition.items = null;
    }

    export function update_objects(_objects)
    {
        objects = _objects;
        refresh();
    }
    
    export function update_self(_self)
    {
        self = _self;
        refresh();
    }
    
    export function select_item(itm, cinfo)
    {
        $context_items_store[select] = itm;
        $context_info_store[select] = cinfo;

        if(itm && itm.oclType)
            $context_types_store[select] = itm.oclType; 
        
        if(focus)
            $context_items_store.focused = select
        
        if(nav)
            $data_tick_store = $data_tick_store + 1;
    }
    
    let last_tick_internal      = -1;

    function override_items_from_slot(...args)
    {
        if(last_tick_internal != definition.items_ticket)
        {
            last_tick_internal = definition.items_ticket;

            if(definition.items)
                items = definition.items;

                console.log('override_items_from_slot', definition.items, definition.items_ticket)
        }

        return 0;
    }
</script>

{#if true}
    <slot/> <!-- let definition execute -->
    
    <table class="{cs} h-auto divide-gray-200 cursor-default">
        <thead class="bg-gray-50 sticky">
            <tr>
                {#if definition || headers.length }
                    {@const lheaders = headers.length ? headers : definition.columns.map( v => v.header )}
                    {#if lheaders.length && lheaders.some(s => s.length > 0)}
                        {#each lheaders as header}
                            <th scope="col" class="py-1 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {header}
                            </th>
                        {/each}    
                    {/if}
                {:else}
                    <th scope="col" class="py-1 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No headers... 
                    </th>
                {/if}
            </tr>
        </thead>
        {#if (items != null) && (items.length > 0)}
            {@const lfields = fields.length ? fields : definition.columns.map( v => v.field )}
            <tbody class="bg-white dark:bg-slate-900">
                {#each items as item}
                    {#if (item != null )}
                        <tr on:click={ (e) => { select_item(item, cinfo);} }
                            class="whitespace-nowrap text-sm font-normal text-gray-900 dark:text-gray-300"
                            class:bg-slate-100={item==selected_item}
                            class:dark:bg-slate-700={item==selected_item}>
                            {#each lfields as field, i}
                                {@const cc = `c${i}`}
                                {@const column = definition.columns[i]}
                                {@const col_size = (column && column.size) ? `${column.size*0.25}rem` : '' } 
                                <td class="pl-4 py-1 {column.cl}" style:width={col_size}>
                                    {#if $$slots[cc]}
                                        {#if cc=='c0'}
                                            <slot name='c0' {item}/>
                                        {:else if cc=='c1'}
                                            <slot name='c1' {item}/>
                                        {:else if cc=='c2'}
                                            <slot name='c2' {item}/>
                                        {:else if cc=='c3'}
                                            <slot name='c3' {item}/>
                                        {:else if cc=='c4'}
                                            <slot name='c4' {item}/>
                                        {:else if cc=='c5'}
                                            <slot name='c5' {item}/>
                                        {:else if cc=='c6'}
                                            <slot name='c6' {item}/>
                                        {:else if cc=='c7'}
                                            <slot name='c7' {item}/>
                                        {:else if cc=='c8'}
                                            <slot name='c8' {item}/>
                                        {:else if cc=='c9'}
                                            <slot name='c9' {item}/>
                                        {:else if cc=='c10'}
                                            <slot name='c10' {item}/>
                                        {:else if cc=='c11'}
                                            <slot name='c11' {item}/>
                                        {/if}
                                    {:else}
                                        {item[field]}
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/if}
                {/each}
            </tbody>
        {/if}
    </table>
{/if}
