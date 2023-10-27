<script lang="ts">

    import {tick, afterUpdate} from 'svelte'
    import {is_device_smaller_than} from '../utils'
    
    let x :number;
    let y :number;
    let visible :boolean = false;
    let toolbar;
    let props = {};

    let around_rect :DOMRect;

    let root_element;
    let invisible_button;
    
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
        
        visible = true;
        toolbar = _toolbar;
        props = _props;

        props.onhide = () => {hide()};
                
        await tick();

        focus_first_element();
    }

    export function is_visible()
    {
        return visible;
    }

    export function hide()
    {
        visible = false;
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

    function focus_first_element()
    {
        invisible_button.focus();
        return;

        let focusable = root_element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        focusable.focus();
    }

    function on_focus_out(e)
    {
        if(!is_device_smaller_than("sm"))
        {
            if(e.relatedTarget && root_element?.contains(e.relatedTarget))
            {

            }
            else
                hide();
        }
        else
        {

        }
    }


</script>

<div    id="__hd_svelte_floating_container"
        class="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shadow {display}"
        style="left:{x}px; top:{y}px; width: max-content; height:max-content"
        on:focusout={on_focus_out}
        bind:this={root_element}>
    <button class="w-0 h-0 fixed bg-transparent " bind:this={invisible_button}></button>
    <svelte:component this={toolbar} {...props} />
</div>

