<script lang="ts">

    import {tick, afterUpdate} from 'svelte'
    import {isDeviceSmallerThan} from '../utils'
    import {toolsActionsOperations} from '../stores'
    import {FaTimes} from 'svelte-icons/fa'
    
    let x :number;
    let y :number;
    let visible :boolean = false;
    let toolbar;
    let props = {};

    let around_rect :DOMRect;

    let root_element;
    
    //$: display = visible ? 'fixed' : 'hidden';

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
        
        cssPosition = calculatePosition(x, y, around_rect, true, true);

        props.onHide = () => {hide()};
        props.onSizeChanged = () => onSizeChanged();

        hide_window_indicator = 0;
        window.addEventListener('click', on_before_window_click, true);

        if(isDeviceSmallerThan("sm"))
        {    
            $toolsActionsOperations = {
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
            }
        }
                
        await tick();

        if(!was_visible)
            root_element.addEventListener('click', on_before_container_click, true);

        cssPosition = calculatePosition(x, y, around_rect, true, false);
    }

    export function isVisible()
    {
        return visible;
    }

    export function hide()
    {
        visible = false;
        cssPosition = calculatePosition(x, y, around_rect, false, false);
        $toolsActionsOperations = []
        
        window.removeEventListener('click', on_before_window_click, true);
        root_element.removeEventListener('click', on_before_container_click, true);
    }

    async function onSizeChanged()
    {
        cssPosition = calculatePosition(x, y, around_rect, true, true);
        await tick();
        cssPosition = calculatePosition(x, y, around_rect, true, false);
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

    /*afterUpdate(() => 
    {
        if(!root_element)
            return;

        let myRect :DOMRect = root_element.getBoundingClientRect()
        if(myRect.height == 0)
            return;

        const m = 15;
        let screenRect :DOMRect = new DOMRect(m, 0, window.innerWidth-2*m, window.innerHeight)
                        
        if(myRect.right > screenRect.right)
            x = screenRect.right - myRect.width;

        if(myRect.bottom > screenRect.bottom)
            y = screenRect.bottom - myRect.height - around_rect.height;
            
        if(myRect.left < screenRect.left)
            x = screenRect.left;

        if(myRect.top < screenRect.top)
            y = screenRect.top
      
    })*/

    let cssPosition = ''
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
                myRect = root_element.getBoundingClientRect()
                if(myRect && myRect.height == 0)
                    myRect = null;
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
        }
        else
        {
            let myRect :DOMRect|null = null;

            if(!fresh)
            {
                myRect = root_element.getBoundingClientRect()
                if(myRect && myRect.height == 0)
                    myRect = null;
            }

            const m = 15;
            let screenRect :DOMRect = new DOMRect(m, 0, window.innerWidth-2*m, window.innerHeight)
                    
            if(myRect)
            {
                if(myRect.right > screenRect.right)
                    x = screenRect.right - myRect.width;

                if(myRect.bottom > screenRect.bottom)
                    y = screenRect.bottom - myRect.height - around_rect.height;
                    
                if(myRect.left < screenRect.left)
                    x = screenRect.left;

                if(myRect.top < screenRect.top)
                    y = screenRect.top
            }

            result = `left:${x}px; top:${y}px; width: max-content; height:max-content; display: block`
            
        }

        return result;
    }


</script>

<div    id="__hd_svelte_floating_container"
        class="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg shadow  z-30 fixed"
        style={cssPosition}
        bind:this={root_element}>
    <svelte:component this={toolbar} {...props} />
</div>

