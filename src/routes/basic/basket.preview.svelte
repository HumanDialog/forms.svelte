<script>
	import { reef } from "@humandialog/auth.svelte";
    import {
        onErrorShowAlert, Icon,
        List, ListTitle, ListSummary, Spinner, i18n,
        contextItemsStore,
        getActiveItems,
        clearActiveItem
    }   from '$lib'
    import {FaRegFolder, FaRegFile, FaRegCalendarCheck, FaRegCalendar, FaFileDownload} from 'svelte-icons/fa'
	import { afterUpdate, onMount } from "svelte";
	import { push } from "svelte-spa-router";

    export let destinationContainer = ''
    export let onHide = undefined
    export let onSizeChanged = undefined
    export let onRefreshView = undefined
    export let onAttach = undefined
    export let onAttachAndClear = undefined

    // gitlab mirror test

    let basketItem;
    let basketEntriesNo = 0
    
    const STATE_FINISHED = 7000;

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

        let res = await reef.post(`/user/BasketFolder/query`,
                            {
                                Id: 1,
                                Name: '',
                                Tree:
                                [
                                    {
                                        Id: 1,
                                        Association: '',
                                        Expressions:['Id', '$ref','Title','Summary', 'href'],
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: 'Folders',
                                                Expressions:['Id','$ref', 'Title', 'Summary', 'Order', 'href', 'IsPinned', '$type', 'icon']

                                            },
                                            {
                                                Id: 3,
                                                Association: 'Notes',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href', '$type']

                                            },
                                            {
                                                Id: 4,
                                                Association: 'Tasks',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'State', 'href', '$type']

                                            },
                                            {
                                                Id: 5,
                                                Association: 'Files',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'Order', 'href', '$type']

                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);
        if(res)
        {
            basketItem = res.Folder;
            basketEntriesNo = 0;

            basketItem.allElements = []

            if(basketItem.Folders && basketItem.Folders.length > 0)
            {
                basketEntriesNo += basketItem.Folders.length;
                basketItem.allElements = [...basketItem.allElements, ...basketItem.Folders]
            }

            if(basketItem.Notes && basketItem.Notes.length > 0)
            {
                basketEntriesNo += basketItem.Notes.length;
                basketItem.allElements = [...basketItem.allElements, ...basketItem.Notes]
            }

            if(basketItem.Tasks && basketItem.Tasks.length > 0)
            {
                basketEntriesNo += basketItem.Tasks.length;
                basketItem.allElements = [...basketItem.allElements, ...basketItem.Tasks]
            }

            if(basketItem.Files && basketItem.Files.length > 0)
            {
                basketEntriesNo += basketItem.Files.length;
                basketItem.allElements = [...basketItem.allElements, ...basketItem.Files]
            }

            basketItem.allElements.sort((a,b) => a.Order - b.Order)

        }
        else
        {
            basketItem = null
            basketEntriesNo = 0
            basketItem.allElements = []
        }
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

        listElement.reload(basketItem);
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

    async function editBasket()
    {
        if(onHide)
            onHide();

        if(basketItem && basketItem.href)
            push(basketItem.href)
    }

    async function attachTo()
    {
        if(onHide)
            onHide();

        if(!destinationContainer)
        {
            if(onAttach)
            {
                const items = [...selectedElements]
                onAttach(basketItem, items)
            }
        }
        else
        {
            const items = selectedElements.map( el => { return {
                Type: el.$type,
                Id: el.Id,
                Title: el.Title
            }})

            const res = await reef.post(`${destinationContainer}/AttachBasketContentMulti`, { items: items }, onErrorShowAlert)
            if(res)
            {
                if(onRefreshView)
                    onRefreshView(res);
            }
        }

    }

    async function attachToAndClear()
    {
        if(onHide)
            onHide();

        if(!destinationContainer)
        {
            if(onAttachAndClear)
            {
                const items = [...selectedElements]
                onAttachAndClear(basketItem, items)
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

    function getFolderIcon(folder)
    {
        if(folder.icon)
        {
            switch(folder.icon)
            {
            case 'Folder':
                return FaRegFolder;
            case 'Clipboard':
                return FaRegClipboard;
            case 'Discussion':
                return FaRegComments;
            default:
                return FaRegFolder
            }
        }
        else
            return FaRegFolder
    }

    function getElementIcon(element)
    {
        switch(element.$type)
        {
        case 'Folder':
        case 'FolderFolder':
            return getFolderIcon(element)

        case 'Note':
        case 'FolderNote':
            return FaRegFile;

        case 'Task':
        case 'FolderTask':
            return FaRegCalendar;

        case 'UploadedFile':
        case 'FolderFile':
            return FaFileDownload;
        }
    }

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
    {#if basketItem}
        <div class="w-full h-64 sm:h-80 sm:max-w-sm overflow-y-auto overflow-x-clip
                text-stone-600 dark:text-stone-400">

            {#if basketEntriesNo==0}
                <div class="h-full flex items-center justify-center">
                    <p>_; Clipboard is empty; El portapapeles está vacío; Schowek jest pusty</p>
                </div>
            {/if}

            <List   self={basketItem}
                    a='allElements'
                    orderAttrib='Order'
                    multiselect
                    selectionKey='handy'
                    bind:this={listElement}
                    >
                <ListTitle a='Title' readonly/>
                <ListSummary a='Summary' readonly/>

                <span slot="left" let:element>
                    <Icon component={getElementIcon(element)}
                        class="h-5 w-5 sm:w-4 sm:h-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 "/>
                </span>
            </List>

            

        </div>

        <!-- Footer -->

            <div class="mt-2 flex flex-row justify-stretch gap-2">
                <button class=" py-2.5 px-5
                                text-base sm:text-xs font-medium
                                bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400
                                hover:bg-stone-200 hover:dark:bg-stone-600
                                disabled:bg-white/60 disabled:dark:bg-stone-700/60
                                border rounded
                                border-stone-200 dark:border-stone-600 focus:outline-none
                                disabled:border-stone-200/60 disabled:dark:border-stone-600/60
                                inline-flex items-center justify-center"
                                disabled={!basketItem}
                                on:click={() => editBasket()}>

                    _; Go to Clipboard; Ir al Portapapeles; Przejdź do Schowka
                </button>

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
                                on:click={() => attachToAndClear()}>

                    _; Paste and forget; Pegar y olvidar; Wklej i zapomnij
                </button>
            </div>

    {:else}
        <Spinner delay={3000}/>
    {/if}

</menu>