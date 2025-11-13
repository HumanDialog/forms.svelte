<script>
	import { reef } from "@humandialog/auth.svelte";
    import {
        onErrorShowAlert, Icon,
        List, ListTitle, ListSummary, Spinner, i18n,
        contextItemsStore,
        getActiveItems,
        clearActiveItem
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

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
 <!--svelte-ignore a11y-no-noninteractive-element-interactions -->
<menu class="" bind:this={rootElement} on:click={clearSelection}>
    {#if basketEntriesNo >= 0}
        <div class="w-full sm:w-80 h-64 sm:h-80 sm:max-w-sm overflow-y-auto overflow-x-clip overscroll-contain
                text-stone-600 dark:text-stone-400">

            {#if basketEntriesNo==0}
                <div class="w-full h-full flex items-center justify-center">
                    <p class="">_; Clipboard is empty; El portapapeles está vacío; Schowek jest pusty</p>
                </div>
            {:else}
                <List   self={clipboardItem}
                        a='Elements'
                        orderAttrib='Order'
                        multiselect
                        selectionKey='handy'
                        bind:this={listElement}
                        >
                    <ListTitle a='Title' readonly/>
                    <ListSummary a='Summary' readonly/>

                    <span slot="left" let:element>
                        <Icon component={getElementIcon(element)}
                            class="text-stone-500 dark:text-stone-400 h-5 w-5  cursor-pointer mt-0.5  ml-2  mr-1"/>
                    </span>
                </List>
            {/if}

        </div>

        <!-- Footer -->

            <div class="mt-2 flex flex-row justify-end gap-2">
                <!--button class=" py-2.5 px-5
                                text-base sm:text-xs font-medium
                                bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400
                                hover:bg-stone-200 hover:dark:bg-stone-600
                                disabled:bg-white/60 disabled:dark:bg-stone-700/60
                                border rounded
                                border-stone-200 dark:border-stone-600 focus:outline-none
                                disabled:border-stone-200/60 disabled:dark:border-stone-600/60
                                inline-flex items-center justify-center"
                                disabled={!clipboardItem}
                                on:click={() => editBasket()}>

                    _; Go to Clipboard; Ir al Portapapeles; Przejdź do Schowka
                </button-->

                <button class=" py-2.5 px-5
                                text-base sm:text-xs font-medium
                                bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400
                                hover:bg-stone-200 hover:dark:bg-stone-600
                                disabled:bg-white/60 disabled:dark:bg-stone-700/60
                                border rounded
                                border-stone-200 dark:border-stone-600 focus:outline-none
                                disabled:border-stone-200/60 disabled:dark:border-stone-600/60
                                inline-flex items-center justify-center"
                                disabled={!selectedElementsNo}
                                on:click={() => attachTo()}>

                    _; Paste; Pegar; Wklej
                </button>

                <!--button class=" py-2.5 px-5
                                text-base sm:text-xs font-medium
                                bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400
                                hover:bg-stone-200 hover:dark:bg-stone-600
                                disabled:bg-white/60 disabled:dark:bg-stone-700/60
                                border rounded
                                border-stone-200 dark:border-stone-600 focus:outline-none
                                disabled:border-stone-200/60 disabled:dark:border-stone-600/60
                                inline-flex items-center justify-center"
                                disabled={!selectedElementsNo}
                                on:click={() => attachToAndClear()}>

                    _; Paste and forget; Pegar y olvidar; Wklej i zapomnij
                </button-->
            </div>

    {:else}
        <Spinner delay={3000}/>
    {/if}

</menu>