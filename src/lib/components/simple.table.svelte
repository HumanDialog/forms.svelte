<script>
    import {data_tick_store, contextItemsStore, context_info_store } from '../stores.js'
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
        item = $contextItemsStore[ctx];
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
                item = $contextItemsStore[ctx];
            else
                item = self    

            if(objects != null)
                items = objects
            else if (item != null)
                items = item[collection]
                    
            //console.log("t["+ctx+", "+collection + "]: " + t + ", "  + last_tick)
        }        
    }
    

    
    const selectItem = (itm, cinfo) => () => {
       
        $contextItemsStore[select] = itm;
        $context_info_store[select] = cinfo;
        
        if(focus)
            $contextItemsStore.focused = select
        if(nav)
            $data_tick_store = $data_tick_store + 1;
    };
    
    let selected_item = $contextItemsStore[select]
    $: selected_item = $contextItemsStore[select]
</script>


    <table class="min-w-full h-auto divide-stone-200">
        <thead class="bg-stone-50 sticky">
            <tr>
                {#if headers != null}
                    {#each headers as header}
                        <th scope="col" class="py-1 px-4 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                            {header}
                        </th>
                    {/each}    
                {:else}
                    <th scope="col" class="py-1 px-4 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        No headers... 
                    </th>
                {/if}
            </tr>
        </thead>
        {#if (items != null && items.length > 0 && fields != null)}
            <tbody class="bg-white ">
                {#each items as item}
                {#if (item != null )}
                    {#if item == selected_item}
                    <tr >
                        {#each fields as field}
                            <td class="px-4 py-1 bg-stone-100 whitespace-nowrap text-sm font-normal text-stone-900">{item[field]}</td>
                        {/each}
                    </tr>
                    {:else}
                    <tr on:click={selectItem(item, cinfo)}>
                        {#each fields as field}
                            <td class="px-4 py-1 whitespace-nowrap text-sm font-normal text-stone-900">{item[field]}</td>
                        {/each}
                    </tr>
                    {/if}
                 {/if}
                {/each}
            </tbody>
        {/if}
    </table>
