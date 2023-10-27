<script>
    import {data_tick_store, context_items_store, context_info_store } from '../../stores.js'
    import {getContext} from 'svelte';

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
    let items = null;
    
    let ctx = context ? context : getContext('ctx');
        
    let item = null 
    if(self == null)
        item = $context_items_store[ctx];
    else
        item = self    

    if(objects != null)
        items = objects
    else if (item != null)
        items = item[collection]
    
    let  last_tick = $data_tick_store
    
    let t = 0
    $:{ t = $data_tick_store        
        if(t > last_tick)
        {
            last_tick = t            
            if(self == null)
                item = $context_items_store[ctx];
            else
                item = self    

            if(objects != null)
                items = objects
            else if (item != null)
                items = item[collection]
                    
            //console.log("t["+ctx+", "+collection + "]: " + t + ", "  + last_tick)
        }        
    }
    

    
    const select_item = (itm, cinfo) => () => {
       
        $context_items_store[select] = itm;
        $context_info_store[select] = cinfo;
        
        if(focus)
            $context_items_store.focused = select
        if(nav)
            $data_tick_store = $data_tick_store + 1;
    };
    
    let selected_item = $context_items_store[select]
    $: selected_item = $context_items_store[select]
</script>


    <table class="min-w-full h-auto divide-gray-200 cursor-default">
        <thead class="bg-gray-50 sticky">
            <tr>
                {#if headers != null}
                    {#each headers as header}
                        <th scope="col" class="py-1 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {header}
                        </th>
                    {/each}    
                {:else}
                    <th scope="col" class="py-1 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No headers... 
                    </th>
                {/if}
            </tr>
        </thead>
        {#if (items != null && items.length > 0 && fields != null)}
            <tbody class="bg-white dark:bg-slate-900">
                {#each items as item}
                    {#if (item != null )}
                        <tr on:click={select_item(item, cinfo)}
                            class="whitespace-nowrap text-sm font-normal text-gray-900 dark:text-gray-300"
                            class:bg-slate-100={item==selected_item}
                            class:dark:bg-slate-700={item==selected_item}>
                            {#if $$slots['row']}
                                <slot name='row' {item}/>
                            {:else}
                                {#each fields as field}
                                <td class="px-4 py-1">
                                    {#if $$slots['cell']}
                                        <slot name='cell' {field} value={item[field]}></slot>
                                    {:else}
                                        {item[field]}
                                    {/if}
                                </td>
                                {/each}
                            {/if}
                        </tr>
                    {/if}
                {/each}
            </tbody>
        {/if}
    </table>
