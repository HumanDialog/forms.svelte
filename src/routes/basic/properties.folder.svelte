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

    export let element = undefined
    export let onHide = undefined
    export let onSizeChanged = undefined
    export let onRefreshView = undefined


    let reloadTicket = -1
    let lastReloadTicket = 0
    let elementRef = ''
    let folder=null;

    let creationDate = null
    let modificationDate = null

    const FS_PUBLIC_ROOT_FOLDER = 15
    const FS_PUBLIC_FOLDER      = 16
    const FS_USER_ROOT_FOLDER   = 101
    const FS_GROUP_ROOT_FOLDER  = 102
    const FS_PINNED_ROOT_FOLDER = 103
    const FS_BASKET_ROOT_FOLDER = 104
    const FS_USER_FOLDER        = 111
    const FS_GROUP_FOLDER       = 112
    const FS_USER_ROOT_SHARED_FOLDER  = 131
    const FS_GROUP_ROOT_SHARED_FOLDER = 132
    const FS_USER_SHARED_FOLDER     = 141
    const FS_GROUP_SHARED_FOLDER    = 142

    const FK_FOLDER             = 0
    const FK_BASKET             = 1
    const FK_DISCUSSION         = 2
    const FK_TABLE              = 3
    const FK_DOCUMENT           = 4

    $: initData()

    async function initData(...args)
    {
        //if(lastReloadTicket == reloadTicket)
        //    return;

        //lastReloadTicket = reloadTicket

        // todo
        if(element)
        {
            if(element.$type == 'FolderFolder')
                elementRef = `Folder/${element.FolderId}`
            else if(element.$type == 'Folder')
                elementRef = element.$ref
            else
                return;

            await reloadData()
        }
    }

    let rootDialog
    export function show(folderElement)
    {
        element = folderElement
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
                            Expressions:['Id', '$ref','Title','Summary', 'Kind', 'Status', 'GetCanonicalPath', 'CreationDate', 'ModificationDate'],
                            SubTree:
                            [
                               {
                                    Id: 100,
                                    Association: 'InFolders',
                                    Filter: 'not IsCanonical',
                                    Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                },
                                {
                                    Id: 101,
                                    Association: 'CreatedBy',
                                    Expressions:['$ref', 'Name', 'href']
                                }
                            ]
                        }
                    ]
                },
                onErrorShowAlert)

        folder = res.Folder

        // tmp
        folder.ColumnsNo = 1

        if(folder.CreationDate)
            creationDate = new Date(folder.CreationDate)
        else
            creationDate = null

        if(folder.ModificationDate)
            modificationDate = new Date(folder.ModificationDate)
        else
            modificationDate = null
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

    function folderStatus(status)
    {
        switch(status)
        {
        case FS_PUBLIC_ROOT_FOLDER:
            return '_; Root public; Pública raíz; Publiczny główny'
        case FS_PUBLIC_FOLDER:
            return '_; Public; Pública; Publiczny'
        case FS_USER_ROOT_FOLDER:
            return '_; Personal root; Raíz personal; Główny osobisty'
        case FS_GROUP_ROOT_FOLDER:
            return '_; Group root; Raíz del grupo; Grupowy główny'
        case FS_USER_FOLDER:
            return '_; Personal; Personal; Osobisty'
        case FS_GROUP_FOLDER:
            return '_; Group; Groupo; Grupowy'
        case FS_USER_SHARED_FOLDER:
            return '_; Personal shared; Personal compartida; Osobisty udostępniony'
        case FS_GROUP_SHARED_FOLDER:
            return '_; Group shared; Compartida del grupo; Grupowy udostępniony'
        default:
            return '_; Unknown; Desconocido; Nieznany'
        }
    }

    const allKinds = [FK_FOLDER, FK_TABLE, FK_DOCUMENT, FK_DISCUSSION]
    function folderKind(kind)
    {
        switch(kind)
        {
        case FK_FOLDER:
            return '_; List; Lista; Lista'
        case FK_DISCUSSION:
            return '_; Disscusion; Discusión; Dyskusja'
        case FK_TABLE:
            return '_; Table; Tabla; Tabela'
        case FK_DOCUMENT:
            return '_; Document; Documento; Dokument'
        default:
            return '_; Unknown; Desconocido; Nieznany'
        }
    }

    async function setFolderKind(kind)
    {
        await reef.get(`${folder.$ref}/ChangeKind?kind=${kind}`, onErrorShowAlert)
        await reloadData()
    }

    const allColumns = [1, 2, 3, 4, 5]
    async function setColumnsNo(colsNo)
    {

    }

    function showLinkMenu(e, inFolder)
    {
        const operations = [
            {
                caption: '_; Detach; Desconectar; Odłącz',
                action: (f) => dettachElement(inFolder)
            },
            {
                caption: '_; Set as primary location; Establecer como ubicación principal; Ustaw jako główną lokalizację',
                action: (f) => setLocationAsCanonical(inFolder)
            }
        ]

        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        let rect = owner.getBoundingClientRect()
        showMenu(rect, operations, SHOW_MENU_LEFT)
    }

    async function dettachElement(inFolder)
    {
        await reef.post(`${inFolder.$ref}/InFolder/DettachSubFolder`, { folderLink: inFolder.$ref } , onErrorShowAlert);
        await reloadData();
    }

    async function setLocationAsCanonical(inFolder)
    {
        await reef.get(`${inFolder.$ref}/SetLocationAsCanonical`, onErrorShowAlert)
        await reloadData();
    }

    function closeDialog(e)
    {
        rootDialog.hide()
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
 <!--svelte-ignore a11y-no-noninteractive-element-interactions -->
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
                    <span>{ext(folder.Title)} - </span><span class="text-left">_;Folder properties; Propiedades de la carpeta; Właściwości folderu</span>
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
        {#if folder}
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4 >_; Name; Nombre; Nazwa</h4>
            <p class="mr-4 ">{ext(folder.Title)}</p>
            </div >
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; Type; Tipo; Rodzaj</h4>
            <p class="flex flex-row">
                {#each allKinds as kind}
                    {@const isActive = kind == folder.Kind}
                    <span class=" px-2 mx-1
                                text-stone-700 dark:text-stone-300 dark:hover:text-white
                                hover:bg-stone-200 dark:hover:bg-stone-700
                                border border-stone-300 focus:outline-none dark:border-stone-600
                                flex items-center rounded"
                                class:bg-stone-200={isActive}
                                class:dark:bg-stone-700={isActive}
                                class:dark:text-white={isActive}
                                disabled={isActive}
                                on:click={(e)=>setFolderKind(kind)}>
                        {folderKind(kind)}
                    </span>
                {/each}

            </p>
            </div>

            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; Number of columns; Número de columnas; Ilość kolumn</h4>
            <p class="flex flex-row">
                {#each allColumns as colsNo}
                    {@const isActive = colsNo == folder.ColumnsNo}
                    <button class=" px-2 mx-1
                                text-stone-700 dark:text-stone-300 dark:hover:text-white
                                hover:bg-stone-200 dark:hover:bg-stone-700
                                border border-stone-300 focus:outline-none dark:border-stone-600
                                flex items-center rounded"
                                class:bg-stone-200={isActive}
                                class:dark:bg-stone-700={isActive}
                                class:dark:text-white={isActive}
                                disabled={isActive}
                                on:click={(e)=>setColumnsNo(colsNo)}>
                        {colsNo}
                    </button>
                {/each}

            </p>
            </div>
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; Path; Ruta; Ścieżka</h4>
            <p>
                {#if folder.GetCanonicalPath && folder.GetCanonicalPath.length > 0}
                    {#each folder.GetCanonicalPath as segment, idx}
                        {#if idx > 0}
                            <span class="ml-1">/</span>
                        {/if}
                        <a class="font-normal text-zinc-700 dark:text-zinc-300"
                            href={segment.href} use:link>{ext(segment.Name)}</a>
                    {/each}
                {/if}
            </p>
            </div>
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            {#if folder.InFolders && folder.InFolders.length > 0}
                <h4>_; Attached to; Adjunto a; Przyłączony do</h4>
                    <p>
                    {#each folder.InFolders as inFolder}

                            <span class="flex flex-row items-center">
                                <span class="relative">
                                    <Icon component={getElementIcon(inFolder)}
                                        class="block-inline h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-1  mr-1"/>
                                    <Icon component={FaExternalLinkSquareAlt}
                                        class="absolute left-0 top-1/2 w-1/2 h-1/2
                                                text-stone-500 dark:text-stone-300 " />
                                </span>
                                <a  class="font-normal text-zinc-700 dark:text-zinc-300 "
                                    href={inFolder.InHRef} use:link>
                                        {ext(inFolder.InTitle)}

                                </a>

                                <button class=" ms-auto
                                        text-stone-700 dark:text-stone-300 dark:hover:text-white
                                        flex items-center rounded
                                        h-4 w-4"
                                        on:click={(e)=>showLinkMenu(e, inFolder)}>
                                <FaEllipsisV/>
                            </button>
                            </span>

                    {/each}
                    </p>

                <!--section class="not-prose">
                    <List   self={folder}
                            a='InFolders'
                            selectionKey='handy'
                            bind:this={connectedToComponent}
                            toolbarOperations = {(el) => connectedToOperations(el)}>

                        <ListTitle      a='InTitle'
                                        hrefFunc={(el) => `${el.InHRef}`}
                                        readonly/>

                        <ListSummary    a='InSummary'
                                        readonly/>

                        <span slot="left" let:element class="relative">
                            <Icon component={getElementIcon(element)}
                                class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1"/>
                            {#if element.IsCanonical == 0}
                                    <Icon component={FaExternalLinkSquareAlt}
                                    class="absolute left-1 top-1/2 w-1/2 h-1/2
                                            text-stone-500 dark:text-stone-300 " />
                            {/if}
                        </span>
                    </List>
                </section-->
            {/if}
            </div>
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            <h4>_; Status; Estado; Status</h4>
            <p>{folderStatus(folder.Status)}</p>
            </div>
            <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
            {#if creationDate}
                <h4>_; Created; Creado; Utworzony</h4>
                <p>
                    <span>{getNiceStringDate(creationDate)}</span>

                    {#if folder.CreatedBy}
                        <span>_; by; por; przez</span>
                        <a  class="font-normal text-zinc-700 dark:text-zinc-300 "
                            href={folder.CreatedBy.href} use:link>
                                {folder.CreatedBy.Name}
                        </a>
                    {/if}

                </p>
            {/if}
            </div>
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