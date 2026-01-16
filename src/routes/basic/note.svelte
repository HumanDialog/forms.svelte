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
            informModificationEx,
            Breadcrumb, i18n, UI,
			showFloatingToolbar,
			randomString,
            showMenu,
            SHOW_MENU_BELOW,
            ext,
            List, ListTitle, ListSummary, ListInserter, Icon, Ricon,
            reloadPageToolbarOperations, Paper, PaperHeader, focusEditable, openInNewTab, copyAddress,

			getNiceStringDateTime

            } from '$lib'
	import { onMount, tick } from 'svelte';

    import {location, querystring, push, link} from 'svelte-spa-router'

    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo, FaSave, FaCloudUploadAlt, FaFont, FaPen, FaList, FaUpload, FaFile,
        FaImage, FaTable, FaPaperclip, FaBold, FaItalic, FaUnderline, FaStrikethrough, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle,
        FaInfo, FaListUl, FaLink, FaRegFolder, FaRegCalendar, FaRegCalendarCheck, FaRegFile, FaDownload, FaTrash, FaExternalLinkSquareAlt,
        FaCaretUp, FaCaretDown
    } from 'svelte-icons/fa/'


    import AttachedFile from './attached.file.svelte'
    import BasketPreview from './basket.preview.svelte'
    import PopupExplorer from './popup.explorer.svelte'
    import {fetchComposedClipboard4Editor, fetchComposedClipboard4Note, transformClipboardToJSONReferences, pushBrowserRecentElements, setBrowserRecentElement, getBrowserRecentElements} from './basket.utils'
    import {getElementIcon} from './icons'

    import FileProperties from './properties.file.svelte'
	import NoteProperties from './properties.note.svelte'

    let noteRef = ''
    let activeNoteRef = ''
    let note = null;
    let activeNote = null

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

    const NK_DOCUMENT          = 0
    const NK_THREAD            = 1
    const NK_POST              = 2
    let isThread = false


    $: onParamsChanged($location)

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

        // turn off read-only mode by default.
        //isReadOnly = true;

       await reloadData();
       noteId = id

       if(note)
            pushBrowserRecentElements( note.Id, note.$type, note.$ref, note.Title, note.Summary, "file-text", note.href)
    }

    async function reloadData()
    {
        if(!noteRef)
            return;

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
                                                    'IsPinned',
                                                    'GetCanonicalPath',
                                                    '$ref',
                                                    '$type',
                                                    '$acc',
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
                                            Expressions:['$ref', 'Name']
                                        },

                                        {
                                            Id: 13,
                                            Association: 'InFolders',
                                            Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                        },
                                        {
                                            Id: 14,
                                            Association: 'InTasks',
                                            Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                        },
                                        {
                                            Id: 15,
                                            Association: 'InNotes',
                                            Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'InIcon', 'IsCanonical', '$type']
                                        },

                                        {
                                            Id: 16,
                                            Association: 'Notes',
                                            Sort: 'Order',
                                            Expressions:['Id', '$ref', 'Title', 'Summary', 'href', 'icon', 'IsCanonical', '$type', 'NoteId', 'Order'],
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

        isReadOnly = (note.$acc & 0x2) == 0
        canBeEditable = (note.$acc & 0x2) > 0

        isThread = note.Kind == NK_THREAD

        activeNote = note
        if(note && note.Notes && note.Notes.length > 0)
        {
            for(let idx=0; idx<note.Notes.length; idx++)
            {
                const subNote = note.Notes[idx].Note
                if(subNote.Kind == NK_POST)
                {
                    prepareAttachementsList(subNote)
                    activeNote = subNote
                }
            }
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

    function prepareAttachementsList(noteElement)
    {
        noteElement.attachements = []
        if(noteElement.Notes && noteElement.Notes.length > 0)
        {
            noteElement.Notes.forEach((n) => {
                if(n.Note.Kind != NK_POST)
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

    function onPropertySingleChange(txt, attrib)
    {
        //note[attrib] = txt
        //informModification(note, attrib)
        informModificationEx(activeNote.$type, activeNote.Id, attrib, txt)
        refreshToolbarOperations()
    }

    async function onUpdateAllTags(newAllTags)
    {
        allTags  = newAllTags
        await reef.post('group/set', { AllTags: allTags}, onErrorShowAlert)
    }

    async function onTagsChanged(tags)
    {
        activeNote.Tags = tags;
        informModification(activeNote, 'Tags')
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
        {
            operations.push({
                caption: '_; New response; Nueva respuesta; Nowa odpowiedź',
                mricon: 'message-square',
                tbr: 'A',
                fab: 'M01',
                action: () => addThreadResponse()
            })

            operations.push({separator: true, tbr: 'A'})
        }

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
                destinationContainer: activeNoteRef,
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
            const res = await reef.post(`${activeNoteRef}/AttachClipboard`, { references: references }, onErrorShowAlert)
            if(res)
                await reloadWithAttachements();

        }
    }

    async function runPasteBrowserRecent4Note(btt, aroundRect)
    {
        const clipboardElements = getBrowserRecentElements()
        showFloatingToolbar(aroundRect, BasketPreview, {
            destinationContainer: activeNoteRef,
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
            destinationContainer: activeNoteRef,
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
        const headings = [
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

        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            preAction: editorElement.preventBlur,
            operations: [
                {
                    caption: '_; Styles; Estilos; Style',
                    //tbr: 'B',
                    preAction: editorElement.preventBlur,
                    operations: [
                        ... (isThread ? [] : headings),
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

    function extraInsertPalletteCommands(editorElement)
    {
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
                            action: (btt, aroundRect) => pasteRecentClipboardElement4Editor(btt, aroundRect, editorElement)
                        },
                        {
                            caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                            action: (btt, aroundRect) => runPasteBasket4Editor(btt, aroundRect, editorElement)
                        },
                        {
                            caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                            action: (btt, aroundRect) => runPasteBrowserRecent4Editor(btt, aroundRect, editorElement)
                        },
                        {
                            caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                            action: (btt, aroundRect) => runEditorPopupExplorer4SelectFromFolders(btt, aroundRect, editorElement)
                        },
                        {
                            caption: '_; Select from task lists; Seleccionar de listas de tareas; Wybierz z listy zadań',
                            action: (btt, aroundRect) => runEditorPopupExplorer4SelectFromTaskLists(btt, aroundRect, editorElement)
                        },
                        {
                            separator: true
                        },
                        {
                            caption: '_; New note; Nueva nota; Nowa notatka',
                            action: () => runNoteCreator4Editor(editorElement)
                        },
                        {
                            caption: '_; Add file; Añadir archivo; Dodaj plik',
                            action: () => runFileAttacher4Editor(editorElement)
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
    let isEditorFocused = false;

    function activateFormattingTools(editorElement)
    {
        isEditorFocused = true;
        activateItem('props', descriptionActive, getPageOperationsWithFormattingTools(editorElement))
    }

    function deactivateFormattingToolsIfNeeded(editorElement)
    {
        isEditorFocused = false;
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

            const res = await reef.post(`${activeNoteRef}/Images/blob?name=${file.name}&size=${resizedImage.size}`, {}, onErrorShowAlert)
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
                        const dataPath = `${activeNoteRef}/Images/blob?key=${newKey}`

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


            let fileLink = await reef.post(`${activeNoteRef}/CreateFile`,
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
                    action: (f) => askToDeleteAttachement(element, kind)
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
        await reef.post(`${activeNoteRef}/CopyNoteToBasket`, { noteLink: forNote.$ref } , onErrorShowAlert);
    }

    async function cutNoteToBasket(forNote)
    {
        await reef.post(`${activeNoteRef}/CutNoteToBasket`, { noteLink: forNote.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function copyFileToBasket(file)
    {
        await reef.post(`${activeNoteRef}/CopyFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
    }

    async function cutFileToBasket(file)
    {
        await reef.post(`${activeNoteRef}/CutFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
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
        await reef.post(`${activeNoteRef}/DettachNote`, { noteLink: forNote.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function dettachFile(file)
    {
        await reef.post(`${activeNoteRef}/DettachFile`, { fileLink: file.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
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
            await reef.post(`${activeNoteRef}/DeletePermanentlyNote`, { noteLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await reloadData();
            if(attachementsComponent)
                attachementsComponent.reload(activeNote, attachementsComponent.SELECT_NEXT);
            else
                clearActiveItem('props')
            break;

        case 'UploadedFile':
        case 'NoteFile':
            await reef.post(`${activeNoteRef}/DeletePermanentlyFile`, { fileLink: objectToDelete.$ref } , onErrorShowAlert);
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
        let res = await reef.post(`${activeNoteRef}/CreateSubNote`,{
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

    async function addThreadResponse()
    {
        let res = await reef.post(`${noteRef}/AddPost`,{
            content: ''})

        if(!res)
            return null;

        let newNote = res.NoteNote;

        await reloadData();
        await tick();

        if(threadResponses && threadResponses.length > 0)
        {
            const activeEditor = threadResponses[threadResponses.length-1]
            activeEditor.run();
            activeEditor.scrollIntoView({ block: "end" })
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
            <Breadcrumb class="mt-1 sm:min-w-[65ch]" path={note.GetCanonicalPath}/>
        </PaperHeader>

        <div class="w-full flex flex-row justify-between">
            <!--span>Eidt<self=note a='index'/></span-->

            <span>
                {getNiceStringDate(creationDate)}
            </span>
        </div>


        <!--h1>
            <REdit self={note} a='Title'/>
        </h1-->
        <h1><Editable self={note} a='Title' readonly={isReadOnly}/></h1>



        <div class="w-full flex flex-row flex-wrap justify-between">
            <div class="grow-0">
                {#if note.CreatedBy}
                    {@const href = `${note.CreatedBy.href}`}
                    <a {href} use:link> {note.CreatedBy.Name} </a>
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
                            readOnly={isReadOnly || (noteRef!=activeNoteRef)}
                            disableHeadings={isThread}
                            onFocusCb={() => activateFormattingTools(description)}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded(description)}
                            onAddImage={uploadImage}
                            onRemoveImage={removeImage}
                            onLinkClick={editorLinkClicked}
                            extraInsertPaletteCommands={() => extraInsertPalletteCommands(description)}/>

            {#if isThread && (noteRef != activeNoteRef) && note.attachements && note.attachements.length > 0}
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
                    {@const subNote = subNoteLink.Note}
                    {#if subNote.Kind == NK_POST}
                        <hr/>
                        <h4>{subNote.CreatedBy.Name} {getNiceStringDateTime(subNote.CreationDate)}</h4>
                        <Editor     on:click={(e) => e.stopPropagation()}
                                    a='Content'
                                    self={subNote}
                                    compact={true}
                                    bind:this={threadResponses[subNoteIdx]}
                                    readOnly={subNote.$ref!=activeNoteRef}
                                    disableHeadings={isThread}
                                    onFocusCb={() => activateFormattingTools(threadResponses[subNoteIdx])}
                                    onBlurCb={() => deactivateFormattingToolsIfNeeded(threadResponses[subNoteIdx])}
                                    onAddImage={uploadImage}
                                    onRemoveImage={removeImage}
                                    onLinkClick={editorLinkClicked}
                                    extraInsertPaletteCommands={() => extraInsertPalletteCommands(threadResponses[subNoteIdx])}/>

                        {#if subNote.$ref!=activeNoteRef && subNote.attachements && subNote.attachements.length > 0}
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

            {#if (activeNote.attachements && activeNote.attachements.length > 0) || notesPlaceholder}
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

            <h2>_; Attached to; Adjunto a; Przyłączony do</h2>
            <section>
                <List   self={note}
                        a='connectedToList'
                        list_properties={attached_to_list_properties}
                        bind:this={connectedToComponent}
                        toolbarOperations = {(el) => connectedToOperations(el)}>
                </List>
            </section>





    </Paper>

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/> <!-- capture="environment" -->
    <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>
</Page>

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