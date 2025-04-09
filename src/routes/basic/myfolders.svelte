<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner, 
                Page, 
                Icon, 
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty,
				mainContentPageReloader,
                Modal,
                onErrorShowAlert} from '$lib'
    import {FaRegFolder, FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle, FaPen, FaArchive, FaEllipsisH, FaCopy, FaCut} from 'svelte-icons/fa'

    export let params = {}

    let user = null;
    let listComponent;
    

    $: onParamsChanged($session, $mainContentPageReloader);
    
    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            user = null;
            return;
        }
        
        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.post(`/user/query`,
                                {
                                    Id: 1,
                                    Name: "collector",
                                    ExpandLevel: 3,
                                    Tree:
                                    [
                                        {
                                            Id: 1,
                                            Association: '',
                                            Expressions:['Id','Name','login', '$ref'],
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'Folders',
                                                    Expressions:['Id','Title', 'Summary', 'href', 'Order', '$ref'],
                                                    Sort: "Order",
                                                }
                                            ]
                                        }
                                    ]   
                                },
                                onErrorShowAlert);
        if(res)
            user = res.User;
        else
            user = null
    }

    async function reloadFolders(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(user, selectRecommendation);
    }
    

    let deleteModal;
    let folderToDelete;
    function askToDelete(folder)
    {
        folderToDelete = folder;
        deleteModal.show()
    }

    
    async function deleteFolder()
    {
        if(!folderToDelete)
            return;

        await reef.post(`${folderToDelete.$ref}/DeletePermanently`, { }, onErrorShowAlert);
        deleteModal.hide();

        
        await reloadFolders(listComponent.SELECT_NEXT)
    }

    
    async function addFolder(newFolderAttribs)
    {
        let res = await reef.post(`/user/Folders/new`, newFolderAttribs, onErrorShowAlert)
        if(!res)
            return null;

        let newFolder = res.Folder[0];
        await reloadFolders(newFolder.Id)
    }

    let pageOperations = {
        opver: 1,
        operations: [
            {
                caption: 'View',
                operations: [
                    {
                        icon: FaPlus,
                        caption: '',
                        action: (focused) => { listComponent.addRowAfter(null) },
                        fab: 'M10',
                        tbr: 'A'
                    }
                ]
            }
        ]
    }

    function getEditOperations(folder)
    {
        return [
            {
                caption: 'Name',
                action: (focused) =>  { listComponent.edit(folder, 'Title') }
            },
            {
                caption: 'Summary',
                action: (focused) =>  { listComponent.edit(folder, 'Summary') }
            }
        ];
    }

    let folderOperations = (folder) => { 
        let editOperations = getEditOperations(folder)
        return {
            opver: 1,
            operations: [
                {
                    caption: 'Folder',
                    operations: [
                        {
                            icon: FaPlus,
                            caption: '',
                            action: (focused) => { listComponent.addRowAfter(folder) },
                            fab: 'M10',
                            tbr: 'A'
                        },
                        {
                            icon: FaPen,
                            grid: editOperations,
                            fab: 'M20',
                            tbr: 'A',
                        },
                        {
                            icon: FaCaretDown,
                            action: (f) => listComponent.moveDown(folder),
                            fab:'M02',
                            tbr:'A' 
                        },
                        {
                            icon: FaCaretUp,
                            action: (f) => listComponent.moveUp(folder),
                            fab:'M03',
                            tbr:'A' 
                        },
                    /*    {
                            icon: FaCopy,   // MdLibraryAdd
                            caption: 'Copy to basket',
                            action: (f) => copyFolderToBasket(folder),
                            fab: 'M04',
                            tbr: 'A'
                        },
                        {
                            icon: FaCut,
                            caption: 'Move to basket',
                            action: (f) => cutFolderToBasket(folder),
                            fab: 'M05',
                            tbr: 'A'
                        },
                    */    {
                            icon: FaTrash,
                            action: (f) => askToDelete(folder),
                            fab:'M30',
                            tbr:'B'
                        }
                    ]
                }
            ]
        }
    }

    /*
    async function copyFolderToBasket(folder)
    {
        await reef.post(`${folder.$ref}/CopyToBasket`, { }, onErrorShowAlert)
        // not needed
        //await reloadFolders(listComponent.SELECT_NEXT)
    }

    async function cutFolderToBasket(folder)
    {
        const res = await reef.post(`${user.$ref}/MoveFolderToBasket`, {folder: folder.$ref}, onErrorShowAlert)
        if(res)
            await reloadFolders(listComponent.SELECT_NEXT)
    }
    */

</script>

<svelte:head>
    <title>My Folders | Octopus Basic</title>
</svelte:head>

{#if user}
    
    <Page   self={user} 
            toolbarOperations={pageOperations}
            clearsContext='props sel'
            title='My Folders'>
            <section class="w-full place-self-center max-w-3xl">
        <List   self={user} 
                a='Folders' 
                toolbarOperations={folderOperations} 
                orderAttrib='Order'                
                bind:this={listComponent}>
            <ListTitle a='Title' hrefFunc={(folder) => `${folder.href}`}/>
            <ListSummary a='Summary'/>
            <ListInserter action={addFolder} icon/>

            <span slot="left" let:element>
                <Icon component={FaRegFolder} 
                    class="h-5 w-5  text-stone-500 dark:text-stone-400 cursor-pointer mt-0.5 ml-2 mr-1 "/>
            </span>
            
        </List>
    </section>
    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title="Delete"
        content="Are you sure you want to delete selected folder?"
        icon={FaTrash}
        onOkCallback={deleteFolder}
        bind:this={deleteModal}
        />
