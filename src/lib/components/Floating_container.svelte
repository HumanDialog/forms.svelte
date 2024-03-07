<script lang="ts">

    import {tick, afterUpdate} from 'svelte'
    
    let x :number;
    let y :number;
    let visible :boolean = false;
    let toolbar;
    let props = {};

    let around_rect :DOMRect;

    let root_element;
    
    $: display = visible ? 'fixed' : 'hidden';

    export async function show(around :DOMRect | DOMPoint, _toolbar, _props = {})
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
            around_rect = new DOMRect(x, y, 0, 0);
        }
        
        const was_visible = visible;

        visible = true;
        toolbar = _toolbar;
        props = _props;

        props.onhide = () => {hide()};

        hide_window_indicator = 0;
        window.addEventListener('click', on_before_window_click, true);
                
        await tick();

        if(!was_visible)
            root_element.addEventListener('click', on_before_container_click, true);
    }

    export function is_visible()
    {
        return visible;
    }

    export function hide()
    {
        visible = false;
        window.removeEventListener('click', on_before_window_click, true);
        root_element.removeEventListener('click', on_before_container_click, true);
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

    afterUpdate(() => 
    {
        if(!root_element)
            return;

        let rect :DOMRect = root_element.getBoundingClientRect()
        if(rect.height == 0)
            return;

        let container_rect :DOMRect = new DOMRect(0, 0, window.innerWidth, window.innerHeight)
                        
        if(rect.right > container_rect.right)
            x = container_rect.right - rect.width;

        if(rect.bottom > container_rect.bottom)
            y = container_rect.bottom - rect.height - around_rect.height;
            
        if(rect.left < container_rect.left)
            x = container_rect.left;

        if(rect.top < container_rect.top)
            y = container_rect.top
      
    })


</script>

<div    id="__hd_svelte_floating_container"
        class="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shadow {display}"
        style="left:{x}px; top:{y}px; width: max-content; height:max-content"
        bind:this={root_element}>
    <svelte:component this={toolbar} {...props} />
</div>

