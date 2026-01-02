<script lang="ts">

    import {tick, afterUpdate} from 'svelte'
    import {isDeviceSmallerThan} from '../utils'
    import {pushToolsActionsOperations, popToolsActionsOperations, fabHiddenDueToPopup} from '../stores'
    import {FaTimes} from 'svelte-icons/fa'
    import Icon from './icon.svelte'
    import {usePreventScroll} from './react-aria/preventScroll'

    let x :number;
    let y :number;
    let visible :boolean = false;
    let toolbar;
    let props = {};

    let around_rect :DOMRect;

    let rootElement;
    let internalElement;
    let closeButtonPos = ''
    let maxHeight = 0
    let preventScrollRestorer = null
    
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

        if((!was_visible) && (toolbar == _toolbar) && internalElement && internalElement.reload)
        {
            internalElement.reload(_props);
        }

        visible = true;
        toolbar = _toolbar;
        props = _props;

        cssPosition = calculatePosition(x, y, around_rect, true, true);

        props.onHide = () => {hide()};
        props.onSizeChanged = () => onSizeChanged();

        hide_window_indicator = 0;
        window.addEventListener('click', on_before_window_click, true);

        if(isDeviceSmallerThan('sm'))
            preventScrollRestorer = usePreventScroll();

        if(isDeviceSmallerThan("sm"))
        {    
            $fabHiddenDueToPopup = true
            /*pushToolsActionsOperations( {
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
                
        await tick();

        if(!was_visible)
            rootElement.addEventListener('click', on_before_container_click, true);

        cssPosition = calculatePosition(x, y, around_rect, true, false);
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
            //popToolsActionsOperations();
        }

        visible = false;
        toolbar = null;
        cssPosition = calculatePosition(x, y, around_rect, false, false);
        
        window.removeEventListener('click', on_before_window_click, true);
        rootElement?.removeEventListener('click', on_before_container_click, true);
        if(preventScrollRestorer)
        {
            preventScrollRestorer()
            preventScrollRestorer = null
        }
    }

    export function isSameToolbar(_toolbar)
    {
        return _toolbar == toolbar;
    }

    async function onSizeChanged()
    {
        if(!visible)
            return;

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
        if(!rootElement)
            return;

        let myRect :DOMRect = rootElement.getBoundingClientRect()
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
                myRect = rootElement.getBoundingClientRect()
                if(myRect && myRect.height == 0)
                    myRect = null;
            }
            
            if(myRect)
            {
                maxHeight = screenRect.height / 2 - margin;

                if(myRect.height < maxHeight)
                    maxHeight = myRect.height
                
                const width = screenRect.width - 2*margin;
                x = margin;
                y = screenRect.bottom - maxHeight - margin;

                result = `left: ${x}px; bottom: ${margin}px; width: ${width}px; max-height: ${maxHeight}px; display: block`
            }
            else
            {
                maxHeight = screenRect.height / 2 - margin;
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
                myRect = rootElement.getBoundingClientRect()
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
            closeButtonPos = ``
            
        }

        return result;
    }


</script>

<div    id="__hd_svelte_floating_container"
        class="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg shadow-md shadow-stone-500 dark:shadow-black z-40 fixed "
        style={cssPosition}
        visible={visible}
        bind:this={rootElement}>
        {#if closeButtonPos}
    <button class="     text-stone-800 dark:text-stone-400
                        fixed w-6 h-6 flex items-center justify-center
                        focus:outline-none font-medium  text-sm text-center" 
            style={closeButtonPos}
            on:click={ hide }>  <!--rounded-full focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 text-stone-500 bg-stone-200/70 hover:bg-stone-200 dark:text-stone-500 dark:bg-stone-700/80 dark:hover:bg-stone-700  -->
            <Icon component={FaTimes} s="md"/>
        </button>
    {/if}

    {#if toolbar}
        <svelte:component this={toolbar} {...props} {maxHeight} bind:this={internalElement} />
    {/if}
</div>

<!-- use usePreventScroll instead -->
<!--style>
    :global(body:has(#__hd_svelte_floating_container[visible="true"])) 
    {
        overflow: hidden;
    }
</style-->