<script lang="ts">
    import {context_toolbar_operations, page_toolbar_operations, context_items_store} from './stores.js'

    $: update($page_toolbar_operations, $context_toolbar_operations);

    let operations = [];
    function update(...args)
    {
        if($context_toolbar_operations && $context_toolbar_operations.length > 0)
            operations = $context_toolbar_operations;
        else
            operations = $page_toolbar_operations;
    }

    function on_click(operation)
    {
        if(!operation)
            return;

        if(!operation.action)
            return;

        let focused_item = null
        if($context_items_store.focused)
            focused_item = $context_items_store[$context_items_store.focused]
        
        operation.action(focused_item)

    }
</script>

<div class="bg-slate-100 w-full h-10 dark:bg-slate-800 overflow-x-clip overflow-y-hidden py-0 text-xs  flex flex-row">
    
    {#each operations as operation}
        <button type="button" class="py-2.5 px-5 text-xs font-medium text-gray-900 bg-slate-100 hover:bg-slate-200 border-r border-gray-200 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 inline-flex items-center"
                on:click={(e) => {on_click(operation)}}>
            <div class="w-3 h-3"><svelte:component this={operation.icon}/></div>
            <span class="ml-1">{operation.caption}</span>
        </button>    
    {/each}

    

</div>