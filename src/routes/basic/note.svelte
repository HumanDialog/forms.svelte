<script>
    import {reef, session, signInHRef} from '@humandialog/auth.svelte'
	import  { Editor,
            Page,
            Combo,
            ComboSource,
            ComboItem,
            DatePicker,
            Tags,
            editable,
            Editable,
            REdit,
			activateItem,
			isActive,
			clearActiveItem,
			isDeviceSmallerThan,
            onErrorShowAlert,
            Modal,
			Spinner,
            resizeImage,
            reloadVisibleTags,
			getNiceStringDate,
            IcH1, IcH2, IcH3, IcH4,
            informModification,
            setjItemProperty,
			pushChanges,
            hasModifications,
            refreshToolbarOperations,
            Breadcrumb, i18n, UI,
			showFloatingToolbar,
			randomString,
            showMenu,
            SHOW_MENU_BELOW,
            ext, mainContentPageReloader,
            List, ListTitle, ListSummary, ListInserter, Icon, Ricon,
            reloadPageToolbarOperations, Paper, PaperHeader, focusEditable, openInNewTab, copyAddress,
            get_main_object_fetch_error_description,
			getNiceStringDateTime,
            get_acc_icon, get_acc_color,
            } from '$lib'
	import { afterUpdate, tick } from 'svelte';

    import {location, querystring, push, link} from 'svelte-spa-router'

    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo, FaSave, FaCloudUploadAlt, FaFont, FaPen, FaList, FaUpload, FaFile,
        FaImage, FaTable, FaPaperclip, FaBold, FaItalic, FaUnderline, FaStrikethrough, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle,
        FaInfo, FaListUl, FaLink, FaRegFolder, FaRegCalendar, FaRegCalendarCheck, FaRegFile, FaDownload, FaTrash, FaExternalLinkSquareAlt,
        FaCaretUp, FaCaretDown
    } from 'svelte-icons/fa/'


    import AttachedFile from './attached.file.svelte'
    import BasketPreview from './basket.preview.svelte'
    import PopupExplorer from './popup.explorer.svelte'
    import {fetchComposedClipboard4Editor, fetchComposedClipboard4Note, transformClipboardToJSONReferences, pushBrowserRecentElements, setBrowserRecentElement, getBrowserRecentElements, getBrowserRecentElements4Note} from './basket.utils'
    import {getElementIcon} from './icons'
    import { STATUS_ACTIVE, STATUS_ARCHIVED, STATUS_DELETED, 
        NK_DOCUMENT, NK_THREAD, NK_COMMENT,
        NS_DRAFT, NS_CONFIDENTIAL, NS_PUBLISHED, NS_PUBLIC, NF_WILL_CONFIDENTIAL, NR_COMMENT, NS_UNAPPROVED} from './consts';
    
    import FileProperties from './properties.file.svelte'
	import NoteProperties from './properties.note.svelte'

    let noteRef = ''
    let note = null;
    let activeNote = null
    let activeNoteRef = ''
    
    let noteId = 0
    let allTags = '';

    let availableStates = [];
    let pendingUploading = false;
    let isReadOnly = false;
    let canBeEditable = false
    const s = session;
    let creationDate = null
    let modificationDate = null
    let attachedFiles = []
    
    let isThread = false
    let failed_message = ''
    let acc_icon                = 'minus'
    let acc_color               = 'text-stone-500'

    let action_after_shown      = ''
    let action_arg1             = ''
    let action_arg2             = ''
    let action_arg3             = ''


    const DF_SHOW_TITLE_PLACEHOLDER                 = 0x00000001
    const DF_DISABLE_HEADINGS                       = 0x00000002
    const DF_DISABLE_COMMENTS_HEADINGS              = 0x00000004
    const DF_SHOW_MAIN_NOTE_ATTACHEMENTS_COMPACT    = 0x00000008
    const DF_SHOW_ACTIVE_NOTE_ATTACHEMENTS_LIST     = 0x00000010
    const DF_SHOW_ORIGINAL_AUTHOR                   = 0x00000020
    

    let  display_flags = 0

    $: onParamsChanged($location, $mainContentPageReloader, $querystring)

    async function onParamsChanged(...args)
    {
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'note');
        if(foundIdx < 0)
            return;

        const id = parseInt(segments[segments.length-1])
        noteRef = `./Note/${id}`

        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags = res
            reloadVisibleTags()
        })

        const params = new URLSearchParams($querystring);
        if(params.has("action"))
        {
            action_after_shown = params.get("action")
            action_arg1 = params.has("arg1") ? params.get("arg1") : ''
            action_arg2 = params.has("arg2") ? params.get("arg2") : ''
            action_arg3 = params.has("arg3") ? params.get("arg3") : ''
            
        }
        else
            action_after_shown = ''

        // turn off read-only mode by default.
        //isReadOnly = true;

       await reloadData();
       noteId = id
       if(note)
       {
            acc_icon = get_acc_icon(note.AccCode)
            acc_color = get_acc_color(note.AccCode)
            pushBrowserRecentElements( note.Id, note.$type, note.$ref, note.Title, note.Summary, "file-text", note.href)

            // na pewno?
            if(activeNote != note)
            {
                action_after_shown = 'focuslastsubnote'
            }
        }
    }

    afterUpdate( () => {

        if(note && action_after_shown)
        {
            switch(action_after_shown)
            {
            case 'showsubnote':
                {
                    let scroll_to_id = action_arg1
                    if(scroll_to_id)
                    {
                        if(scroll_to_id.startsWith('#'))
                            scroll_to_id = scroll_to_id.substr(1)
                        
                        let scroll_element = document.getElementById(scroll_to_id)
                        if(scroll_element)
                            scroll_element.scrollIntoView({behavior: "smooth"})
                    }
                }
                break;

            case 'showfirstsubnote':
                {
                    const arr = document.getElementsByClassName("first-comment")
                    if(arr && arr.length > 0)
                    {
                        const scroll_element = arr[0]   
                        if(scroll_element)
                            scroll_element.scrollIntoView({behavior: "smooth"})
                    }
                    
                }
                break;

            case 'focuscontent':
                {
                    let pos = action_arg1
                    if(!pos)
                        pos = 'end'
                    description.setCursorPos(pos)
                }
                break;

            case 'focuslastsubnote':
                {
                    focus_last_sub_note()
                }
                break;

            case 'insertattachement':
                runFileAttacher()
                break;
            }   

            action_after_shown = ''
        }
    })

    async function reloadData()
    {
        if(!noteRef)
            return;

        failed_message = ''

        let res = await reef.post(`${noteRef}/query`,
                        {
                            Id: 1,
                            Name: "collector",
                            ExpandLevel: 6,
                            Tree:
                            [
                                {
                                    Id: 1,
                                    Association: '',
                                    Expressions:[   'Id',
                                                    'Index',
                                                    'Title',
                                                    'Summary',
                                                    'Content',
                                                    'CreationDate',
                                                    'ModificationDate',
                                                    'Tags',
                                                    'AttachedFiles',
                                                    'Kind',
                                                    'State',
                                                    'Status',
                                                    'AccCode',
                                                    'IsPinned',
                                                    'GetCanonicalPath',
                                                    'Flags',
                                                    '$ref',
                                                    '$type',
                                                    '$acc',
                                                    '$ver',
                                                    'href'],
                                    SubTree:[
                                        {
                                            Id: 11,
                                            Association: 'CreatedBy',
                                            Expressions:['$ref', 'Name', 'href']
                                        },
                                        {
                                            Id: 12,
                                            Association: 'ModifiedBy',
                                            Expressions:['$ref', 'Name', 'href']
                                        },

                                        {
                                            Id: 13,
                                            Association: 'InFolders',
                                            Filter: 'Status=STATUS_ACTIVE',
                                            Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                        },
                                    {
                                            Id: 14,
                                            Association: 'InTasks',
                                            Filter: 'Status=STATUS_ACTIVE',
                                            Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                        },
                                        {
                                            Id: 15,
                                            Association: 'InNotes',
                                            Filter: 'Status=STATUS_ACTIVE',
                                            Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                        },

                                        {
                                            Id: 16,
                                            Association: 'Notes',
                                            Sort: 'Order',
                                            Expressions:['Id', '$ref', 'Title', 'Summary', 'href', 'icon', 'IsCanonical', '$type', 'NoteId', 'Order', 'Role'],
                                            SubTree: [
                                                {
                                                    Id: 161,
                                                    Association: 'Note',
                                                    Recursive: 1
                                                }
                                            ]
                                        },
                                        {
                                            Id: 17,
                                            Association: 'Files',
                                            Sort: 'Order',
                                            Expressions:['Id', '$ref', 'Title', 'Summary', 'href', 'icon', 'IsCanonical', '$type', 'FileId', 'Order']
                                        }
                                    ]
                                }
                            ]
                        },
                        handle_fetch_error)

        note = res.Note

        if(note.CreationDate)
            creationDate = new Date(note.CreationDate)
        else
            creationDate = null

        if(note.ModificationDate)
            modificationDate = new Date(note.ModificationDate)
        else
            modificationDate = null

        isReadOnly = (note.$acc & 0x2) == 0
        canBeEditable = (note.$acc & 0x2) > 0

        isThread = note.Kind == NK_THREAD

        if(note && note.Notes && note.Notes.length > 0)
        {
            for(let idx=0; idx<note.Notes.length; idx++)
            {
                const subNote = note.Notes[idx].Note
                if(subNote.Kind == NK_COMMENT)
                {
                    prepareAttachementsList(subNote)
                    //activeNote = subNote
                }
            }
        }

        display_flags = 0

        if(isThread)
        {
            display_flags |= DF_SHOW_ORIGINAL_AUTHOR
            if(note.State == NS_DRAFT)
                activeNote = note
            else
            {
                //isReadOnly = true
                activeNote = note
                await fetch_working_comment(note.Id)
            }
        }
        else
        {
            activeNote = note
        }

        if(note == activeNote)
        {
            if(isReadOnly)
                display_flags |= DF_SHOW_MAIN_NOTE_ATTACHEMENTS_COMPACT
            else
                display_flags |= DF_SHOW_ACTIVE_NOTE_ATTACHEMENTS_LIST | DF_SHOW_TITLE_PLACEHOLDER;
        }
        else
        {
            display_flags |= DF_SHOW_MAIN_NOTE_ATTACHEMENTS_COMPACT | DF_SHOW_ACTIVE_NOTE_ATTACHEMENTS_LIST
        }

        activeNoteRef = activeNote.$ref

        note.connectedToList = []
        if(note.InFolders)
            note.InFolders.forEach((f) => note.connectedToList.push(f))

        if(note.InTasks)
            note.InTasks.forEach((f) => note.connectedToList.push(f))

        if(note.InNotes)
            note.InNotes.forEach((f) => note.connectedToList.push(f))

        prepareAttachementsList(note)

    }

    function handle_fetch_error(err, res)
    {
        note = null
        failed_message = get_main_object_fetch_error_description(err, res)
    }

    async function fetch_working_comment(main_note_id)
    {
        const res = await reef.post('user/MyDraftPosts/query', {
            Id: 1, Name: 'not published comments', ExpandLevel: 6,
            Tree: [
                {
                    Id: 1,
                    Association: 'Notes',
                    Filter: `Kind=NK_COMMENT and Note/IsDraftCommentInThread(${main_note_id})`,
                    Limit: 1,
                    SubTree: [
                        {
                            Id: 10,
                            Association: 'Note',
                            Expressions:[   'Id',
                                            'Index',
                                            'Title',
                                            'Summary',
                                            'Content',
                                            'CreationDate',
                                            'ModificationDate',
                                            'Tags',
                                            'AttachedFiles',
                                            'Kind',
                                            'State',
                                            'Status',
                                            'AccCode',
                                            'IsPinned',
                                            'Flags',
                                            'GetCanonicalPath',
                                            '$ref',
                                            '$type',
                                            '$acc',
                                            '$ver',
                                            'href'],
                            SubTree: [
                                {
                                            Id: 101,
                                            Association: 'Notes',
                                            Sort: 'Order',
                                            Expressions:['Id', '$ref', 'Title', 'Summary', 'href', 'icon', 'IsCanonical', '$type', 'NoteId', 'Order'],
                                            SubTree: [
                                                {
                                                    Id: 1011,
                                                    Association: 'Note',
                                                    Recursive: 10
                                                }
                                            ]
                                        },
                                        {
                                            Id: 102,
                                            Association: 'Files',
                                            Sort: 'Order',
                                            Expressions:['Id', '$ref', 'Title', 'Summary', 'href', 'icon', 'IsCanonical', '$type', 'FileId', 'Order']
                                        }
                            ]
                        }
                    ]
                }
            ]
        })
        
        if(res && res.FolderNote && res.FolderNote.length > 0)
        {
            const working_info = res.FolderNote[0]
            working_info.Role = NR_COMMENT
            prepareAttachementsList(working_info.Note)

            if(!note.Notes)
                note.Notes = []
            note.Notes.push(working_info)
            activeNote = note.Notes[note.Notes.length - 1].Note
            
        }
    }

    function prepareAttachementsList(noteElement)
    {
        noteElement.attachements = []
        if(noteElement.Notes && noteElement.Notes.length > 0)
        {
            noteElement.Notes.forEach((n) => {
                if(n.Note.Kind != NK_COMMENT)
                {
                    noteElement.attachements.push(n)
                }
            })
        }

        if(noteElement.Files && noteElement.Files.length > 0)
            noteElement.Files.forEach((n) => noteElement.attachements.push(n))

        if(noteElement.attachements && noteElement.attachements.length > 0)
            noteElement.attachements.sort((a,b) => a.Order-b.Order)
    }



    async function onUpdateAllTags(newAllTags)
    {
        allTags  = newAllTags
        await reef.post('group/set', { AllTags: allTags}, onErrorShowAlert)
    }

    async function onTagsChanged(tags)
    {
        note.Tags = tags;
        informModification(note, 'Tags')
        pushChanges(refreshToolbarOperations)
        //await reef.post(`${noteRef}/SetTags`, {val: tags}, onErrorShowAlert)
    }


    let summaryPlaceholder = false;

    let dueDate;
    let dueDatePlaceholder = false


    let createdBy;
    let responsiblePlaceholder = false

    let tags;
    let tagsPlaceholder = false



    let description;
    let threadResponses = [];
    let descriptionPlaceholder = false;



    let addOperations = [
        {
            caption: '_; Summary; Resumen; Podsumowanie',
            action: async (f) =>
                {
                    if(!focusEditable('Summary'))
                    {
                        summaryPlaceholder = true;
                        await tick();
                        focusEditable('Summary')
                    }
                }
        },


        {
            caption: '_; Tag; Etiqueta; Etykieta',
        //    mricon: 'tag',
            action: async (f) => runTagInserter()
        },

        {
            separator: true
        },

    ];

    function getInsertOperations()
    {
        return [
            {
                mricon: 'download',
                caption: '_; Insert; Insertar; Wstaw',
                hideToolbarCaption: true,
                tbr: 'C',
                fab: 'S10',
                menu: [
                    {
                        caption: '_; Paste; Pegar; Wklej',
                        action: pasteRecentClipboardElement4Note
                    },
                    {
                        caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                        action: runPasteBasket4Note
                    },
                    {
                        caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                        action: runPasteBrowserRecent4Note
                    },
                    {
                        caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                        action: runAttachementPopupExplorer4SelectFromFolders
                    },
                    {
                        separator: true
                    },
                    {
                        caption: '_; New note; Nueva nota; Nowa notatka',
                        action: () => runNoteInserter()
                    },
                    {
                        caption: '_; Add file; Añadir archivo; Dodaj plik',
                        action: () => runFileAttacher()
                    }
                ]
            }
        ]
    }

    function get_thread_operations(formatting_tools_enabled=false)
    {
        const submit_post_op = {
            caption: '_; Submit a post; Enviar una entrada; Wyślij wpis',
            mricon: 'send',
            tbr: 'A',
            fab: 'M01',
            action: async () => { await publish_thread(); reloadPageToolbarOperations(getPageOperations()) }
        }

        const is_confidential = (activeNote.Flags & NF_WILL_CONFIDENTIAL) != 0;
        const set_confidential_op = {
            caption: '_; Confidential; Confidencial; Poufne',
            mricon: 'globe-off',
            active: is_confidential,
            tbr: 'A',
            action: () => { set_post_confidential(!is_confidential); 
                            reloadPageToolbarOperations(getPageOperations()) 
                            if(formatting_tools_enabled)
                                reloadPageToolbarOperations(getPageOperationsWithFormattingTools(editorElement), true) }
        }

        const submit_comment_op = {
            caption: '_; Submit a comment; Enviar un comentario; Wyślij komentarz',
            mricon: 'send',
            tbr: 'A',
            fab: 'M01',
            action: async () => { await publish_comment(); reloadPageToolbarOperations(getPageOperations()) }
        }

        const add_comment_op = {
            caption: '_; Leave a comment; Deja un comentario; Skomentuj',
            mricon: 'message-square',
            tbr: 'A',
            fab: 'M01',
            action: () => add_comment()
        }

        const approve_post_op = {
            caption: '_; Approve the post; Aprobar la publicación; Zatwierdź wpis',
            mricon: 'stamp',
            tbr: 'A',
            fab: 'M01',
            action: async (button) => { await approve_post(button); reloadPageToolbarOperations(getPageOperations()) }
        }

        let thread_operations = []
        switch(note.State)
        {
        case NS_DRAFT:
            thread_operations = [submit_post_op, set_confidential_op]
            break;

        case NS_UNAPPROVED:
            if(!isReadOnly)
                thread_operations = [approve_post_op]
            break;

        default:
            if(activeNoteRef == noteRef)
            {
                thread_operations = [add_comment_op]
            }
            else
            {
                switch(activeNote.State)
                {
                case NS_DRAFT:
                    thread_operations = [submit_comment_op]
                    break;

                default:
                    break;
                }
            }
        }

        if((thread_operations.length > 0) && (!formatting_tools_enabled))
            thread_operations = [...thread_operations, {separator: true, tbr: 'A'}]

        return thread_operations
    }

    function getPageOperations()
    {
        const sendOperations = [
                {
                    caption: '_; Copy; Copiar; Kopiuj',
                    action: (f) => copyTaskToBasket(),
                },
                {
                    caption: '_; Copy to folder; Copiar a la carpeta; Kopiuj do folderu',
                    action: (btt, rect) => runPopupExplorer4CopyToFolder(btt, rect, note)
                },
                { separator: true},
                {
                    caption: '_; Open in a new tab; Abrir en una nueva pestaña; Otwórz w nowej karcie',
                    action: () => openInNewTab(note.href)
                },
                {
                    caption: '_; Copy the address; Copiar la dirección; Skopuj adres',
                    action: () => copyAddress(note.href)
                }
        ]

        let operations = []

        if(isThread)
            operations = [...operations, ...get_thread_operations()]            
        
        operations.push(
                {
                    caption: '_; Edit...; Editar...; Edytuj...',
                    mricon: 'pencil',
                    grid: addOperations,
                    disabled: isReadOnly,
                    fab: 'M20',
                    tbr: 'A'
                })



        operations.push(
            {
                caption: '_; Send; Enviar; Wyślij',
                mricon: 'upload',
                hideToolbarCaption: true,
                tbr: 'C',
                fab: 'S00',
                menu: sendOperations
            })

         operations.push(...getInsertOperations())

        if(operations.length > 0)
            operations.push({separator: true})

        operations.push(pinOp())

        operations.push(move_to_archive_op)
        operations.push(move_to_trash_op)

        operations.push({
            caption: '_; Properties; Propiedades; Właściwości',
            action: (btt, rect)=> runElementProperties(btt, rect, note, 'Note')
        })

        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; Note; Nota; Notatka',
                    operations: operations
                }
            ]
        }
    }

    const move_to_archive_op = {
        caption: '_; Archive; Archivar; Archiwizuj',
        action: () => move_to_archive(),
        disabledFunc: () => note ? note.Status != STATUS_ACTIVE : false
    }


    const move_to_trash_op = {
        caption: '_; Delete; Eliminar; Usuń',
        action: () => move_to_trash(),
        disabledFunc: () => note ? note.Status == STATUS_DELETED : false
    }

    async function move_to_archive()
    {
        await reef.get(`${note.$ref}/MoveMeToArchive`)
        await reloadData();
    }

    async function move_to_trash()
    {
        await reef.get(`${note.$ref}/MoveMeToTrash`)
        await reloadData();
    }


    function pinOp()
    {
        let pinOperation;
        if(note.IsPinned)
        {
            pinOperation = {
                caption: '_; Unpin note; Desenganchar la nota; Odepnij notatkę',
                //icon: FaStar, //aRegShareSquare, //
                action: async (f) => {
                    await toggleNotePinned(note);
                    // refreshing operations
                    activateItem('data', note, getPageOperations());
                    if(UI.navigator)
                        UI.navigator.refresh()
                    }
            }
        }
        else
        {
            pinOperation = {
                caption: '_; Pin note; Fijar nota; Przypnij notatkę',
                //icon: FaRegStar, //aRegShareSquare, //
                action: async (f) => {
                    await toggleNotePinned(note);
                    // refreshing operations
                    activateItem('data', note, getPageOperations());
                    if(UI.navigator)
                        UI.navigator.refresh()
                }
            }
        }
        return pinOperation;
    }

    function enableEditing()
    {
        isReadOnly = !canBeEditable
        if(!isReadOnly)
        {
            reloadPageToolbarOperations(getPageOperations())
        }
    }

    async function runPasteBasket4Note(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4Note()

        showFloatingToolbar(aroundRect, BasketPreview,
            {
                destinationContainer: activeNote?.$ref,
                onRefreshView: async (f) => await reloadWithAttachements(),
                clipboardElements: clipboardElements,
                ownCloseButton: true
            }
        )
    }

    async function pasteRecentClipboardElement4Note(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4Note()
        if(clipboardElements && clipboardElements.length > 0)
        {
            const references = transformClipboardToJSONReferences([clipboardElements[0]])
            const res = await reef.post(`${activeNote?.$ref}/AttachClipboard`, { references: references }, onErrorShowAlert)
            if(res)
                await reloadWithAttachements();

        }
    }

    async function runPasteBrowserRecent4Note(btt, aroundRect)
    {
        const clipboardElements = getBrowserRecentElements4Note()
        showFloatingToolbar(aroundRect, BasketPreview, {
            destinationContainer: activeNote?.$ref,
            onRefreshView: async (f) => await reloadWithAttachements(),
            clipboardElements: clipboardElements,
            browserBasedClipboard: true,
            ownCloseButton: true
        })
    }

    async function runAttachementPopupExplorer4SelectFromFolders(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            rootFilter: 'FOLDERS',
            leafFilter: ['Note', 'File'],
            destinationContainer: activeNote?.$ref,
            onRefreshView: async (f) => await reloadWithAttachements(),
            ownCloseButton: true
        })
    }


    async function runPopupExplorer4CopyToFolder(btt, aroundRect, element)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            attachToContainer: true,
            rootFilter: 'FOLDERS',
            onAttach: async (tmp, references) => {
                await reef.post(`${element.$ref}/AttachMeTo`, { references: references }, onErrorShowAlert)
                await reloadData();
                connectedToComponent?.reload(note, connectedToComponent.CLEAR_SELECTION);
            },
            ownCloseButton: true
        })
    }

    async function reloadWithAttachements()
    {
        await reloadData();
        attachementsComponent?.reload(activeNote, attachementsComponent.CLEAR_SELECTION);
        //attachementsFilesComponent?.reload(note, attachementsFilesComponent.CLEAR_SELECTION);
    }

    async function toggleNotePinned(note)
    {
        let res = await reef.post(`${note.$ref}/TogglePinned`, {}, onErrorShowAlert)
        if(res)
        {
            note.IsPinned = true
        }
        else
        {
            note.IsPinned = false
        }
    }

    async function copyTaskToBasket()
    {
        await reef.post(`${noteRef}/CopyToBasket`, { } , onErrorShowAlert);
    }



    function getPageOperationsWithFormattingTools(editorElement)
    {
        let headings = [
            {
                    caption: '_; Heading 1; Título 1; Nagłówek 1',
                    mricon: 'heading-1',
                    tbr: 'A',
                    hideToolbarCaption: true,
                    action: (f) => editorElement.setHeading(1),
                    activeFunc: editorElement.isActiveH1
                },
                {
                    caption: '_; Heading 2; Título 2; Nagłówek 2',
                    mricon: 'heading-2',
                    tbr: 'A',hideToolbarCaption: true,
                    action: (f) => editorElement.setHeading(2),
                    activeFunc: editorElement.isActiveH2
                },
                {
                    caption: '_; Heading 3; Título 3; Nagłówek 3',
                    mricon: 'heading-3',
                    tbr: 'A',hideToolbarCaption: true,
                    action: (f) => editorElement.setHeading(3),
                    activeFunc: editorElement.isActiveH3
                },
                {
                    caption: '_; Heading 4; Título 4; Nagłówek 4',
                    mricon: 'heading-4',
                    tbr: 'A',hideToolbarCaption: true,
                    action: (f) => editorElement.setHeading(4),
                    activeFunc: editorElement.isActiveH4
                }
        ]

        let publish_operations = []
    
        if(isThread)
        {
            publish_operations = [{
                caption: '_; Note; Nota; Notatka',
                preAction: editorElement.preventBlur,
                operations: get_thread_operations(true)
            }]
            
        }
                

        let disable_headings = (note == activeNote) ? (display_flags & DF_DISABLE_HEADINGS) != 0 : (display_flags & DF_DISABLE_COMMENTS_HEADINGS) != 0
        
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            preAction: editorElement.preventBlur,
            operations: [
                ...publish_operations,
                {
                    caption: '_; Styles; Estilos; Style',
                    //tbr: 'B',
                    preAction: editorElement.preventBlur,
                    operations: [
                        ... (disable_headings ? [] : headings),
                        {
                            caption: '_; Normal; Normal; Normalny',
                            mricon: 'pilcrow',
                            tbr: 'A',
                            hideToolbarCaption: true,
                            action: (f) => editorElement.setNormal(),
                            activeFunc: editorElement.isActiveNormal,
                        },
                        {
                            caption: '_; Code; Código; Kod',
                            mricon: 'code-xml',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => editorElement.setCode(),
                            activeFunc: editorElement.isActiveCode
                        },
                        {
                            caption: '_; Quote; Cita; Cytat',
                            mricon: 'text-quote',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => editorElement.setQuote(),
                            activeFunc: editorElement.isActiveQuote
                        },
                        {
                            caption: '_; BulletList; Lista con viñetas; Lista punktowana',
                            mricon: 'list',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => editorElement.setBulletList(),
                            activeFunc: editorElement.isActiveBulletList

                        },
                    ]
                },
                {
                    caption: '_; Text; Texto; Tekst',
                    //tbr: 'B',
                    preAction: editorElement.preventBlur,
                    operations: [
                        {
                            caption: '_; Bold; Negrita; Pogrubiony',
                            mricon: 'bold',
                            action: (f) => editorElement.setBold(),
                            activeFunc: editorElement.isActiveBold,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Italic; Cursiva; Kursywa',
                            mricon: 'italic',
                            action: (f) => editorElement.setItalic(),
                            activeFunc: editorElement.isActiveItalic,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Underline; Subrayar; Podkreślenie',
                            mricon: 'underline',
                            action: (f) => editorElement.setUnderline(),
                            activeFunc: editorElement.isActiveUnderline,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Strikethrough; Tachado; Przekreślenie',
                            mricon: 'strikethrough',
                            action: (f) => editorElement.setStrikethrough(),
                            activeFunc: editorElement.isActiveStrikethrough,
                        },
                    ]
                },
                {
                    caption: '_; Insert; Insertar; Wstaw',
                    //tbr: 'B',
                    preAction: editorElement.preventBlur,
                    operations: [
                        {
                            caption: '_; Image; Imagen; Obraz',
                            mricon: 'image',
                            action: (f) => editorElement.setImage(),
                            activeFunc: editorElement.isActiveImage,
                            tbr: 'A', hideToolbarCaption: true
                        },
                        {
                            caption: '_; Table; Tabla; Tabela',
                            mricon: 'table',
                            action: (f) => editorElement.setTable(),
                            activeFunc: editorElement.isActiveTable
                        },
                        {
                            caption: '_; Attachement; Anexo; Załącznik',
                            mricon: 'paperclip',
                            action: (f) => runFileAttacher(),
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Tag; Etiqueta; Etykieta',
                            mricon: 'tag',
                            action: (f) => runTagInserter()
                        }
                    ]
                },
                {
                    caption: '_; Note; Nota; Notatka',
                    //tbr: 'B',
                    preAction: editorElement.preventBlur,
                    operations: [
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            mricon: 'pencil',
                            grid: addOperations,
                        //    fab: 'M10',
                        //    tbr: 'A'
                        },
                        {
                            caption: '_; Send; Enviar; Wyślij',
                            mricon: 'upload',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S00',
                            menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyTaskToBasket(),
                                    },
                                    {
                                        caption: '_; Copy to folder; Copiar a la carpeta; Kopiuj do folderu',
                                        action: (btt, rect) => runPopupExplorer4CopyToFolder(btt, rect, note)
                                    },
                                    { separator: true},
                                    {
                                        caption: '_; Open in a new tab; Abrir en una nueva pestaña; Otwórz w nowej karcie',
                                        action: () => openInNewTab(note.href)
                                    },
                                    {
                                        caption: '_; Copy the address; Copiar la dirección; Skopuj adres',
                                        action: () => copyAddress(note.href)
                                    }
                                ]

                        },
                        ...getInsertOperations(),
                    ]
                }
            ]
        }

    }

    function extraInsertPalletteCommands(editorIdx)
    {
        const editorElement = (idx) => {
            if(idx < 0)
                return description;
            else
                return threadResponses[idx]
        }

        return [
            {
                mricon: 'download',
                caption: '_; Insert; Insertar; Wstaw',
                //tbr: 'C',
                //fab: 'S10',
                action: () => {
                    const operations = [
                        {
                            caption: '_; Paste; Pegar; Wklej',
                            action: (btt, aroundRect) => pasteRecentClipboardElement4Editor(btt, aroundRect, editorElement(editorIdx))
                        },
                        {
                            caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                            action: (btt, aroundRect) => runPasteBasket4Editor(btt, aroundRect, editorElement(editorIdx))
                        },
                        {
                            caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                            action: (btt, aroundRect) => runPasteBrowserRecent4Editor(btt, aroundRect, editorElement(editorIdx))
                        },
                        {
                            caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                            action: (btt, aroundRect) => runEditorPopupExplorer4SelectFromFolders(btt, aroundRect, editorElement(editorIdx))
                        },
                        {
                            caption: '_; Select from task lists; Seleccionar de listas de tareas; Wybierz z listy zadań',
                            action: (btt, aroundRect) => runEditorPopupExplorer4SelectFromTaskLists(btt, aroundRect, editorElement(editorIdx))
                        },
                        {
                            separator: true
                        },
                        {
                            caption: '_; New note; Nueva nota; Nowa notatka',
                            action: () => runNoteCreator4Editor(editorElement(editorIdx))
                        },
                        {
                            caption: '_; Add file; Añadir archivo; Dodaj plik',
                            action: () => runFileAttacher4Editor(editorElement(editorIdx))
                        }
                    ]

                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    const aroundRect = range.getBoundingClientRect();

                    showMenu(aroundRect, operations, SHOW_MENU_BELOW)
                    return false;   // do not focus editor again
                }
            }
        ]
    }

    async function runPasteBasket4Editor(btt, aroundRect, editorElement)
    {
        const clipboardElements = await fetchComposedClipboard4Editor()

        showFloatingToolbar(aroundRect, BasketPreview,
            {
                onAttach: (clipboard, elements) => makeLinkToElement(editorElement, elements),
                clipboardElements: clipboardElements,
                ownCloseButton: true
            }
        )
    }

    async function pasteRecentClipboardElement4Editor(btt, aroundRect, editorElement)
    {
        const clipboardElements = await fetchComposedClipboard4Editor()
        if(clipboardElements && clipboardElements.length > 0)
        {
            const references = transformClipboardToJSONReferences([clipboardElements[0]])
            makeLinkToElement(editorElement, references)
        }
    }

    async function runPasteBrowserRecent4Editor(btt, aroundRect, editorElement)
    {
        const clipboardElements = getBrowserRecentElements()
        showFloatingToolbar(aroundRect, BasketPreview, {
            onAttach: (clipboard, elements) => makeLinkToElement(editorElement, elements),
            clipboardElements: clipboardElements,
            browserBasedClipboard: true,
            ownCloseButton: true
        })
    }

    async function runEditorPopupExplorer4SelectFromFolders(btt, aroundRect, editorElement)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            rootFilter: 'FOLDERS',
            onAttach: (clipboard, elements) => makeLinkToElement(editorElement, elements),
            ownCloseButton: true
        })
    }

    async function runEditorPopupExplorer4SelectFromTaskLists(btt, aroundRect, editorElement)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            rootFilter: 'TASKLISTS',
            onAttach: (clipboard, elements) => makeLinkToElement(editorElement, elements),
            ownCloseButton: true
        })
    }

    async function runNoteCreator4Editor(editorElement)
    {
        const cursorPos = editorElement.getCurrentCursorPos()

        const insertNewNoteLink = async (newNote) => {
            const res = await reef.get(`${newNote.$ref}?fields=Title,href`, onErrorShowAlert)
            const note = res.NoteNote
            editorElement.setCursorPos(cursorPos)
            makeLinkToElement(editorElement,
            [{
                Title: note.Title,
                href: note.href
            }])
        }

        runNoteInserter(insertNewNoteLink)
    }

    async function runFileAttacher4Editor(editorElement)
    {
        const cursorPos = editorElement.getCurrentCursorPos()

        const insertNewFileLink = async (newFile) => {
            const res = await reef.get(`${newFile.$ref}?fields=Title,href`, onErrorShowAlert)
            const file = res.NoteFile
            editorElement.setCursorPos(cursorPos)

            makeLinkToElement(editorElement,
            [{
                Title: file.Title,
                href: file.href
            }])
        }

        runFileAttacher(insertNewFileLink)
    }

    function makeLinkToElement(editorElement, elements)
    {
        if(elements && Array.isArray(elements) && elements.length > 0)
        {
            elements.forEach((el) =>
            {
                let href;
                if(el.href.endsWith('/blob'))
                {
                    href = el.href + "?name=" + encodeURIComponent(el.Title)
                }
                else if(el.href.startsWith('/'))
                {
                    href = /*window.location.origin +*/ window.location.pathname + '#' + el.href
                }
                else
                    href = el.href

                editorElement.addLink(el.Title, href)
            })
        }
    }

    async function downloadFileFromHRef(href, title)
    {
        let ref;
        let name;
        const queryIdx = href.indexOf('?')
        if(queryIdx > 0)
        {
            ref = href.substring(0, queryIdx)
            const query = href.substring(queryIdx)
            const params = new URLSearchParams(query);
            if(params.has("name"))
                name = params.get("name")
            else if(title)
                name = title
            else
                name = 'file_' + randomString(8)
        }
        else
        {
            ref = href;
            if(title)
                name = title
            else
                name = 'file_' + randomString(8)
        }

        const res = await reef.fetch(`json/anyv/${href}`, onErrorShowAlert);
        if(res.ok)
        {
            const blob = await res.blob()
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a"); // Or maybe get it from the current document
            link.href = blobUrl;
            link.download = name;

            //document.body.appendChild(link); // Or append it whereever you want
            link.click() //can add an id to be specific if multiple anchor tag, and use #id


            URL.revokeObjectURL(blobUrl)
        }
        else
        {
            const err = await res.text()
            console.error(err)
            onErrorShowAlert(err)
        }
    }

    async function editorLinkClicked(href, target)
    {
        if(href.includes('/blob'))
            await downloadFileFromHRef(href)
        else
            window.open(href, target);
    }

    async function downloadAttachedFile(e, href, title)
    {
        e.preventDefault()
        e.stopPropagation()
        await downloadFileFromHRef(href, title);
    }

    function onStaticAttachementClick(e, att)
    {
        if(att.$type == 'NoteFile')
        {
            e.preventDefault()
            e.stopPropagation()
            downloadFileFromHRef(att.href, att.Title);
        }
        else
        {
            e.preventDefault()
            e.stopPropagation()
            push(att.href)
        }
    }

    const extraInsertPalletteCommandsExt = [
        {
            caption: 'Attach_; Attachement; Anexo; Załącznikement',
            mricon: 'paperclip',
            action: runFileAttacher
        },
        {
            caption: '_; Tag; Etiqueta; Etykieta',
            mricon: 'tag',
            action: () => setTimeout(() => runTagInserter(), 500)
        }
    ]

    const descriptionActive = { }
    
    function activateFormattingTools(editorElement)
    {
        activateItem('props', descriptionActive, getPageOperationsWithFormattingTools(editorElement))
    }

    function deactivateFormattingToolsIfNeeded(editorElement)
    {
        if(isActive('props', descriptionActive))
            clearActiveItem('props')
    }

    let imgInput;
    let imgEditorActionAfterSuccess;
    function uploadImage(editorActionAfterSuccess)
    {
        imgEditorActionAfterSuccess = editorActionAfterSuccess;
        imgInput?.click();
    }

    async function onImageSelected()
    {
        const [file] = imgInput.files;
        if(file)
        {
            pendingUploading = true

            let resizedImage = await resizeImage(file, 1024, 1024)
            if(!resizedImage)
                resizedImage = file

            const res = await reef.post(`${activeNote?.$ref}/Images/blob?name=${file.name}&size=${resizedImage.size}`, {}, onErrorShowAlert)
            if(res && res.key && res.uploadUrl)
            {
                const newKey = res.key;
                const uploadUrl = res.uploadUrl

                try
                {
                    //const res = await new Promise(r => setTimeout(r, 10000));
                    const res = await fetch(uploadUrl, {
                                                method: 'PUT',
                                                headers: new Headers({
                                                    'Content-Type': resizedImage.type
                                                }),
                                                body: resizedImage})
                    if(res.ok)
                    {
                        // todo: editor path imgPath
                        const dataPath = `${activeNote?.$ref}/Images/blob?key=${newKey}`

                        if(imgEditorActionAfterSuccess)
                            imgEditorActionAfterSuccess(dataPath)
                    }
                    else
                    {
                        const err = await res.text()
                        console.error(err)
                        onErrorShowAlert(err)
                    }

                }
                catch(err)
                {
                    console.error(err)
                    onErrorShowAlert(err)
                }
            }

            pendingUploading = false;

            await reloadData();
        }
    }

    function removeImage(dataPath)
    {
        reef.delete(dataPath, onErrorShowAlert)
    }

    async function runTagInserter()
    {
        if(tags)
            tags.show();
        else
        {
            tagsPlaceholder = true;
            await tick();
            tags?.show(undefined, () => {tagsPlaceholder = false})
        }
    }

    let attInput;
    function runFileAttacher(afterAction=null)
    {
        attInput?.click();
        additionalAfterCreateAction = afterAction
    }

    async function onAttachementSelected()
    {
        const [file] = attInput.files;
        if(file)
        {
            pendingUploading = true


            let fileLink = await reef.post(`${activeNote?.$ref}/CreateFile`,
                                    {
                                        title: file.name,
                                        mimeType: file.type,
                                        size: file.size,
                                        order: 0
                                    }, onErrorShowAlert)
            if(!fileLink)
                return null;

            fileLink = fileLink.NoteFile
            const res = await reef.post(`UploadedFile/${fileLink.FileId}/Key/blob?name=${file.name}&size=${file.size}`, {}, onErrorShowAlert)

            if(res && res.key && res.uploadUrl)
            {
                const uploadUrl = res.uploadUrl
                try
                {
                    //const res = await new Promise(r => setTimeout(r, 10000));
                    const res = await fetch(uploadUrl, {
                                                method: 'PUT',
                                                headers: new Headers({
                                                    'Content-Type': file.type
                                                }),
                                                body: file})
                    if(res.ok)
                    {
                        setBrowserRecentElement(fileLink.FileId, 'UploadedFile')
                    }
                    else
                    {
                        const err = await res.text()
                        console.error(err)
                        onErrorShowAlert(err)
                    }

                }
                catch(err)
                {
                    console.error(err)
                    onErrorShowAlert(err)
                }
            }

            pendingUploading = false;

            await reloadData();
            attachementsComponent.reload(activeNote, fileLink.$ref);

            if(additionalAfterCreateAction)
                additionalAfterCreateAction(fileLink)
        }
    }


    function isContentEmpty()
    {
        if(!note.Content)
            return true
        else if(note.Content == '<p></p>')
            return true
        else
            return false
    }




    let attachementsComponent
    //let attachementsFilesComponent
    let connectedToComponent
    const attList = (kind) => attachementsComponent //kind == 'NoteNote' ? attachementsNotesComponent : attachementsFilesComponent
    function attachementOperations(element, kind)
    {
        const isCanonical = element.IsCanonical

        let list = attList(kind);

        let linkOperations = []
        if(isCanonical)
        {
            linkOperations = [
                {
                    caption: '_; Delete; Eliminar; Usuń',
                    action: (f) => moveAttachementToTrash(element, kind)
                },
                {
                    caption: '_; Archive; Archivar; Archiwizuj',
                    action: (f) => moveAttachementToArchive(element, kind)
                }
            ]
        }
        else
        {
             linkOperations = [
                {
                    caption: '_; Detach; Desconectar; Odłącz',
                    action: (f) => dettachAttachement(element, kind)
                }
             ]
        }


        return {
                opver: 2,
                fab: 'M00',
                tbr: 'D',
                operations: [
                    {
                        caption: '_; Element; Elemento; Element',
                        operations: [
                            {
                                caption: '_; Edit; Editar; Edytuj',
                                mricon: 'pencil',
                                tbr: 'A',
                                fab:'M20',
                                grid:[
                                    {
                                        caption: '_; Title; Título; Tytuł',
                                        action: (focused) =>  { list.edit(element, 'Title') },
                                    },
                                    {
                                        caption: '_; Summary; Resumen; Podsumowanie',
                                        action: (focused) =>  { list.edit(element, 'Summary') }
                                    }
                                ]

                            },
                            {
                                caption: '_; Move to top ; Mover al principio de la lista; Przesuń na szczyt',
                                mricon: 'chevrons-up',
                                action: (f) => list.moveTop(element),
                                fab:'M07',
                                tbr:'A',
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                                mricon: 'chevron-up',
                                action: (f) => list.moveUp(element),
                                fab:'M06',
                                tbr:'A',
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                                mricon: 'chevron-down',
                                action: (f) => list.moveDown(element),
                                fab:'M05',
                                tbr:'A' ,
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Send; Enviar; Wyślij',
                                hideToolbarCaption: true,
                                mricon: 'upload',
                                tbr: 'C',
                                fab: 'S00',
                                menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyAttachementToBasket(element, kind),
                                    },
                                    {
                                        caption: '_; Cut; Cortar; Wytnij',
                                        action: (f) => cutAttachementToBasket(element, kind)
                                    },
                                    {
                                        caption: '_; Copy to folder; Copiar a la carpeta; Kopiuj do folderu',
                                        action: (btt, rect) => runPopupExplorer4CopyToFolder(btt, rect, element)
                                    },
                                    { separator: true},
                                    {
                                        caption: '_; Open in a new tab; Abrir en una nueva pestaña; Otwórz w nowej karcie',
                                        action: () => openInNewTab(element.href)
                                    },
                                    {
                                        caption: '_; Copy the address; Copiar la dirección; Skopuj adres',
                                        action: () => copyAddress(element.href)
                                    }
                                ]
                            },
                            {
                                separator: true
                            },
                            ...linkOperations,
                            {
                                caption: '_; Properties; Propiedades; Właściwości',
                                action: (btt, rect)=> runElementProperties(btt, rect, element, kind)
                            }
                        ]
                    }
                ]
            }
    }

    let filePropertiesDialog;
    let notePropertiesDialog;
    function runElementProperties(btt, aroundRect, element, kind)
    {
        switch(kind)
        {
        case 'Note':
        case 'NoteNote':
            notePropertiesDialog.show(element)
            break;

        case 'UploadedFile':
        case 'NoteFile':
            filePropertiesDialog.show(element)
            break;
        }
    }

    async function changeAttachementProperty(item, value, propName)
    {
        item[propName] = value

        switch(propName)
        {
        case 'Title':
            await reef.post(`${item.$ref}/SetTitle`, { value: value }, onErrorShowAlert)
            break;

        case 'Summary':
            await reef.post(`${item.$ref}/SetSummary`, { value: value }, onErrorShowAlert)
            break;
        }

    }

    async function copyAttachementToBasket(element, kind)
    {
        switch(kind)
        {
        case 'Note':
        case 'NoteNote':
            return copyNoteToBasket(element)
        case 'UploadedFile':
        case 'NoteFile':
            return copyFileToBasket(element)
        }
    }

    async function cutAttachementToBasket(element, kind)
    {
        switch(kind)
        {
        case 'Note':
        case 'NoteNote':
            return cutNoteToBasket(element)
        case 'UploadedFile':
        case 'NoteFile':
            return cutFileToBasket(element)
        }
    }

    async function copyNoteToBasket(forNote)
    {
        await reef.post(`${activeNote?.$ref}/CopyNoteToBasket`, { noteLink: forNote.$ref } , onErrorShowAlert);
    }

    async function cutNoteToBasket(forNote)
    {
        await reef.post(`${activeNote?.$ref}/CutNoteToBasket`, { noteLink: forNote.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function copyFileToBasket(file)
    {
        await reef.post(`${activeNote?.$ref}/CopyFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
    }

    async function cutFileToBasket(file)
    {
        await reef.post(`${activeNote?.$ref}/CutFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function dettachAttachement(element, kind)
    {
        switch(kind)
        {
        case 'Note':
        case 'NoteNote':
            return dettachNote(element)
        case 'UploadedFile':
        case 'NoteFile':
            return dettachFile(element)
        }
    }

    async function dettachNote(forNote)
    {
        await reef.post(`${activeNote?.$ref}/DettachNote`, { noteLink: forNote.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function dettachFile(file)
    {
        await reef.post(`${activeNote?.$ref}/DettachFile`, { fileLink: file.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function moveAttachementToTrash(object, kind)
    {
        if(!object)
            return;

        let success = false

        switch(kind)
        {
        case 'NoteNote':
            success = await reef.get(`${object.$ref}/Note/MoveMeToTrash`);
            break;

        case 'NoteFile':
            success = await reef.get(`${object.$ref}/File/MoveMeToTrash`);
            break;
        }

        if(success)
        {
            await reloadData();
            if(attachementsComponent)
                attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
            else
                clearActiveItem('props')
        }
    }

    async function moveAttachementToArchive(object, kind)
    {
        if(!object)
            return;

        let success = false

        switch(kind)
        {
        case 'NoteNote':
            success = await reef.get(`${object.$ref}/Note/MoveMeToArchive`);
            break;

        case 'NoteFile':
            success = await reef.get(`${object.$ref}/File/MoveMeToArchive`);
            break;
        }

        if(success)
        {
            await reloadData();
            if(attachementsComponent)
                attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
            else
                clearActiveItem('props')
        }
    }

    let deleteModal;
    let objectToDelete;
    let deleteObjectKind = ''
    function askToDeleteAttachement(object, kind)
    {
        deleteObjectKind = kind;
        objectToDelete = object;
        deleteModal.show()
    }


    async function deleteAttachement()
    {
        if(!objectToDelete)
            return;

        switch(deleteObjectKind)
        {
        case 'Note':
        case 'NoteNote':
            await reef.post(`${activeNote?.$ref}/DeletePermanentlyNote`, { noteLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await reloadData();
            if(attachementsComponent)
                attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
            else
                clearActiveItem('props')
            break;

        case 'UploadedFile':
        case 'NoteFile':
            await reef.post(`${activeNote?.$ref}/DeletePermanentlyFile`, { fileLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await reloadData();
            if(attachementsComponent)
                attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
            else
                clearActiveItem('props')
            break;
        }
    }

    function connectedToOperations(element)
    {
        // TaskNote
        // FolderNote
        // NoteNote
        const isCanonical = element.IsCanonical

        let linkOperations = []
        if(isCanonical)
        {
            linkOperations = [ ]
        }
        else
        {
            linkOperations = [
                {
                    caption: '_; Detach; Desconectar; Odłącz',
                    action: (f) => dettachParent(element)
                },
                {
                    caption: '_; Set as primary location; Establecer como ubicación principal; Ustaw jako główną lokalizację',
                    action: (f) => setParentLocationAsCanonical(element)
                }
             ]
        }


        return {
                opver: 2,
                fab: 'M00',
                tbr: 'D',
                disabled: linkOperations.length == 0,
                operations: [
                    {
                        caption: '_; Element; Elemento; Element',
                        operations: linkOperations
                    }
                ]
            }

    }

    async function dettachParent(element)
    {
        switch(element.$type)
        {
        case 'FolderNote':
            await reef.post(`${element.$ref}/Folder/DettachNote`, { noteLink: element.$ref } , onErrorShowAlert);
            break;

        case 'TaskNote':
            await reef.post(`${element.$ref}/Task/DettachNote`, { noteLink: element.$ref } , onErrorShowAlert);
            break;

        case 'NoteNote':
            await reef.post(`${element.$ref}/InNote/DettachNote`, { noteLink: element.$ref } , onErrorShowAlert);
        }

        await reloadData();
        if(connectedToComponent)
            connectedToComponent.reload(note, connectedToComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function setParentLocationAsCanonical(element)
    {
        await reef.get(`${element.$ref}/SetLocationAsCanonical`, onErrorShowAlert)
        await reloadData();
        connectedToComponent.reload(note, connectedToComponent.KEEP_SELECTION);
    }

    let notesPlaceholder = false
    let additionalAfterCreateAction = null
    async function runNoteInserter(afterCreateAction=null)
    {
        if(!attachementsComponent)
        {
            notesPlaceholder = true
            await tick();
        }

        await attachementsComponent.addRowAfter(null)
        additionalAfterCreateAction = afterCreateAction
    }

    async function addEmptyNote(newNoteAttribs)
    {
        notesPlaceholder = false
        let res = await reef.post(`${activeNote?.$ref}/CreateSubNote`,{
            title: newNoteAttribs.Title,
            summary: '',
            order: 0
        }, onErrorShowAlert)

        if(!res)
            return null;

        let newNote = res.NoteNote;
        setBrowserRecentElement(newNote.NoteId, 'Note')

        await reloadData();
        attachementsComponent.reload(activeNote, newNote.$ref);

        if(additionalAfterCreateAction)
        {
            additionalAfterCreateAction(newNote)
        }
    }

    async function add_comment()
    {
        const res = await reef.post(`user/NewDraftComment`, {
            content: '',
            thread: note.$ref})

        if(res)
        {
            //res.WorkingPost

            await reloadData();
            await tick();

            focus_last_sub_note()
        }
    }

    async function addThreadResponse()
    {
        let res = await reef.post(`${noteRef}/AddPost`,{
            content: ''})

        if(!res)
            return null;

        let newNote = res.NoteNote;

        await reloadData();
        await tick();

        focus_last_sub_note()
    }

    function focus_last_sub_note()
    {
        if(threadResponses && threadResponses.length > 0)
        {
            const activeEditor = threadResponses[threadResponses.length-1]
            activeEditor.setCursorPos('end');
            activeEditor.scrollIntoView({ behaviour: "smooth", block: "start" })
        }
    }

    let title_not_valid = false
    async function publish_thread()
    {
        // validate before publish
        if(!note.Title)
        {
            title_not_valid = true;
            const title_placeholder = document.getElementById("title-placeholder")
            if(title_placeholder)
                title_placeholder.scrollIntoView({ behaviour: "smooth", block: "start" })
            return;
        }

        const res = await reef.post(`${activeNote.$ref}/PublishThread`, {})
        if(res)
            await reloadData();
    }

    async function approve_post(button)
    {
        let rect = button.getBoundingClientRect()

        const select_op = async (ref) => {
            const res = await reef.post(`${activeNote.$ref}/ApproveMe`, {catLink: ref})
            if(res)
                await reloadData();
        }

        const categories = await reef.get('group/FeedsRoot/Folders?fields=$ref,Title')
        if(categories && categories.FolderFolder && categories.FolderFolder.length > 0)
        {
            let operations = []
            categories.FolderFolder.forEach(folder => {
                operations.push({
                    caption: folder.Title,
                    action: () => select_op(folder.$ref)
                })
            });

            showMenu(rect, operations)
        }
        
        
    }

    async function publish_comment()
    {
        const res = await reef.post(`${activeNote.$ref}/PublishComment`, {})
        if(res)
        {
            await reloadData();
            await tick();
            clearActiveItem('props')
        }
    }

    async function set_post_confidential(confidential=true)
    {
        const newFlags = confidential ? activeNote.Flags | NF_WILL_CONFIDENTIAL : (activeNote.Flags & (~NF_WILL_CONFIDENTIAL))
        setjItemProperty(activeNote, 'Flags', newFlags)
    }

    let title_placeholder = false;
    async function start_title_editing(e)
    {
        if(!focusEditable('Title'))
        {
            title_placeholder = true;
            await tick();   // rerender with h1
            focusEditable('Title')
        }
    }

    let list_properties = {
        element:{
            icon: "icon",
            href: "href",
            Title: "Title",
            Summary: "Summary"
        },
        context:{
            NoteNote:{
                icon:'#file-text'
            },
            NoteFile:{
                icon:'#file-archive',
                downloadable: true,
                onOpen: async (f) => await downloadFileFromHRef(f.href, f.Title)
            }
        }
    }

    let attached_to_list_properties = {
        element:{
            icon: "InIcon",
            href: "InHRef",
            Title: "InTitle",
            Summary: "InSummary"
        },
        context:{
            TaskNote:{
                head_right: "ModificationDate"
            }
        }
    }

</script>

<svelte:head>
    {#if note && note.Title}
        <title>{note.Title} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>


{#key `${activeNoteRef}_${isReadOnly}` }
{#if note != null}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={note}
            toolbarOperations={getPageOperations()}
            clearsContext='props'
            title={note.Title}>
    <Paper class="mb-64">
        <PaperHeader>
            <div class="flex flex-row items-center">
            <Breadcrumb class="mt-1 sm:min-w-[65ch]" path={note.GetCanonicalPath}/>
            <div class="ml-auto {acc_color}" >
                <Ricon icon={acc_icon} s/>
            </div>

            </div>
        </PaperHeader>

        <div class="w-full flex flex-row justify-between">
            <!--span>Eidt<self=note a='index'/></span-->

            <span>
                {getNiceStringDateTime(modificationDate)}
            </span>
        </div>


        <!--h1>
            <REdit self={note} a='Title'/>
        </h1-->
        
        {#if display_flags & DF_SHOW_TITLE_PLACEHOLDER}
            <h1 on:click={start_title_editing}>
                {#if note.Title || title_placeholder}
                    <Editable self={note} a='Title' focusOnClick={false} />
                {:else}
                    <span   id="title-placeholder" 
                            class="placeholder"
                            class:alert={title_not_valid}>
                        _; Enter a title; Escribe el título; Wpisz tytuł
                    </span>
                {/if}
            </h1>
        {:else}
            <h1><Editable self={note} a='Title' readonly={isReadOnly}/></h1>
        {/if}
        
        
        <div class="w-full flex flex-row flex-wrap justify-between">
            <div class="grow-0">
                {#if DF_SHOW_ORIGINAL_AUTHOR}
                    {#if note.CreatedBy}
                        {@const href = `${note.CreatedBy.href}`}
                        <a {href} use:link> {note.CreatedBy.Name} </a>
                    {/if}
                {:else}
                    {#if note.ModifiedBy}
                        {@const href = `${note.ModifiedBy.href}`}
                        <a {href} use:link> {note.ModifiedBy.Name} </a>
                    {/if}
                {/if}
            </div>

            <div>
                <!--
                {#if availableStates && availableStates.length > 0}
                    <Combo  compact={true}
                            inContext='data'
                            a='State'
                            icon
                            placeholder='State'
                            hasNone={false}
                            s='prose'>
                        <ComboSource    objects={availableStates}
                                        key="state"
                                        name="name"
                                        icon="icon"/>
                    </Combo>
                {/if}
                -->
            </div>

            <div>
                {#if note.Tags || tagsPlaceholder}
                    <Tags class="w-full "
                        a='Tags'
                        s='prose'
                        onSelect={onTagsChanged}
                        getGlobalTags={() => allTags}
                        {onUpdateAllTags}
                        canChangeColor
                        readOnly={isReadOnly}
                        bind:this={tags}/>
                {/if}
            </div>
        </div>

        {#if note.Summary || summaryPlaceholder}
            {#key note.Summary}
                <p  class="lead"><Editable self={note} a='Summary' readonly={isReadOnly}/></p>
            {/key}

        {/if}


            <!--{#if note.Content || descriptionPlaceholder}
                             -->
            <hr/>

                <!--BEFORE EDITOR-->
                <Editor     on:click={(e) => e.stopPropagation()}
                            class="mb-20"
                            a='Content'
                            compact={true}
                            bind:this={description}
                            readOnly={isReadOnly || (noteRef!=activeNote?.$ref)}
                            disableHeadings={(display_flags & DF_DISABLE_HEADINGS) != 0}
                            onFocusCb={() => activateFormattingTools(description)}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded(description)}
                            onAddImage={uploadImage}
                            onRemoveImage={removeImage}
                            onLinkClick={editorLinkClicked}
                            extraInsertPaletteCommands={() => extraInsertPalletteCommands(-1)}/>

            
            {#if (display_flags & DF_SHOW_MAIN_NOTE_ATTACHEMENTS_COMPACT) && note.attachements && note.attachements.length > 0}
                {#each note.attachements as att}
                    <p class="bg-stone-100 dark:bg-stone-800">
                    <span class="whitespace-normal">
                        {#if att.$type == "NoteFile"}
                            <a      class="mr-4 font-normal  whitespace-nowrap"
                                    href={att.href}
                                    on:click={(e) => downloadAttachedFile(e, att.href, att.Title)}>
                                <span class="inline-block w-4 h-4 mr-2">
                                    <Ricon icon = {att.icon}/>
                                </span>
                                <span class="text-sky-800 dark:text-sky-200">
                                    {att.Title}
                                </span>
                            </a>
                        {:else}
                            <a      class="mr-4 font-normal  whitespace-nowrap"
                                    href={att.href}
                                    use:link>
                                <span class="inline-block w-4 h-4 mr-2">
                                    <Ricon icon = {att.icon}/>
                                </span>
                                <span class="text-sky-800 dark:text-sky-200">
                                    {att.Title}
                                </span>
                            </a>
                        {/if}

                    </span>
                </p>
                {/each}
            {/if}


            <!-- ============================================================================== -->

            {#if isThread && note.Notes && note.Notes.length > 0}
                {#each note.Notes as subNoteLink, subNoteIdx}
                    {#if subNoteLink.Role == NR_COMMENT}
                        {@const subNote = subNoteLink.Note}
                        {@const is_first = subNoteIdx==0}
                        {@const separator_class = is_first ? "first-comment" : ""}
                    
                        <hr id="{subNote.$ref}" class={separator_class}/>
                        {#if subNote.State == NS_DRAFT}
                            <h4>_; Your unpublished comment:; Tu comentario no publicado:; Twój nieopublikowany komentarz:</h4>
                        {:else}
                            <h4>{subNote.CreatedBy.Name}  <span class="font-normal ml-4 text-body">{getNiceStringDateTime(subNote.ModificationDate)}</span></h4>
                        {/if}
                        <Editor     on:click={(e) => e.stopPropagation()}
                                    a='Content'
                                    self={subNote}
                                    compact={true}
                                    bind:this={threadResponses[subNoteIdx]}
                                    readOnly={subNote.$ref!=activeNote?.$ref}
                                    disableHeadings={(display_flags & DF_DISABLE_COMMENTS_HEADINGS) != 0}
                                    onFocusCb={() => activateFormattingTools(threadResponses[subNoteIdx])}
                                    onBlurCb={() => deactivateFormattingToolsIfNeeded(threadResponses[subNoteIdx])}
                                    onAddImage={uploadImage}
                                    onRemoveImage={removeImage}
                                    onLinkClick={editorLinkClicked}
                                    extraInsertPaletteCommands={() => extraInsertPalletteCommands(subNoteIdx)}/>

                        {#if subNote.$ref!=activeNote?.$ref && subNote.attachements && subNote.attachements.length > 0}
                            {#each subNote.attachements as att}
                                <p class="bg-stone-100 dark:bg-stone-700">
                                <span class="whitespace-normal">
                                    {#if att.$type == "NoteFile"}
                                        <a      class="mr-4 font-normal  whitespace-nowrap"
                                                href={att.href}
                                                on:click={(e) => downloadAttachedFile(e, att.href, att.Title)}>
                                            <span class="inline-block w-4 h-4 mr-2">
                                                <Ricon icon = {att.icon}/>
                                            </span>
                                            <span class="text-stone-800 dark:text-stone-200">
                                                {att.Title}
                                            </span>
                                        </a>
                                    {:else}
                                        <a      class="mr-4 font-normal  whitespace-nowrap"
                                                href={att.href}
                                                use:link>
                                            <span class="inline-block w-4 h-4 mr-2">
                                                <Ricon icon = {att.icon}/>
                                            </span>
                                            <span class="text-stone-800 dark:text-stone-200">
                                                {att.Title}
                                            </span>
                                        </a>
                                    {/if}

                                </span>
                            </p>
                            {/each}
                        {/if}
                    {/if}
                {/each}
            {/if}

            <!-- ============================================================================== -->

            {#if (display_flags & DF_SHOW_ACTIVE_NOTE_ATTACHEMENTS_LIST) && ((activeNote.attachements && activeNote.attachements.length > 0) || notesPlaceholder)}
                <h2>_;Attachments; Anexos; Załączniki</h2>
                <section>
                        <List   self={activeNote}
                                a='attachements'
                                {list_properties}
                                bind:this={attachementsComponent}
                                orderAttrib='Order'
                                toolbarOperations={(el) => attachementOperations(el, el.$type)}>

                            <ListInserter   action={addEmptyNote} icon incremental={false}/>

                        </List>
                </section>
            {/if}

            {#if note && note.connectedToList && note.connectedToList.length > 0}
                <h2>_; Attached to; Adjunto a; Przyłączony do</h2>
                <section>
                    <List   self={note}
                            a='connectedToList'
                            list_properties={attached_to_list_properties}
                            bind:this={connectedToComponent}
                            toolbarOperations = {(el) => connectedToOperations(el)}>
                    </List>
                </section>
            {/if}





    </Paper>

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/> <!-- capture="environment" -->
    <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>
</Page>

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
{/key}

<Modal title={i18n(['Uploading...', 'Carga...', 'Przesyłanie...'])}
    bind:open={pendingUploading} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/>
    <span class="ml-3">_; Your file is uploading to the server; Tu archivo se está cargando en el servidor; Twój plik jest przesyłany na serwer</span>
</Modal>

<Modal  title={i18n(['Delete', 'Eliminar', 'Usuń'])}
        icon={FaTrash}
        onOkCallback={deleteAttachement}
        bind:this={deleteModal}>
    <p class="text-sm text-stone-500 dark:text-stone-300">
        <span>
            _;
            Are you sure you want to delete selected element?;
            ¿Está seguro de que desea eliminar el elemento seleccionado?;
            Czy na pewno chcesz usunąć wybrany element?
        </span>
    </p>
</Modal>

<FileProperties bind:this={filePropertiesDialog} />
<NoteProperties bind:this={notePropertiesDialog} />

<style lang="postcss">
    .placeholder {
        color: var(--tw-prose-lead);
    }

    :global(.dark) .placeholder {
        color: var(--tw-prose-lead-invert);
    }

    .placeholder.alert {
        color: theme('colors.red.700');
    }

    :global(.dark) .placeholder.alert {
        color: theme('colors.red.300');
    }

    .text-body {
        color: var(--tw-prose-body);
    }

    :global(.dark) .text-body {
        color: var(--tw-prose-invert-body);
    }


</style>