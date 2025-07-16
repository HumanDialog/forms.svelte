<script lang="ts">
    import {contextToolbarOperations, pageToolbarOperations, leftHandedFAB, toolsActionsOperations, fabCollapsed, bottom_bar_visible_store, main_sidebar_visible_store} from '../stores.js'
    import { showFloatingToolbar, showMenu, showGridMenu } from './menu.js';
    import {FaChevronUp, FaChevronDown, FaChevronLeft, FaChevronRight, FaCircle, FaEllipsisV, FaRegDotCircle, FaDotCircle} from 'svelte-icons/fa/'
    import {isDeviceSmallerThan} from '../utils.js'
	import { tick } from 'svelte';


    export let mainPageCoords = undefined
    

    $: setupCurrentContextOperations(   $pageToolbarOperations, 
                                        $contextToolbarOperations, 
                                        $toolsActionsOperations, 
                                        $fabCollapsed,
                                        $bottom_bar_visible_store,
                                        $main_sidebar_visible_store,
                                        $leftHandedFAB);

    let operations :object[] = [];
    let mainOperation :object|null = null;
    let secondaryOperation :object|null = null;
    let toolboxOperations :object[] = [];
    let isExpandable: boolean = false;
    let vToolboxExpanded :boolean = false;
    let hToolboxExpanded: boolean = false;
    
    let isDirectPositioningMode = false;
    //..
    async function setupCurrentContextOperations(...args)
    {
        await tick(); // to force mainContent re-render first. We need its bounding rect

        let opVer = 0
        let main_FAB_position = ''

        isDirectPositioningMode = false;
        if($toolsActionsOperations && Array.isArray($toolsActionsOperations) && toolsActionsOperations.length > 0)
        {
            operations = $toolsActionsOperations
        }
        else if($toolsActionsOperations && $toolsActionsOperations.operations && $toolsActionsOperations.operations.length > 0)
        {
            operations = $toolsActionsOperations.operations;
            opVer = $toolsActionsOperations.opver ?? 0
            main_FAB_position = $toolsActionsOperations.fab ?? ''
            if(opVer > 0)
                isDirectPositioningMode = true;
        }
        else if($contextToolbarOperations && Array.isArray($contextToolbarOperations) && $contextToolbarOperations.length > 0)
        {
            operations = $contextToolbarOperations;
        }
        else if($contextToolbarOperations && $contextToolbarOperations.operations && $contextToolbarOperations.operations.length > 0)
        {
            operations = $contextToolbarOperations.operations;
            opVer = $contextToolbarOperations.opver ?? 0
            main_FAB_position = $contextToolbarOperations.fab ?? ''
            if(opVer > 0)
                isDirectPositioningMode = true;
        }
        else
        {
            if(Array.isArray($pageToolbarOperations))
                operations = $pageToolbarOperations;
            else
            {
                operations = $pageToolbarOperations.operations;
                opVer = $pageToolbarOperations.opver ?? 0
                main_FAB_position = $pageToolbarOperations.fab ?? ''
                if(opVer > 0)
                    isDirectPositioningMode = true;
            }
        }


        if(opVer == 1)
        {
            let flatOperations = []
            operations.forEach(group => {
                flatOperations = [...flatOperations, ...group.operations]
            })

            operations = flatOperations
        }
        else if(opVer == 2)
        {
            const definedOperations = [...operations]
            // ************************* MAIN FAB MENU ******************************
            if(main_FAB_position)  // make one button for to show all operations as menu
            {
                let flatOperations = []
                definedOperations.forEach(group => {
                    flatOperations.push({
                        caption: group.caption,
                        separator: true
                    })

                    flatOperations = [...flatOperations, ...group.operations]
                })

                const realOps = flatOperations.filter((el) => !!el.separator == false)
                if(realOps.length > 1)
                {

                    mainOperation = {
                        icon: FaEllipsisV,
                        menu: flatOperations,
                        fab: main_FAB_position
                    }

                    operations = [mainOperation]
                }
                else if(realOps.length == 1)
                {
                    mainOperation = realOps[0]
                    mainOperation['fab'] = main_FAB_position
                    operations = [mainOperation]
                }
                else
                    operations = []
            }

            
            // ************************* USER DEFINED FABs *******************************

            definedOperations.forEach(group => {
                group.operations.forEach( op => {
                    if(op.fab)
                    {
                        operations = [...operations, op]
                    }
                })
            })
            
            // ************************* COLLAPSE FAB ***********************************
            if(operations.length > 1)
            {
                if(!operations.find(op => op.fab == 'M10'))
                {
                    const collapseFAB = {
                        icon: $fabCollapsed  ? FaRegDotCircle : FaDotCircle,
                        fab: 'M10',
                        action: (f) => toggleExpandAdditionalOperations()
                    }
                    operations = [...operations, collapseFAB]
                }
            }

        }
        else    // opVer == 0
        {
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
   }

  

   function toggleExpandAdditionalOperations()
   {
        $fabCollapsed = !$fabCollapsed
   }

   /*
   export function setFloatingToolsOperations(ops)
   {
        console.log('setFloatingToolsOperations', ops)
        if(!ops)
        {
            setupCurrentContextOperations();
        }
        else
        {
            if(Array.isArray(ops))
                operations = [...ops]
            else
            {
                operations = [...ops.operations]
                if(ops.opver == 1)
                {
                    isDirectPositioningMode = true;
                }
            }
        }
   }

   export function clearFloatingToolsOperations()
   {
        console.log('clearFloatingToolsOperations')
        setupCurrentContextOperations();
   }
   */

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

        let owner = e.target;
        while(owner && ((owner.tagName != 'BUTTON') && (owner.tagName != 'LI')))
            owner = owner.parentElement

        if(operation.preAction)
            operation.preAction(owner)

        if(operation.action)
        {
            //let focused_item = null
            //if($contextItemsStore.focused)
            //    focused_item = $contextItemsStore[$contextItemsStore.focused]

            operation.action(owner)
        }



        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()

        const margin = 15;
        rect.x -= margin;
        rect.y -= margin;
        rect.width += 2*margin;
        rect.height += 2*margin;

        const mobile = isDeviceSmallerThan("sm")

        if(operation.menu)
            showMenu(rect, operation.menu)
        else if(operation.toolbar)
            showFloatingToolbar(rect, operation.toolbar, operation.props ?? {})
        else if(operation.grid)
        {
            if(mobile)
                showMenu(rect, operation.grid)     // mobile screen too small
            else
                showGridMenu(rect, operation.grid)
        }
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
        let result = '';

        const fab = operation.fab;
        if(fab.length != 3)
            return '';

        const section = fab[0]
        const col_no = parseInt(fab[1]);
        const row_no = parseInt(fab[2]);

        if((col_no == NaN) || (row_no == NaN))
            return '';

        const width = 55;   //px
        const height = 55;   //px
        const margin = 10;

        let lShift = 0
        let tShift = 0
        let rShift = 0
        let bShift = 0
        let vMiddle = '50vh'
        

        // na razie tylko dla >= sm.
        if(!isDeviceSmallerThan('sm'))
        {
            
            const container = document.getElementById("__hd_svelte_main_content_container")
            if(container)
            {
                const containerRect = container?.getBoundingClientRect();
                lShift = containerRect.x
                tShift = containerRect.y
                bShift = window.innerHeight - containerRect.bottom
                rShift = window.innerWidth - containerRect.right
                vMiddle = `${containerRect.x + containerRect.width / 2}px`
            }
        }
        
        if(!$leftHandedFAB)
        {
            switch(section)
            {
            case 'M':
                result = `right: ${rShift + margin + col_no * width}px; bottom: ${bShift + margin + row_no * height}px`
                break;

            case 'S':
                result = `left: ${lShift + margin + col_no * width}px; bottom: ${bShift + margin + row_no * height}px`
                break;

            case 'A':
                result = `right: ${rShift + margin + col_no * width}px; top: calc(${vMiddle} - ${row_no * height}px)`
                break;

            case 'C':
                result = `left: ${lShift + margin + col_no * width}px; top: calc(${vMiddle} - ${row_no * height}px)`
                break;

            case 'T':
                result = `right: ${rShift + margin + col_no * width}px; top: ${tShift + margin + row_no * height}px`
                break;

            case 'F':
                result = `left: ${lShift + margin + col_no * width}px; top: ${tShift + margin + row_no * height}px`
                break;
            }
        }
        else
        {
            switch(section)
            {
            case 'M':
                result = `left: ${lShift + margin + col_no * width}px; bottom: ${bShift + margin + row_no * height}px`
                break;

            case 'S':
                result = `right: ${rShift+ margin + col_no * width}px; bottom: ${bShift + margin + row_no * height}px`
                break;

            case 'A':
                result = `left: ${lShift + margin + col_no * width}px; top: calc(${vMiddle} - ${row_no * height}px)`
                break;

            case 'C':
                result = `right: ${rShift + margin + col_no * width}px; top: calc(${vMiddle} - ${row_no * height}px)`
                break;

            case 'T':
                result = `left: ${lShift + margin + col_no * width}px; top: ${tShift + margin + row_no * height}px`
                break;

            case 'F':
                result = `right: ${rShift + margin + col_no * width}px; top: ${tShift + margin + row_no * height}px`
                break;
            }
        }

        return result
    }

    function operationVisible(operation): boolean
    {
        if(!operation.fab)
            return false;

        if($fabCollapsed)
        {
            if(operation.fab == 'M00')
                return true;

            if(operation.fab == 'M10')
                return true;

            return false
        }
        else
        {
            if(operation.disabledFunc)
                return !operation.disabledFunc();
            else if(operation.disabled)
                return false

            return true
        }
    }

