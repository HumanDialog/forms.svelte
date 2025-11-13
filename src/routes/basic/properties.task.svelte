<script>
    import { afterUpdate, onMount } from "svelte";
    import { reef } from "@humandialog/auth.svelte";
    import {
        onErrorShowAlert, Icon,
        List, ListTitle, ListSummary, Spinner, ext, i18n, showMenu, Dialog,
        clearActiveItem, SHOW_MENU_LEFT, getNiceStringDate
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
    let task=null;

    let creationDate = null
    let modificationDate = null

    $: initData()

    async function initData(...args)
    {

        console.log('initData', elementLink.$type, elementLink.$ref)
        //if(lastReloadTicket == reloadTicket)
        //    return;

        //lastReloadTicket = reloadTicket

        // todo
        if(elementLink)
        {
            switch(elementLink.$type)
            {
            case "FolderTask":
                elementRef = `Task/${elementLink.TaskId}`
                break;
            case "Task":
                elementRef = elementLink.$ref
                break;
            default:
                return
            }

            console.log(elementRef)
            await reloadData()
        }
    }

    let rootDialog
    export function show(paramElement)
    {
        elementLink = paramElement
        console.log(elementLink)
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
                            Expressions:['Id', '$ref','Title','Summary', 'Kind', 'GetCanonicalPath', 'CreationDate'],
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
                                    Association: 'Actor',
                                    Expressions:['$ref', 'Name', 'href', '$type']
                                },
                                {
                                    Id: 103,
                                    Association: 'TaskList',
                                    Expressions:['$ref', 'Name', 'Summary', 'href', '$type']
                                },
                            ]
                        }
                    ]
                },
                onErrorShowAlert)

        task = res.Task

        if(task.CreationDate)
            creationDate = new Date(task.CreationDate)
        else
            creationDate = null

        task.attachedTo = []
        if(task.InFolders && task.InFolders.length > 0)
            task.InFolders.forEach((f) => task.attachedTo.push(f))
        
        if(task.TaskList)
        {
            task.attachedTo.push({
                $ref: task.TaskList.$ref,
                InTitle: task.TaskList.Name,
                InSummary: task.TaskList.Summary,
                InHRef: task.TaskList.href,
                InIcon: 'TaskList',
                $type: task.TaskList.$type,
                IsCanonical: 1
            })
        }

        if(task.Actor)
        {
            task.attachedTo.push({
                $ref: task.Actor.$ref,
                InTitle: task.Actor.Name,
                InSummary: '',
                InHRef: task.Actor.href,
                InIcon: 'User',
                $type: task.Actor.$type,
                IsCanonical: 1
            })
        }
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
        case 'FolderTask':
            await reef.post(`${inLink.$ref}/Folder/DettachTask`, { taskLink: inLink.$ref } , onErrorShowAlert);
            break;

        case 'TaskList':
            await reef.get(`${task.$ref}/set?TaskList=null` , onErrorShowAlert);
            break;

        case 'User':
            await reef.get(`${task.$ref}/set?Actor=null` , onErrorShowAlert);
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
        return 'Normal'
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
 <!--svelte-ignore a11y-no-noninteractive-elementLink-interactions -->
<Dialog bind:this={rootDialog}>

<menu bind:this={rootElement} on:click={clearSelection}
    class="w-full sm:min-w-[20rem] max-h-80 sm:max-h-none overflow-y-auto overflow-x-hidden overscroll-contain" >
    
    {#if closeButtonPos}
        <button class="     text-stone-800 dark:text-stone-400
                            fixed w-6 h-6 flex items-center justify-center
                            focus:outline-none font-medium  text-sm text-center" 
                            style={closeButtonPos}
                on:click={ closeDialog }>   <!-- rounded-full text-stone-500 bg-stone-200/70 hover:bg-stone-200 dark:text-stone-500 dark:bg-stone-700/80 dark:hover:bg-stone-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 -->
            <Icon component={FaTimes} s="md"/>
        </button>
    {/if}

    <article class="w-full prose prose-base prose-zinc dark:prose-invert mb-20 sm:my-5">

        <h3>_;Task properties; Propiedades de la tarea; Właściwości zadania</h3>
        
        {#if task}
            <h4>_; Name; Nombre; Nazwa</h4>
            <p>{ext(task.Title)}</p>

            <h4>_; Type; Tipo; Rodzaj</h4>
            <p class="flex flex-row">
                {printNiceKind(task.Kind)}
            </p>

            <h4>_; Path; Ruta; Ścieżka</h4>
            <p>
                {#if task.GetCanonicalPath && task.GetCanonicalPath.length > 0}
                    {#each task.GetCanonicalPath as segment, idx}
                        {#if idx > 0}
                            <span class="ml-1">/</span>
                        {/if}
                        <a class="font-normal text-zinc-700 dark:text-zinc-300"
                            href={segment.href} use:link>{ext(segment.Name)}</a>
                    {/each}
                {/if}
            </p>

            {#if task.attachedTo && task.attachedTo.length > 0}
                <h4>_; Attached to; Adjunto a; Przyłączony do</h4>
                    <p>
                    {#each task.attachedTo as inLink}
                        
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
                
                <!--section class="not-prose"> 
                    <List   self={task}
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
            <p>{folderStatus(task.Status)}</p-->

            {#if creationDate}
                <h4>_; Created; Creado; Utworzony</h4>
                <p>
                    <span>{getNiceStringDate(creationDate)}</span>
                    
                    {#if task.CreatedBy}
                        <span>_; by; por; przez</span>
                        <a  class="font-normal text-zinc-700 dark:text-zinc-300 "
                            href={task.CreatedBy.href} use:link>
                                {task.CreatedBy.Name}
                        </a>
                    {/if}

                </p>
            {/if}
        {:else}
            <Spinner />
        {/if}
    </article>

</menu>
</Dialog>