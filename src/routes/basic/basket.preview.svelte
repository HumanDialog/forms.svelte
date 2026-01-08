<script>
	import { reef } from "@humandialog/auth.svelte";
    import {
        onErrorShowAlert, Icon,
        List, ListTitle, ListSummary, Spinner, i18n,
        contextItemsStore,
        getActiveItems,
        clearActiveItem, Ricon
    }   from '$lib'
    import { afterUpdate, onMount } from "svelte";
	import { push } from "svelte-spa-router";
	import { recentClipboardElements, transformClipboardToJSONReferences } from "./basket.utils";
    import {getElementIcon} from './icons'

    export let destinationContainer = ''
    export let onHide = undefined
    export let onSizeChanged = undefined
    export let onRefreshView = undefined
    export let onAttach = undefined
    export let onAttachAndClear = undefined

    export let clipboardElements = []
    export let browserBasedClipboard = false

    // gitlab mirror test

    let clipboardItem;
    let basketEntriesNo = -1

    const EIF_ITEM              =  0x00000000
    const EIF_CUT               =  0x00000001
    const EIF_BEGIN_GROUP       =  0x00000100
    const EIF_END_GROUP         =  0x00000200
    const EIF_NOT_ALLOWED       =  0x10000000

    let reloadTicket = -1
    let lastReloadTicket = 0

    $: initData()
    $: selectedElements = getSelectedItems($contextItemsStore)
    $: selectedElementsNo = selectedElements.length

    async function initData(...args)
    {
        if(lastReloadTicket == reloadTicket)
            return;

        lastReloadTicket = reloadTicket

        clipboardItem = {
            Elements: [...clipboardElements]
        }

        basketEntriesNo = clipboardItem.Elements.length
    }

    function getSelectedItems(...args)
    {
        const selectedElements = getActiveItems('handy')
        return selectedElements;
    }

    let listElement;
    export async function reload()
    {
        reloadTicket++;
        await initData()

        listElement.reload(clipboardItem);
    }

    let rootElement;
    let prevHeight = 0
    afterUpdate( () =>
    {
        if(rootElement)
        {
            const myRect = rootElement.getBoundingClientRect()
            if(myRect.height != prevHeight)
            {
                prevHeight = myRect.height
                if(onSizeChanged)
                    onSizeChanged();
            }
        }
    })

    /*async function editBasket()
    {
        if(onHide)
            onHide();

        if(clipboardItem && clipboardItem.href)
            push(clipboardItem.href)
    }
    */

    async function attachTo()
    {
        if(onHide)
            onHide();

        const selectedReferences = selectedElements.sort((a,b) => a.Order-b.Order).filter((e) => (e.ElementInfo & EIF_NOT_ALLOWED) == 0 )
        const references = transformClipboardToJSONReferences(selectedReferences)

        if(!destinationContainer)
        {
            if(onAttach)
            {
                onAttach(clipboardItem, references)
            }
        }
        else
        {
            const res = await reef.post(`${destinationContainer}/AttachClipboard`, { references: references }, onErrorShowAlert)
            if(res)
            {
                if(onRefreshView)
                    onRefreshView(res);
            }
        }

        recentClipboardElements(selectedReferences, browserBasedClipboard)

    }

    /*async function attachToAndClear()
    {
        if(onHide)
            onHide();

        if(!destinationContainer)
        {
            if(onAttachAndClear)
            {
                const items = [...selectedElements]
                onAttachAndClear(clipboardItem, items)
            }
        }
        else
        {
            const items = selectedElements.map( el => { return {
                Type: el.$type,
                Id: el.Id,
                Title: el.Title
            }})

            const res = await reef.post(`${destinationContainer}/AttachAndClearBasketContentMulti`, { items: items }, onErrorShowAlert)
            if(res)
            {
                if(onRefreshView)
                    onRefreshView(res);
            }
        }
    }
    */

    function clearSelection(e)
    {
        clearActiveItem('handy')
    }

    onMount( () => {
        // clear selection when shown
        clearActiveItem('handy')
    })

    let list_properties = {
        element:{
            icon: "icon",
            Title: "Title",
            Summary: "Summary",
            readonly: true,
        }
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
 <!--svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="paper w-full sm:w-[24rem]
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline
                sm:max-w-3xl

                m-0 pt-3 pb-5 px-2
                sm:rounded
                sm:bg-stone-100 sm:dark:bg-stone-900
                flex flex-col"
                bind:this={rootElement} on:click={clearSelection}>

     <!-------------------------------------------------------------------->
        <!-- POPUP HEADER ---------------------------------------------------->
        <!-------------------------------------------------------------------->
        <h3 class = "flex-none">
            <div class="px-2 w-full flex flex-row justify-between">
                <div class="ml-auto py-1.5  flex flex-row justify-between">
                    <button class="ml-4 w-6
                                hover:bg-stone-200 hover:dark:bg-stone-700
                                hover:outline hover:outline-8
                                hover:outline-stone-200 hover:dark:outline-stone-700"
                                on:click={onHide}>
                        <Ricon icon = 'x' />
                    </button>
                </div>
            </div>
        </h3>


    <!-------------------------------------------------------------------->
    <!-- POPUP CONTENT---------------------------------------------------->
    <!-------------------------------------------------------------------->
    {#if basketEntriesNo >= 0}


            {#if basketEntriesNo==0}
                <div class="w-full h-full flex items-center justify-center">
                    <p>_; Clipboard is empty; El portapapeles está vacío; Schowek jest pusty</p>
                </div>
            {:else}
                <div class="px-2 flex-none h-[45dvh] overflow-y-auto overscroll-contain">
                    <List   self={clipboardItem}
                            a='Elements'
                            {list_properties}
                            orderAttrib='Order'
                            multiselect
                            selectionKey='handy'
                            bind:this={listElement}
                            >
                    </List>
                </div>
            {/if}



        <!-------------------------------------------------------------------->
        <!-- POPUP FOOTER----------------------------------------------------->
        <!-------------------------------------------------------------------->
        <h4 class = "flex-none">

                <div class="flex flex-row justify-end gap-2">

                    <button class="px-4 mx-2
                            bg-stone-100 dark:bg-stone-800
                            outline outline-offset-2 outline-2
                            outline-stone-200 dark:outline-stone-500
                            hover:bg-stone-200 hover:dark:bg-stone-700
                            "
                            on:click={onHide}>
                        _; Cancel; Pegar; Anuluj
                    </button>
                    <button class="px-4 mx-2
                            bg-stone-100 dark:bg-stone-700
                            outline outline-offset-2 outline-2
                            outline-stone-200 dark:outline-stone-500
                            hover:bg-stone-200 hover:dark:bg-stone-700
                            "
                            disabled={!selectedElementsNo}
                            on:click={() => attachTo()}>
                        _; Paste; Pegar; Wklej
                    </button>
                </div>
            </h4>



    {:else}
        <Spinner delay={3000}/>
    {/if}

</div>