<script lang="ts">
	import { afterUpdate, tick} from 'svelte';
    import Icon from './icon.svelte'
    import {context_items_store} from '../stores'
    import {is_device_smaller_than} from '../utils'
    import {hide_whole_context_menu} from './menu'

    export let width_px     :number = 400;

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

        let container_rect :DOMRect = new DOMRect(0, 0, window.innerWidth, window.innerHeight)
        //console.log('beforeUpdate', rect, ' in ', container_rect)
                
        if(rect.right > container_rect.right)
            x = container_rect.right - rect.width;

        if(rect.bottom > container_rect.bottom)
            y = container_rect.bottom - rect.height - around_rect.height;

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

        if(menu_items.length)
            focus_menu_item(focused_index);
        
    }

    export function is_visible()
    {
        return visible;
    }

    export function hide()
    {
        visible = false;

        window.removeEventListener('click', on_before_window_click, true);
        menu_root.removeEventListener('click', on_before_container_click, true);
    }

    export function get_rendered_rect() :DOMRect | undefined
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
            hide_whole_context_menu();
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
        if(!is_device_smaller_than("sm"))
        {
            if(e.relatedTarget && e.relatedTarget.id.startsWith(menu_items_id_prefix))
                return;
            else
                hide();
        }
    }

    function on_mouse_move(index)
    {
        focus_menu_item(index);
    }

    function execute_action(operation, index)
    {
        if(operation.menu)
        {
            focus_menu_item(index);
            return;
        }

        hide_whole_context_menu();

        if(!operation)
            return;

        if(!operation.action)
            return;

        let context_item = null
        if($context_items_store.focused)
            context_item = $context_items_store[$context_items_store.focused]
        
        
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
                let rendered_rect = submenus[focused_index].get_rendered_rect();
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
    

</script>

<div id="__hd_svelte_contextmenu" 
    class=" bg-white dark:bg-gray-700 text-slate-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-900 shadow-md 
            z-30 fixed min-w-[{min_width_px}px] w-max" 
    style={`left:${x}px; top:${y}px; display:${display}`}
    bind:this={menu_root}>

    {#each operations as operation, index}
        {@const is_separator = operation.separator}
        {#if is_separator}
            <hr class="my-1 mx-0 border-1 dark:border-slate-900">
        {:else}
            {@const mobile = is_device_smaller_than("sm")}
            {@const icon_placeholder_without_desc = mobile ? 12 : 10}
            {@const icon_placeholder_with_desc = mobile ? 14 : 12}
            {@const icon_placeholder_size = operation.description ? icon_placeholder_with_desc : icon_placeholder_without_desc}
            {@const menu_item_id = menu_items_id_prefix + index}
            {@const active = focused_index == index ? 'bg-gray-200 dark:bg-gray-600' : ''}
            {@const has_submenu = operation.menu !== undefined && operation.menu.length > 0}
            
            <button class="font-medium m-0 p-2 text-lg sm:text-sm w-full text-left flex flex-row cursor-context-menu {active} focus:outline-none"
                    id={menu_item_id}
                    bind:this={menu_items[index]}
                    on:click|stopPropagation={(e) => { execute_action(operation, index) } } 
                    on:mouseenter = {(e) => {on_mouse_move(index)}}
                    on:keydown|stopPropagation={(e) => on_keydown(e, operation, index)}>
                    
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
                        <p  class="text-sm font-normal text-slate-900 dark:text-gray-500 truncate inline-block"
                            style:max-width={`calc(${width_px-shortcut_width_px} - 3rem)`} >{operation.description}</p>
                    {/if}
                </div>
                {#if has_submenu}
                    <p class="ms-auto pr-1 text-sm font-mono text-gray-500">&rarr;</p>
                    <svelte:self bind:this={submenus[index]} menu_items_id_prefix={`${menu_item_id}_`} owner_menu_item={menu_items[index]}/>
                {/if}
            </button>
        {/if}
    {/each}
</div>