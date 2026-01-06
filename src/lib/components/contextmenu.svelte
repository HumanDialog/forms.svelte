<script lang="ts">
	import { afterUpdate, tick} from 'svelte';
    import Icon from './icon.svelte'
    import Ricon from './r.icon.svelte'

    import {contextItemsStore, pushToolsActionsOperations, popToolsActionsOperations, fabHiddenDueToPopup} from '../stores'
    import {isDeviceSmallerThan, isOnScreenKeyboardVisible} from '../utils'
    import {hideWholeContextMenu, showMenu, showFloatingToolbar, showGridMenu,
        SHOW_MENU_BELOW, SHOW_MENU_ABOVE, SHOW_MENU_RIGHT, SHOW_MENU_LEFT } from './menu'
    import {FaTimes} from 'svelte-icons/fa'
	import { usePreventScroll } from './react-aria/preventScroll';

    export let widthPx     :number = 400;

    export let menu_items_id_prefix :string = '__hd_svelte_menuitem_'
    export let owner_menu_item :HTMLElement | undefined = undefined;

    let x :number = 0;
    let y :number = 0;
    let visible :boolean = false;
    let menu_root;
    let operations = [];

    let min_width_px = 200;
    let focused_index = 0;
    let menu_items :HTMLElement[] = [];
    let submenus = [];
    let around_rect :DOMRect;
    let around_preference: number = 0
    let css_position = 'display: none'
    let closeButtonPos = ''

    $: display = visible ? 'block' : 'none';
