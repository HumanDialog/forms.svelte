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
			saveCurrentEditable,
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
			pushChanges,
            hasModifications,
            refreshToolbarOperations,
            informModificationEx,
            Breadcrumb, i18n, UI,
			showFloatingToolbar,
			randomString,
            showMenu,
            SHOW_MENU_BELOW,
            ext
            } from '$lib'
	import { onMount, tick } from 'svelte';

    import {location, querystring, push, link} from 'svelte-spa-router'

    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo, FaSave, FaCloudUploadAlt, FaFont, FaPen, FaList, FaRegShareSquare, FaFileDownload,
        FaImage, FaTable, FaPaperclip, FaBold, FaItalic, FaUnderline, FaStrikethrough, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle,
        FaInfo, FaListUl, FaLink, FaRegFolder, FaRegCalendar, FaRegFile
    } from 'svelte-icons/fa/'


    import AttachedFile from './attached.file.svelte'
    import BasketPreview from './basket.preview.svelte'
    import PopupExplorer from './popup.explorer.svelte'
    import {fetchComposedClipboard4Editor, fetchComposedClipboard4Note, transformClipboardToJSONReferences, pushBrowserRecentElements, setBrowserRecentElement, getBrowserRecentElements} from './basket.utils'

    let noteRef = ''
    let note = null;
    let allTags = '';

    let availableStates = [];
    let pendingUploading = false;
    let isReadOnly = false;
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

        const taskId = segments[segments.length-1]
        noteRef = `./Note/${taskId}`

        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags = res
            reloadVisibleTags()
        })

       await reloadData();

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
                                            Association: 'InFolders/Folder',
                                            Expressions:['$ref', 'Title', 'href']
                                        },
                                        {
                                            Id: 14,
                                            Association: 'InTasks/Task',
                                            Expressions:['$ref', 'Title', 'href']
                                        },
                                        {
                                            Id: 15,
                                            Association: 'InNotes/InNote',
                                            Expressions:['$ref', 'Title', 'href']
                                        },

                                        {
                                            Id: 16,
                                            Association: 'Notes',
                                            Expressions:['$ref', 'Title', 'href']
                                        },
                                        {
                                            Id: 17,
                                            Association: 'Files',
                                            Expressions:['$ref', 'Title', 'href']
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

    }

    async function onTitleChanged(text)
    {
        note.Title = text;
        informModification(note, 'Title')
        pushChanges(refreshToolbarOperations)
        //await reef.post(`${noteRef}/SetTitle`, {val: text}, onErrorShowAlert)
    }

    async function onSummaryChanged(text)
    {
        note.Summary = text;
        informModification(note, 'Summary')
        pushChanges(refreshToolbarOperations)
        //await reef.post(`${noteRef}/SetSummary`, {val: text}, onErrorShowAlert)

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

    
    let summary;
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
                    if(summary)
                        summary.focus();
                    else
                    {
                        summaryPlaceholder = true;
                        await tick();
                        summary?.focus();
                    }
                }
        },


        {
            caption: '_; Tag; Etiqueta; Etykieta',
            icon: FaTag,
            action: async (f) => runTagInserter()
        },

        {
            separator: true
        },
        {
            caption: '_; Attachement; Anexo; Załącznik',
            icon: FaFileDownload,
            action: async (f) => runFileAttacher()
        },
        {
            caption: '_; Content; Contenido; Treść',
            icon: FaAlignLeft,
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
    ];

    function getPageOperations()
    {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'C',
            operations: [
                {
                    caption: '_; Note; Nota; Notatka',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: '_; Save; Guardar; Zapisz',
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => saveCurrentEditable(),
                            fab: 'T02',
                            tbr: 'C',
                            disabledFunc: () => !hasModifications()
                        },
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            icon: FaPen,
                            grid: addOperations,
                            fab: 'M20',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Send to...; Enviar a...; Wyślij do ...',
                            icon: FaRegShareSquare,   // MdLibraryAdd
                            menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyTaskToBasket(),
                                    },
                                    {
                                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                                        disabled: true
                                    }
                                ], 
                            fab: 'M30',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Insert; Insertar; Wstaw',
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
                                }
                            ]
                        },
                        {
                            separator: true
                        },
                        pinOp()
                    ]
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

    async function runPasteBasket4Note(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4Note()

        showFloatingToolbar(aroundRect, BasketPreview, 
            {
                destinationContainer: noteRef,
                onRefreshView: async (f) => await reloadData(),
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
                await reloadData();
            
        }
    }

    async function runPasteBrowserRecent4Note(btt, aroundRect)
    {
        const clipboardElements = getBrowserRecentElements()
        showFloatingToolbar(aroundRect, BasketPreview, {
            destinationContainer: noteRef,
            onRefreshView: async (f) => await reloadData(),
            clipboardElements: clipboardElements,
            browserBasedClipboard: true
        })
    }

    async function runPopupExplorer4Note(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            destinationContainer: noteRef,
            onRefreshView: async (f) => await reloadData()
        })
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
            tbr: 'C',
            preAction: description.preventBlur,
            operations: [
                {
                    caption: '_; Styles; Estilos; Style',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: '_; Heading 1; Título 1; Nagłówek 1',
                            icon: IcH1,
                            tbr: 'A',
                            hideToolbarCaption: true,
                            action: (f) => description.setHeading(1),
                            activeFunc: description.isActiveH1
                        },
                        {
                            caption: '_; Heading 2; Título 2; Nagłówek 2',
                            icon: IcH2,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setHeading(2),
                            activeFunc: description.isActiveH2
                        },
                        {
                            caption: '_; Heading 3; Título 3; Nagłówek 3',
                            icon: IcH3,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setHeading(3),
                            activeFunc: description.isActiveH3
                        },
                        {
                            caption: '_; Heading 4; Título 4; Nagłówek 4',
                            icon: IcH4,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setHeading(4),
                            activeFunc: description.isActiveH4
                        },
                        {
                            caption: '_; Normal; Normal; Normalny',
                            icon: FaRemoveFormat,
                            tbr: 'A',
                            hideToolbarCaption: true,
                            action: (f) => description.setNormal(),
                            activeFunc: description.isActiveNormal,
                        },
                        {
                            caption: '_; Code; Código; Kod',
                            icon: FaCode,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setCode(),
                            activeFunc: description.isActiveCode
                        },
                        {
                            caption: '_; Quote; Cita; Cytat',
                            icon: FaQuoteRight,
                            tbr: 'A',hideToolbarCaption: true,
                            action: (f) => description.setQuote(),
                            activeFunc: description.isActiveQuote
                        },
                        {
                            caption: '_; BulletList; Lista con viñetas; Lista punktowana',
                            icon: FaListUl,
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
                            icon: FaBold,
                            action: (f) => description.setBold(),
                            activeFunc: description.isActiveBold,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Italic; Cursiva; Kursywa',
                            icon: FaItalic,
                            action: (f) => description.setItalic(),
                            activeFunc: description.isActiveItalic,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Underline; Subrayar; Podkreślenie',
                            icon: FaUnderline,
                            action: (f) => description.setUnderline(),
                            activeFunc: description.isActiveUnderline,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Strikethrough; Tachado; Przekreślenie',
                            icon: FaStrikethrough,
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
                            icon: FaImage,
                            action: (f) => description.setImage(),
                            activeFunc: description.isActiveImage,
                            tbr: 'A', hideToolbarCaption: true
                        },
                        {
                            caption: '_; Table; Tabla; Tabela',
                            icon: FaTable,
                            action: (f) => description.setTable(),
                            activeFunc: description.isActiveTable
                        },
                        {
                            caption: '_; Attachement; Anexo; Załącznik',
                            icon: FaPaperclip,
                            action: (f) => runFileAttacher(),
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: '_; Tag; Etiqueta; Etykieta',
                            icon: FaTag,
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
                            caption: '_; Save; Guardar; Zapisz',
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => description?.save(),
                       //     fab: 'S00',
                            tbr: 'C',
                            disabledFunc: () => !hasModifications()
                        },
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            icon: FaPen,
                            grid: addOperations,
                        //    fab: 'M10',
                        //    tbr: 'A'
                        },
                        {
                            caption: '_; Send to...; Enviar a...; Wyślij do ...',
                            icon: FaRegShareSquare,
                            menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyTaskToBasket(),
                                    },
                                    {
                                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                                        disabled: true
                                    }
                                ], 
                        //   fab: 'M30',
                        //    tbr: 'A'

                        },
                        {
                            caption: '_; Insert; Insertar; Wstaw',
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
                                }
                            ]
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
            icon: FaSave,
            action: () => description?.save(),
        }
        
    ]
    const extraInsertPalletteCommands = [
        {
            icon: FaLink,
            caption: '_; Insert; Insertar; Wstaw',
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
                    }
                ]

                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const aroundRect = range.getBoundingClientRect();

                showMenu(aroundRect, operations, SHOW_MENU_BELOW)
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
            onAttach: (clipboard, elements) => makeLinkToElement(elements)
        })
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
            icon: FaPaperclip,
            action: runFileAttacher
        },
        {
            caption: '_; Tag; Etiqueta; Etykieta',
            icon: FaTag,
            action: () => setTimeout(() => runTagInserter(), 500)
        }
    ]

    const extraBackPaletteCommands = []
    const extraBackPaletteCommandsExt = [
        {
            caption: '_; Send to...; Enviar a...; Wyślij do ...',
            icon: FaRegShareSquare,   // MdLibraryAdd
            menu: [
                    {
                        caption: '_; Copy; Copiar; Kopiuj',
                        action: () => copyTaskToBasket(),
                    },
                    {
                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                        disabled: true
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
    function runFileAttacher()
    {
        attInput?.click();
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

    

</script>

<svelte:head>
    {#if note && note.Title}
        <title>{note.Title} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>

{#if note != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={note}
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title={note.Title}>
    <section class="w-full flex flex-col items-center">
        {#if note.GetCanonicalPath}
                <Breadcrumb class="mt-1 sm:min-w-[65ch]" path={note.GetCanonicalPath}/>
            {/if}
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2 prose-img:rounded-xl ">
            

            <section class="w-full flex flex-row justify-between">
                
                    <p class="">
                        {note.Index}
                    </p>
                    <!--div>
                        {#if note.TaskList || onListPlaceholder}
                            <Combo  compact
                                    inContext='data'
                                    a='TaskList'
                                    isAssociation
                                    icon={false}
                                    placeholder='List'
                                    s='prose'
                                    hasNone={false}
                                    bind:this={onList}>
                                <ComboSource    objects={allLists}
                                                key="$ref"
                                                name='Name'/>
                            </Combo>
                        {/if}
                    </div-->
                    <div>
                        {#if creationDate}
                            <p>
                                {getNiceStringDate(creationDate)}
                            </p>
                        {/if}
                    </div>
            </section>

            <h1     class=""
                    use:editable={{
                        action: (text) => onTitleChanged(text),
                        onSingleChange: (txt) => onPropertySingleChange(txt, 'Title'),
                        active: true,
                        readonly: isReadOnly}}
                        tabindex="0">
                {note.Title}
            </h1>

            {#if note.Summary || summaryPlaceholder}
                {#key note.Summary}
                    <p  class="lead"
                        use:editable={{
                            action: (text) => onSummaryChanged(text),
                            onSingleChange: (txt) => onPropertySingleChange(txt, 'Summary'),
                            active: true,
                            readonly: isReadOnly}}
                        tabindex="0"
                        bind:this={summary}>
                        {note.Summary}
                    </p>
                {/key}

           {/if}

            <section class="w-full flex flex-row flex-wrap justify-between">
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
                            bind:this={tags}/>
                    {/if}
                </div>
            </section>


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
            <div class="relative">
                <Editor     class="mb-40"
                            a='Content'
                            compact={true}
                            bind:this={description}
                            onFocusCb={() => activateFormattingTools()}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded()}
                            onAddImage={uploadImage}
                            onRemoveImage={removeImage}
                            onLinkClick={editorLinkClicked}
                            extraFrontPaletteCommands={extraPaletteCommands}
                            extraInsertPaletteCommands={extraInsertPalletteCommands}
                            extraBackPaletteCommands={extraBackPaletteCommands}/>
                {#if isContentEmpty() && !isEditorFocused}
                    <div
                        class="absolute top-0 left-0 text-gray-400 italic pointer-events-none select-none"
                    >
                    _;
                    Write the content of your note here. Press the / key to expand the formatting palette.;
                    Escribe aquí el contenido de la nota. Pulsa la tecla / para desplegar la paleta de formato.;
                    Pisz treść notatki tutaj. Naciśnij klawisz / by rozwinąć paletę formatującą.
                    </div>
                {/if}
            </div>
            

            <hr/>

            {#if (note.Notes && note.Notes.length > 0) || (note.Files && note.Files.length > 0)}
                <h4>_;Attachments; Anexos; Załączniki</h4>
                <p>
                    {#if note.Notes && note.Notes.length > 0}
                        {#each note.Notes as note}
                            <a  class="mr-2 underline whitespace-nowrap" href={'#'+note.href}>
                                <span class="inline-block w-4 h-4 relative top-0.5">
                                    <FaRegFile/>
                                </span>
                                <span class="">
                                    {note.Title}
                                </span>
                            </a>        
                        {/each}
                    {/if}

                    {#if note.Files && note.Files.length > 0}
                        {#each note.Files as file}
                            <a  class="mr-2 whitespace-nowrap" on:click={(e) => downloadAttachedFile(e, file.href, file.Title)} href={file.href}>
                                <span class="inline-block w-4 h-4 relative top-0.5">
                                    <FaFileDownload/>
                                </span>
                                <span>
                                    {file.Title}
                                </span>
                            </a>        
                        {/each}
                    {/if}
                </p>    
            {/if}

            <h4>_; Attached to; Adjunto a; Przyłączony do</h4>
            <p>
                {#if note['InFolders/Folder'] && note['InFolders/Folder'].length > 0}
                    {#each note['InFolders/Folder'] as inFolder}
                        <a  class="mr-2 whitespace-nowrap" href={'#'+inFolder.href}>
                            <span class="inline-block w-4 h-4 relative top-0.5">
                                <FaRegFolder/>
                            </span>
                            <span>
                                {ext(inFolder.Title)}
                            </span>
                        </a>
                    {/each}
                {/if}

                {#if note['InTasks/Task'] && note['InTasks/Task'].length > 0}
                    {#each note['InTasks/Task'] as inTask}
                        <a  class="mr-2 whitespace-nowrap" href={'#'+inTask.href}>
                            <span class="inline-block w-4 h-4 relative top-0.5">
                                <FaRegCalendar/>
                            </span>
                            <span>
                                {inTask.Title}
                            </span>
                        </a>
                    {/each}
                {/if}

                {#if note['InNotes/InNote'] && note['InNotes/InNote'].length > 0}
                    {#each note['InNotes/InNote'] as inNote}
                        <a  class="mr-2 whitespace-nowrap" href={'#'+inNote.href}>
                            <span class="inline-block w-4 h-4 relative top-0.5">
                                <FaRegFile/>
                            </span>
                            <span>
                                {inNote.Title}
                            </span>
                        </a>
                    {/each}
                {/if}
            </p>

        </article>



    </section>

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/> <!-- capture="environment" -->
    <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>
</Page>
{/if}

<Modal title='Uploading...' bind:open={pendingUploading} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/>
    <span class="ml-3">_; Your file is uploading to the server; Tu archivo se está cargando en el servidor; Twój plik jest przesyłany na serwer</span>
</Modal>
