<script lang="ts">
	import { afterUpdate, tick} from 'svelte';
    import Icon from './icon.svelte'
    import {contextItemsStore} from '../stores'
    import {isDeviceSmallerThan} from '../utils'
    import {hideWholeContextMenu} from './menu'

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

    $: display = visible ? 'block' : 'none';

    afterUpdate(() => 
    {
        let rect :DOMRect = menu_root.getBoundingClientRect()
        if(rect.height == 0)
            return;

        const m = 15;
        let container_rect :DOMRect = new DOMRect(m, 0, window.innerWidth-2*m, window.innerHeight)
        
        if(isDeviceSmallerThan('sm'))       // are we on mobile?
        {
            const sel = window.getSelection();
            //console.log('sel', sel)
            // if we have active selections then it's very possible we have onscreen keyboard visible, se we need to shrink window.innerHeight 
            if(sel && sel.rangeCount>0 && sel.focusNode && sel.focusNode.nodeType==sel.focusNode.TEXT_NODE)
            {
                container_rect.height -= 300; // it will be enough?
                console.log('shirnked: ', container_rect)
            }
        }

        
        
        //console.log('beforeUpdate', rect, ' in ', container_rect)
                
        let xShifted = false;
        if(rect.right > container_rect.right)
        {
            x = container_rect.right - rect.width + m;
            xShifted = true;
        }

        let yShifted = false;
        if(rect.bottom > container_rect.bottom)
        {
            y = container_rect.bottom - rect.height-m;
            if(xShifted)    // possible covers around rect
                x -= around_rect.width;
            else
                y -= around_rect.height-m;
            yShifted = true;
        }

        if(rect.left < container_rect.left)
            x = container_rect.left;

        if(rect.top < container_rect.top)
            y = container_rect.top
    })
    
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
        
        operations = [..._operations];
        focused_index = 0;

        const is_root_menu = (owner_menu_item == undefined)


        if(is_root_menu)
        {
            hide_window_indicator = 0;
            window.addEventListener('click', on_before_window_click, true)
        }
        

        await tick();

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
        visible = false;

        window.removeEventListener('click', on_before_window_click, true);
        menu_root.removeEventListener('click', on_before_container_click, true);
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
            execute_action(operation, index);
            e.preventDefault();
            e.stopPropagation();
            break;

        }
    }

    function navigate_up()
    {
        let index = focused_index;
        while(index > 0 && menu_items.length > 0)
        {
            let prev_item = menu_items[--index];
            if(prev_item)
            {
                focus_menu_item(index);
                break;
            } 
        }
    }

    function navigate_down()
    {
        let index = focused_index;
        while(index+1 < menu_items.length)
        {
            let next_item = menu_items[++index];
            if(next_item)
            {
                focus_menu_item(index);
                break;
            }
        }
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

    function execute_action(operation, index)
    {
        if(operation.menu)
        {
            focus_menu_item(index);
            return;
        }

        hideWholeContextMenu();

        if(!operation)
            return;

        if(!operation.action)
            return;

        let context_item = null
        if($contextItemsStore.focused)
            context_item = $contextItemsStore[$contextItemsStore.focused]
        
        
        operation.action(context_item);
    }

    function focus_menu_item(index :number)
    {
        focused_index = index;
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

</script>

<div id="__hd_svelte_contextmenu" 
    class=" bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-lg border border-stone-200 dark:border-stone-900 shadow-md 
            z-30 fixed min-w-[{min_width_px}px] w-max" 
    style={`left:${x}px; top:${y}px; display:${display}`}
    bind:this={menu_root}>

    {#each operations as operation, index}
        {@const is_separator = operation.separator}
        {#if is_separator}
            <hr class="my-1 mx-0 border-1 dark:border-stone-900">
        {:else}
            {@const mobile = isDeviceSmallerThan("sm")}
            {@const icon_placeholder_without_desc = mobile ? 12 : 10}
            {@const icon_placeholder_with_desc = mobile ? 14 : 12}
            {@const icon_placeholder_size = operation.description ? icon_placeholder_with_desc : icon_placeholder_without_desc}
            {@const menu_item_id = menu_items_id_prefix + index}
            {@const active = ((!mobile) && (focused_index == index)) ? 'bg-stone-200 dark:bg-stone-600' : ''}
            {@const has_submenu = operation.menu !== undefined && operation.menu.length > 0}
            
            <button class="font-medium m-0 py-2 pr-4 text-lg sm:text-sm w-full text-left flex flex-row cursor-context-menu {active} focus:outline-none"
                    id={menu_item_id}
                    bind:this={menu_items[index]}
                    on:click|stopPropagation={(e) => { execute_action(operation, index) } } 
                    on:mouseenter = {(e) => {on_mouse_move(index)}}
                    on:keydown|stopPropagation={(e) => on_keydown(e, operation, index)}
                    on:mousedown={mousedown}>
                    
                <div class="flex items-center justify-center mt-1 sm:mt-0.5" style:width={`${icon_placeholder_size*0.25}rem`}>
                    {#if operation.icon}
                        {@const cc = mobile ? 7 : 6}
                        {@const icon_size = icon_placeholder_size - cc}
                        <Icon size={icon_size} component={operation.icon}/>
                    {/if}
                </div>
                <div class="">
                    <p>{operation.caption}</p>
                    {#if operation.description}
                        {@const shortcut_width_px = operation.shortcut ? 80 : 0}
                        <p  class="text-sm font-normal text-stone-900 dark:text-stone-500 truncate inline-block"
                            style:max-width={`calc(${width_px-shortcut_width_px} - 3rem)`} >{operation.description}</p>
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