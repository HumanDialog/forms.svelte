<script lang="ts">
    import { each } from 'svelte/internal';
import {contextToolbarOperations, pageToolbarOperations, contextItemsStore} from '../stores.js'
    import { showFloatingToolbar, showMenu, showGridMenu } from './menu.js';
    import {FaChevronUp, FaChevronDown, FaChevronLeft, FaChevronRight, FaCircle} from 'svelte-icons/fa/'
    
    
    $: update($pageToolbarOperations, $contextToolbarOperations);

    let operations :object[] = [];
    let mainOperation :object|null = null;
    let secondaryOperation :object|null = null;
    let toolboxOperations :object[] = [];
    let isExpandable: boolean = false;
    let vToolboxExpanded :boolean = false;
    let hToolboxExpanded: boolean = false;
    
    let isMain = false;

    function update(...args)
    {
        //vToolboxExpanded = false;
        if($contextToolbarOperations && $contextToolbarOperations.length > 0)
            operations = $contextToolbarOperations;
        else
            operations = $pageToolbarOperations;
        
        if(operations && operations.length > 0 && operations[0].main)
        {
            isMain = true;
        }
        else
        {
            isMain = false;   
        }

        if(operations.length > 0)
            mainOperation = operations[0];
        else
            mainOperation = null;

        secondaryOperation = null;
        toolboxOperations = [];
        if(operations.length > 1)
        {
            const operation = operations[1];
            if(!operation.separator)
            {
                if(!operation.toolbox)
                    secondaryOperation = operation;
                else
                    toolboxOperations = operation.toolbox
            }
        }
        
        if((operations.length == 3 && secondaryOperation!=null) || (operations.length > 3) || toolboxOperations.length > 0)
            isExpandable = true;
        else
            isExpandable = false;
   }

   export function activateMainOperation()
   {
        const mainOperationButton = document.getElementById('__hd_fab_mainOperation')
        if(!mainOperationButton)
            return;

        mainOperationButton.click();
   }

    function on_click(e, operation)
    {
        //vToolboxExpanded = false;
        
        if(!operation)
            return;

        if(operation.action)
        {
            let focused_item = null
            if($contextItemsStore.focused)
                focused_item = $contextItemsStore[$contextItemsStore.focused]
        
            operation.action(focused_item)
        }


        let owner = e.target;
        while(owner && ((owner.tagName != 'BUTTON') && (owner.tagName != 'LI')))
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()

        const margin = 15;
        rect.x -= margin;
        rect.y -= margin;
        rect.width += 2*margin;
        rect.height += 2*margin;

        if(operation.menu)
            showMenu(rect, operation.menu)
        else if(operation.toolbar)
            showFloatingToolbar(rect, operation.toolbar, operation.props ?? {})
        else if(operation.grid)
            showMenu(rect, operation.grid)     // mobile screen too small
            //showGridMenu(rect, operation.grid)
    }

    function toggleExpandToolboxV(e)
    {
        vToolboxExpanded = !vToolboxExpanded;
        hToolboxExpanded = vToolboxExpanded;
    }

    function toggleExpandToolboxH(e)
    {
        hToolboxExpanded = !hToolboxExpanded;
        vToolboxExpanded = hToolboxExpanded;
    }

    function mousedown(e)
    {
        // preventDefault on mousedown avoids focusing the button
        // so it keeps focus (and text selection) 
        e.preventDefault()
    }

    function getSelectionPos()
    {
        const selection = window.getSelection();
        if(selection?.rangeCount > 0)
        {
            
            const range = selection.getRangeAt(0);
            
            let rect :DOMRect;
            rect = range.getBoundingClientRect();
            let result = window.innerHeight - rect.top;
            result = Math.floor(result);
           // console.log('selection box', result)
            return result;
        }
        else
            return 0;
    }
    
    function calculatePosition(operation) : string
    {
        let right = 0;
        let result = `bottom: 10px; right:${right}px`
        return result
    }
    
    function operationVisible(operation): boolean
    {
        return false;
    }
    
</script>

