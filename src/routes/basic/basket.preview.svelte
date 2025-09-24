<script>
	import { reef } from "@humandialog/auth.svelte";
    import {
        onErrorShowAlert, Icon,
        List, ListTitle, ListSummary, Spinner, i18n
    }   from '$lib'
    import {FaRegFolder, FaRegFile, FaRegCalendarCheck, FaRegCalendar} from 'svelte-icons/fa'
	import { afterUpdate, onMount } from "svelte";
	import { push } from "svelte-spa-router";

    export let destinationContainer = ''
    export let onHide = undefined
    export let onSizeChanged = undefined
    export let onRefreshView = undefined
    export let onAttach = undefined
    export let onAttachAndClear = undefined

    let basketItem;
    let basketEntriesNo = 0
    
    const STATE_FINISHED = 7000;

    let reloadTicket = -1
    let lastReloadTicket = 0
    

    $: initData()

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

            basketItem.allElements.sort((a,b) => a.Order - b.Order)

        }
        else
        {
            basketItem = null
            basketEntriesNo = 0
            basketItem.allElements = []
        }
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
                onAttach(basketItem)
        }
        else
        {
            const res = await reef.post(`${destinationContainer}/AttachBasketContent`, { }, onErrorShowAlert)
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
                onAttachAndClear(basketItem)
        }
        else
        {
            const res = await reef.post(`${destinationContainer}/AttachAndClearBasketContent`, { }, onErrorShowAlert)
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
        }
    }

</script>

<menu class="" bind:this={rootElement}>
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
                    bind:this={listElement}
                    >
                <ListTitle a='Title'/>
                <ListSummary a='Summary'/>

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

                    _; Edit; Editar; Edytuj
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
                                disabled={!basketEntriesNo}
                                on:click={() => attachTo()}>

                    _; Attach; Adjuntar; Załącz
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
                                disabled={!basketEntriesNo}
                                on:click={() => attachToAndClear()}>

                    _; Attach and clear; Adjuntar y borrar; Załącz i wyczyść
                </button>
            </div>

    {:else}
        <Spinner delay={3000}/>
    {/if}

</menu>