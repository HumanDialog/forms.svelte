<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Editable,
                mainContentPageReloader, refreshToolbarOperations, reloadPageToolbarOperations,
                i18n, ext,
                Breadcrumb, contextItemsStore,
                Paper, PaperHeader, openInNewTab, copyAddress, isActive, activateItem,
				focusEditable, showMenu, Ricon, get_main_object_fetch_error_description,  setjItemProperty,
                Editor, getNiceStringDateTime, download_file_from_href, truncate_html, sleep, startEditing, editable} from '$lib'
    import {onMount, tick} from 'svelte'
    import {location, pop, push, querystring, link} from 'svelte-spa-router'
    import {cache} from './cache.js'
    import FolderProperties from './properties.folder.svelte'
    import {NK_COMMENT, NS_LATEST, NS_CONFIDENTIAL, NR_SCRATCH, NR_DRAFT} from './consts.js'
	import FinishPostDialog from './finish.post.dialog.svelte' 
	
    
    export let params = {}

    let contextItem = null;
    let contextNavigation = '';
    let cacheKey = '';
    let contextItemSelector;
    let contextItemId;

    let breadcrump;
    let folderTitle = ''
    let failed_message = ''
    let details_visibility = 0

    let scratch_post = null
    let finish_post_dialog
    let prompt_rerender_ticket = 0

    let readonly = false

    const DV_SHOW_CATEGORY = 0x0001
    const DV_SHOW_TITLE = 0x0002
    const DV_SHOW_SUMMARY = 0x0004
    const DV_SHOW_NEW_MESSAGE_PROMPT = 0x0008
    const DV_ADD_FOLLOW_CATEGORY_OPERATIONS = 0x0010
    const DV_SHOW_WORKING_POSTS = 0x0020
    const DV_CONTEXTUAL_VIEW = 0x0040

    let users = [];
    let working_posts = []
    //let unapproved_posts = []

    
    $: on_params_changed($location, $querystring, $mainContentPageReloader, $session);
    $: on_selection_changed($contextItemsStore)

    async function on_params_changed(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'feed');
        if(foundIdx < 0)
            return;

        let selector_idx = 0 
        if(!segments.length)
            contextItemSelector = 'default'
        else
        {
            selector_idx = segments.findIndex(s => s == 'feed')
            if(selector_idx >= 0)
            {
                selector_idx++
                contextItemSelector = segments[selector_idx]
            }
            else
                contextItemSelector = 'default'
        }

        contextItemId = 0
        details_visibility = 0
        working_posts = []
        //unapproved_posts = []
        

        switch (contextItemSelector)
        {
        case 'my':
            contextNavigation = "user/MyFeed";
            cacheKey = "user_MyFeed";
            details_visibility = DV_SHOW_TITLE | DV_SHOW_SUMMARY | DV_SHOW_CATEGORY | DV_SHOW_NEW_MESSAGE_PROMPT | DV_ADD_FOLLOW_CATEGORY_OPERATIONS | DV_SHOW_WORKING_POSTS
            break;
        case 'sent':
            contextNavigation = "user/MySentPosts";
            cacheKey = "user_MySentPosts";
            details_visibility = DV_SHOW_TITLE | DV_SHOW_SUMMARY | DV_SHOW_CATEGORY
            break;
        case 'latest':
            contextNavigation = "group/LatestPosts";
            cacheKey = "group_LatestPosts";
            details_visibility = DV_SHOW_TITLE | DV_SHOW_SUMMARY | DV_CONTEXTUAL_VIEW
            break;
        case 'confidential':
            contextNavigation = "group/ConfidentialPosts";
            cacheKey = "group_ConfidentialPosts";
            details_visibility = DV_SHOW_TITLE | DV_SHOW_SUMMARY
            break;
        default:
            contextItemId = parseInt(segments[segments.length-1])
            contextNavigation = `Folder/${contextItemId}`
            cacheKey = `Feed_${contextItemId}`;
            details_visibility = DV_SHOW_TITLE | DV_SHOW_SUMMARY | DV_CONTEXTUAL_VIEW
            break;
        }

        const fetching_context_id = contextItemId

        const cachedValue = cache.get(cacheKey)
        if(cachedValue)
        {
            contextItem = cachedValue;
            folderTitle = ext(contextItem.Title);
            contextItemId = cachedValue.Id;
            readonly = (contextItem.$acc & 0x02) == 0
            breadcrump?.reload(contextItem.GetCanonicalPath)
        }
        //---------------------------------------------------

        let promises = [read_context_item(contextNavigation)]

        if(details_visibility & DV_SHOW_WORKING_POSTS)
            promises.push(fetch_my_working_threads(fetching_context_id))

        const [read_item, my_working_posts] = await Promise.all(promises)
        const folderItem = setup_data_after_fetch(read_item, my_working_posts);


        // dodatkowe zabezpiecznie dla przypadku kiedy pokazalismy folder, ale jego wersje z cache'a
        // i wciąż jeszcze czekamy na odpowiedź z serwisu. W międzyczasie user przeszedł do folderu niżej
        // zostajemy więc w tym komponencie, ale zmienił się parametr folderu do załadowania
        // wysyłamy więc nowe zapytanie, a to poprzednie, które wciąż jeszcze trwa, już nas nie interesuje
        if((contextItemId > 0) && (folderItem.Id != contextItemId))
            return;

        contextItem  = folderItem
        cache.set(cacheKey, contextItem)
       

        if(contextItem)
        {
            folderTitle = ext(contextItem.Title);
            readonly = (contextItem.$acc & 0x02) == 0
            setup_all_elements(contextItem)
        }

        breadcrump?.reload(contextItem.GetCanonicalPath)
    }

    async function read_context_item(contextNavigation)
    {
        failed_message = ''
        return reef.post(`${contextNavigation}/query`,
        {
            Id: 1,
            Name: "collector",
            ExpandLevel: 6,
            Tree:
            [
            {   Id: 1, Association: '',
                Expressions:['Id', '$ref', '$type', 'icon', 'Title','Summary', 'Kind', 'ModificationDate', 'CreatedBy', 'IsPinned', 'IsBasket', 'IsRootPinned', 'IsSubscribed', 'GetCanonicalPath', '$ver', 'Status', '$acc'],
                SubTree:[
                    { 
                        Id: 3, Association: 'Notes',
                        Expressions:['Id', '$ref', 'Title', 'Summary', 'Content', 'Order', 'State', 'Role', 'NotesCount', 'Kind', 'ModificationDate', 'href', 'icon', 'IsInBasket', 'IsCanonical', 'NoteId', 'ThreadFolderInfo', 'DraftCommentThreadInfo', '$type', '$ver'],
                        Sort: "-Order",
                        SubTree:[
                            {
                                Id: 31,
                                Association: "Note/ModifiedBy",
                                Expressions:['$ref', 'Name', 'href']
                            },
                            {
                                Id: 32,
                                Association: "Note/CreatedBy",
                                Expressions:['$ref', 'Name', 'href']
                            },
                            {
                                Id: 33,
                                Association: "Note/Files",
                                Expressions: ["$ref", "Title", "Summary", "href", "icon", "$type"]
                            },
                            {
                                Id: 34,
                                Association: "Note/InNotes",
                                Filter: "IsCanonical",
                                Expressions: ["Id", "$ref", "InTitle", "InContent", "InModificationDate", "InHRef"],
                                SubTree: [
                                    {
                                        Id: 331,
                                        Association: "InNote/ModifiedBy",
                                        Expressions:['$ref', 'Name', 'href']
                                    },
                                    {
                                        Id: 332,
                                        Association: "InNote/CreatedBy",
                                        Expressions:['$ref', 'Name', 'href']
                                    }
                                ]
                            }
                         /*   ,{
                                Id: 34,
                                Association: "Note/InFolders",
                                Filter: "IsCanonical",
                                Expressions: ["Id", "$ref", "InTitle", "InHRef"]
                            }*/
                        ]
                    },
              
                ]
            }
        ]
        },
        handle_fetch_error);
        
    }

    async function fetch_my_working_threads(parent_folder_id) 
    {
        working_posts = []
       
        /*return reef.post('user/query', {
            Id: 1, Name: 'drafts and unapproved posts', ExpandLevel: 16,
            Tree: [
                {
                    Id: 1,
                    Association: '',
                    Expressions: [],
                    SubTree: [
                        {
                            Id: 10,
                            Association: 'MyDraftPosts',
                            Expressions: [],
                            SubTree: [
                                {
                                    Id: 100,
                                    Association: 'Notes',
                                    Filter: parent_folder_id ? `Kind=NK_THREAD and Note/IsDraftThreadInCategory(${parent_folder_id})` : '',
                                    Expressions: ['Id', '$ref', 'Title', 'Summary', 'Content', 'Kind', 'State', 'href', '$type', 'ModificationDate', 'DraftThreadCategoryFolderInfo', 'DraftCommentThreadInfo', '$ver'],
                                    Sort: "-ModificationDate",
                                    SubTree: [
                                        {
                                            Id: 1000,
                                            Association: 'Note/Files',
                                            Expressions: ["$ref", "Title", "Summary", "href", "icon", "$type"]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        })*/
       
    }

    function setup_data_after_fetch(context_item, user_posts)
    {
        let result = null
        if(context_item)
            result = context_item.Folder

        scratch_post = null  
        if(details_visibility & DV_SHOW_NEW_MESSAGE_PROMPT)
        {
            if(context_item.Folder && context_item.Folder.Notes)
            {
                scratch_post = context_item.Folder.Notes.find(n => n.Role == NR_SCRATCH)   
            }
        }
           
        if(user_posts && user_posts.User)
        {
            if(user_posts.User.MyDraftPosts && user_posts.User.MyDraftPosts.Notes && user_posts.User.MyDraftPosts.Notes.length>0)
                working_posts = user_posts.User.MyDraftPosts.Notes


            //if(user_posts.User.MySentPosts && user_posts.User.MySentPosts.Notes && user_posts.User.MySentPosts.Notes.length>0)
            //    unapproved_posts = user_posts.User.MySentPosts.Notes
        }

        return result
    }

    function handle_fetch_error(err, res)
    {
        contextItem = null
        failed_message = get_main_object_fetch_error_description(err, res);
    }

    function setup_all_elements(contextItem)
    {
        contextItem.all_elements = []
        //if(contextItem.Folders)
        //    contextItem.all_elements = [...contextItem.all_elements, ...contextItem.Folders]

        if(contextItem.Notes)
        {
            //let unapproved_posts = contextItem.Notes.filter(el => el.State == NS_LATEST)
            //unapproved_posts.sort((a,b) =>  b.Order - a.Order)

            //let other_posts = contextItem.Notes.filter(el => el.State != NS_LATEST)
            //other_posts.sort((a,b) =>  b.Order - a.Order)

            //contextItem.all_elements = [...contextItem.all_elements, ...unapproved_posts, ...other_posts]
            contextItem.all_elements = [...contextItem.all_elements, ...contextItem.Notes]
        }

        //if(contextItem.Tasks)
        //    contextItem.all_elements = [...contextItem.all_elements, ...contextItem.Tasks]

        //if(contextItem.Files)
        //    contextItem.all_elements = [...contextItem.all_elements, ...contextItem.Files]

        contextItem.all_elements.sort((a,b) =>  b.Order - a.Order)

        // ==========================================


    }

    async function fetch_data()
    {

        let promises = [read_context_item(contextNavigation)]

        if(details_visibility & DV_SHOW_WORKING_POSTS)
            promises.push(fetch_my_working_threads(contextItemId))

        const [read_item, my_working_posts] = await Promise.all(promises)

        contextItem = setup_data_after_fetch(read_item, my_working_posts);
        cache.set(cacheKey, contextItem)
        if(contextItem)
        {
            folderTitle = ext(contextItem.Title);
            setup_all_elements(contextItem)
        }
        prompt_rerender_ticket = prompt_rerender_ticket + 1
    }


    function on_selection_changed(...params)
    {
        if(contextItem && contextItem.all_elements)
            contextItem.all_elements = [...contextItem.all_elements]
    }
 
    const refresh_operation = {
        caption: '_; Refresh; Actualizar; Odśwież',
        action: async (f) => await fetch_data(),
    }

    let folder_properties_dialog;
    const properties_operation = {
        caption: '_; Properties; Propiedades; Właściwości',
        action: (btt, rect)=> folder_properties_dialog.show(contextItem)
    }

    
    function get_page_operations()
    {
        if(!contextItem)
            return [];

        
    
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        {
                            caption: '_; Edit; Editar; Edytuj',
                            disabled: readonly,
                            hideToolbarCaption: true,
                            mricon: 'pencil',
                            tbr: 'A',
                            fab:'M20',
                            grid:[
                                {
                                    caption: '_; Title; Título; Tytuł',
                                    action: () =>  { focusEditable('Title') },
                                },
                                {
                                    caption: '_; Summary; Resumen; Podsumowanie',
                                    action: () =>  { focusEditable('Summary') }
                                }
                            ]
                        },
                        ... (details_visibility & DV_CONTEXTUAL_VIEW) ? [... (contextItem.IsSubscribed ? [unfollow_op()] : [follow_op()])] : [],
                        refresh_operation,
                        properties_operation
                    ]
                }

            ]
        }

        
    }


    async function toggle_subscribe_category(info)
    {
        if(info.IsSubscribed)
        {
            const res = await reef.get(`${info.ref}/Unsubscribe`)
            if(res)
                info.IsSubscribed = false
        }
        else
        {
            const res = await reef.get(`${info.ref}/Subscribe`)
            if(res)
                info.IsSubscribed = true
        }
    }


    async function copy_note_to_basket(note)
    {
        await reef.post(`${contextItem.$ref}/CopyNoteToBasket`, { noteLink: note.$ref } , onErrorShowAlert);
        refreshToolbarOperations()
    }


    async function delete_working_post(working_post)
    {
        await reef.post(`${working_post.$ref}/Note/MoveMeToTrash`, {})
        await fetch_data()
    }


    let new_message_content_element
    
    async function on_prompt_change(text, a)
    {
        if(scratch_post)
        {
            setjItemProperty(scratch_post, a, text)
        }
        else
        {
            const result = await reef.post(`${contextItem.$ref}/NewScratchPost`, {title: '', summary: '', content: ''})
            if(result && result.FolderNote)
            {
                scratch_post = result.FolderNote
                scratch_post.Title = ''
                scratch_post.Content = ''
                //setjItemProperty(scratch_post, a, text)
            }
        }
    }

    function on_new_message_title_finish(detail)
    {
        if(detail.incremental)
        {            
            new_message_content_element?.focus()
        }
    }

    
    let working_post_creating = false
    let working_post_spinner = ''

    const MWN_NOTHING = 0
    const MWN_FOCUS_CONTENT_END = 1
    const MWN_FOCUS_CONTENT_ALL = 2
    const MWN_INSERT_ATTACHEMENT = 3

    async function save_scratch_as_draft(note, action_after_redirecting=MWN_NOTHING, spinner = '')
    {
        if(!note)
            return;

        let working_post_content = ''
        if(note.Content)
        {
            working_post_content = note.Content.replace(/\r?\n/g, '<br>')
            working_post_content = `<p>${working_post_content}</p>`
        }
        

        if(spinner)
        {
            working_post_creating = true
            working_post_spinner = spinner
        }

        let href = await reef.post(`${note.$ref}/Note/SaveScratchAsDraft`, {
            title: note.Title,
            summary: '',
            content: working_post_content
        })

        if(href)
        {
            let postfix = ''
            switch(action_after_redirecting)
            {
            case MWN_FOCUS_CONTENT_END:
                postfix = '?action=focuscontent&arg1=end'
                break;
            case MWN_FOCUS_CONTENT_ALL:
                postfix = '?action=focuscontent&arg1=all'
                break;
            case MWN_INSERT_ATTACHEMENT:
                postfix = '?action=insertattachement'
                break;
            }

            if(postfix)
                href += postfix
        }

        working_post_spinner = ''
        working_post_creating = false

        return href
    }

    async function go_to_post_editor(note) 
    {
        let href
        if(note.Role == NR_SCRATCH)
            href = await save_scratch_as_draft(note, MWN_FOCUS_CONTENT_END)    
        else    
            href = note.href
        
        if(href)
            push(href)
    }

    function finish_post(note)
    {
        finish_post_dialog.show(note)
    }

    async function on_refresh_after_finish_post(finishing_post)
    {
        if(finishing_post == scratch_post)
            scratch_post = null

        await fetch_data()
    }
    
    function unfollow_op()
    {
        return {
            caption: '_; Unfollow; Dejar de seguir; Przestań obserwować',
            mricon: 'eye-off',
            tbr: 'C',
            fab: 'M09',
            hideToolbarCaption: true,
            action: (f) => toggle_subscribe()
        }
    }

    function follow_op()
    {
        return {
            caption: '_; Follow; Seguir; Obserwuj',
            mricon: 'eye',
            tbr: 'C',
            fab: 'MO9',
            hideToolbarCaption: true,
            action: (f) => toggle_subscribe()
        }
    }

    async function toggle_subscribe()
    {
        if(contextItem.IsSubscribed)
        {
            const res = await reef.get(`${contextItem.$ref}/Unsubscribe`)
            if(res)
                contextItem.IsSubscribed = false
        }
        else
        {
            const res = await reef.get(`${contextItem.$ref}/Subscribe`)
            if(res)
                contextItem.IsSubscribed = true
        }

        reloadPageToolbarOperations(get_page_operations())
    }

    function get_post_operations(note)
    {
        if(note.Role == NR_DRAFT)
            return get_draft_post_operations(note)

        const send_operations = [
                {
                    caption: '_; Copy; Copiar; Kopiuj',
                    action: () => copy_note_to_basket(note),
                },
                {
                    caption: '_; Open in a new tab; Abrir en una nueva pestaña; Otwórz w nowej karcie',
                    action: () => openInNewTab(note.href)
                },
                {
                    caption: '_; Copy the address; Copiar la dirección; Skopuj adres',
                    action: () => copyAddress(note.href)
                }
        ]

        let unfollow_note_category_operations = [] 
        if((details_visibility & DV_ADD_FOLLOW_CATEGORY_OPERATIONS) > 0 && (note.ThreadFolderInfo)) 
        {
            if(note.ThreadFolderInfo.IsSubscribed)
            {
                unfollow_note_category_operations.push({
                    caption: '_; Unfollow this category; Dejar de seguir esta categoría; Przestań obserwować tę kategorię',
                    action: () => toggle_subscribe_category(note.ThreadFolderInfo)
                })
            }
            else
            {
                unfollow_note_category_operations.push({
                    caption: '_; Follow this category; Sigue esta categoría; Obserwuj tę kategorię',
                    action: () => toggle_subscribe_category(note.ThreadFolderInfo)
                })
            }
            unfollow_note_category_operations.push({separator: true});
        }

        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; Note; Nota; Notatka',
                    operations: [
                        ...unfollow_note_category_operations,
                        {
                            caption: '_; Send; Enviar; Wyślij',
                            mricon: 'upload',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S00',
                            menu: send_operations
                        }
                    ]
                },
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        ... (details_visibility & DV_CONTEXTUAL_VIEW) ? [... (contextItem.IsSubscribed ? [unfollow_op()] : [follow_op()])] : [],
                        refresh_operation,
                        properties_operation
                    ]
                }
            ]
        }
    }

    function get_draft_post_operations(note)
    {
        const send_operations = [
                {
                    caption: '_; Copy; Copiar; Kopiuj',
                    action: () => copy_note_to_basket(note),
                },
                {
                    caption: '_; Open in a new tab; Abrir en una nueva pestaña; Otwórz w nowej karcie',
                    action: () => openInNewTab(note.href)
                },
                {
                    caption: '_; Copy the address; Copiar la dirección; Skopuj adres',
                    action: () => copyAddress(note.href)
                }
        ]

        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; Note; Nota; Notatka',
                    operations: [        
                        {
                            caption: '_; Finish the post; Terminar la entrada; Dokończ wpis',
                            mricon: 'send',
                            //hideToolbarCaption: true,
                            //tbr: 'A',
                            //fab:'M20',
                            action: () => finish_post(note)
                        },
                        {
                            caption: '_; Send; Enviar; Wyślij',
                            mricon: 'upload',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S00',
                            menu: send_operations
                        },
                        {
                            caption: '_; Delete; Eliminar; Usuń',
                            action: () => delete_working_post(note)
                        }
                    ]
                },
                {
                    caption: '_; View; Ver; Widok',
                    operations: [
                        ... (details_visibility & DV_CONTEXTUAL_VIEW) ? [... (contextItem.IsSubscribed ? [unfollow_op()] : [follow_op()])] : [],
                        refresh_operation,
                        properties_operation
                    ]
                }
            ]
        }
    }

    function activate_post(event, note, idx)
    {
        event.stopPropagation();

        if(isActive('props', note))
        {
            push(note.href)   
        }
        else
        {
            const operations = get_post_operations(note)
            activateItem('props', note, operations)
        }
    }

    const button_enabled_light_colors = 'text-stone-900/70 hover:text-stone-900 hover:bg-stone-900/10 active:bg-stone-900/20 border-stone-900/15'
    const button_disabled_light_colors = 'text-stone-900/35 border-stone-900/10'
    const button_enabled_dark_colors = 'dark:text-stone-100/80 dark:hover:text-white dark:hover:bg-stone-100/10 dark:active:bg-stone-100/20 dark:border-stone-100/15'
    const button_disabled_dark_colors = 'dark:text-stone-100/30 dark:border-stone-100/10'

    const button_disabled_colors = `${button_disabled_light_colors} ${button_disabled_dark_colors}`
    const button_enabled_colors = `${button_enabled_light_colors} ${button_enabled_dark_colors}`
    const button_colors = (disabled) => disabled ? button_disabled_colors : button_enabled_colors;

