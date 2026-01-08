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
    let note=null;

    let creationDate = null
    let modificationDate = null

    const NK_DOCUMENT          = 0
    const NK_THREAD            = 1
    const NK_POST              = 2


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
            case "FolderNote":
            case "TaskNote":
            case "NoteNote":
                elementRef = `Note/${elementLink.NoteId}`
                break;
            case "Note":
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
                            Expressions:['Id', '$ref','Title','Summary', 'Kind', 'GetCanonicalPath', 'CreationDate', 'ModificationDate'],
                            SubTree:
                            [
                                {
                                    Id: 100,
                                    Association: 'CreatedBy',
                                    Expressions:['$ref', 'Name', 'href']
                                },
                                {
                                    Id: 101,
                                    Association: 'ModifiedBy',
                                    Expressions:['$ref', 'Name', 'href']
                                },
                               {
                                    Id: 102,
                                    Association: 'InFolders',
                                    Filter: 'not IsCanonical',
                                    Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                },
                                {
                                    Id: 103,
                                    Association: 'InTasks',
                                    Filter: 'not IsCanonical',
                                    Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                },
                                {
                                    Id: 104,
                                    Association: 'InNotes',
                                    Filter: 'not IsCanonical',
                                    Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                }
                            ]
                        }
                    ]
                },
                onErrorShowAlert)

        note = res.Note

        if(note.CreationDate)
            creationDate = new Date(note.CreationDate)
        else
            creationDate = null

        if(note.ModificationDate)
            modificationDate = new Date(note.ModificationDate)
        else
            modificationDate = null

        note.attachedTo = []
        if(note.InFolders && note.InFolders.length > 0)
            note.InFolders.forEach((f) => note.attachedTo.push(f))

        if(note.InTasks && note.InTasks.length > 0)
            note.InTasks.forEach((f) => note.attachedTo.push(f))

        if(note.InNotes && note.InNotes.length > 0)
            note.InNotes.forEach((f) => note.attachedTo.push(f))
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
            }]


        if(inLink.IsCanonical == 0)
        {
            operations.push(
                {
                    caption: '_; Set as primary location; Establecer como ubicación principal; Ustaw jako główną lokalizację',
                    action: (f) => setLocationAsCanonical(inLink)
                })
        }


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
        case 'FolderNote':
            await reef.post(`${inLink.$ref}/Folder/DettachNote`, { noteLink: inLink.$ref } , onErrorShowAlert);
            break;

        case 'TaskNote':
            await reef.post(`${inLink.$ref}/Task/DettachNote`, { noteLink: inLink.$ref } , onErrorShowAlert);
            break;

        case 'NoteNote':
            await reef.post(`${inLink.$ref}/InNote/DettachNote`, { noteLink: inLink.$ref } , onErrorShowAlert);
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

    function printNiceKind(kind)
    {
        switch(kind)
        {
        case NK_DOCUMENT:
            return '_; Document; Documento; Dokument'
        case NK_THREAD:
            return '_; Thread; Hilo; Wątek'
        case NK_POST:
            return '_; Answer; Respuesta; Odpowiedź'
        }
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
                    <span class="text-left">_;Note properties; Propiedades de la nota; Właściwości notatki</span>
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
            {#if note}
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; Name; Nombre; Nazwa</h4>
            <p>{ext(note.Title)}</p>
            </div >
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; Type; Tipo; Rodzaj</h4>
            <p class="flex flex-row">
                {printNiceKind(note.Kind)}
            </p>
            </div >
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; Path; Ruta; Ścieżka</h4>
            <p>
                {#if note.GetCanonicalPath && note.GetCanonicalPath.length > 0}
                    {#each note.GetCanonicalPath as segment, idx}
                        {#if idx > 0}
                            <span class="ml-1">/</span>
                        {/if}
                        <a class="font-normal text-zinc-700 dark:text-zinc-300"
                            href={segment.href} use:link>{ext(segment.Name)}</a>
                    {/each}
                {/if}
            </p>
            </div >

            {#if note.attachedTo && note.attachedTo.length > 0}
                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>_; Attached to; Adjunto a; Przyłączony do</h4>
                    <p>
                    {#each note.attachedTo as inLink}

                            <span class="flex flex-row items-center">
                                <span class="relative">
                                    <Icon component={getElementIcon(inLink)}
                                        class="block-inline h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-1  mr-1"/>
                                    {#if inLink.IsCanonical == 0}
                                        <Icon component={FaExternalLinkSquareAlt}
                                            class="absolute left-0 top-1/2 w-1/2 h-1/2
                                                    text-stone-500 dark:text-stone-300 " />
                                    {/if}
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
                    <List   self={note}
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
            <p>{folderStatus(note.Status)}</p-->

            {#if creationDate}
                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>_; Created; Creado; Utworzony</h4>
                <p>
                    <span>{getNiceStringDate(creationDate)}</span>

                    {#if note.CreatedBy}
                        <span>_; by; por; przez</span>
                        <a  class="font-normal text-zinc-700 dark:text-zinc-300 "
                            href={note.CreatedBy.href} use:link>
                                {note.CreatedBy.Name}
                        </a>
                    {/if}

                </p>
                </div>
            {/if}

            {#if modificationDate}
                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                <h4>_; Modified; Modificado; Zmodyfikowany</h4>
                <p>
                    <span>{getNiceStringDate(modificationDate)}</span>

                    {#if note.ModifiedBy}
                        <span>_; by; por; przez</span>
                        <a  class="font-normal text-zinc-700 dark:text-zinc-300 "
                            href={note.ModifiedBy.href} use:link>
                                {note.ModifiedBy.Name}
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