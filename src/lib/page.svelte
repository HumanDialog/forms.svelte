<script>
    export let context = "data"
    export let self = null
    export let typename = '';
    export let focused_only = false
    export let in_context = ''
    export let cl =
        "w-full h-full flex flex-col dark:bg-slate-800  overflow-y-hidden  overflow-x-hidden py-1 px-1 border-0" // border-green-500
    export let c = ''
    import {
        writable
    } from 'svelte/store';
    import {
        setContext
    } from 'svelte';
    import {
        context_items_store,
        data_tick_store,
        context_types_store
    } from './stores.js'
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
</script>

<div class="{visibilty} {cl} bg-slate-100 dark:bg-slate-800 ">
    {#if visibilty == "" }
        <slot/>
    {/if}
</div>