//
    /* afterUpdate(() =>
    {
        console.log('menu afterUpdate', around_rect)

        let rect :DOMRect = menu_root.getBoundingClientRect()
        if(rect.height == 0)
            return;

        if(isDeviceSmallerThan("sm"))
        {

        }
        else
        {
            //css_position = calculatePosition(x, y,  visible);
        }
    })
        */

    function calculatePosition(x: number, y: number, visible: boolean, fresh: boolean): string
    {
        let result = '';

        if(!visible)
        {
            result = 'display: none';
        }
        else if(isDeviceSmallerThan("sm"))
        {
            let screenRect = new DOMRect;
            screenRect.x = 0;
            screenRect.y = 0;
            screenRect.width = window.innerWidth;
            screenRect.height = window.innerHeight;

            const margin = 5

            let myRect :DOMRect|null = null;
            if(!fresh)
            {
                myRect = menu_root.getBoundingClientRect()
                if(myRect.height == 0)
                {
                    myRect = null;
                }
            }

            let maxHeight
            if(myRect)
            {
                maxHeight = screenRect.height  - margin;

                if(myRect.height < maxHeight)
                    maxHeight = myRect.height

                const width = screenRect.width - 2*margin;
                x = margin;
                y = screenRect.bottom - maxHeight - margin;

                result = `left: ${x}px; bottom: ${margin}px; width: ${width}px; max-height: ${maxHeight}px; display: block`
            }
            else
            {
                maxHeight = screenRect.height  - margin;
                const width = screenRect.width - 2*margin;
                x = margin;
                y = screenRect.bottom - maxHeight - margin;

                result = `left: ${x}px; bottom: ${margin}px; width: ${width}px; max-height: ${maxHeight}px; display: block`
            }

            //closeButtonPos = `right: ${margin}px; top: calc(${y}px - 1.75rem)`
            closeButtonPos = `right: 0.5rem; bottom: calc(${margin + maxHeight}px - 1.75rem)`

        }
        else
        {
            let myRect :DOMRect|null = null;
            if(!fresh)
            {
                myRect = menu_root.getBoundingClientRect()
                if(myRect.height == 0)
                {
                    myRect = null;
                }
            }

            if(myRect)
            {
                const m = 15;
                let screenRect :DOMRect = new DOMRect(m, 0, window.innerWidth-2*m, window.innerHeight)

                if(around_rect)
                {
                    const menuWidth = myRect.width
                    const menuHeight = myRect.height

                    let topArea;
                    let bottomArea;
                    let leftArea;
                    let rightArea;

                    switch(around_preference)
                    {
                    case SHOW_MENU_BELOW:
                        topArea = around_rect.top - screenRect.top
                        bottomArea = screenRect.bottom - around_rect.bottom
                        leftArea = around_rect.right - screenRect.left
                        rightArea = screenRect.right - around_rect.left

                        if(menuHeight <= bottomArea)
                            y = around_rect.bottom
                        else if(menuHeight <= topArea)
                            y = around_rect.top - menuHeight

                        if(menuWidth <= rightArea)
                            x = around_rect.left
                        else if(menuWidth <= leftArea)
                            x = around_rect.right - menuWidth
                        break;

                    case SHOW_MENU_ABOVE:
                        topArea = around_rect.top - screenRect.top
                        bottomArea = screenRect.bottom - around_rect.bottom
                        leftArea = around_rect.right - screenRect.left
                        rightArea = screenRect.right - around_rect.left

                        if(menuHeight <= topArea)
                            y = around_rect.top - menuHeight
                        else if(menuHeight <= bottomArea)
                            y = around_rect.bottom

                        if(menuWidth <= rightArea)
                            x = around_rect.left
                        else if(menuWidth <= leftArea)
                            x = around_rect.right - menuWidth
                        break;

                    case SHOW_MENU_RIGHT:
                        topArea = around_rect.bottom - screenRect.top
                        bottomArea = screenRect.bottom - around_rect.top
                        leftArea = around_rect.left - screenRect.left
                        rightArea = screenRect.right - around_rect.right

                        if(menuWidth <= rightArea)
                            x = around_rect.right
                        else if(menuWidth <= leftArea)
                            x = around_rect.left - menuWidth

                        if(menuHeight <= bottomArea)
                            y = around_rect.top
                        else if(menuHeight <= topArea)
                            y = around_rect.bottom - menuHeight

                        break;

                    case SHOW_MENU_LEFT:
                        topArea = around_rect.bottom - screenRect.top
                        bottomArea = screenRect.bottom - around_rect.top
                        leftArea = around_rect.left - screenRect.left
                        rightArea = screenRect.right - around_rect.right

                        if(menuWidth <= leftArea)
                            x = around_rect.left - menuWidth
                        else if(menuWidth <= rightArea)
                            x = around_rect.right

                        if(menuHeight <= bottomArea)
                            y = around_rect.top
                        else if(menuHeight <= topArea)
                            y = around_rect.bottom - menuHeight
                        break;
                    }
                }
                else
                {
                    if(myRect.right > screenRect.right)
                        x = screenRect.right - myRect.width + m;

                    if(myRect.bottom > screenRect.bottom)
                        y = screenRect.bottom - myRect.height;

                    if(myRect.left < screenRect.left)
                        x = screenRect.left;

                    if(myRect.top < screenRect.top)
                        y = screenRect.top
                }

            }

            result = `left:${x}px; top:${y}px; display: block; min-width: 15rem`
            closeButtonPos = ''
        }

        return result;
    }

    function intersects(lpRect1: DOMRect , lpRect2: DOMRect): boolean
    {
        const left  = Math.max(lpRect1.left,  lpRect2.left);
        const right = Math.min(lpRect1.right, lpRect2.right);
        const top   = Math.max(lpRect1.top, lpRect2.top);
        const bottom= Math.min(lpRect1.bottom, lpRect2.bottom);

        return ((left <= right) && (top <= bottom));
    }

    let preventScrollRestorer = null
    export async function show(around :DOMRect|DOMPoint, _operations, preference :number = 0)
    {
        if(around instanceof DOMRect)
        {
            switch(preference)
            {
            case SHOW_MENU_BELOW:
                x = around.left;
                y = around.bottom;
                break;

            case SHOW_MENU_ABOVE:
                x = around.left;
                y = around.top;
                break;

            case SHOW_MENU_RIGHT:
                x = around.right;
                y = around.top;
                break;

            case SHOW_MENU_LEFT:
                x = around.left;
                y = around.top;
                break;
            }

            around_preference = preference
            around_rect = around;
        }
        else if(around instanceof DOMPoint)
        {
            x = around.x;
            y = around.y;
            around_rect = new DOMRect(x, y, 0, 0)
        }

        visible = true;
        css_position = calculatePosition(x, y, true, true);


        operations = [..._operations];
        focused_index = operations.findIndex(o => !o.disabled)

        const is_root_menu = (owner_menu_item == undefined)


        if(is_root_menu)
        {
            hide_window_indicator = 0;
            window.addEventListener('click', on_before_window_click, true)

            if(isDeviceSmallerThan('sm'))
                preventScrollRestorer = usePreventScroll();
        }


        if(isDeviceSmallerThan("sm"))
        {
            $fabHiddenDueToPopup = true
            /*pushToolsActionsOperations ({
                opver: 1,
                operations: [
                    {
                        caption: 'Menu',
                        operations: [
                            {
                                icon: FaTimes,
                                action: (f) => { hide(); },
                                fab: 'M00',
                                tbr: 'A'
                            }
                        ]
                    }
                ]
            })*/
        }

        await tick();       // render menu and fix position after rendering

        css_position = calculatePosition(x, y, true, false);

        if(is_root_menu)
            menu_root.addEventListener('click', on_before_container_click, true)


        if(menu_items.length && !isDeviceSmallerThan("sm"))
            focus_menu_item(focused_index);


    }



    export function isVisible()
    {
        return visible;
    }

    export function hide()
    {
        if(visible)
        {
            $fabHiddenDueToPopup = false
            //popToolsActionsOperations()
        }

        visible = false;
        css_position = calculatePosition(x, y, false, false);

        window.removeEventListener('click', on_before_window_click, true);
        menu_root?.removeEventListener('click', on_before_container_click, true);
        if(preventScrollRestorer)
        {
            preventScrollRestorer();
            preventScrollRestorer = null
        }
    }

    export function getRenderedRect() :DOMRect | undefined
    {
        if(menu_root)
            return menu_root.getBoundingClientRect();
        else
            return undefined;
    }

    let hide_window_indicator :number = 0;
    function on_before_window_click()
    {
        hide_window_indicator++;
		setTimeout( ()=> {
            if(hide_window_indicator != 0)
            {
                hide_window_indicator = 0;
                hide();
            }
        }, 0);
    }

    function on_before_container_click()
    {
        hide_window_indicator--;
    }

    function on_keydown(e, operation, index)
    {
        //console.log(e);

        switch(e.key)
        {
        case 'Esc':
        case 'Escape':
            hideWholeContextMenu();
            break;

        case 'ArrowDown':
            navigate_down();
            break;

        case 'ArrowUp':
            navigate_up();
            break;

        case 'ArrowLeft':
            hide_submenu();
            break;

        case 'Enter':
            execute_action(undefined, operation, index);
            e.preventDefault();
            e.stopPropagation();
            break;

        }
    }

    function navigate_up()
    {
        let index = get_this_or_prev_valid_index(focused_index-1);
        focus_menu_item(index);
    }

    function navigate_down()
    {
        let index = get_this_or_next_valid_index(focused_index+1);
        focus_menu_item(index);
    }

    function on_change_focus(e)
    {
        if(!isDeviceSmallerThan("sm"))
        {
            if(e.relatedTarget && e.relatedTarget.id.startsWith(menu_items_id_prefix))
                return;
            else
                hide();
        }
    }

    function on_mouse_move(index)
    {
        if(!isDeviceSmallerThan("sm"))
            focus_menu_item(index);
    }

    function execute_action(e, operation, index)
    {
        const mobile = isDeviceSmallerThan("sm")

        if(operation.menu && !mobile)
        {
            focus_menu_item(index);
            return;
        }

        hideWholeContextMenu();

        if(!operation)
            return;

        ////

        /*
        if(!operation.action)
            return;

        let context_item = null
        if($contextItemsStore.focused)
            context_item = $contextItemsStore[$contextItemsStore.focused]


        operation.action(context_item);
        */
        ////

        let owner = e?.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(operation.preAction)
            operation.preAction(owner)



        if(operation.action)
        {
            //let focused_item = null
            //if($contextItemsStore.focused)
            //    focused_item = $contextItemsStore[$contextItemsStore.focused]

            operation.action(owner, around_rect)
        }
        else
        {
            let rect;
            if(around_rect)
                rect = around_rect
            else
                rect = owner.getBoundingClientRect()

            if(operation.toolbar)
                showFloatingToolbar(rect, operation.toolbar, operation.props ?? {} )
            else if(operation.grid)
            {
                if(false && mobile)
                    showMenu(rect, operation.grid)
                else
                    showGridMenu(rect, operation.grid, operation.caption ?? '')
            }
            else if(operation.menu)
            {
                showMenu(rect, operation.menu)
            }
        }


    }

    function get_this_or_next_valid_index(index: number): number
    {
        if(!operations)
            return 0;

        if(operations.length == 0)
            return 0;

        if(index >= operations.length)
            return operations.length-1;

        if(index < 0)
            return 0;

        const op = operations[index]
        if(op.separator || op.disabled)
            return get_this_or_next_valid_index(index+1)
        else
            return index;
    }

    function get_this_or_prev_valid_index(index: number): number
    {
        if(!operations)
            return 0;

        if(operations.length == 0)
            return 0;

        if(index >= operations.length)
            return operations.length-1;

        if(index < 0)
            return 0;

        const op = operations[index]
        if(op.separator || op.disabled)
            return get_this_or_prev_valid_index(index-1)
        else
            return index;
    }

    function focus_menu_item(index :number)
    {
        const operation = operations[index]
        if(operation.disabled)
            return;

        focused_index = get_this_or_next_valid_index(index)
        let element :HTMLElement = menu_items[focused_index];
        element.focus();

        if(submenus && submenus.length)
        {
            if(submenus[focused_index])
            {
                let rect :DOMRect = element.getBoundingClientRect();
                submenus[focused_index].show(rect, operations[focused_index].menu, SHOW_MENU_RIGHT)
            }

            for(let i=0; i<submenus.length; i++)
            {
                if(i!=focused_index)
                {
                    if(submenus[i])
                        submenus[i].hide();
                }
            }
        }
    }

    function hide_submenu()
    {
        if(!owner_menu_item)
            return;

        owner_menu_item.focus();
        hide();
    }

    function mousedown(e)
    {
        // preventDefault on mousedown avoids focusing the button
        // so it keeps focus (and text selection)
        e.preventDefault()
    }

    function calculateBackground(is_highlighted, active)
    {
        if(is_highlighted)
        {
            if(active)
                return 'bg-stone-400/40 dark:bg-stone-400/40';
            else
                return 'bg-stone-400/30 dark:bg-stone-400/30';
        }
        else
        {
            if(active)
                return 'bg-stone-400/20 dark:bg-stone-400/20';
            else
                return '';
        }
    }

    function isOperationActivated(operation)
    {
        if(operation.activeFunc)
            return operation.activeFunc();
        else
            return operation.active ?? false;
    }

    function isOperationDisabled(operation)
    {
        if(operation.disabledFunc)
            return operation.disabledFunc();
        else
            return operation.disabled ?? false;
    }

