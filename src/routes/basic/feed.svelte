<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner,
                Page,
                Editable,
                mainContentPageReloader, refreshToolbarOperations, reloadPageToolbarOperations,
                i18n, ext,
                Breadcrumb,
                Paper, PaperHeader, openInNewTab, copyAddress,
				focusEditable, showMenu, Ricon, get_main_object_fetch_error_description, 
                Editor, getNiceStringDateTime, download_file_from_href, truncate_html, sleep} from '$lib'
    import {onMount} from 'svelte'
    import {location, pop, push, querystring, link} from 'svelte-spa-router'
    import {cache} from './cache.js'
    import FolderProperties from './properties.folder.svelte'
    import {NK_COMMENT, NS_UNAPPROVED, NS_CONFIDENTIAL} from './consts.js'
    
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

    
    $: on_params_changed($location, $querystring, $mainContentPageReloader, $session);

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
        case 'unapprovedposts':
            contextNavigation = "group/UnapprovedPosts";
            cacheKey = "group_UnapprovedPosts";
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
                        Expressions:['Id', '$ref', 'Title', 'Summary', 'Content', 'Order', 'State', 'NotesCount', 'Kind', 'ModificationDate', 'href', 'icon', 'IsInBasket', 'IsCanonical', 'NoteId', 'ThreadFolderInfo', '$type', '$ver'],
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
        return reef.post('user/MyDraftPosts/query', {
            Id: 1, Name: 'not published posts', ExpandLevel: 16,
            Tree: [
                {
                    Id: 1,
                    Association: 'Notes',
                    Filter: parent_folder_id ? `Kind=NK_THREAD and Note/IsDraftThreadInCategory(${parent_folder_id})` : '',
                    Expressions: ['Id', '$ref', 'Title', 'Summary', 'Content', 'Kind', 'href', '$type', 'ModificationDate', 'DraftThreadCategoryFolderInfo', 'DraftCommentThreadInfo', '$ver'],
                    Sort: "-ModificationDate",
                    SubTree: [
                        {
                            Id: 10,
                            Association: 'Note/Files',
                            Expressions: ["$ref", "Title", "Summary", "href", "icon", "$type"]
                        }
                    ]
                    
                }
            ]
        }) 

       
    }

    function setup_data_after_fetch(context_item, draft_posts)
    {
        let result = null
        if(context_item)
            result = context_item.Folder
           
        if(draft_posts && draft_posts.FolderNote && draft_posts.FolderNote.length > 0)
        {
            working_posts = draft_posts.FolderNote
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
        if(contextItem.Folders)
            contextItem.all_elements = [...contextItem.all_elements, ...contextItem.Folders]

        if(contextItem.Notes)
            contextItem.all_elements = [...contextItem.all_elements, ...contextItem.Notes]

        if(contextItem.Tasks)
            contextItem.all_elements = [...contextItem.all_elements, ...contextItem.Tasks]

        if(contextItem.Files)
            contextItem.all_elements = [...contextItem.all_elements, ...contextItem.Files]

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


    function show_working_post_menu(e, working_post)
    {
        e.stopPropagation()

        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        let rect = owner.getBoundingClientRect()
        showMenu(rect, [
            {
                caption: '_; Finish the post; Terminar la entrada; Dokończ wpis',
                action: (f) => push(working_post.href),
                mricon: 'arrow-right'
            },
            {
                caption: '_; Send; Enviar; Wyślij',
                mricon: 'upload',
                menu: [
                    /*    {
                            caption: '_; Copy; Copiar; Kopiuj',
                            action: (f) => copy_note_to_basket(postLink),
                        },
                    */    {
                            caption: '_; Open in a new tab; Abrir en una nueva pestaña; Otwórz w nowej karcie',
                            action: () => openInNewTab(working_post.href)
                        },
                        {
                            caption: '_; Copy the address; Copiar la dirección; Skopuj adres',
                            action: () => copyAddress(working_post.href)
                        }

                    ]
            },
            {
                separator: true
            },
            {
                caption: '_; Delete; Eliminar; Usuń',
                action: () => delete_working_post(working_post)
            }
        ])
    }
 

    function show_post_menu(e, postLink)
    {
        e.stopPropagation()

        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        let rect = owner.getBoundingClientRect()
        showMenu(rect, [
            {
                caption: '_; Show post; Mostrar entrada; Pokaż wpis',
                action: (f) => push(postLink.href),
                mricon: 'file-search-corner'
            },
            {
                caption: '_; Send; Enviar; Wyślij',
                mricon: 'upload',
                menu: [
                        {
                            caption: '_; Copy; Copiar; Kopiuj',
                            action: (f) => copy_note_to_basket(postLink),
                        },
                        {
                            caption: '_; Open in a new tab; Abrir en una nueva pestaña; Otwórz w nowej karcie',
                            action: () => openInNewTab(postLink.href)
                        },
                        {
                            caption: '_; Copy the address; Copiar la dirección; Skopuj adres',
                            action: () => copyAddress(postLink.href)
                        }

                    ]
            },
            ... ((details_visibility & DV_ADD_FOLLOW_CATEGORY_OPERATIONS) > 0 && (postLink.ThreadFolderInfo)) ? [
                {
                    separator: true
                },
                ... postLink.ThreadFolderInfo.IsSubscribed ? [{
                    caption: '_; Unfollow this category; Dejar de seguir esta categoría; Przestań obserwować tę kategorię',
                    mricon: 'eye-off',
                    action: () => toggle_subscribe_category(postLink.ThreadFolderInfo)
                }] : [{
                    caption: '_; Follow this category; Sigue esta categoría; Obserwuj tę kategorię',
                    mricon: 'eye',
                    action: () => toggle_subscribe_category(postLink.ThreadFolderInfo)
                }] ]
                : []
        ])
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


    let new_message_content = '';
    let new_message_confidential = false;
    let new_message_element

    function on_new_message_key_down(e)
    {
        if (event.key === 'Enter') 
        {
            event.preventDefault();
            document.execCommand('insertLineBreak');
        }
    }

    let working_post_creating = false
    let working_post_spinner = ''

    const MWN_NOTHING = 0
    const MWN_FOCUS_CONTENT_END = 1
    const MWN_FOCUS_CONTENT_ALL = 2
    const MWN_INSERT_ATTACHEMENT = 3

    async function make_working_post(e, action_after_redirecting, spinner)
    {
        const clean_content = new_message_content.replace(/&nbsp;/g, ' ').trim();
        if(!clean_content)
            return;

        const lines = clean_content.split(/<br\s*[\/]?>/gi);

        const parsed_title = lines[0]?.trim() || '';
        const parsed_content = lines.slice(1).join('<br>').trim();

        ///////////////////////////////


        working_post_creating = true
        working_post_spinner = spinner


        //await sleep(2000)

        const res = await reef.post('user/NewDraftThread', {
            title: parsed_title,
            summary: '',
            content: parsed_content ? `<p>${parsed_content}</p>` : '',
            category: details_visibility & DV_CONTEXTUAL_VIEW ? contextItem.$ref : null,
            confidential: new_message_confidential
        })

        if(res && res.Note)
        {
            let href = await reef.get(`${res.Note.$ref}/href`)
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

                push(href)
            }
        }

        working_post_spinner = ''
        working_post_creating = false
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
                <!--h3 class="ml-2">Ask about TILOS</h3-->
                <section class="not-prose
                            min-h-20 w-full
                            border border-stone-300 dark:border-stone-600 rounded-lg p-2
                            bg-stone-50 dark:bg-stone-800">

                    <p   class="w-full min-h-50 bg-stone-50 dark:bg-stone-800 outline-none
                                overflow-x-clip text-wrap break-words overscroll-contain
                                editable-placeholder"
                                bind:innerHTML={new_message_content}
                                bind:this={new_message_element}
                                on:keydown={on_new_message_key_down}
                                contenteditable="true"
                                data-placeholder={i18n({
                                    en: 'Enter the title of your new post...\nStart writing about your problem or idea...',
                                    es: 'Escribe el título de la nueva entrada...\nEmpieza a escribir sobre tu problema o idea...',
                                    pl: 'Wpisz tytuł nowego wpisu...\nZacznij opisywać problem lub pomysł...'
                                })}
                                >
                        </p>

                    <div class="mt-2 w-full flex flex-row gap-4 items-center">
                        <button class="flex flex-row gap-1 items-center px-1 {button_colors(working_post_creating)}"
                            title={i18n({ en:'Add an attachment', es: 'Añadir un archivo adjunto',  pl: 'Dodaj załącznik'})}
                            on:click={(e) => make_working_post(e, MWN_INSERT_ATTACHEMENT, 'att')}
                            disabled={working_post_creating}>
                            {#if working_post_spinner!='att'}
                                <Ricon icon='plus' s/>
                            {:else}
                                <Ricon icon='loader-circle' s/>
                            {/if}
                        </button>

                        <button class="flex flex-row gap-1 items-center px-1 {button_colors(working_post_creating)}"
                            title={i18n({ en:'Format', es: 'Formato',  pl: 'Formatuj'})}
                            on:click={(e) => make_working_post(e, MWN_FOCUS_CONTENT_END, 'format')}
                            disabled={working_post_creating}>
                            {#if working_post_spinner != 'format'}
                                <Ricon icon='case-sensitive' stroke=1/>
                            {:else}
                                <Ricon icon='loader-circle' s/>
                            {/if}
                        </button>

                        {#if 1}
                        {@const hint = i18n({en: 'Check this option to make the post visible only to TILOS developers', es: 'Marca esta opción para que la publicación solo sea visible para los desarrolladores de TILOS.', pl: 'Zaznacz tę opcję, aby wpis był widoczny wyłącznie dla programistów TILOS'})}
                        <div class="flex items-center gap-1.5">
                            <input  type="checkbox" 
                                    id="confidential" 
                                    bind:checked={new_message_confidential}
                                    data-class="accent-stone-600 dark:accent-stone-400 h-4 w-4 cursor-pointer"
                                    class="appearance-none h-4 w-4 rounded border 
                                        border-stone-300 hover:border-stone-400 checked:border-stone-600
                                        bg-white hover:bg-stone-50 checked:bg-stone-600 checked:hover:bg-stone-700
                                        dark:border-stone-600 dark:hover:border-stone-500 dark:checked:border-stone-500
                                        dark:bg-stone-800 dark:hover:bg-stone-700 dark:checked:bg-stone-600 dark:checked:hover:bg-stone-500

                                        cursor-pointer 
                                        relative checked:after:content-['✓'] checked:after:text-white checked:after:text-xs checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center"
                                    title={hint}/>

                            <label for="confidential" class="text-sm text-stone-700 dark:text-stone-300 cursor-pointer select-none"
                                    title={hint}>
                                _; Confidential; Confidencial; Poufne
                            </label>
                        </div>
                        {/if}

                        <button class="ml-auto flex flex-row gap-1 items-center pl-3 pr-2 {button_colors(working_post_creating)}
                            rounded-full border border-stone-300 dark:border-stone-600"
                            on:click={(e) => make_working_post(e, MWN_FOCUS_CONTENT_END, 'finish')}
                            disabled={working_post_creating}>
                            <span>_; Finish the post; Terminar la entrada; Dokończ wpis</span>
                            {#if working_post_spinner!='finish'}
                                <Ricon icon='arrow-right' s/>
                            {:else}
                                <Ricon icon='loader-circle' s/>
                            {/if}
                        </button>

                    </div>
                    
                </section>
            {/if}

            {#if working_posts && working_posts.length > 0}
                <!--section class="mt-8 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-stone-100/50 dark:bg-stone-900/40 p-5"-->
                <section class="mt-8 mb-12 
                                border-l-2 border-stone-300/80 dark:border-stone-700/80
                                bg-stone-50 dark:bg-stone-800/40
                                pl-5 pr-2 py-3 rounded-r-lg">
                    <h4 class=" mt-0 pb-3 
                                border-b border-stone-300/80 dark:border-stone-700/80
                                flex flex-row items-center gap-2">
                    <!--h4 class=" mt-0 pb-2 mb-6 
                                flex flex-row items-center gap-2"-->
                        <Ricon icon="square-pen" s/>
                        _; My Draft Posts; Mis borradores de entradas; Moje szkice wpisów
                        <span class="text-body font-normal">({working_posts.length})</span>
                        <span class="ml-auto text-xs text-body font-normal">
                            _; Visible only to you; Visible solo para ti; Widoczne tylko dla Ciebie
                        </span>
                    </h4>
                    
                    {#each working_posts as note, idx (note.$ref)}
                        {@const is_first = idx == 0}
                        {@const is_last = idx == working_posts.length-1}
                        {@const is_comment = note.Kind==NK_COMMENT}
                        <section>
                            <div class="w-full flex flex-row flex-wrap justify-between">
                                <p class="text-xs">
                                    <span>_; Edited; Editado; Edytowany</span>
                                    <span>
                                        {getNiceStringDateTime(note.ModificationDate)}
                                    </span>
                                </p>

                                <div class="flex flex-row items-center gap-2">
                                    {#if (details_visibility & DV_SHOW_CATEGORY) && note.DraftThreadCategoryFolderInfo}
                                        {@const title = note.DraftThreadCategoryFolderInfo.Title}
                                        {@const href = note.DraftThreadCategoryFolderInfo.href}
                                        {#if title && href}
                                            <a {href} use:link class="text-xs">{title}</a>
                                        {/if}
                                    {/if}

                                    <button 
                                        on:click={(e) => show_working_post_menu(e, note)} class="{button_enabled_colors}"
                                        title={i18n({en: 'Show post menu', es: 'Mostrar el menú de la publicación', pl: 'Pokaż menu wpisu'})}>
                                        <Ricon icon='ellipsis-vertical' s/>
                                    </button>
                                </div>
                                
                            </div>

                            {#if (details_visibility & DV_SHOW_TITLE) && note.Title}
                                <h2 class="mt-5">{note.Title}</h2>
                            {/if}

                            {#if (details_visibility & DV_SHOW_SUMMARY) && note.Summary}
                                <p  class="lead">{note.Summary}</p>
                            {/if}

                            <Editor     class=""
                                        value={truncate_html(note.Content, 300)} 
                                        readOnly compact
                                        on:click={(e) => e.stopPropagation()}/>

                            {#if note["Note/Files"] }
                                {@const files = note["Note/Files"]}
                                {#if files && files.length > 0}
                                    <div class="w-full flex flex-row flex-wrap gap-2 text-sm">
                                        {#each files as file}
                                            <button class="flex flex-row gap-1 items-center px-1 {button_enabled_colors}"
                                                    on:click={download_file_from_href(file.href, file.Title)}>
                                                <Ricon icon="file-archive" s/>
                                                <span>
                                                    {file.Title}
                                                </span>
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            {/if}

                            {#if is_comment && note.DraftCommentThreadInfo}
                                {@const thread = note.DraftCommentThreadInfo}
                                {#if thread}
                                    <section
                                        class="ml-5 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 text-xs">
                                        <a href={thread.href} use:link class="font-normal text-zinc-700 dark:text-zinc-300">
                                            <h4 class="">
                                                {thread.ModifiedByName}
                                                <span class="ml-5 font-normal">
                                                    {getNiceStringDateTime(thread.ModificationDate)}
                                                </span>
                                            </h4>
                                            <p class="text-xs post-preview">
                                                {#if thread.Title}
                                                    {thread.Title}
                                                {:else}
                                                    {@html thread.Content}
                                                {/if}
                                            </p>
                                        </a>
                                    </section>
                                {/if}
                            {/if}

                            <div class="mt-8 w-full flex flex-row flex-wrap">
                                <div></div>

                                <button class="ml-auto flex flex-row gap-1 items-center px-1 {button_enabled_colors}"
                                        on:click={push(note.href)}>
                                    <span>_; Finish the post; Terminar la entrada; Dokończ wpis</span>
                                    <Ricon icon='arrow-right' s/>
                                </button>
                            </div>
                        

                        {#if !is_last}
                            <hr/>
                        {/if}
                        
                        </section>
                    {/each}
                </section>
            {/if}

            <div class="mt-12"></div>

            {#if contextItem.all_elements && contextItem.all_elements.length > 0}
            
                {#each contextItem.all_elements as note, idx (note.$ref)}
                    {@const is_first = idx == 0}
                    {@const is_last = idx == contextItem.all_elements.length-1}
                    {@const is_comment = note.Kind==NK_COMMENT}
                    {@const comment_padding = is_comment ? "" : ""}

                    

                    <section class="{comment_padding}">
                        
                        <div class="w-full flex flex-row flex-wrap justify-between">
                            <div class="flex flex-row gap-5 items-center">
                                <div class="grow-0">
                                    {#if note["Note/CreatedBy"]}
                                        {@const author = note["Note/CreatedBy"]}
                                        {@const href = `${author.href}`}
                                        <a {href} use:link> {author.Name} </a>
                                    {/if}
                                </div>

                                <div class="text-sm">
                                    {getNiceStringDateTime(note.ModificationDate)}
                                </div>
                            </div>

                            <div class="flex flex-row items-center gap-2">
                                {#if note.State == NS_CONFIDENTIAL}
                                    <span title={i18n({en: 'Confidential', es: 'Confidencial', pl: 'Poufne'})}>
                                        <Ricon icon='globe-off' s/>
                                    </span>
                                {/if}

                                {#if (details_visibility & DV_SHOW_CATEGORY)}
                                    {#if note.ThreadFolderInfo}
                                        {@const title = note.ThreadFolderInfo.Title}
                                        {@const href = note.ThreadFolderInfo.href}
                                        {#if title && href}
                                            <a {href} use:link class="text-xs">{title}</a>
                                        {/if}
                                    {:else}
                                        {#if note.State == NS_UNAPPROVED}
                                            <span class="text-xs">
                                                _; Pending approval; A la espera de aprobación; Oczekuje na zatwierdzenie
                                            </span>
                                        {/if}
                                    {/if}
                                {/if}

                                <button 
                                    on:click={(e) => show_post_menu(e, note)} class="{button_enabled_colors}"
                                    title={i18n({en: 'Show post menu', es: 'Mostrar el menú de la publicación', pl: 'Pokaż menu wpisu'})}>
                                    <Ricon icon='ellipsis-vertical' s/>
                                </button>
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
                                        on:click={(e) => e.stopPropagation()}/>
                        <!--/div-->
                        
                        {#if note["Note/Files"] }
                            {@const files = note["Note/Files"]}
                            {#if files && files.length > 0}
                                <div class="w-full flex flex-row flex-wrap gap-2 text-sm">
                                    {#each files as file}
                                        <button class="flex flex-row gap-1 items-center px-1 {button_enabled_colors}"
                                                on:click={download_file_from_href(file.href, file.Title)}>
                                            <Ricon icon="file-archive" s/>
                                            <span>
                                                {file.Title}
                                            </span>
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        {/if}

                        </section>

                        <!-- original post hint -->
                        {#if is_comment}
                            {@const inNotes = note["Note/InNotes"]}
                            {@const thread = (inNotes && inNotes.length > 0) ? inNotes[0] : null}
                            {@const author = thread ? thread["InNote/CreatedBy"] : null}
                            {#if thread && author}
                                <section
                                    class="ml-5 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 text-xs">
                                    <a href={thread.InHRef} use:link class="font-normal text-zinc-700 dark:text-zinc-300">
                                        <h4 class="">
                                            {author.Name}
                                            <span class="ml-5 font-normal">
                                                {getNiceStringDateTime(thread.InModificationDate)}
                                            </span>
                                        </h4>
                                        <p class="text-xs post-preview">
                                            {#if thread.InTitle}
                                                {thread.InTitle}
                                            {:else}
                                                {@html thread.InContent}
                                            {/if}
                                        </p>
                                    </a>
                                </section>
                            {/if}
                        {/if}

                        <div class="mt-8 w-full flex flex-row flex-wrap justify-end gap-10">
                            <!--button disabled class="flex flex-row gap-1 items-center px-1 {button_disabled_colors}">
                                <Ricon icon='thumbs-up' s/>
                                <span>15</span>
                            </button-->

                            {#if !is_comment}
                                <button class="flex flex-row gap-1 items-center px-1 {button_enabled_colors}"
                                        on:click={push(note.href + "?action=showfirstsubnote")}>
                                    <Ricon icon='messages-square' s/>
                                    <span>{note.NotesCount}</span>
                                </button>
                            {:else}
                                <div></div>
                            {/if}

                            <button class="flex flex-row gap-1 items-center px-1 {button_enabled_colors}"
                                    on:click={push(note.href)}>
                                <Ricon icon='message-square-more' s/>
                                <span>_; Show post; Mostrar entrada; Pokaż wpis</span>
                            </button>
                        </div>
                    

                    {#if !is_last}
                        <hr/>
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