<script>
    import {data_tick_store, context_items_store, context_types_store} from '../stores.js' 
    import {inform_modification, push_changes} from '../updates.js'
    import {parse_width_directive} from '../utils.js'
    import {getContext} from 'svelte';
    import Rich_edit from './document/rich.edit.svelte'
    

    
    export let label = ''
    export let self = null;
    export let a = '';
    export let context = ""
    export let itype="text"
    export let typename = '';
    
    export let val = ''
        
    export const placeholder = 'pl'

    export  let s = 'sm'
    export  let c = ''

    
    let   item = null

    let     label_mb = 'mb-1' //
    let input_pt = 'pt-0.5'
    let input_pb = 'pb-1'
    
    switch (s)
    {
        case 'md':
            label_mb = 'mb-2';
            input_pt = 'pt-2.5'
            input_pb = 'pb-2.5';           
            break;
    }
   
    let cs =  c ? parse_width_directive(c) : 'col-span-1';
    let ctx = context ? context : getContext('ctx');
        
    let  last_tick = -1    

    $:{ 
        if($data_tick_store > last_tick)
            setup();
    }

    function setup()
    {
        last_tick = $data_tick_store;
        item = self ?? $context_items_store[ctx];    

        if(!typename)
            typename = $context_types_store[ctx];

        if(item && a)    
            val = item[a]
        
        if(label == '')
            label = a
    }
    
    
    
    function value_changed()
    {
        if(item != null)
        {
            item[a] = val
            
            if(typename)
                inform_modification(item, a, typename);
        }
    }

    function accept_change()
    {
        $data_tick_store = $data_tick_store + 1;
        push_changes();
            
    }
        
   
</script>    

{#if itype == 'text'}
    <div class={cs}>
        <label for="name" class="block {label_mb} text-xs font-small text-gray-900 dark:text-white">{label}</label>
        
        <input  type=text name="name" id="name" 
                bind:value={val} 
                on:change={()=> (value_changed())}
                on:blur={() => { accept_change(); } }
                
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-primary-600 focus:border-primary-600 block w-full  {input_pb} {input_pt} px-2.5 dark:bg-gray-700
            dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
                
                placeholder={placeholder}>
    </div>
{:else if itype == 'html'}   
    <!-- div class="{cs} prose prose-sm sm:prose-base dark:prose-invert h-full max-h-full overflow-y-auto"    
        contenteditable="true"
        bind:innerHTML={val} 
        on:input={()=> (value_changed())}
        on:blur={() => { accept_change(); }}/ -->
    <Rich_edit {...$$props} />
{/if}       
