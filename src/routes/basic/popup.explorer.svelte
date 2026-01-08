<script>
	import { reef } from "@humandialog/auth.svelte";
    import {
        onErrorShowAlert, Icon,
        List, ListTitle, ListSummary, Spinner, i18n,
        Ricon,
        contextItemsStore,
        getActiveItems,
        clearActiveItem,
        ext
    }   from '$lib'
    import {FaRegFolder, FaRegFile, FaRegCalendarCheck, FaRegCalendar, FaFile, FaList, FaRegComments, FaRegClipboard, FaClipboardList, FaLevelUpAlt} from 'svelte-icons/fa'
    import { afterUpdate, onMount } from "svelte";
    import {transformClipboardToJSONReferences} from './basket.utils'
    import {getElementIcon} from './icons'
	import { readonly } from "svelte/store";


    export let destinationContainer = ''
    export let onHide = undefined
    export let onSizeChanged = undefined
    export let onRefreshView = undefined
    export let onAttach = undefined
    export let canSelectRootElements = false

    export let whatToShow = undefined

    let elements = []
    let canSelectElements = false
    let levelUpHRef = ''
    let currentLevelTitle = __APP_TITLE__

    let reloadTicket = -1
    let lastReloadTicket = 0

    const EIF_ITEM              =  0x00000000
    const EIF_CUT               =  0x00000001
    const EIF_BEGIN_GROUP       =  0x00000100
    const EIF_END_GROUP         =  0x00000200
    const EIF_NOT_ALLOWED       =  0x10000000

    $: initData()
    $: selectedElements = getSelectedItems($contextItemsStore)
    $: selectedElementsNo = selectedElements.length

    async function initData(...args)
    {
        if(lastReloadTicket == reloadTicket)
            return;

        lastReloadTicket = reloadTicket

        if(whatToShow == undefined)
        {
            if(localStorage.lastPopupExplorerLocation)
                whatToShow = localStorage.lastPopupExplorerLocation
            else
                whatToShow = '/root'
        }

        switch(whatToShow)
        {
        case '/root':
            elements = await generateRootReferences()
            break;

        case '/mytasks':
            elements = await generateMyTasksReferences()
            break;

        case '/mylists':
            elements = await generateMyListsReferences()
            break;

        case '/alllists':
            elements = await generateGroupListsReferences()
            break;

        case '/myfolders':
            elements = await generateMyFoldersReferences()
            break;

        case '/group-folders':
            elements = await generateGroupFoldersReferences()
            break;

        default:
            if(whatToShow.startsWith('/folder/'))
                elements = await generateFolderReferences(whatToShow)
            else if(whatToShow.startsWith('/listboard/'))
                elements = await generateTaskListReferences(whatToShow)
            else if(whatToShow.startsWith('/tasklist/'))
                elements = await generateTaskListReferences(whatToShow)
            else if(whatToShow.startsWith('/task/'))
                elements = await generateTaskReferences(whatToShow)
            else if(whatToShow.startsWith('/note/'))
                elements = await generateNoteReferences(whatToShow)
        }

        listElement?.reload(elements);
    }

    async function generateRootReferences()
    {
        canSelectElements = false
        levelUpHRef = ''
        currentLevelTitle = __APP_TITLE__

        let references = [
            {
                ElementId: 0,
                ElementType: '',
                ElementNav: '',
                Title: '_; My tasks; Mis tareas; Moje zadania',
                Summary: '',
                icon: 'square-pen',
                href: '/mytasks',
                ElementInfo: 0,
                $ref: 'mytasks'
            },
            {
                ElementId: 0,
                ElementType: '',
                ElementNav: '',
                Title: '_; My lists; Mis listas; Moje listy#',
                Summary: '',
                icon: 'clipboard-list',
                href: '/mylists',
                ElementInfo: 0,
                $ref: 'mylists'
            },
            {
                ElementId: 0,
                ElementType: '',
                ElementNav: '',
                Title: '_; Common lists; Listas comunes; Wspólne listy',
                Summary: '',
                icon: 'clipboard-list',
                href: '/alllists',
                ElementInfo: 0,
                $ref: 'alllists'
            },
            {
                ElementId: 0,
                ElementType: '',
                ElementNav: '',
                Title: '_; My Folders; Mis carpetas; Moje foldery',
                Summary: '',
                icon: 'folder',
                href: '/myfolders',
                ElementInfo: 0,
                $ref: 'myfolders'
            },
            {
                ElementId: 0,
                ElementType: '',
                ElementNav: '',
                Title: '_; Common folders; Carpetas comunes; Wspólne foldery',
                Summary: '',
                icon: 'folder',
                href: '/group-folders',
                ElementInfo: 0,
                $ref: 'groupfolders'
            }
        ]

        return references;
    }

    async function generateMyTasksReferences()
    {
        canSelectElements = true
        levelUpHRef = '/root'
        currentLevelTitle = '_; My tasks; Mis tareas; Moje zadania'

        let res = await reef.get(`/user/MyTasks?State<>STATE_FINISHED&fields=Id,$type,$ref,Title,Summary,href,icon&sort=UserOrder`, onErrorShowAlert);
        if(!res)
            return [  ]
        else
        {
            let references = [ ]

            res.Task.forEach(t => {
                references.push({
                    ElementId: t.Id,
                    ElementType: t.$type,
                    ElementNav: t.$ref,
                    Title: t.Title,
                    Summary: t.Summary,
                    icon: t.icon,
                    href: t.href,
                    ElementInfo: 0,
                    $ref: t.$ref
                })
            })

            return references
        }
    }

    async function generateMyListsReferences()
    {
        canSelectElements = canSelectRootElements
        levelUpHRef = '/root'
        currentLevelTitle = '_; My lists; Mis listas; Moje listy! '
        let res = await reef.get(`/user/MyLists?Status<>TLS_GROUP_ARCHVIVED_LIST&fields=Id,$type,$ref,Name,Summary,href&sort=Order`, onErrorShowAlert);
        if(!res)
            return [  ]
        else
        {
            let references = [ ]

            res.TaskList.forEach(t => {
                references.push({
                    ElementId: t.Id,
                    ElementType: t.$type,
                    ElementNav: t.$ref,
                    Title: t.Name,
                    Summary: t.Summary,
                    icon: 'clipboard-list',
                    href: t.href,
                    ElementInfo: 0,
                    $ref: t.$ref
                })
            })

            return references
        }
    }

    async function generateGroupListsReferences()
    {
        canSelectElements = canSelectRootElements
        levelUpHRef = '/root'
        currentLevelTitle = '_; Common lists; Listas comunes; Wspólne listy'

        let res = await reef.get(`/group/Lists?fields=Id,$type,$ref,Name,Summary,href&sort=Order`, onErrorShowAlert);
        if(!res)
            return [  ]
        else
        {
            let references = [ ]

            res.TaskList.forEach(t => {
                references.push({
                    ElementId: t.Id,
                    ElementType: t.$type,
                    ElementNav: t.$ref,
                    Title: t.Name,
                    Summary: t.Summary,
                    icon: 'clipboard-list',
                    href: t.href,
                    ElementInfo: 0,
                    $ref: t.$ref
                })
            })

            return references
        }
    }

    async function generateMyFoldersReferences()
    {
        canSelectElements = canSelectRootElements
        levelUpHRef = '/root'
        currentLevelTitle = '_; My Folders; Mis carpetas; Moje foldery'

        let res = await reef.get(`/user/Folders?fields=Id,$type,$ref,Title,Summary,href,icon&sort=Order`, onErrorShowAlert);
        if(!res)
            return [  ]
        else
        {
            let references = [ ]

            res.Folder.forEach(t => {
                references.push({
                    ElementId: t.Id,
                    ElementType: t.$type,
                    ElementNav: t.$ref,
                    Title: t.Title,
                    Summary: t.Summary,
                    icon: t.icon,
                    href: t.href,
                    ElementInfo: 0,
                    $ref: t.$ref
                })
            })

            return references
        }
    }

    async function generateGroupFoldersReferences()
    {
        canSelectElements = canSelectRootElements
        levelUpHRef = '/root'
        currentLevelTitle = '_; Common folders; Carpetas comunes; Wspólne foldery'

        let res = await reef.get(`/group/Folders?fields=Id,$type,$ref,Title,Summary,href,icon&sort=Order`, onErrorShowAlert);
        if(!res)
            return [  ]
        else
        {
            let references = [ ]

            res.Folder.forEach(t => {
                references.push({
                    ElementId: t.Id,
                    ElementType: t.$type,
                    ElementNav: t.$ref,
                    Title: t.Title,
                    Summary: t.Summary,
                    icon: t.icon,
                    href: t.href,
                    ElementInfo: 0,
                    $ref: t.$ref
                })
            })

            return references
        }
    }


    async function generateFolderReferences(whatToShow)
    {
        const segments = whatToShow.split('/')
        const folderId = parseInt(segments[2])

        canSelectElements = true

        let res = await reef.post(`/Folder/${folderId}/query`,
                            {
                                Id: 1,
                                Name: "collector",
                                ExpandLevel: 3,
                                Tree:
                                [
                                    {
                                        Id: 1,
                                        Association: '',
                                        Expressions:['Title','GetCanonicalPath'],
                                        SubTree:
                                        [
                                            {
                                                Id: 2,
                                                Association: 'Folders',
                                                Expressions:['FolderId','$ref', 'Title', 'Summary', 'Order', 'href', 'icon', '$type']

                                            },
                                            {
                                                Id: 3,
                                                Association: 'Notes',
                                                Expressions:['NoteId', '$ref', 'Title', 'Summary', 'Order', 'href', 'icon',  '$type']

                                            },
                                            {
                                                Id: 4,
                                                Association: 'Tasks',
                                                Expressions:['TaskId', '$ref', 'Title', 'Summary', 'Order', 'href', 'icon', '$type']

                                            },
                                            {
                                                Id: 5,
                                                Association: 'Files',
                                                Expressions:['FileId', '$ref', 'Title', 'Summary', 'Order', 'href', 'icon', '$type']

                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);



        if(!res)
        {
            levelUpHRef = '/root'
            currentLevelTitle = ''
            return [  ]
        }
        else
        {
            let contextItem = res.Folder
            const canonicalPath = contextItem.GetCanonicalPath
            if(canonicalPath.length > 0)
                levelUpHRef = canonicalPath[canonicalPath.length-1].href
            else
                levelUpHRef = '/root'

           currentLevelTitle = contextItem.Title

            let references = [  ]

            let allElements = []
            if(contextItem.Folders && contextItem.Folders.length > 0)
            {
                contextItem.Folders.forEach((f) => {
                    allElements.push({
                        Id: f.FolderId,
                        $type: 'Folder',
                        Title: f.Title,
                        Summary: f.Summary,
                        icon: f.icon,
                        href: f.href,
                        Order: f.Order,
                        $ref: `./Folder/${f.FolderId}`
                    })
                })
            }

            if(contextItem.Notes && contextItem.Notes.length > 0)
            {
                contextItem.Notes.forEach((f) => {
                    allElements.push({
                        Id: f.NoteId,
                        $type: 'Note',
                        Title: f.Title,
                        Summary: f.Summary,
                        icon: f.icon,
                        href: f.href,
                        Order: f.Order,
                        $ref: `./Note/${f.NoteId}`
                    })
                })
            }

            if(contextItem.Tasks && contextItem.Tasks.length > 0)
            {
                contextItem.Tasks.forEach((f) => {
                    allElements.push({
                        Id: f.TaskId,
                        $type: 'Task',
                        Title: f.Title,
                        Summary: f.Summary,
                        icon: f.icon,
                        href: f.href,
                        Order: f.Order,
                        $ref: `./Task/${f.TaskId}`
                    })
                })
            }

            if(contextItem.Files && contextItem.Files.length > 0)
            {
                contextItem.Files.forEach((f) => {
                    allElements.push({
                        Id: f.FileId,
                        $type: 'UploadedFile',
                        Title: f.Title,
                        Summary: f.Summary,
                        icon: f.icon,
                        href: f.href,
                        Order: f.Order,
                        $ref: `./UploadedFile/${f.FileId}`
                    })
                })
            }

        allElements.sort((a,b) => a.Order - b.Order)

            allElements.forEach(t => {
                references.push({
                    ElementId: t.Id,
                    ElementType: t.$type,
                    ElementNav: t.$ref,
                    Title: t.Title,
                    Summary: t.Summary,
                    icon: t.icon,
                    href: t.href,
                    ElementInfo: 0,
                    $ref: t.$ref
                })
            })

            return references
        }
    }

    async function generateTaskListReferences(whatToShow)
    {
        const segments = whatToShow.split('/')
        const listId = parseInt(segments[2])

        canSelectElements = true

        let res = await reef.post(`/TaskList/${listId}/query`,
                            {
                                Id: 1,
                                Name: "collector",
                                ExpandLevel: 3,
                                Tree:
                                [
                                    {
                                        Id: 2,
                                        Association: '',
                                        Expressions:['Name','GetCanonicalPath'],
                                        SubTree:
                                        [
                                            {
                                                Id: 3,
                                                Association: 'Tasks',
                                                Sort: 'ListOrder',
                                                Expressions:['Id', '$ref', 'Title', 'Summary', 'href', 'icon', '$type']

                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);



        if(!res)
        {
            levelUpHRef = '/root'
            currentLevelTitle = ''
            return [  ]
        }
        else
        {
            let contextItem = res.TaskList
            const canonicalPath = contextItem.GetCanonicalPath
            if(canonicalPath.length > 0)
                levelUpHRef = canonicalPath[canonicalPath.length-1].href
            else
                levelUpHRef = '/root'

            currentLevelTitle = contextItem.Name

            let references = [ ]

            contextItem.Tasks.forEach(t => {
                references.push({
                    ElementId: t.Id,
                    ElementType: t.$type,
                    ElementNav: t.$ref,
                    Title: t.Title,
                    Summary: t.Summary,
                    icon: t.icon,
                    href: t.href,
                    ElementInfo: 0,
                    $ref: t.$ref
                })
            })

            return references
        }
    }

    async function generateTaskReferences(whatToShow)
    {
        const segments = whatToShow.split('/')
        const taskId = parseInt(segments[2])

        canSelectElements = true

        let res = await reef.post(`/Task/${taskId}/query`,
                            {
                                Id: 1,
                                Name: "collector",
                                ExpandLevel: 3,
                                Tree:
                                [
                                    {
                                        Id: 2,
                                        Association: '',
                                        Expressions:['Title','GetCanonicalPath'],
                                        SubTree:
                                        [
                                            {
                                                Id: 3,
                                                Association: 'Notes',
                                                Expressions:['NoteId', 'Title', 'Summary', 'href', 'icon']

                                            },
                                            {
                                                Id: 4,
                                                Association: 'Files',
                                                Expressions:['FileId', 'Title', 'Summary', 'href', 'icon']

                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);



        if(!res)
        {
            levelUpHRef = '/root'
            currentLevelTitle = ''
            return [  ]
        }
        else
        {
            let contextItem = res.Task
            const canonicalPath = contextItem.GetCanonicalPath
            if(canonicalPath.length > 0)
                levelUpHRef = canonicalPath[canonicalPath.length-1].href
            else
                levelUpHRef = '/root'

            currentLevelTitle = contextItem.Title

            let references = [ ]

            if(contextItem.Notes && contextItem.Notes.length > 0)
            {
                contextItem.Notes.forEach(t => {
                    references.push({
                        ElementId: t.NoteId,
                        ElementType: 'Note',
                        ElementNav: `./Note/${t.NoteId}`,
                        Title: t.Title,
                        Summary: t.Summary,
                        icon: t.icon,
                        href: t.href,
                        ElementInfo: 0,
                        $ref: `./Note/${t.NoteId}`
                    })
                })
            }

            if(contextItem.Files && contextItem.Files.length > 0)
            {
                contextItem.Files.forEach(t => {
                    references.push({
                        ElementId: t.FileId,
                        ElementType: 'UploadedFile',
                        ElementNav: `./UploadedFile/${t.FileId}`,
                        Title: t.Title,
                        Summary: t.Summary,
                        icon: t.icon,
                        href: t.href,
                        ElementInfo: 0,
                        $ref: `./UploadedFile/${t.FileId}`
                    })
                })
            }

            return references
        }
    }

    async function generateNoteReferences(whatToShow)
    {
        const segments = whatToShow.split('/')
        const noteId = parseInt(segments[2])

        canSelectElements = true

        let res = await reef.post(`/Note/${noteId}/query`,
                            {
                                Id: 1,
                                Name: "collector",
                                ExpandLevel: 3,
                                Tree:
                                [
                                    {
                                        Id: 2,
                                        Association: '',
                                        Expressions:['Title','GetCanonicalPath'],
                                        SubTree:
                                        [
                                            {
                                                Id: 3,
                                                Association: 'Notes',
                                                Expressions:['NoteId', 'Title', 'Summary', 'href', 'icon']

                                            },
                                            {
                                                Id: 4,
                                                Association: 'Files',
                                                Expressions:['FileId', 'Title', 'Summary', 'href', 'icon']

                                            }
                                        ]
                                    }
                                ]
                            },
                            onErrorShowAlert);



        if(!res)
        {
            levelUpHRef = '/root'
            currentLevelTitle = ''
            return [  ]
        }
        else
        {
            let contextItem = res.Note
            const canonicalPath = contextItem.GetCanonicalPath
            if(canonicalPath.length > 0)
                levelUpHRef = canonicalPath[canonicalPath.length-1].href
            else
                levelUpHRef = '/root'

            currentLevelTitle = contextItem.Title

            let references = []

            if(contextItem.Notes && contextItem.Notes.length > 0)
            {
                contextItem.Notes.forEach(t => {
                    references.push({
                        ElementId: t.NoteId,
                        ElementType: 'Note',
                        ElementNav: `./Note/${t.NoteId}`,
                        Title: t.Title,
                        Summary: t.Summary,
                        icon: t.icon,
                        href: t.href,
                        ElementInfo: 0,
                        $ref: `./Note/${t.NoteId}`
                    })
                })
            }

            if(contextItem.Files && contextItem.Files.length > 0)
            {
                contextItem.Files.forEach(t => {
                    references.push({
                        ElementId: t.FileId,
                        ElementType: 'UploadedFile',
                        ElementNav: `./UploadedFile/${t.FileId}`,
                        Title: t.Title,
                        Summary: t.Summary,
                        icon: t.icon,
                        href: t.href,
                        ElementInfo: 0,
                        $ref: `./UploadedFile/${t.FileId}`
                    })
                })
            }

            return references
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

        listElement.reload(elements);
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

    async function attachTo()
    {
        if(onHide)
            onHide();

        selectedElements = getSelectedItems($contextItemsStore)

        const selectedReferences = selectedElements.sort((a,b) => a.Order-b.Order).filter((e) => (e.ElementInfo & EIF_NOT_ALLOWED) == 0 )
        const references = transformClipboardToJSONReferences(selectedReferences)

        if(!destinationContainer)
        {
            if(onAttach)
            {
                onAttach(null, references)
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

        //todo: setBrowserRecentElement
        //recentClipboardElements(selectedReferences, browserBasedClipboard)

    }



    function clearSelection(e)
    {
        clearActiveItem('handy')
    }

    onMount( () => {
        // clear selection when shown
        clearActiveItem('handy')
    })

    function onOpen(item)
    {
        whatToShow = item.href
        localStorage.lastPopupExplorerLocation = whatToShow

        clearActiveItem('handy')
        selectedElements = getSelectedItems($contextItemsStore)

        reload()
    }

    function goUp()
    {
        if(levelUpHRef)
        {
            whatToShow = levelUpHRef
            localStorage.lastPopupExplorerLocation = whatToShow

            clearActiveItem('handy')
            reload();
        }
    }
let list_properties = {
        element:{
            icon: "icon",
            Title: "Title",
            Summary: "Summary",
            readonly: true,
            onOpen: onOpen
        }
    }

    let isMultiselectionEnabled = listElement?.isMultiselectionEnabled
    function toggleMultiselection()
    {
        isMultiselectionEnabled = listElement.toggleMultiselection()
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!--svelte-ignore a11y-no-noninteractive-element-interactions -->

    <div class="
                paper w-full sm:w-[24rem]
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline
                sm:max-w-3xl

                m-0 pt-3 pb-5 px-2
                sm:rounded
                sm:bg-stone-100 sm:dark:bg-stone-900
                flex flex-col
                "
        bind:this={rootElement} on:click={clearSelection}>
        <!-------------------------------------------------------------------->
        <!-- POPUP HEADER ---------------------------------------------------->
        <!-------------------------------------------------------------------->
        <h3 class = "flex-none">
            <div class="px-2 w-full flex flex-row justify-between">
                <div class="py-1.5  flex flex-row justify-between">
                    {#if levelUpHRef}
                        <button class="mr-4 w-6
                                    hover:bg-stone-200 hover:dark:bg-stone-700
                                    hover:outline hover:outline-8
                                    hover:outline-stone-200 hover:dark:outline-stone-700"
                                    on:click={goUp}
                            ><Ricon icon = 'arrow-up' />
                        </button>
                    {:else}
                        <div class="mr-4 w-6"></div>
                    {/if}

                    {#if canSelectElements}
                        {@const activeClass = isMultiselectionEnabled ? "bg-stone-200 dark:bg-stone-700 outline outline-8 outline-stone-200 dark:outline-stone-700" : ""}
                        <button class="mr-4 w-6
                                    {activeClass}
                                    hover:bg-stone-200 hover:dark:bg-stone-700
                                    hover:outline hover:outline-8
                                    hover:outline-stone-200 hover:dark:outline-stone-700"
                                    on:click={toggleMultiselection}>
                            <Ricon icon = 'check-check' />
                        </button>
                    {:else}
                        <div class="mr-4 w-6"></div>
                    {/if}
                </div>
                <div class="grow ">
                    <span class="px-2 text-left">{ext(currentLevelTitle)}
                    </span>
                </div>
                <div class="py-1.5  flex flex-row justify-between">
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
        <div class="px-2 flex-none h-[45dvh] overflow-y-auto overscroll-contain">
            <List   objects={elements}
                    orderAttrib='Order'
                    {list_properties}
                    selectionKey='handy'
                    bind:this={listElement}
                    >
            </List>
        </div>
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
                        disabled={!selectedElementsNo || !canSelectElements}
                        on:click={() => attachTo()}>
                     _; Paste; Pegar; Wklej
                </button>
            </div>
        </h4>
    </div>

    {#if false && elements && elements.length >= 0}



        <div class="w-full sm:w-80 h-64 sm:h-80 sm:max-w-sm overflow-y-auto overflow-x-clip overscroll-contain
                text-stone-600 dark:text-stone-400">

            <div class="flex flex-row">
                {#if 1}
                    {@const isDisabled = !levelUpHRef}
                    {@const textColor= isDisabled ? 'text-stone-600 dark:text-stone-500' : 'text-stone-800 dark:text-stone-300 dark:hover:text-white '}
                    <button type="button"
                            class="ml-2 mt-1.5 mr-3 w-4 h-4
                            {textColor}
                            hover:bg-stone-700 active:bg-stone-200 border-stone-200
                            dark:hover:bg-stone-800 dark:active:bg-stone-600 dark:border-stone-600"
                            on:click={()=>goUp()}
                            disabled={isDisabled}>
                        <FaLevelUpAlt/>
                    </button>
                {/if}

                <h2 class="text-lg font-semibold ">
                    {ext(currentLevelTitle)}
                </h2>
            </div>


            <List   objects={elements}
                    orderAttrib='Order'
                    {list_properties}
                    multiselect={canSelectElements}
                    selectionKey='handy'
                    bind:this={listElement}
                    >
                <ListTitle a='Title' readonly onOpen={onOpen}/>
                <ListSummary a='Summary' readonly/>

                <span slot="left" let:element>
                    <Icon component={getElementIcon(element)}
                        class="text-stone-500 dark:text-stone-400 h-5 w-5  cursor-pointer mt-0.5  ml-2  mr-1"/>
                </span>
            </List>
        </div>


            <div class="mt-2 flex flex-row justify-end gap-2">

                <button class=" py-2.5 px-5
                                text-base sm:text-xs font-medium
                                bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400
                                hover:bg-stone-200 hover:dark:bg-stone-600
                                disabled:bg-white/60 disabled:dark:bg-stone-700/60
                                border rounded
                                border-stone-200 dark:border-stone-600 focus:outline-none
                                disabled:border-stone-200/60 disabled:dark:border-stone-600/60
                                inline-flex items-center justify-center"
                                disabled={!selectedElementsNo || !canSelectElements}
                                on:click={() => attachTo()}>

                    _; Paste; Pegar; Wklej
                </button>

            </div>

    {/if}