</script>

<svelte:head>
    {#if contextItem && folderTitle}
        <title>{folderTitle} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>


{#if contextItem}
    {#key contextNavigation}  <!-- to force new page operations -->
    <Page   self={contextItem}
            toolbarOperations={ get_page_operations() }
            clearsContext='props sel'
            title={folderTitle}>

        <Paper>
            <PaperHeader>
            <div class="flex flex-row items-center">
                <Breadcrumb  path = {contextItem.GetCanonicalPath} bind:this={breadcrump}/>
            </div>

            </PaperHeader>

            <!--div class="w-full flex flex-row justify-between">
                <span>Index 23</span>
                summary=
            </div-->

            <h1><Editable self={contextItem} a='Title' {readonly}/></h1>
            
            <p class="lead">
                <Editable self={contextItem} a='Summary' {readonly}/>
            </p>


            <!-- prompt -->
            {#if details_visibility & DV_SHOW_NEW_MESSAGE_PROMPT}
                {#key prompt_rerender_ticket}
                <!--h3 class="ml-2">Ask about TILOS</h3-->
                <section class="
                            min-h-24 w-full
                            border border-stone-300 dark:border-stone-600 rounded-lg p-2
                            bg-stone-50 dark:bg-stone-800">

                    <h2 class=" mt-2
                                outline-none 
                                overflow-x-clip text-wrap break-words overscroll-contain
                                editable-placeholder"
                                data-placeholder={i18n({
                                        en: 'Enter the title of your new post...',
                                        es: 'Escribe el título de la nueva entrada...',
                                        pl: 'Wpisz tytuł nowego wpisu...'
                                    })}
                                use:editable={{
                                    active: true,
                                    action: (text) => on_prompt_change(text, 'Title'),
                                    onSingleChange: (text) => on_prompt_change(text, 'Title'),
                                    onFinish: on_new_message_title_finish
                                    }}
                                >
                            {scratch_post ? scratch_post.Title : ''}
                    </h2>
                    
                    <p  class=" outline-none whitespace-pre-wrap
                                overflow-x-clip text-wrap break-words overscroll-contain
                                editable-placeholder"
                        bind:this={new_message_content_element}
                        data-placeholder={i18n({
                                    en: 'Start writing about your problem or idea...',
                                    es: 'Empieza a escribir sobre tu problema o idea...',
                                    pl: 'Zacznij opisywać problem lub pomysł...'
                                })}
                        use:editable={{
                            active: true,
                            action: (text) => on_prompt_change(text, 'Content'),
                            onSingleChange: (text) => on_prompt_change(text, 'Content'),
                            enterAsNewLine: true
                        }}>
                        {scratch_post ? scratch_post.Content : ''}
                    </p>

                    {#if 1}
                        {@const disabled = working_post_creating || (scratch_post==null)}
                        <div class="mt-2 w-full flex flex-row gap-4 items-center">
                            <button class="flex flex-row gap-1 items-center p-2 {button_colors(disabled)}"
                                title={i18n({ en:'Open the post draft editor', es: 'Abrir el editor de borrador de la entrada',  pl: 'Otwórz edytor szkicu wpisu'})}
                                on:click={(e) => go_to_post_editor(scratch_post)}
                                {disabled}>
                                {#if working_post_spinner != 'format'}
                                    <Ricon icon='pencil' s/>
                                {:else}
                                    <Ricon icon='loader-circle' s/>
                                {/if}
                            </button>
                        

                            <button class="ml-auto p-2 {button_colors(disabled)}
                                rounded-full border border-stone-300 dark:border-stone-600"
                                title={i18n({ en:'Finish the post', es: 'Terminar la entrada',  pl: 'Dokończ wpis'})}
                                on:click={(e) => finish_post(scratch_post)}
                                {disabled}>
                                <Ricon icon='send' s/>
                            </button>

                        </div>
                    {/if}

                </section>
                {/key}
            {/if}

            
            <div class="mt-12"></div>

            {#if contextItem.all_elements && contextItem.all_elements.length > 0}
            
                {#each contextItem.all_elements as note, idx (note.$ref)}
                    {@const is_first = idx == 0}
                    {@const is_last = idx == contextItem.all_elements.length-1}
                    {@const is_active = isActive('props', note)}
                    {@const is_scratch = note.Role == NR_SCRATCH}
                    {@const is_draft = note.Role == NR_DRAFT}
                    {@const is_comment = note.Kind == NK_COMMENT}
                    {@const is_confidential = note.State == NS_CONFIDENTIAL}
                    
                    {#if !is_scratch}
                    
                        {@const not_active_bg = ""}
                        {@const active_bg = "bg-stone-200 dark:bg-stone-800 outline outline-8 outline-stone-200 dark:outline-stone-800 cursor-pointer"}
                        {@const class_bg = is_active ? active_bg : not_active_bg}

                        {@const normal_class = class_bg}
                        {@const draft_class = `pl-5 pr-3 py-3 border-l-2 border-stone-300/80 dark:border-stone-700/80 ${class_bg}`}
                        
                        {@const post_class = is_draft ? draft_class : normal_class}
                    
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <section class="{post_class}" on:click={(e) => activate_post(e, note, idx)}>
                            
                            <div class="w-full flex flex-row flex-wrap justify-between">
                                <div class="flex flex-row gap-5 items-center">
                                    <div class="grow-0">
                                        {#if note["Note/CreatedBy"]}
                                            {@const author = note["Note/CreatedBy"]}
                                            {@const href = `${author.href}`}
                                            <a {href} use:link on:click|stopPropagation> {author.Name}</a>
                                        {/if}
                                    </div>

                                    <div class="text-sm">
                                        {getNiceStringDateTime(note.ModificationDate)}
                                    </div>
                                </div>

                                <div class="flex flex-row items-center gap-2">
                                    {#if is_confidential}
                                        <span title={i18n({en: 'Confidential', es: 'Confidencial', pl: 'Poufne'})}>
                                            <Ricon icon='globe-off' s/>
                                        </span>
                                    {/if}

                                    {#if (details_visibility & DV_SHOW_CATEGORY)}
                                        {#if is_draft}
                                            <span class="text-xs">_; Your draft post; Tu borrador de entrada; Twój szkic wpisu</span>
                                        {:else if note.ThreadFolderInfo}
                                            {@const title = note.ThreadFolderInfo.Title}
                                            {@const href = note.ThreadFolderInfo.href}
                                            {#if title && href}
                                                <a {href} use:link class="text-xs" on:click|stopPropagation>{ext(title)}</a>
                                            {/if}
                                        {/if}
                                        
                                    {/if}

                                    <!--button 
                                        on:click={(e) => show_post_menu(e, note)} class="{button_enabled_colors}"
                                        title={i18n({en: 'Show post menu', es: 'Mostrar el menú de la publicación', pl: 'Pokaż menu wpisu'})}>
                                        <Ricon icon='ellipsis-vertical' s/>
                                    </button-->
                                </div>
                                
                            </div>

                            {#if (details_visibility & DV_SHOW_TITLE) && note.Title}
                                <h2 class="mt-5">{note.Title}</h2>
                            {/if}

                            {#if (details_visibility & DV_SHOW_SUMMARY) && note.Summary}
                                <p  class="lead">{note.Summary}</p>
                            {/if}

                            <!--div class="post-preview"-->
                                <Editor     class=""
                                            value={truncate_html(note.Content, 300)} 
                                            readOnly compact
                                            />
                            <!--/div-->
                            
                            {#if note["Note/Files"] }
                                {@const files = note["Note/Files"]}
                                {#if files && files.length > 0}
                                    <div class="w-full flex flex-row flex-wrap gap-2 text-sm">
                                        {#each files as file}
                                            <button class="flex flex-row gap-1 items-center px-1 {button_enabled_colors}"
                                                    on:click|stopPropagation={(e) => download_file_from_href(file.href, file.Title)}>
                                                <Ricon icon="file-archive" s/>
                                                <span>
                                                    {file.Title}
                                                </span>
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            {/if}

                            

                            <!-- original post hint -->
                            {#if is_comment}
                                {@const is_draf_comment = is_draft && note.DraftCommentThreadInfo}
                                {@const draf_comment_thread = is_draf_comment ? note.DraftCommentThreadInfo : null}
                                {@const inNotes = note["Note/InNotes"]}
                                {@const comment_thread = (inNotes && inNotes.length > 0) ? inNotes[0] : null}
                                {@const thread = is_draf_comment ? draf_comment_thread : comment_thread}
                                
                                {#if thread}
                                    {@const thread_href = is_draf_comment ? thread.href : thread.InHRef}
                                    {@const thread_author = is_draf_comment ? thread.ModifiedByName : thread["InNote/CreatedBy"]?.Name}
                                    {@const thread_date = is_draf_comment ? thread.ModificationDate : thread.InModificationDate}
                                    {@const thread_title = is_draf_comment ? thread.Title : thread.InTitle}
                                    {@const thread_content = is_draf_comment ? thread.Content :thread.InContent }

                                    <section
                                        class="ml-5 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 text-xs">
                                        <!--a href={thread_href} use:link class="font-normal text-zinc-700 dark:text-zinc-300" on:click|stopPropagation-->
                                            <h4 class="">
                                                {thread_author}
                                                <span class="ml-5 font-normal">
                                                    {getNiceStringDateTime(thread_date)}
                                                </span>
                                            </h4>
                                            <p class="text-xs post-preview">
                                                {#if thread_title}
                                                    {thread_title}
                                                {:else}
                                                    {@html thread_content}
                                                {/if}
                                            </p>
                                        <!--/a-->
                                    </section>
                                {/if}
                            {/if}

                            <div class="mt-8 w-full flex flex-row flex-wrap justify-end gap-10">
                                <!--button disabled class="flex flex-row gap-1 items-center px-1 {button_disabled_colors}">
                                    <Ricon icon='thumbs-up' s/>
                                    <span>15</span>
                                </button-->

                                {#if is_draft}
                                    <button class="ml-auto p-2 {button_colors(false)}
                                        rounded-full border border-stone-300 dark:border-stone-600"
                                        title={i18n({ en:'Finish the post', es: 'Terminar la entrada',  pl: 'Dokończ wpis'})}
                                        on:click|stopPropagation={(e) => finish_post(note)}>
                                        <Ricon icon='send' s/>
                                    </button>
                                {:else if !is_comment && note.NotesCount > 0}
                                    <button class="flex flex-row gap-1 items-center px-1 {button_enabled_colors}"
                                            title={i18n({en: 'Show comments', es: 'Mostrar comentarios', pl: 'Pokaż komentarze'})}
                                            on:click|stopPropagation={(e) => push(note.href + "?action=showfirstsubnote")}>
                                        <Ricon icon='messages-square' s/>
                                        <span>{note.NotesCount}</span>
                                    </button>
                                {/if}
                            </div>

                        </section>

                        {#if !is_last}
                            <hr/>
                        {/if}
                    {/if}
                {/each}
            {:else}
                <p class="text-center text-zinc-600 dark:text-zinc-400">_; There's nothing here; Aquí no hay nada; Nic tu nie ma</p>
            {/if}

        </Paper>

    </Page>
    {/key}
{:else}
    {#if failed_message}
        <Paper>
            <PaperHeader></PaperHeader>
            <h3>_; Error; Error; Błąd</h3>
            <p>{failed_message}</p>
        </Paper>
        
    {:else}
        <Spinner delay={3000}/>
    {/if}
{/if}


<FolderProperties bind:this={folder_properties_dialog} />

<FinishPostDialog bind:this={finish_post_dialog} on_refresh={on_refresh_after_finish_post}/>

<style>
 
 .post-preview {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.editable-placeholder:empty::before {
  content: attr(data-placeholder);
  white-space: pre-wrap;
  color: #52525b; /* zinc-600 */
  pointer-events: none;
  cursor: text;
}


:global(.dark) .editable-placeholder:empty::before {
  color: #a1a1aa;
}

.text-body {
        color: var(--tw-prose-body);
    }

:global(.dark) .text-body {
    color: var(--tw-prose-invert-body);
}

</style>