{#if isMain}
    {#if operations && operations.length > 0}
        {#each operations as operation, idx}
            {#if operationVisible(operation)}
            <button  
                    class="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 
                        font-medium rounded-full text-sm text-center shadow-md
                        w-[55px] h-[55px] 
                        fixed m-0 absolute bottom-0
                        dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                        flex items-center justify-center
                        disable-dbl-tap-zoom"
                        style={calculatePosition(operation)}
                        on:click|stopPropagation={(e) => {on_click(e, mainOperation)}} 
                        on:mousedown={mousedown} >
            <div class="w-7 h-7"><svelte:component this={operation.icon}/></div>
        </button>
        {/if}
        {/each}
    {/if}
{:else}

    {#if operations && operations.length > 0}
        {@const topPosition = 350}
        {@const verticalPosition = mainOperation.aboveKeyboard ? `bottom: ${topPosition}px` : "bottom: 10px"}
        <button     id="__hd_fab_mainOperation"
                    class="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 
                        font-medium rounded-full text-sm text-center shadow-md
                        w-[55px] h-[55px] 
                        fixed m-0 absolute bottom-0 right-[0px]
                        dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                        flex items-center justify-center
                        disable-dbl-tap-zoom"
                        style={verticalPosition}
                        on:click|stopPropagation={(e) => {on_click(e, mainOperation)}} 
                        on:mousedown={mousedown} >
            <div class="w-7 h-7"><svelte:component this={mainOperation.icon}/></div>
        </button>

        {#if secondaryOperation || isExpandable}
            
            <!-- horizontal container -->
            <div class="flex flex-row m-0 absolute bottom-[10px] right-[60px]">
            
                {#if isExpandable}
                    <!-- Expander -->
                    <button class=" bg-transparent mr-2
                                    w-[55px] h-[55px] 
                                    flex items-center justify-center
                                    disable-dbl-tap-zoom"
                                    on:click|stopPropagation={toggleExpandToolboxH}
                                    on:mousedown={mousedown}>
                        <div class="    w-10 h-10
                                        text-white bg-zinc-500 hover:bg-zinc-500 
                                        font-medium rounded-full text-sm text-center shadow-md
                                        dark:bg-zinc-500 dark:hover:bg-zinc-500
                                        flex items-center justify-center">
                            <div class="w-2 h-2">
                                {#if hToolboxExpanded}
                                    <FaCircle/>
                                {:else}
                                    <FaCircle/>
                                {/if}
                            </div>
                        </div>
                    </button>

                    {#if hToolboxExpanded}
                        {#if secondaryOperation}
                            <button class="     bg-transparent
                                                mx-0 mr-2 w-[55px] h-[55px] 
                                                flex items-center justify-center
                                                disable-dbl-tap-zoom"
                                                on:click|stopPropagation={(e) => {on_click(e, secondaryOperation)}}
                                                on:mousedown={mousedown}>
                                <div class="    w-10 h-10
                                                text-white bg-zinc-500 group-hover:bg-zinc-500 
                                                dark:bg-zinc-500 dark:group-hover:bg-zinc-500
                                                font-medium rounded-full text-sm text-center shadow-md
                                                flex items-center justify-center">
                                    <div class="w-5 h-5"><svelte:component this={secondaryOperation.icon}/></div>
                                </div>
                            </button>
                        {:else if toolboxOperations.length > 0}
                            {@const toolbox=toolboxOperations.reverse()}
                            {#each toolbox as operation}
                                {#if !operation.separator}
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <button class=" bg-transparent
                                                        mx-0 mr-2 w-[55px] h-[55px] 
                                                        flex items-center justify-center
                                                        disable-dbl-tap-zoom"
                                                        on:click|stopPropagation={(e) => {on_click(e, operation)}}
                                                        on:mousedown={mousedown}>
                                        <div class="    w-10 h-10
                                                        text-white bg-zinc-500 group-hover:bg-zinc-500 
                                                        dark:bg-zinc-500 dark:group-hover:bg-zinc-500
                                                        font-medium rounded-full text-sm text-center shadow-md
                                                        flex items-center justify-center">
                                            <div class="w-5 h-5"><svelte:component this={operation.icon}/></div>
                                        </div>
                                    </button>
                                {/if}
                            {/each}

                        {/if}
                    {/if}
                {:else}
                    <button class=" bg-transparent
                                    mx-0 mr-2 w-[55px] h-[55px] 
                                    flex items-center justify-center
                                    disable-dbl-tap-zoom"
                            on:click|stopPropagation={(e) => {on_click(e, secondaryOperation)}}
                            on:mousedown={mousedown}>
                        <div class="    w-10 h-10
                                        text-white bg-zinc-500 group-hover:bg-zinc-500 
                                        dark:bg-zinc-500 dark:group-hover:bg-zinc-500
                                        font-medium rounded-full text-sm text-center shadow-md
                                        flex items-center justify-center">
                            <div class="w-5 h-5"><svelte:component this={secondaryOperation.icon}/></div>
                        </div>
                    </button>
                {/if}

            </div>
        {/if}

        {#if operations.length > 2} <!-- has vertical operations -->
            <!-- vertical tools container  -->
            <ul class="list-none m-0 absolute bottom-[70px] right-0">
                {#if (isExpandable && vToolboxExpanded) || !isExpandable}
                    {@const verticalOperations = operations.slice(2).reverse()}
                    {#each verticalOperations as operation}
                        {#if !operation.separator}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li class="flex flex-row px-0 py-0 justify-end group"
                                on:click|stopPropagation={(e) => {on_click(e, operation)}}
                                on:mousedown={mousedown}>
                                {#if operation.caption}
                                    <div>
                                        <span class="block whitespace-nowrap text-sm mt-3 font-semibold text-white mr-3     select-none bg-stone-700 group-hover:bg-stone-800 px-1 shadow-lg rounded">{operation.caption}</span>
                                    </div>
                                {/if}
                                <button class=" bg-transparent
                                                mx-0 mb-2 w-[55px] h-[55px] 
                                                flex items-center justify-center
                                                disable-dbl-tap-zoom">
                                    <div class="    w-10 h-10
                                                    text-white bg-zinc-500 group-hover:bg-zinc-500 
                                                    dark:bg-zinc-500 dark:group-hover:bg-zinc-500
                                                    font-medium rounded-full text-sm text-center shadow-md
                                                    flex items-center justify-center">
                                        <div class="w-5 h-5"><svelte:component this={operation.icon}/></div>
                                    </div>
                                </button>
                            </li>
                        {/if}
                    {/each}
                {/if}
            </ul>
        {/if}

    {/if}
{/if}

<style>

.disable-dbl-tap-zoom {
  touch-action: manipulation;
}
</style>