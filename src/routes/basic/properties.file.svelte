<script>
    import { afterUpdate, onMount } from "svelte";
    import { reef } from "@humandialog/auth.svelte";
    import {
        onErrorShowAlert, Icon,
        List, ListTitle, ListSummary, Spinner, ext, i18n, showMenu, Dialog,
        clearActiveItem, SHOW_MENU_LEFT, getNiceStringDate, Ricon
    }   from '$lib'

    import {link} from 'svelte-spa-router'

    import {getElementIcon} from './icons'
    import {FaExternalLinkSquareAlt, FaEllipsisV, FaTimes} from 'svelte-icons/fa'

    export let elementLink = undefined
    export let onHide = undefined
    export let onSizeChanged = undefined
    export let onRefreshView = undefined


    let reloadTicket = -1
    let lastReloadTicket = 0
    let elementRef = ''
    let file=null;

    let creationDate = null
    let modificationDate = null

    $: initData()

    async function initData(...args)
    {
        //if(lastReloadTicket == reloadTicket)
        //    return;

        //lastReloadTicket = reloadTicket

        // todo
        if(elementLink)
        {
            switch(elementLink.$type)
            {
            case "FolderFile":
            case "TaskFile":
            case "NoteFile":
                elementRef = `UploadedFile/${elementLink.FileId}`
                break;
            case "UploadedFile":
                elementRef = elementLink.$ref
                break;
            default:
                return
            }

            await reloadData()
        }
    }

    let rootDialog
    export function show(paramElement)
    {
        elementLink = paramElement
        initData().then((res) => rootDialog.show())

    }

    async function reloadData()
    {
        if(!elementRef)
            return

        let res = await reef.post(`${elementRef}/query`,
                {
                    Id: 1,
                    Name: "collector",
                    ExpandLevel: 3,
                    Tree:
                    [
                        {
                            Id: 10,
                            Association: '',
                            Expressions:['Id', '$ref','Title','Summary', 'Size', 'MimeType', 'GetCanonicalPath', 'CreationDate'],
                            SubTree:
                            [
                                {
                                    Id: 100,
                                    Association: 'CreatedBy',
                                    Expressions:['$ref', 'Name', 'href']
                                },
                               {
                                    Id: 101,
                                    Association: 'InFolders',
                                    Filter: 'not IsCanonical',
                                    Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                },
                                {
                                    Id: 102,
                                    Association: 'InTasks',
                                    Filter: 'not IsCanonical',
                                    Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                },
                                {
                                    Id: 103,
                                    Association: 'InNotes',
                                    Filter: 'not IsCanonical',
                                    Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                }
                            ]
                        }
                    ]
                },
                onErrorShowAlert)

        file = res.UploadedFile

        if(file.CreationDate)
            creationDate = new Date(file.CreationDate)
        else
            creationDate = null

        if(file.ModificationDate)
            modificationDate = new Date(file.ModificationDate)
        else
            modificationDate = null

        file.attachedTo = []
        if(file.InFolders && file.InFolders.length > 0)
            file.InFolders.forEach((f) => file.attachedTo.push(f))

        if(file.InTasks && file.InTasks.length > 0)
            file.InTasks.forEach((f) => file.attachedTo.push(f))

        if(file.InNotes && file.InNotes.length > 0)
            file.InNotes.forEach((f) => file.attachedTo.push(f))
    }

    let rootElement;
    let prevHeight = 0
    let closeButtonPos = ''
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

            //closeButtonPos = `top: calc(${myRect.top}px - 2.25rem); left: calc(${myRect.right}px - 1rem)`
            closeButtonPos = `top: calc(${myRect.top}px - 0.25rem); left: calc(${myRect.right}px - 1.25rem)`
        }
    })

    function clearSelection(e)
    {
        clearActiveItem('handy')
    }

    onMount( () => {
        // clear selection when shown
        clearActiveItem('handy')
    })

    let connectedToComponent;
    function connectedToOperations(el)
    {
        return []
    }



    function showLinkMenu(e, inLink)
    {
        const operations = [
            {
                caption: '_; Detach; Desconectar; Odłącz',
                action: (f) => dettachElement(inLink)
            },
            {
                caption: '_; Set as primary location; Establecer como ubicación principal; Ustaw jako główną lokalizację',
                action: (f) => setLocationAsCanonical(inLink)
            }
        ]

        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        let rect = owner.getBoundingClientRect()
        showMenu(rect, operations, SHOW_MENU_LEFT)
    }

    async function dettachElement(inLink)
    {
        switch(inLink.$type)
        {
        case 'FolderFile':
            await reef.post(`${inLink.$ref}/Folder/DettachFile`, { fileLink: inLink.$ref } , onErrorShowAlert);
            break;

        case 'TaskFile':
            await reef.post(`${inLink.$ref}/Task/DettachFile`, { fileLink: inLink.$ref } , onErrorShowAlert);
            break;

        case 'NoteFile':
            await reef.post(`${inLink.$ref}/Note/DettachFile`, { fileLink: inLink.$ref } , onErrorShowAlert);
            break;
        }

        await reloadData();
    }

    async function setLocationAsCanonical(inLink)
    {
        await reef.get(`${inLink.$ref}/SetLocationAsCanonical`, onErrorShowAlert)
        await reloadData();
    }

    function closeDialog(e)
    {
        rootDialog.hide()
    }

    function printNiceSize(size)
    {
        const KiB = 1024
        const MiB = 1024*KiB
        const GiB = 1024*MiB
        if(size >= GiB)
            return  `${(size / GiB).toFixed(2)} GiB`;
        else if(size >= MiB)
            return  `${(size / MiB).toFixed(2)} MiB`;
        else if(size >= KiB)
            return  `${(size / KiB).toFixed(2)} KiB`;
        else
            return  `${size} B`;

    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
 <!--svelte-ignore a11y-no-noninteractive-elementLink-interactions -->
<Dialog bind:this={rootDialog}>

        <div class="
                paper w-full
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                m-0 pt-5 pb-5 px-8
                sm:rounded
                bg-stone-200 dark:bg-stone-900
                flex flex-col
                "
        bind:this={rootElement} on:click={clearSelection}>

        <!-------------------------------------------------------------------->
        <!-- POPUP HEADER ---------------------------------------------------->
        <!-------------------------------------------------------------------->
        <h3 class = "flex-none">
            <div class="w-full flex flex-row justify-between">
                <!--div class="py-1.5  flex flex-row justify-between">
                    <button class="mr-4 w-6
                                hover:bg-stone-200 hover:dark:bg-stone-700
                                hover:outline hover:outline-8
                                hover:outline-stone-200 hover:dark:outline-stone-700"
                        ><Ricon icon = 'arrow-up' />
                    </button>
                    <button class="mr-4 w-6
                                hover:bg-stone-200 hover:dark:bg-stone-700
                                hover:outline hover:outline-8
                                hover:outline-stone-200 hover:dark:outline-stone-700">
                        <Ricon icon = 'check-check' />
                    </button>
                </div-->
                <div class="grow ">
                    <span class="text-left">_;File properties; Propiedades del archivo; Właściwości pliku</span>
                </div>
                <div class="py-1.5  flex flex-row justify-between">
                    <button class="ml-4 w-6
                                hover:bg-stone-200 hover:dark:bg-stone-700
                                hover:outline hover:outline-8
                                hover:outline-stone-200 hover:dark:outline-stone-700"
                                on:click={ closeDialog }>
                        <Ricon icon = 'x' />
                    </button>
                </div>
            </div>
        </h3>


        <!-------------------------------------------------------------------->
        <!-- POPUP CONTENT---------------------------------------------------->
        <!-------------------------------------------------------------------->
        <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">
        {#if file}
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; Name; Nombre; Nazwa</h4>
            <p>{ext(file.Title)}</p>
            </div >
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">

            <h4>_; Type; Tipo; Rodzaj</h4>
            <p class="flex flex-row">
                {file.MimeType}
            </p>
            </div >
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">

            <h4>_; Size; Tamaño; Rozmiar</h4>
            <p class="flex flex-row">
                {printNiceSize(file.Size)}
            </p>
            </div >
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">

            <h4>_; Path; Ruta; Ścieżka</h4>
            <p>
                {#if file.GetCanonicalPath && file.GetCanonicalPath.length > 0}
                    {#each file.GetCanonicalPath as segment, idx}
                        {#if idx > 0}
                            <span class="ml-1">/</span>
                        {/if}
                        <a class="font-normal text-zinc-700 dark:text-zinc-300"
                            href={segment.href} use:link>{ext(segment.Name)}</a>
                    {/each}
                {/if}
            </p>
            </div >


            {#if file.attachedTo && file.attachedTo.length > 0}
                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>_; Attached to; Adjunto a; Przyłączony do</h4>
                    <p>
                    {#each file.attachedTo as inLink}

                            <span class="flex flex-row items-center">
                                <span class="relative">
                                    <Icon component={getElementIcon(inLink)}
                                        class="block-inline h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-1  mr-1"/>
                                    <Icon component={FaExternalLinkSquareAlt}
                                        class="absolute left-0 top-1/2 w-1/2 h-1/2
                                                text-stone-500 dark:text-stone-300 " />
                                </span>
                                <a  class="font-normal text-zinc-700 dark:text-zinc-300 "
                                    href={inLink.InHRef} use:link>
                                        {ext(inLink.InTitle)}

                                </a>

                                <button class=" ms-auto
                                        text-stone-700 dark:text-stone-300 dark:hover:text-white
                                        flex items-center rounded
                                        h-4 w-4"
                                        on:click={(e)=>showLinkMenu(e, inLink)}>
                                <FaEllipsisV/>
                            </button>
                            </span>

                    {/each}
                    </p>
                </div>
                <!--section class="not-prose">
                    <List   self={file}
                            a='InFolders'
                            selectionKey='handy'
                            bind:this={connectedToComponent}
                            toolbarOperations = {(el) => connectedToOperations(el)}>

                        <ListTitle      a='InTitle'
                                        hrefFunc={(el) => `${el.InHRef}`}
                                        readonly/>

                        <ListSummary    a='InSummary'
                                        readonly/>

                        <span slot="left" let:elementLink class="relative">
                            <Icon component={getElementIcon(elementLink)}
                                class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1"/>
                            {#if elementLink.IsCanonical == 0}
                                    <Icon component={FaExternalLinkSquareAlt}
                                    class="absolute left-1 top-1/2 w-1/2 h-1/2
                                            text-stone-500 dark:text-stone-300 " />
                            {/if}
                        </span>
                    </List>
                </section-->
            {/if}

            <!--h4>_; Status; Estado; Status</h4>
            <p>{folderStatus(file.Status)}</p-->

            {#if creationDate}
                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>_; Created; Creado; Utworzony</h4>
                <p>
                    <span>{getNiceStringDate(creationDate)}</span>

                    {#if file.CreatedBy}
                        <span>_; by; por; przez</span>
                        <a  class="font-normal text-zinc-700 dark:text-zinc-300 "
                            href={file.CreatedBy.href} use:link>
                                {file.CreatedBy.Name}
                        </a>
                    {/if}

                </p>
                </div>
            {/if}
        {:else}
            <Spinner />
        {/if}
        </div>

        <!-------------------------------------------------------------------->
        <!-- POPUP FOOTER----------------------------------------------------->
        <!-------------------------------------------------------------------->
        <h4 class = "flex-none">

            <div class="flex flex-row justify-end gap-2">

                <button class="px-4 mx-2
                        bg-stone-100 dark:bg-stone-700
                        outline outline-offset-2 outline-2
                        outline-stone-200 dark:outline-stone-500
                        hover:bg-stone-200 hover:dark:bg-stone-700
                        "

                        on:click={ closeDialog }> Ok
                </button>
            </div>
        </h4>

</div>
</Dialog>