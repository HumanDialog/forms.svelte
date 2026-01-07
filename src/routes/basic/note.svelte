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
            List, ListTitle, ListSummary, ListInserter, Icon,
            reloadPageToolbarOperations, Paper, PaperHeader, focusEditable
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
    let note = null;
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


    $: onParamsChanged($location)

    async function onParamsChanged(...args)
    {
        //console.log('note: ', $location)
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
            pushBrowserRecentElements( note.Id, note.$type, note.$ref, note.Title, note.Summary, "Note", note.href)
    }

    async function reloadData()
    {
        if(!noteRef)
            return;

        let res = await reef.post(`${noteRef}/query`,
                        {
                            Id: 1,
                            Name: "collector",
                            ExpandLevel: 3,
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
                                            Expressions:['$ref', 'InTitle', 'InSummary', 'InHRef', 'IsCanonical', '$type']
                                        },

                                        {
                                            Id: 16,
                                            Association: 'Notes',
                                            Sort: 'Order',
                                            Expressions:['Id', '$ref', 'Title', 'Summary', 'href', 'IsCanonical', '$type', 'NoteId', 'Order']
                                        },
                                        {
                                            Id: 17,
                                            Association: 'Files',
                                            Sort: 'Order',
                                            Expressions:['Id', '$ref', 'Title', 'Summary', 'href', 'IsCanonical', '$type', 'FileId', 'Order']
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


        if(note.AttachedFiles)
        {
            attachedFiles = []
            const names = note.AttachedFiles.split(';');
            names.forEach(n => {
                attachedFiles.push({
                    name: n,
                    downloading: false
                })
            })
        }

        note.connectedToList = []
        if(note.InFolders)
            note.InFolders.forEach((f) => note.connectedToList.push(f))

        if(note.InTasks)
            note.InTasks.forEach((f) => note.connectedToList.push(f))

        if(note.InNotes)
            note.InNotes.forEach((f) => note.connectedToList.push(f))

        note.attachements = []
        if(note.Notes && note.Notes.length > 0)
            note.Notes.forEach((n) => note.attachements.push(n))

        if(note.Files && note.Files.length > 0)
            note.Files.forEach((n) => note.attachements.push(n))

        if(note.attachements && note.attachements.length > 0)
            note.attachements.sort((a,b) => a.Order-b.Order)
    }


    function onPropertySingleChange(txt, attrib)
    {
        //note[attrib] = txt
        //informModification(note, attrib)
        informModificationEx(note.$type, note.Id, attrib, txt)
        refreshToolbarOperations()
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
    /*    {
            caption: '_; Attachement; Anexo; Załącznik',
       //     icon: FaFile,
            action: async (f) => runFileAttacher()
        },
    */
   /*    {
            caption: '_; Content; Contenido; Treść',
        //    icon: FaAlignLeft,
            action: async (f) =>
                {
                    if(description)
                        description.run();
                    else
                    {
                        descriptionPlaceholder = true;
                        await tick();
                        description?.run(() => {descriptionPlaceholder = false})
                    }
                }
        }
    */
    ];

    function getPageOperations()
    {
        const insertOperations = [
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
                    action: runPopupExplorer4Note
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

        const sendOperations = [
                {
                    caption: '_; Copy; Copiar; Kopiuj',
                    action: (f) => copyTaskToBasket(),
                },
                {
                    caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                    action: (btt, rect) => runPopupExplorerToPlaceElement(btt, rect, note)
                }
        ]

        let operations = []

        if(!isReadOnly)
        {
            operations.push(
                {
                    caption: '_; Edit...; Editar...; Edytuj...',
                    mricon: 'pencil',
                    grid: addOperations,
                    disabled: isReadOnly,
                    fab: 'M20',
                    tbr: 'A'
                })
        }
        else if(canBeEditable)
        {
            operations.push(
                {
                    caption: '_; Enable editing; Activar edición; Włącz edytowanie',
                    mricon: 'pencil',
                    action: (f) => enableEditing(),
                    fab: 'M20',
                    tbr: 'A'
                })
        }

        operations.push(
            {
                caption: '_; Send; Enviar; Wyślij',
                mricon: 'upload',
                hideToolbarCaption: true,
                tbr: 'D',
                fab: 'S00',
                menu: sendOperations
            })

        if(!isReadOnly)
        {
            operations.push(
                {
                    mricon: 'download',
                    caption: '_; Insert; Insertar; Wstaw',
                    hideToolbarCaption: true,
                    disabled: isReadOnly,
                    tbr: 'C',
                    fab: 'S10',
                    menu: insertOperations
                })


            operations.push(
                {
                    caption: '_; Save; Guardar; Zapisz',
                    hideToolbarCaption: true,
                    mricon: 'save',
                    action: (f) => pushChanges(),
                    fab: 'T02',
                    tbr: 'C',
                    //disabledFunc: () => !hasModifications()
                })
        }

        if(operations.length > 0)
            operations.push({separator: true})

        operations.push(pinOp())

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
                destinationContainer: noteRef,
                onRefreshView: async (f) => await reloadWithAttachements(),
                clipboardElements: clipboardElements
            }
        )
    }

    async function pasteRecentClipboardElement4Note(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4Note()
        if(clipboardElements && clipboardElements.length > 0)
        {
            const references = transformClipboardToJSONReferences([clipboardElements[0]])
            const res = await reef.post(`${noteRef}/AttachClipboard`, { references: references }, onErrorShowAlert)
            if(res)
                await reloadWithAttachements();

        }
    }

    async function runPasteBrowserRecent4Note(btt, aroundRect)
    {
        const clipboardElements = getBrowserRecentElements()
        showFloatingToolbar(aroundRect, BasketPreview, {
            destinationContainer: noteRef,
            onRefreshView: async (f) => await reloadWithAttachements(),
            clipboardElements: clipboardElements,
            browserBasedClipboard: true
        })
    }

    async function runPopupExplorer4Note(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            destinationContainer: noteRef,
            onRefreshView: async (f) => await reloadWithAttachements(),
            ownCloseButton: true
        })
    }

    async function runPopupExplorerToPlaceElement(btt, aroundRect, element)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            canSelectRootElements: true,
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
        attachementsComponent?.reload(note, attachementsComponent.CLEAR_SELECTION);
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



    function getPageOperationsWithFormattingTools()
    {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            preAction: description.preventBlur,
            operations: [
                {
                    caption: '_; Styles; Estilos; Style',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: '_; Heading 1; Título 1; Nagłówek 1',
                            mricon: 'heading-1',
                            tbr: 'A',
                            hideToolbarCaption: true,
                            action: (f) => description.setHeading(1),
                            activeFunc: description.isActiveH1
                        },
                        {
                            caption: '_; Heading 2; Título 2; Nagłówek 2',
                            mricon: 'heading-2',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setHeading(2),
                            activeFunc: description.isActiveH2
                        },
                        {
                            caption: '_; Heading 3; Título 3; Nagłówek 3',
                            mricon: 'heading-3',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setHeading(3),
                            activeFunc: description.isActiveH3
                        },
                        {
                            caption: '_; Heading 4; Título 4; Nagłówek 4',
                            mricon: 'heading-4',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setHeading(4),
                            activeFunc: description.isActiveH4
                        },
                        {
                            caption: '_; Normal; Normal; Normalny',
                            mricon: 'pilcrow',
                            tbr: 'A',
                            hideToolbarCaption: true,
                            action: (f) => description.setNormal(),
                            activeFunc: description.isActiveNormal,
                        },
                        {
                            caption: '_; Code; Código; Kod',
                            mricon: 'code-xml',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setCode(),
                            activeFunc: description.isActiveCode
                        },
                        {
                            caption: '_; Quote; Cita; Cytat',
                            mricon: 'text-quote',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setQuote(),
                            activeFunc: description.isActiveQuote
                        },
                        {
                            caption: '_; BulletList; Lista con viñetas; Lista punktowana',
                            mricon: 'list',
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setBulletList(),
                            activeFunc: description.isActiveBulletList

                        },
                    ]
                },
                {
                    caption: '_; Text; Texto; Tekst',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: '_; Bold; Negrita; Pogrubiony',
                            mricon: 'bold',
                            action: (f) => description.setBold(),
                            activeFunc: description.isActiveBold,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Italic; Cursiva; Kursywa',
                            mricon: 'italic',
                            action: (f) => description.setItalic(),
                            activeFunc: description.isActiveItalic,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Underline; Subrayar; Podkreślenie',
                            mricon: 'underline',
                            action: (f) => description.setUnderline(),
                            activeFunc: description.isActiveUnderline,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Strikethrough; Tachado; Przekreślenie',
                            mricon: 'strikethrough',
                            action: (f) => description.setStrikethrough(),
                            activeFunc: description.isActiveStrikethrough,
                        },
                    ]
                },
                {
                    caption: '_; Insert; Insertar; Wstaw',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: '_; Image; Imagen; Obraz',
                            mricon: 'image',
                            action: (f) => description.setImage(),
                            activeFunc: description.isActiveImage,
                            tbr: 'A', hideToolbarCaption: true
                        },
                        {
                            caption: '_; Table; Tabla; Tabela',
                            mricon: 'table',
                            action: (f) => description.setTable(),
                            activeFunc: description.isActiveTable
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
                    preAction: description.preventBlur,
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
                            tbr: 'D',
                            fab: 'S00',
                            menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyTaskToBasket(),
                                    },
                                    {
                                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                                        action: (btt, rect) => runPopupExplorerToPlaceElement(btt, rect, note)
                                    }
                                ]

                        },
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
                                    action: runPopupExplorer4Note
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
                        },
                        {
                            caption: '_; Save; Guardar; Zapisz',
                            hideToolbarCaption: true,
                            mricon: 'save',
                            action: (f) => description?.save(),
                       //     fab: 'S00',
                            tbr: 'C',
                            disabledFunc: () => !hasModifications()
                        },
                    ]
                }
            ]
        }

    }
    const extraPaletteCommands = []

    const extraPaletteCommandsExt = [
        {
            caption: '_; Save; Guardar; Zapisz',
            mricon: 'save',
            action: () => description?.save(),
        }

    ]
    const extraInsertPalletteCommands = [
        {
            mricon: 'download',
            caption: '_; Insert; Insertar; Wstaw',
            //tbr: 'C',
            //fab: 'S10',
            action: () => {
                const operations = [
                    {
                        caption: '_; Paste; Pegar; Wklej',
                        action: pasteRecentClipboardElement4Editor
                    },
                    {
                        caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                        action: runPasteBasket4Editor
                    },
                    {
                        caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                        action: runPasteBrowserRecent4Editor
                    },
                    {
                        caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                        action: runPopupExplorer4Editor
                    },
                    {
                        separator: true
                    },
                    {
                        caption: '_; New note; Nueva nota; Nowa notatka',
                        action: () => runNoteCreator4Editor()
                    },
                    {
                        caption: '_; Add file; Añadir archivo; Dodaj plik',
                        action: () => runFileAttacher4Editor()
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

    async function runPasteBasket4Editor(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4Editor()

        showFloatingToolbar(aroundRect, BasketPreview,
            {
                onAttach: (clipboard, elements) => makeLinkToElement(elements),
                //onAttachAndClear: (clipboard, elements) => makeLinkToElement(elements),
                clipboardElements: clipboardElements
            }
        )
    }

    async function pasteRecentClipboardElement4Editor(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4Editor()
        if(clipboardElements && clipboardElements.length > 0)
        {
            const references = transformClipboardToJSONReferences([clipboardElements[0]])
            makeLinkToElement(references)
        }
    }

    async function runPasteBrowserRecent4Editor(btt, aroundRect)
    {
        const clipboardElements = getBrowserRecentElements()
        showFloatingToolbar(aroundRect, BasketPreview, {
            onAttach: (clipboard, elements) => makeLinkToElement(elements),
            clipboardElements: clipboardElements,
            browserBasedClipboard: true
        })
    }

    async function runPopupExplorer4Editor(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            onAttach: (clipboard, elements) => makeLinkToElement(elements),
            ownCloseButton: true
        })
    }

    async function runNoteCreator4Editor()
    {
        const cursorPos = description.getCurrentCursorPos()

        const insertNewNoteLink = async (newNote) => {
            const res = await reef.get(`${newNote.$ref}?fields=Title,href`, onErrorShowAlert)
            const note = res.NoteNote
            description.setCursorPos(cursorPos)
            makeLinkToElement([{
                Title: note.Title,
                href: note.href
            }])
        }

        runNoteInserter(insertNewNoteLink)
    }

    async function runFileAttacher4Editor()
    {
        const cursorPos = description.getCurrentCursorPos()

        const insertNewFileLink = async (newFile) => {
            const res = await reef.get(`${newFile.$ref}?fields=Title,href`, onErrorShowAlert)
            const file = res.NoteFile
            description.setCursorPos(cursorPos)

            makeLinkToElement([{
                Title: file.Title,
                href: file.href
            }])
        }

        runFileAttacher(insertNewFileLink)
    }

    function makeLinkToElement(elements)
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

                description.addLink(el.Title, href)
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

    const extraBackPaletteCommands = []
    const extraBackPaletteCommandsExt = [
        {
            caption: '_; Send; Enviar; Wyślij',
            mricon: 'upload',
            menu: [
                    {
                        caption: '_; Copy; Copiar; Kopiuj',
                        action: () => copyTaskToBasket(),
                    },
                    {
                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                        action: (btt, rect) => runPopupExplorerToPlaceElement(btt, rect, note)
                    }
                ],
        }
    ]

    const descriptionActive = { }
    let isEditorFocused = false;

    function activateFormattingTools()
    {
        isEditorFocused = true;
        activateItem('props', descriptionActive, getPageOperationsWithFormattingTools())
    }

    function deactivateFormattingToolsIfNeeded()
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

            const res = await reef.post(`${noteRef}/Images/blob?name=${file.name}&size=${resizedImage.size}`, {}, onErrorShowAlert)
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
                        const dataPath = `${noteRef}/Images/blob?key=${newKey}`

                        //console.log('upload success for ', dataPath)
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


            let fileLink = await reef.post(`${noteRef}/CreateFile`,
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
            attachementsComponent.reload(note, fileLink.$ref);

            if(additionalAfterCreateAction)
                additionalAfterCreateAction(fileLink)
        }
    }

    /*async function onAttachementSelected()
    {
        const [file] = attInput.files;
        if(file)
        {
            pendingUploading = true

            const res = await reef.post(`${noteRef}/AttachedFiles/blob?name=${file.name}&size=${file.size}`, {}, onErrorShowAlert)
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
                                                    'Content-Type': file.type
                                                }),
                                                body: file})
                    if(res.ok)
                    {
                        // todo: editor path imgPath

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
    */

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
            /*    {
                    caption: '_; Set as primary location; Establecer como ubicación principal; Ustaw jako główną lokalizację',
                    action: (f) => setAttachementLocationAsCanonical(element, kind)
                }*/
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
                                tbr: 'D',
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
                                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                                        action: (btt, rect) => runPopupExplorerToPlaceElement(btt, rect, element)
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
        await reef.post(`${noteRef}/CopyNoteToBasket`, { noteLink: forNote.$ref } , onErrorShowAlert);
    }

    async function cutNoteToBasket(forNote)
    {
        await reef.post(`${noteRef}/CutNoteToBasket`, { noteLink: forNote.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(note, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function copyFileToBasket(file)
    {
        await reef.post(`${noteRef}/CopyFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
    }

    async function cutFileToBasket(file)
    {
        await reef.post(`${noteRef}/CutFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(note, attachementsComponent.SELECT_NEXT);
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
        await reef.post(`${noteRef}/DettachNote`, { noteLink: forNote.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(note, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function dettachFile(file)
    {
        await reef.post(`${noteRef}/DettachFile`, { fileLink: file.$ref } , onErrorShowAlert);
        await reloadData();
        if(attachementsComponent)
            attachementsComponent.reload(note, attachementsComponent.SELECT_NEXT);
        else
            clearActiveItem('props')
    }

    async function setAttachementLocationAsCanonical(element, kind)
    {
        await reef.get(`${element.$ref}/SetLocationAsCanonical`, onErrorShowAlert)
        await reloadData();

        switch(kind)
        {
        case 'Note':
        case 'NoteNote':
            attachementsComponent.reload(note, attachementsComponent.KEEP_SELECTION);
        case 'UploadedFile':
        case 'NoteFile':
            attachementsComponent.reload(note, attachementsComponent.KEEP_SELECTION);
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
            await reef.post(`${noteRef}/DeletePermanentlyNote`, { noteLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await reloadData();
            if(attachementsComponent)
                attachementsComponent.reload(note, attachementsComponent.SELECT_NEXT);
            else
                clearActiveItem('props')
            break;

        case 'UploadedFile':
        case 'NoteFile':
            await reef.post(`${noteRef}/DeletePermanentlyFile`, { fileLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await reloadData();
            if(attachementsComponent)
                attachementsComponent.reload(note, attachementsComponent.SELECT_NEXT);
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
        let res = await reef.post(`${noteRef}/CreateSubNote`,{
            title: newNoteAttribs.Title,
            input: '',
            order: 0
        }, onErrorShowAlert)

        if(!res)
            return null;

        let newNote = res.NoteNote;
        setBrowserRecentElement(newNote.NoteId, 'Note')

        await reloadData();
        attachementsComponent.reload(note, newNote.$ref);

        if(additionalAfterCreateAction)
        {
            additionalAfterCreateAction(newNote)
        }
    }
    let list_properties = {
        Title: "Title",
        Summary: "Summary",
        icon: "icon",
        element:{
            icon: "icon",
            href: "href",
            Title: "Title",
            Summary: "Summary"
        },
        context:{
            Folder:{
                Summary: "Summary",

            },
            FolderFolder:{
                Title:      "InTitle",
                Summary:    "InSummary",
                icon:       "#folder",
                head_right: "ModificationDate"
            },
            NoteNote:{
                icon:'#file-text'
            }
        }
    }

    let attached_to_list_properties = {
        Title: "Title",
        Summary: "Summary",
        icon: "icon",
        element:{
            icon: "icon",
            href: "href",
            Title: "Title",
            Summary: "Summary"
        },
        context:{
            FolderNote:{
                Title:      "InTitle",
                icon:       "#folder",
                Summary:    "InSummary",
                href:       "InHRef"

            },
            TaskNote:{

                Summary: "Summary",
                head_right: "ModificationDate"
            },
            NoteNote:{
                Title:      "InTitle",
                icon:'#file-text'
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


{#key noteId + (isReadOnly ? 100000 : 200000)}
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



            {#if attachedFiles && attachedFiles.length > 0}
            <!--p>
                {#each attachedFiles as fileInfo (fileInfo.name)}
                    <AttachedFile self={note} a='AttachedFiles' {fileInfo}/>
                {/each}
            </p-->
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
                            readOnly={isReadOnly}
                            onFocusCb={() => activateFormattingTools()}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded()}
                            onAddImage={uploadImage}
                            onRemoveImage={removeImage}
                            onLinkClick={editorLinkClicked}
                            extraFrontPaletteCommands={extraPaletteCommands}
                            extraInsertPaletteCommands={extraInsertPalletteCommands}
                            extraBackPaletteCommands={extraBackPaletteCommands}/>
                {#if  isContentEmpty() && !isEditorFocused && !isReadOnly}
                    <p

                    >
                    _;
                    Write the content of your note here. Press the / key to expand the formatting palette.;
                    Escribe aquí el contenido de la nota. Pulsa la tecla / para desplegar la paleta de formato.;
                    Pisz treść notatki tutaj. Naciśnij klawisz / by rozwinąć paletę formatującą.
                    </p>
                {/if}



            <hr/>

            {#if (note.Notes && note.Notes.length > 0) || (note.Files && note.Files.length > 0) || notesPlaceholder}
                <h2>_;Attachments; Anexos; Załączniki</h2>
                <section>
                    {#if (note.attachements && note.attachements.length > 0) || notesPlaceholder}
                        <List   self={note}
                                a='attachements'
                                {list_properties}
                                bind:this={attachementsComponent}
                                orderAttrib='Order'
                                toolbarOperations={(el) => attachementOperations(el, el.$type)}>

                            <ListInserter   action={addEmptyNote} icon incremental={false}/>

                        </List>
                    {/if}

                    {#if note.Files && note.Files.length > 0}
                        <!--List   self={note}
                                a='Files'
                                bind:this={attachementsFilesComponent}
                                toolbarOperations={(el) => attachementOperations(el, 'NoteFile')}>

                            <ListTitle      a='Title'
                                            hrefFunc={(el) => `${el.href}`}
                                            downloadable
                                            onOpen={async (f) => await downloadFileFromHRef(f.href, f.Title)}
                                            onChange={changeAttachementProperty}/>

                            <ListSummary    a='Summary'
                                            onChange={changeAttachementProperty}/>

                            <span slot="left" let:element class="relative">
                                <Icon component={getElementIcon('File')}
                                    class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1"/>
                                {#if element.IsCanonical == 0}
                                    <Icon component={FaExternalLinkSquareAlt}
                                        class="absolute left-1 top-1/2 w-1/2 h-1/2
                                                text-stone-500 dark:text-stone-300 " />
                                {/if}
                            </span>
                        </List-->
                    {/if}
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