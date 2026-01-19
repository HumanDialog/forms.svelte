<script lang="ts">
    import Menu from './contextmenu.svelte'

    let visible :boolean = false;
    let menu;

    let onOrgHideCallback :Function|undefined = undefined

    export async function show(around :DOMRect|DOMPoint, _operations, preference :number = 0, onHideCallback: Function|undefined = undefined)
    {
        visible = true
        onOrgHideCallback = onHideCallback
        menu?.show(around, _operations, preference, onHide);
    }

    export function isVisible()
    {
        return visible;
    }

    export function hide()
    {
        visible = false
        menu?.hide()
    }

    function onHide()
    {
        if(onOrgHideCallback)
            onOrgHideCallback()

        visible = false
    }

    function on_window_click(e)
    {
        const clickedElement = e.target
        if(clickedElement.id == '__hd_svelte_contextmenu')
        {
            hide()   
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div id="__hd_svelte_contextmenu"
    class=" z-40 
            fixed inset-0 w-screen overflow-y-auto overscroll-contain"
    hidden={!visible}
    on:click={on_window_click}>

    <Menu bind:this={menu}/>

</div>