</script>

{#if isDirectPositioningMode}
    {#if operations && operations.length > 0}
        {#each operations as operation}
            {#if operationVisible(operation)}
                {@const position = calculatePosition(operation)}
                {#if position}
                    <button
                        class=" text-stone-500 bg-stone-200/70 hover:bg-stone-200
                                focus:outline-none font-medium rounded-full text-sm text-center
                                dark:text-stone-500 dark:bg-stone-700/80 dark:hover:bg-stone-700 
                                focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800
                                w-[30px] h-[30px]
                                fixed m-0                            
                                flex items-center justify-center
                                disable-dbl-tap-zoom
                                cursor-pointer z-20"
                                style={position}
                                on:click|stopPropagation={(e) => {on_click(e, operation)}}
                                on:mousedown={mousedown} >
                        <div class="w-5 h-5"><svelte:component this={operation.icon}/></div>
                    </button>
                {/if}
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
                        fixed m-0 bottom-0 right-[0px]
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
            <div class="flex flex-row m-0 fixed bottom-[10px] right-[60px]">

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
            <ul class="list-none m-0 fixed bottom-[70px] right-0">
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
                                        <span class="block whitespace-nowrap text-sm mt-3 font-semibold text-white mr-3
                                        select-none bg-stone-700 group-hover:bg-stone-800 px-1 shadow-lg rounded">{operation.caption}</span>
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