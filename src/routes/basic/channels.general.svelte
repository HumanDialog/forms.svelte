<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Icon,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
				mainContentPageReloader,
                Modal, Paper, PaperHeader,
                onErrorShowAlert, i18n} from '$lib'
    import {querystring, location} from 'svelte-spa-router'
    import {FaRegFolder, FaHashtag, FaCaretUp, FaCaretDown, FaTrash, FaRegComments, FaRegClipboard, FaPen, FaArchive, FaEllipsisH} from 'svelte-icons/fa'

    export let params = {}

    let group = null;
    let listComponent;

    const title = '_; General Channels; Canales generales; Kanały ogólne'


    $: onParamsChanged($session, $mainContentPageReloader, $querystring);

    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            group = null;
            return;
        }

        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.post(`/group/query`,
                                {
                                    Id: 1,
                                    Name: "collector",
                                    ExpandLevel: 3,
                                    Tree:
                                    [
                                        {
                                            Id: 1,
                                            Association: '',
                                            Expressions:['Id','Name', '$ref'],
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'MessageChannels',
                                                    Expressions:['Id','Title', 'Summary', 'href', 'Order', 'icon','$ref', 'GetUnreadMessagesNo', 'IsSubscribed'],
                                                    Sort: "Order",
                                                }
                                            ]
                                        }
                                    ]
                                },
                                onErrorShowAlert);
        if(res)
            group = res.Group;
        else
            group = null
    }

    async function reloadChannels(selectRecommendation)
    {
        await fetchData();
        listComponent.reload(group, selectRecommendation);
    }


    let deleteModal;
    let channelToDelete;
    function askToDelete(channel)
    {
        channelToDelete = channel;
        deleteModal.show()
    }


    async function deleteChannel()
    {
        if(!channelToDelete)
            return;

        await reef.delete(`/group/MessageChannels/${channelToDelete.Id}`, onErrorShowAlert)
        deleteModal.hide();


        await reloadChannels(listComponent.SELECT_NEXT)
    }


    async function addChannel(newChannelAttribs)
    {
        let res = await reef.post("/group/AddGeneralMessageChannel",
            {
                title: newChannelAttribs.Title,
                summary: newChannelAttribs.Summary ?? '',
                order: newChannelAttribs.Order ?? 0
            }, onErrorShowAlert);
        if(!res)
            return null;

        let newChannel = res.MessageChannel
        await reloadChannels(newChannel.$ref)
    }

    let pageOperations = {
        opver: 2,
        fab: 'M00',
        operations: [
            {
                caption: '_; View; Ver; Widok',
                operations: [
                    {
                        caption: '_; New channel; Nuevo canal; Nowy kanał',
                        mricon: 'messages-square',
                        action: (focused) => { listComponent.addRowAfter(null) },
                        tbr: 'A',
                        fab: 'M03'
                    }
                ]
            }
        ]
    }

    function getEditOperations(channel)
    {
        return [

        ];
    }

    let channelOperations = (channel) => {
        let editOperations = getEditOperations(channel)
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            caption: '_; New channel; Nuevo canal; Nowy kanał',
                            mricon: 'messages-square',
                            action: (focused) => { listComponent.addRowAfter(channel) },
                            tbr: 'A',
                            fab: 'M03'
                        }
                    ]
                },
                {
                    caption: '_; Channel; Canal; Kanał',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit; Editar; Edytuj',
                            mricon: 'pencil',
                            tbr: 'A',
                            fab:'M20',
                            grid:[
                                {
                                    caption: '_; Title; Título; Tytuł',
                                    action: (f) =>  { listComponent.edit(channel, 'Title') },
                                },
                                {
                                    caption: '_; Summary; Resumen; Podsumowanie',
                                    action: (f) =>  { listComponent.edit(channel, 'Summary') }
                                }
                            ]

                        },
                        {
                            caption: '_; Move to top ; Mover al principio de la lista; Przesuń na szczyt',
                            hideToolbarCaption: true,
                            mricon: 'chevrons-up',
                            action: (f) => listComponent.moveTop(channel),
                            fab:'M06',
                            tbr:'A',
                        },
                        {
                            caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                            hideToolbarCaption: true,
                            mricon: 'chevron-up',
                            action: (f) => listComponent.moveUp(channel),
                            fab:'M05',
                            tbr:'A',
                        },
                        {
                            caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                            hideToolbarCaption: true,
                            mricon: 'chevron-down',
                            action: (f) => listComponent.moveDown(channel),
                            fab:'M04',
                            tbr:'A'
                        },

                       {
                            caption: '_; Delete; Eliminar; Usuń',
                            //icon: FaTrash,
                            action: (f) => askToDelete(channel),
                            //fab:'M30',
                            //tbr:'B'
                        }

                    ]
                }
            ]
        }
    }

    let list_properties = {
        element:{
            icon: "icon",
            href: "href",
            Title: "Title",
            Summary: "Summary"
        }
    }

</script>

<svelte:head>
    <title>{title} | {__APP_TITLE__}</title>
</svelte:head>

{#if group}

    <Page   self={group}
            toolbarOperations={pageOperations}
            clearsContext='props sel'
            title={title}>
            <Paper class="mb-64">
            <PaperHeader>

            </PaperHeader>

            <h1>{title}</h1>



        <List   self={group}
                a='MessageChannels'
                {list_properties}
                toolbarOperations={channelOperations}
                orderAttrib='Order'
                bind:this={listComponent}>

            <ListInserter action={addChannel} icon/>


        </List>

        </Paper>
    </Page>
{:else}
    <Spinner delay={3000}/>
{/if}


<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        content={i18n(["Are you sure you want to delete selected channel?", "¿Está seguro de que desea eliminar el elemento seleccionado?", "Czy na pewno chcesz usunąć wybrany element?"])}
        icon={FaTrash}
        onOkCallback={deleteChannel}
        bind:this={deleteModal}
        />
