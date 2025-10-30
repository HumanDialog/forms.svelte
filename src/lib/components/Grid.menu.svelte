<script>
    import {contextItemsStore} from '../stores.js'

    export let operations = []
    export let onHide = undefined;
    
    $: grid_cols = init(operations);

    function init(operations)
    {
        let cols_no = 0;
        let current_row_cols_no = 0;

        for(let i=0; i<operations.length; i++)
        {
            let operation = operations[i];
            if(operation.separator)
            {
                if(current_row_cols_no > cols_no)
                    cols_no = current_row_cols_no;

                current_row_cols_no = 0;
            }
            else
            {
                let cols = operation.columns ?? 1;
                current_row_cols_no += cols;
            }
        }

        if(current_row_cols_no > cols_no)
            cols_no = current_row_cols_no;

        switch(cols_no)
        {
            case 1:
                return "grid-cols-1";
                
            case 2:
                return "grid-cols-2";
                
            case 3:
                return "grid-cols-3";
                
            case 4:
                return "grid-cols-4";
                
            case 5:
                return "grid-cols-5";
                
            case 6:
                return "grid-cols-6";
                
            case 7:
                return "grid-cols-7";
                
            case 8:
                return "grid-cols-8";
                
            case 9:
                return "grid-cols-9";
                
            case 10:
                return "grid-cols-10";
        }
    }

    function col_span(n)
    {
        switch(n)
        {
        case 1:
            return "col-span-1";
        case 2:
            return "col-span-2";
        case 3:
            return "col-span-3";
        case 4:
            return "col-span-4";
        case 5:
            return "col-span-5";
        case 6:
            return "col-span-6";
        case 7:
            return "col-span-7";
        case 8:
            return "col-span-8";
        case 9:
            return "col-span-9";
        case 10:
            return "col-span-10";
        }
    }

    function execute_action(e, operation)
    {
        if(!!onHide)
            onHide();

        e.stopPropagation();

        if(!operation)
            return;

        if(!operation.action)
            return;

        let context_item = null
        if($contextItemsStore.focused)
            context_item = $contextItemsStore[$contextItemsStore.focused]
        
        operation.action(context_item);
    }

</script>


<div  class="grid gap-2 {grid_cols}">  
    {#each operations as operation}
        {#if !operation.separator}
            {@const col=col_span(operation.columns ?? 1)}
            
            <button class=" py-2.5 px-5 {col}
                            text-sm font-medium text-stone-900 dark:text-stone-400 dark:hover:text-white
                            bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600
                            border rounded border-stone-200 dark:border-stone-600 focus:outline-none
                            inline-flex items-center justify-center"
                            on:click={(e) => {execute_action(e, operation)}}>
                
                {#if operation.icon}
                    <div class="w-3 h-3 mr-1"><svelte:component this={operation.icon}/></div>
                {/if}
                <div>{operation.caption}</div>
            </button>
        {/if}
    {/each}
</div>

