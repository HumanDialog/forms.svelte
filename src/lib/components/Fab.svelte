<script lang="ts">
    import {contextToolbarOperations, pageToolbarOperations, leftHandedFAB, toolsActionsOperations, fabCollapsed, bottom_bar_visible_store, main_sidebar_visible_store, fabHiddenDueToPopup} from '../stores.js'
    import { showFloatingToolbar, showMenu, showGridMenu } from './menu.js';
    import {FaChevronUp, FaChevronDown, FaChevronLeft, FaChevronRight, FaCircle, FaEllipsisV, FaRegDotCircle, FaDotCircle} from 'svelte-icons/fa/'
    import {isDeviceSmallerThan} from '../utils.js'
	import { tick } from 'svelte';
    import Ricon from './r.icon.svelte'
    import {i18n} from '../i18n.js'
    import {pushChanges, hasModifications, unsavedModificationsTicket} from '../updates.js'

    export let mainPageCoords = undefined


    $: setupCurrentContextOperations(   $pageToolbarOperations,
                                        $contextToolbarOperations,
                                        $toolsActionsOperations,
                                        $fabCollapsed,
                                        $bottom_bar_visible_store,
                                        $main_sidebar_visible_store,
                                        $leftHandedFAB,
                                        $fabHiddenDueToPopup,
                                        $unsavedModificationsTicket);

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
        if($fabHiddenDueToPopup)
        {
            operations = []
            return;
        }

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

            const saveOperation = {
                caption: i18n({en: 'Save', es: 'Guardar', pl: 'Zapisz'}),
                hideToolbarCaption: true,
                mricon: 'save',
                action: (f) => pushChanges(),
                fab: 'T00',
                disabledFunc: () => !hasModifications()
            }

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

                flatOperations.push({separator: true})
                flatOperations.push(saveOperation)
                
                const realOps = flatOperations.filter((el) => !!el.separator == false)
                if(realOps.length > 1)
                {

                    mainOperation = {
                        icon: FaEllipsisV,
                        mricon: 'ellipsis-vertical',
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

            operations.push(saveOperation)


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
                        mricon: $fabCollapsed  ? 'circle-dot-dashed' : 'circle-dashed',
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
            if(false && mobile)
                showMenu(rect, operation.grid)     // mobile screen too small
            else
                showGridMenu(rect, operation.grid, operation.caption ?? '')
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
        const margin = 0 ;//10;

        let lShift = 0
        let tShift = 0
        let rShift = 0
        let bShift = 55
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


{#if operations && operations.length > 0}
    {#each operations as operation}
        {#if operationVisible(operation)}
            {@const position = calculatePosition(operation)}
            {#if position}
                <button
                    class=" w-[55px] h-[55px]
                            fixed m-0
                            flex items-center justify-center
                            disable-dbl-tap-zoom
                            cursor-pointer z-20"
                            style={position}
                            on:click|stopPropagation={(e) => {on_click(e, operation)}}
                            on:mousedown={mousedown} >

                        <div class="    focus:outline-none font-medium  text-sm text-center

                                        text-stone-500 bg-stone-200/70 hover:bg-stone-200
                                        rounded-full
                                        dark:text-orange-200 dark:bg-stone-700/40 dark:hover:bg-stone-700
                                        ring-1 ring-orange-800/40 dark:ring-orange-200/30

                                        focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800

                                        flex items-center justify-center
                                        w-8 h-8">
                            {#if operation.mricon}
                                <div class="py-1 mr-1 w-4"><Ricon icon = {operation.mricon} s/></div>
                            {:else }
                            <div class="w-4 h-4 text-orange-500">
                                <svelte:component this={operation.icon}/>
                            </div>
                            {/if}
                        </div>
                </button>
            {/if}
        {/if}
    {/each}
{/if}


<style>

.disable-dbl-tap-zoom {
  touch-action: manipulation;
}
</style>