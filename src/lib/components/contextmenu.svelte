<script lang="ts">
	import { afterUpdate, tick} from 'svelte';
    import Icon from './icon.svelte'
    import {context_items_store} from '../stores'
    import {is_device_smaller_than} from '../utils'

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

        await tick();

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
    }

    export function get_rendered_rect() :DOMRect | undefined
    {
        if(menu_root)
            return menu_root.getBoundingClientRect();
        else
            return undefined;
    }


    function on_keydown(e, operation, index)
    {
        //console.log(e);

        switch(e.key)
        {
        case 'Esc':
        case 'Escape':
            hide();
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

        hide();

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

        if(submenus && submenus.length && submenus[focused_index])
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

            submenus[focused_index].show(_x, _y, operations[focused_index].menu)
        }
    }

    function hide_submenu()
    {
        if(!owner_menu_item)
            return;

        owner_menu_item.focus();
    }
    

</script>

<div id="__hd_svelte_contextmenu" 
    class="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md z-20 fixed min-w-[{min_width_px}px] w-max" 
    style={`left:${x}px; top:${y}px; display:${display}`}
    bind:this={menu_root}
    on:focusout={on_change_focus}>

    {#each operations as operation, index}
        {@const is_separator = operation.separator}
        {#if is_separator}
            <hr class="my-1 mx-1">
        {:else}
            {@const icon_placeholder_size = operation.description ? 12 : 10}
            {@const menu_item_id = menu_items_id_prefix + index}
            {@const active = focused_index == index ? 'bg-gray-200 dark:bg-gray-700' : ''}
            {@const has_submenu = operation.menu !== undefined && operation.menu.length > 0}
            
            <button class="font-medium m-0 p-2 text-sm w-full text-left flex flex-row cursor-context-menu {active} focus:outline-none"
                    id={menu_item_id}
                    bind:this={menu_items[index]}
                    on:click|stopPropagation={(e) => { execute_action(operation, index) } } 
                    on:mouseenter = {(e) => {on_mouse_move(index)}}
                    on:keydown|stopPropagation={(e) => on_keydown(e, operation, index)}>
                    
                <div class="flex items-center justify-center" style:width={`${icon_placeholder_size*0.25}rem`}>
                    {#if operation.icon}
                        {@const icon_size = icon_placeholder_size - 6}
                        <Icon size={icon_size} component={operation.icon}/>
                    {/if}
                </div>
                <div class="">
                    <p>{operation.caption}</p>
                    {#if operation.description}
                        {@const shortcut_width_px = operation.shortcut ? 80 : 0}
                        <p  class="text-sm font-normal text-gray-400 dark:text-gray-500 truncate inline-block"
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