</script>


<div id="__hd_svelte_contextmenu"
    class="
            bg-stone-100 dark:bg-stone-800 rounded-lg shadow-md shadow-stone-500
            dark:shadow-black z-40 fixed
            sm:shadow-xl sm:shadow-slate-700/10
            sm:dark:shadow-black/80
            sm:outline sm:outline-1 sm:outline-stone-500
            z-40 fixed min-w-60 max-h-screen "

    style={css_position}
    visible={visible}
    bind:this={menu_root}>
    <div class="
                paper w-full sm:w-[24rem]
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline
                sm:max-w-3xl

                m-0 pt-3 pb-5 px-2
                sm:rounded
                sm:bg-stone-100 sm:dark:bg-stone-900
                flex flex-col
                ">

    <!-------------------------------------------------------------------->
    <!-- POPUP HEADER ---------------------------------------------------->
    <!-------------------------------------------------------------------->
    {#if closeButtonPos}
    <h3 class = "flex-none">
        <div class="px-2 w-full flex flex-row justify-between">

            <div class="grow ">
                <span class="px-2 text-left"></span>
            </div>
            <div class="py-1.5  flex flex-row justify-between">
                <button class="ml-4 w-6
                            hover:bg-stone-300 hover:dark:bg-stone-700
                            hover:outline hover:outline-8
                            hover:outline-stone-300 hover:dark:outline-stone-700"
                            on:click={hide}>
                    <Ricon icon = 'x' />
                </button>
            </div>
        </div>
    </h3>
    {/if}


    <!-------------------------------------------------------------------->
    <!-- POPUP CONTENT---------------------------------------------------->
    <!-------------------------------------------------------------------->
    <div class="px-2 grow max-h-[45dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">



        {#each operations as operation, index}

            {@const is_separator = operation.separator}
            {#if is_separator}
                {#if index>0 && index < operations.length-1}
                    <!--hr class="my-1 mx-4 border-1 border-stone-300 dark:border-stone-700"-->
                    <hr class="my-4">
                {/if}
            {:else}

                {@const mobile = isDeviceSmallerThan("sm")}
                {@const icon_placeholder_without_desc = mobile ? 12 : 10}
                {@const icon_placeholder_with_desc = mobile ? 14 : 12}
                {@const icon_placeholder_size = operation.description ? icon_placeholder_with_desc : icon_placeholder_without_desc}
                {@const menu_item_id = menu_items_id_prefix + index}
                {@const isTop = index==0}
                {@const isBottom = index == operations.length-1}
                {@const isFocused = index == focused_index}
                {@const clipFocusedBorder = isFocused ? (isTop ? 'rounded-t-lg' : (isBottom ? 'rounded-b-lg' : '')) : ''}
                {@const active = calculateBackground(isFocused || isOperationActivated(operation), false)}
                {@const has_submenu = operation.menu !== undefined && operation.menu.length > 0}
                <!--div-->
                <div class="pl-4 cursor-pointer {active}"
                    id={menu_item_id}
                    bind:this={menu_items[index]}
                    on:click|stopPropagation={(e) => { execute_action(e, operation, index) } }
                    on:mouseenter = {(e) => {on_mouse_move(index)}}
                    on:keydown|stopPropagation={(e) => on_keydown(e, operation, index)}
                    on:mousedown={mousedown}
                    disabled={isOperationDisabled(operation)}
                    class:opacity-60={isOperationDisabled(operation)}>



                <h4 class = "font-normal my-0 py-2"> <!-- test -->
                    <div class=" w-full flex flex-row justify-between">
                        {#if operation.mricon}
                        <div class="py-1 mr-1 w-4"><Ricon icon = {operation.mricon} s/></div>
                        {:else if operation.icon}
                        <div class="py-1 mr-1 w-4 text-orange-500"><Icon s="md" component={operation.icon}/></div>
                        {:else}
                        <div class="py-1 mr-1 w-4"></div>
                        {/if}
                        <div class="grow">
                            <span class="px-2 text-left">{operation.caption}
                            </span>
                        </div>

                        {#if has_submenu}
                            <div class="py-1 mr-1 w-4"><Ricon icon = 'chevron-right' xs/></div>
                            <svelte:self bind:this={submenus[index]} menu_items_id_prefix={`${menu_item_id}_`} owner_menu_item={menu_items[index]}/>
                        {/if}

                    </div>
                </h4>



        <!-- comming soon - top info --
        <figcaption>
            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                <span>OCT-254</span>
                <span class="text-center"></span>
                <span class="text-right">15 listopad 25</span>
            </div>
        </figcaption>
        -------------------------------->
        <!--@el------------------------->
        <!-- comming soon - middle info --
        <figcaption>
            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                <span>Andrzej</span>
                <span class="text-center"></span>
                <span class="text-right">Specyfikacje</span>
            </div>
        </figcaption>


        {#if summary && item[summary]}
        <figcaption>
            {item[summary]}
        </figcaption>
        {/if}
        -------------------------------->
            </div>
        <!--/div-->
    {#if false}
                <button class="block w-full pr-4 text-left flex flex-row cursor-context-menu {active} focus:outline-none items-center"
                        id={menu_item_id}
                        bind:this={menu_items[index]}
                        on:click|stopPropagation={(e) => { execute_action(e, operation, index) } }
                        on:mouseenter = {(e) => {on_mouse_move(index)}}
                        on:keydown|stopPropagation={(e) => on_keydown(e, operation, index)}
                        on:mousedown={mousedown}
                        disabled={isOperationDisabled(operation)}
                        class:opacity-60={isOperationDisabled(operation)}>

                    <div class="flex  justify-center space-x-10 px-4 py-2 ml-12 sm:ml-0" >
                        {#if operation.icon}
                            {@const cc = mobile ? 7 : 6}
                            {@const icon_size = icon_placeholder_size - cc}
                            <Icon s="md" component={operation.icon}/>
                        {:else if operation.img}
                            {@const cc = mobile ? 7 : 6}
                            {@const icon_size = icon_placeholder_size - cc}
                            <div class="w-4 h-4">
                                <img src={operation.img} alt=""/>
                            </div>
                        {:else}
                            {@const cc = mobile ? 7 : 6}
                            {@const icon_size = icon_placeholder_size - cc}
                            <div class="w-4 h-4"></div>
                        {/if}
                    </div>
                    <div class="">
                            <p class=""> {operation.caption}</p>
                        {#if operation.description}
                            <p  class="truncate inline-block text-xs">
                                {operation.description}
                            </p>
                        {/if}
                    </div>
                    {#if has_submenu}
                        <p class="ms-auto pr-1 text-sm font-mono text-stone-500">&rarr;</p>
                        <svelte:self bind:this={submenus[index]} menu_items_id_prefix={`${menu_item_id}_`} owner_menu_item={menu_items[index]}/>
                    {/if}
                </button>
    {/if}
            {/if}
        {/each}
    </div>
    <!--/div-->

    </div>
    </div>

<!-- use usePreventScroll instead -->
<!--style>
    :global(#__hd_svelte_layout_root:has(#__hd_svelte_contextmenu[visible="true"]))
    {
        overflow: hidden;
        position: fixed;
    }
</style-->
