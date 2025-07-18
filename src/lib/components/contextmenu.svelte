<script lang="ts">
	import { afterUpdate, tick} from 'svelte';
    import Icon from './icon.svelte'
    import {contextItemsStore, pushToolsActionsOperations, popToolsActionsOperations} from '../stores'
    import {isDeviceSmallerThan, isOnScreenKeyboardVisible} from '../utils'
    import {hideWholeContextMenu, showMenu, showFloatingToolbar, showGridMenu} from './menu'
    import {FaTimes} from 'svelte-icons/fa'

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
    let css_position = ''
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
            //css_position = calculatePosition(x, y, around_rect, visible);
        }
    })
        */

    function calculatePosition(x: number, y: number, around: DOMRect, visible: boolean, fresh: boolean): string
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

            if(myRect)
            {
                let maxHeight = screenRect.height / 2 - margin;

                if(myRect.height < maxHeight)
                    maxHeight = myRect.height

                const width = screenRect.width - 2*margin;
                x = margin;
                y = screenRect.bottom - maxHeight - margin;

                result = `left: ${x}px; top: ${y}px; width: ${width}px; max-height: ${maxHeight}px; display: block`
            }
            else
            {
                const maxHeight = screenRect.height / 2 - margin;
                const width = screenRect.width - 2*margin;
                x = margin;
                y = screenRect.bottom - maxHeight - margin;

                result = `left: ${x}px; top: ${y}px; width: ${width}px; max-height: ${maxHeight}px; display: block`
            }

            closeButtonPos = `right: ${margin}px; top: calc(${y}px - 1.75rem)`

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

                let xShifted = false;
                if(myRect.right > screenRect.right)
                {
                    x = screenRect.right - myRect.width + m;
                    xShifted = true;
                }

                let yShifted = false;
                if(myRect.bottom > screenRect.bottom)
                {
                    y = screenRect.bottom - myRect.height;
                    if(around)
                    {
                        if(xShifted)    // possible covers around rect
                            x -= around.width;
                        else
                            y -= around.height;
                    }
                    yShifted = true;
                }

                if(myRect.left < screenRect.left)
                    x = screenRect.left;

                if(myRect.top < screenRect.top)
                    y = screenRect.top
            }

            result = `left:${x}px; top:${y}px; display: block; min-width: 15rem`
            closeButtonPos = ''
        }

        return result;
    }

    export async function show(around :DOMRect|DOMPoint, _operations)
    {
        if(around instanceof DOMRect)
        {
            x = around.left;
            y = around.bottom;
            around_rect = around;
        }
        else if(around instanceof DOMPoint)
        {
            x = around.x;
            y = around.y;
            around_rect = new DOMRect(x, y, 0, 0)
        }

        visible = true;
        css_position = calculatePosition(x, y, around_rect, true, true);


        operations = [..._operations];
        focused_index = operations.findIndex(o => !o.disabled)

        const is_root_menu = (owner_menu_item == undefined)


        if(is_root_menu)
        {
            hide_window_indicator = 0;
            window.addEventListener('click', on_before_window_click, true)
        }


        if(false && isDeviceSmallerThan("sm"))
        {
            pushToolsActionsOperations ({
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
            })
        }

        await tick();       // render menu and fix position after rendering

        css_position = calculatePosition(x, y, around_rect, true, false);

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
        if(false && visible)
            popToolsActionsOperations()

        visible = false;
        css_position = calculatePosition(x, y, around_rect, false, false);

        window.removeEventListener('click', on_before_window_click, true);
        menu_root?.removeEventListener('click', on_before_container_click, true);
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
        if(operation.menu)
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

        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(operation.preAction)
            operation.preAction(owner)

        const mobile = isDeviceSmallerThan("sm")

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
                if(mobile)
                    showMenu(rect, operation.grid)
                else
                    showGridMenu(rect, operation.grid)
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
                let container_rect = new DOMRect(0, 0, window.innerWidth, window.innerHeight);

                let _x = rect.right;
                let _y = rect.top;

                let submenu_width = min_width_px;
                let rendered_rect = submenus[focused_index].getRenderedRect();
                if(rendered_rect && rendered_rect.width > 0)
                    submenu_width = rendered_rect.width;


                if(_x + submenu_width > container_rect.right)
                {
                    // choose left or right side depending on which space is larger
                    if(rect.left - container_rect.left > container_rect.right - rect.right)
                        _x = rect.left - submenu_width;
                }

                submenus[focused_index].show(new DOMPoint(_x, _y), operations[focused_index].menu)
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

</script>


<div id="__hd_svelte_contextmenu"
    class=" bg-white dark:bg-stone-800
            text-stone-800 dark:text-stone-400 rounded-lg border
            border-stone-200 dark:border-stone-700 shadow-md
            z-40 fixed min-w-60 max-h-screen overflow-y-auto"
    style={css_position}
    bind:this={menu_root}>

    {#if closeButtonPos}
        <button class="     fixed w-6 h-6 flex items-center justify-center
                            text-stone-500 bg-stone-200/70 hover:bg-stone-200
                            focus:outline-none font-medium rounded-full text-sm text-center
                            dark:text-stone-500 dark:bg-stone-700/80 dark:hover:bg-stone-700 
                            focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800" 
                style={closeButtonPos}
                on:click={ hide }>
            <Icon component={FaTimes} s="md"/>
        </button>
    {/if}

    {#each operations as operation, index}
        {@const is_separator = operation.separator}
        {#if is_separator}
            {#if index>0 && index < operations.length-1}
                <hr class="my-1 mx-4 border-1 border-stone-300 dark:border-stone-700">
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
            {@const active = calculateBackground(isFocused, false)}
            {@const has_submenu = operation.menu !== undefined && operation.menu.length > 0}

            <button class="block  w-full pr-4 text-left flex flex-row cursor-context-menu {active} focus:outline-none items-center"
                    id={menu_item_id}
                    bind:this={menu_items[index]}
                    on:click|stopPropagation={(e) => { execute_action(e, operation, index) } }
                    on:mouseenter = {(e) => {on_mouse_move(index)}}
                    on:keydown|stopPropagation={(e) => on_keydown(e, operation, index)}
                    on:mousedown={mousedown}
                    disabled={operation.disabled}
                    class:opacity-60={operation.disabled}>

                <div class="flex  justify-center space-x-10 px-4 py-2 ml-12 sm:ml-0" >
                    {#if operation.icon}
                        {@const cc = mobile ? 7 : 6}
                        {@const icon_size = icon_placeholder_size - cc}
                        <Icon s="md" component={operation.icon}/>
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
    {/each}
</div>