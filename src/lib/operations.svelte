<script lang="ts">
	import { show_floating_toolbar, show_menu, show_grid_menu } from './components/menu.js';
    import {context_toolbar_operations, page_toolbar_operations, context_items_store} from './stores.js'

    export let mobile :boolean = false

    $: update($page_toolbar_operations, $context_toolbar_operations);

    let operations = [];
    function update(...args)
    {
        if($context_toolbar_operations && $context_toolbar_operations.length > 0)
            operations = $context_toolbar_operations;
        else
            operations = $page_toolbar_operations;
    }

    function on_click(e, operation)
    {
        if(!operation)
            return;

        if(operation.action)
        {
            let focused_item = null
            if($context_items_store.focused)
                focused_item = $context_items_store[$context_items_store.focused]
            
            operation.action(focused_item)
            return;
        }

        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()


        if(operation.menu)
            show_menu(rect, operation.menu)
        else if(operation.toolbar)
            show_floating_toolbar(rect, operation.toolbar)
        else if(operation.grid)
            show_grid_menu(rect, operation.grid)

    }

    function mousedown(e)
    {
        // preventDefault on mousedown avoids focusing the button
        // so it keeps focus (and text selection) 
        e.preventDefault()
    }
</script>

<div    class="no-print bg-slate-100 w-full h-10 dark:bg-slate-800 overflow-x-clip overflow-y-hidden py-0 text-xs flex flex-row"
        class:flex-row-reverse={mobile}>
    
    {#each operations as operation}
        {#if !operation.separator}

            <button type="button" 
                    class="py-2.5 px-5 
                    text-xs font-medium text-gray-900 dark:text-gray-400 dark:hover:text-white 
                    bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 active:bg-slate-300 dark:active:bg-gray-600
                    border-gray-200 focus:outline-none dark:border-gray-600
                    inline-flex items-center"
                    class:border-r={!mobile}
                    class:border-l={mobile}
                    on:click={(e) => {on_click(e, operation)}}
                    on:mousedown={mousedown}>
                {#if operation.icon}
                    <div class="w-3 h-3 mr-1"><svelte:component this={operation.icon}/></div>
                {/if}
                {#if operation.caption}
                    <span>{operation.caption}</span>
                {/if}
            </button>    
        {/if}
    {/each}
</div>

<style>
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>