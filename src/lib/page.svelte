<script>
    import { setContext, onMount } from 'svelte';
    import {
        context_items_store,
        data_tick_store,
        context_types_store,
        context_info_store,
        context_toolbar_operations,
        page_toolbar_operations     } from './stores.js'
    
    //import {chnages} from './utils.js'

    export let context = "data"
    export let self = null
    export let typename = '';
    export let focused_only = false
    export let in_context = ''
    export let cl =
        "w-full h-full flex flex-col dark:bg-slate-800  overflow-y-hidden  overflow-x-hidden py-1 px-1 border-0" // border-green-500
    export let c = ''
    
    export let toolbar_operations = undefined;
    export let clears_context = '';

    
    switch (c) {
        case 'main':
            cl = "w-full h-full flex flex-col dark:bg-slate-800  overflow-y-hidden  overflow-x-hidden py-1 px-1 border-0"
            break;
        case 'main-d':
            cl = "bg-slate-800 w-full h-full flex flex-col dark:bg-slate-800  overflow-y-hidden  overflow-x-hidden py-1 px-1 border-0"
            break;
        default:
            //NOP    
    }

    onMount(() => {
            if(toolbar_operations != undefined && Array.isArray(toolbar_operations))
            {
                $page_toolbar_operations = [...toolbar_operations]
                return () => { $page_toolbar_operations = [] }
            }
            else
                return () => {}
    })

    setContext('ctx', context)
    let item = null;
    let visibilty = "hidden"
    if (in_context == '')
        in_context = context;
    let last_tick = 0
    if (self != null)
        $context_items_store[context] = self
    
    if(typename)
        $context_types_store[context] = typename;

    item = $context_items_store[context]
    visibilty = "hidden";
    if (item != null) {
        if (focused_only) {
            if ($context_items_store.focused == in_context)
                visibilty = "";
        } else
            visibilty = "";
    }
    let t = 0
    $: {
        t = $data_tick_store
        //chnages.just_changed_context = false;

        if (t > last_tick) {
            last_tick = t
            if (self != null)
                $context_items_store[context] = self
            
            if(typename)
                $context_types_store[context] = typename;

            item = $context_items_store[context]
            visibilty = "hidden";
            if (item != null) {
                if (focused_only) {
                    if ($context_items_store.focused == in_context)
                        visibilty = "";
                } else
                    visibilty = "";
            }
            //console.log("$page[" + in_context + ", " + context + "]: " + visibilty)
            //console.log(item)  
            //console.log("--------------")
        }
    }

    function clear_selection(e)
    {
        //console.log('page click', chnages.just_changed_context)
        if(!clears_context)
            return;

       

        let contexts = clears_context.split(' ');
        contexts.forEach(c => 
        {
            $context_items_store[c] = null;
            $context_info_store[c] = '';
        })

        //e.stopPropagation();
    
        $context_toolbar_operations = [];
        $data_tick_store = $data_tick_store + 1;
    }
</script>

<div class="bg-slate-100 dark:bg-slate-800 {visibilty} {cl}" on:click={clear_selection}>
    {#if visibilty == "" }
        <slot/>
    {/if}
</div>