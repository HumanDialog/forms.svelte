<script>
    import {reef, session, signInHRef} from '@humandialog/auth.svelte'
	import  { Editor,
            editable,
			activateItem,
			isActive,
			clearActiveItem,
			onErrorShowAlert,
            Modal,
			Spinner,
            resizeImage,
            informModification,
			pushChanges,
            refreshToolbarOperations,
            informModificationEx,
            Breadcrumb, i18n, UI,
			showFloatingToolbar,
			randomString,
            showMenu,
            SHOW_MENU_BELOW,
            IcH1, IcH2, IcH3, IcH4,
            selectable, isSelected, contextItemsStore, startEditing, hasModifications,
            Editable,

			focusEditable

            } from '$lib'
	import { onMount, tick } from 'svelte';

    import {location, querystring, push, link} from 'svelte-spa-router'

    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo, FaSave, FaCloudUploadAlt, FaFont, FaPen, FaList, FaUpload, FaFile,
        FaImage, FaTable, FaPaperclip, FaBold, FaItalic, FaUnderline, FaStrikethrough, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle,
        FaInfo, FaListUl, FaLink, FaRegFolder, FaRegCalendar, FaRegCalendarCheck, FaRegFile, FaDownload, FaTrash, FaExternalLinkSquareAlt, FaCaretUp, FaCaretDown
    } from 'svelte-icons/fa/'


    import BasketPreview from './basket.preview.svelte'
    import PopupExplorer from './popup.explorer.svelte'
    import {fetchComposedClipboard4Editor, fetchComposedClipboard4Note, transformClipboardToJSONReferences, pushBrowserRecentElements, setBrowserRecentElement, getBrowserRecentElements} from './basket.utils'
    import {getElementIcon} from './icons'
    import NoteProperties from './properties.note.svelte'

	export let noteLink
    export let refreshParent = null
    export let runNoteInserter
    export let runFileAttacher

    let noteRef = ''
    let note = null;
    let noteId = 0

    let pendingUploading = false;
    let isReadOnly = false;
    let canBeEditable = false
    const s = session;
    let noteTitleElement
    let descriptionElementsId = ''

    const NR_NONE               = 0
    const NR_DESCRIPTION        = 1
    const NR_COVER              = 2


    $: initCompnent()
    $: isHeaderActive = calculate_active(note, $contextItemsStore)
    $: isHeaderSelected = selected(note, $contextItemsStore)

    $: selectedClass = isHeaderSelected ? "rounded-lg !border-blue-300 dark:!border-blue-300/50" : "";
    $: focusedClass = isHeaderActive ? "rounded-lg bg-stone-100 dark:bg-stone-700" : "";

    async function initCompnent(...args)
    {
        //console.log('note: ', $location)
        const id = noteLink.NoteId
        noteRef = `./Note/${id}`

        isReadOnly = false;

       await reloadData();
       noteId = id
       descriptionElementsId = `TaskDesc_${noteId}`
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
                                                    'Title',
                                                    'Summary',
                                                    'Content',
                                                    '$ref',
                                                    '$type',
                                                    '$acc',
                                                    'href']
                                }
                            ]
                        },
                        onErrorShowAlert)

        note = res.Note

        isReadOnly = (note.$acc & 0x2) == 0
    }



    function onPropertySingleChange(txt, attrib)
    {
        //note[attrib] = txt
        //informModification(note, attrib)
        informModificationEx(note.$type, note.Id, attrib, txt)
        refreshToolbarOperations()
    }

    let summary;
    let summaryPlaceholder = false;

    let description;

    const extraPaletteCommands = []

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
                    }/* temporary off, refreshing issues,
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
                    }*/
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
            setTimeout(async () => {
                const res = await reef.get(`${newNote.$ref}?fields=Title,href`, onErrorShowAlert)
                const note = res.NoteNote
                description.setCursorPos(cursorPos)
                makeLinkToElement([{
                    Title: note.Title,
                    href: note.href
                }])
            }, 500)


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

    let isEditorFocused = false;

    const fakeEditingNote = {}
    function activateFormattingTools()
    {
        isEditorFocused = true;
        activateItem('props', fakeEditingNote, descriptionOperationsWithFormattingTools())
    }

    function deactivateFormattingToolsIfNeeded()
    {
        isEditorFocused = false;
        if(isActive('props', fakeEditingNote))
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



    function isContentEmpty()
    {
        if(!note.Content)
            return true
        else if(note.Content == '<p></p>')
            return true
        else
            return false
    }

    export async function selectTitle()
    {
        await tick()
        activate()
        noteTitleElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest"
            })
    }

    function activate(e)
    {
        if(e)
            e.stopPropagation();

        if(isActive('props', note))
        {
            return;
        }

        activateItem('props', note, descriptionOperations());
    }

    function calculate_active(...args)
    {
        return isActive('props', note)
    }

    function selected(...args)
    {
        return isSelected(note)
    }



    function descriptionOperations()
    {
        const isCanonical = noteLink.IsCanonical

        let linkOperations = []
        if(isCanonical)
        {
            linkOperations = [
                {
                    caption: '_; Delete; Eliminar; Usuń',
                    action: (f) => askToDeleteAttachement()
                }
            ]
        }
        else
        {
             linkOperations = [
                {
                    caption: '_; Detach; Desconectar; Odłącz',
                    action: (f) => dettachNote()
                }
             ]
        }

        let noteOperations = []
        noteOperations.push({
            caption: '_; Set as task description; Establecer como descripción de la tarea; Ustaw jako opis zadania',
            action: (f) => toggleNoteDescriptionRole(noteLink),
            active: noteLink.Role == NR_DESCRIPTION
        })


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
                                        action: (focused) =>  { focusEditable(`#${descriptionElementsId}_Title`) },
                                    },
                                /*    {
                                        caption: '_; Summary; Resumen; Podsumowanie',
                                        action: (focused) =>  { list.edit(element, 'Summary') },
                                        disabled: true
                                    } */
                                ]

                            },
                            {
                                caption: '_; Move up; Deslizar hacia arriba; Przesuń w górę',
                                mricon: 'chevron-up',
                                action: async (f) => await moveUp(),
                                fab:'M06',
                                tbr:'A',
                                hideToolbarCaption: true
                            },
                            {
                                caption: '_; Move down; Desplácese hacia abajo; Przesuń w dół',
                                mricon: 'chevron-down',
                                action: async (f) => await moveDown(),
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
                                        action: (f) => copyNoteToBasket(),
                                    },
                                    {
                                        caption: '_; Cut; Cortar; Wytnij',
                                        action: (f) => cutNoteToBasket()
                                    },
                                    {
                                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                                        action: (btt, rect) => runPopupExplorerToPlaceElement(btt, rect)
                                    }
                                ]
                            },
                            ...noteOperations,
                            {
                                separator: true
                            },
                            ...linkOperations,
                            {
                                caption: '_; Properties; Propiedades; Właściwości',
                                action: (btt, rect)=> runElementProperties(btt, rect, noteLink)
                            }
                        ]
                    }
                ]
            }
    }

    function descriptionOperationsWithFormattingTools()
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
                        }/*,
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
                        }*/
                    ]
                },
                {
                    caption: '_; Note; Nota; Notatka',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        /*{
                            caption: '_; Edit...; Editar...; Edytuj...',
                            mricon: 'pencil',
                            grid: addOperations,
                        //    fab: 'M10',
                        //    tbr: 'A'
                        },*/
                        {
                            caption: '_; Send; Enviar; Wyślij',
                            mricon: 'upload',
                            hideToolbarCaption: true,
                            tbr: 'D',
                            fab: 'S00',
                            menu: [
                                    {
                                        caption: '_; Copy; Copiar; Kopiuj',
                                        action: (f) => copyNoteToBasket(),
                                    },
                                    {
                                        caption: '_; Select a location; Seleccione una ubicación; Wybierz lokalizację',
                                        action: (btt, rect) => runPopupExplorerToPlaceElement(btt, rect)
                                    }
                                ]

                        }/*,
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
                        }*/,
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


    async function toggleNoteDescriptionRole(noteLink)
    {
        await reef.get(`${noteLink.$ref}/ToggleDescriptionRole`, onErrorShowAlert)
        if(refreshParent)
            await refreshParent()
    }

    let notePropertiesDialog;
    function runElementProperties(btt, aroundRect, element)
    {
       notePropertiesDialog.show(element)
    }

    let deleteModal;
    function askToDeleteAttachement()
    {
        deleteModal.show()
    }


    async function deleteAttachement()
    {
        await reef.post(`Task/${noteLink.TaskId}/DeletePermanentlyNote`, { noteLink: noteLink.$ref } , onErrorShowAlert);
        deleteModal.hide();

        if(refreshParent)
            await refreshParent()
    }

    async function dettachNote()
    {
        await reef.post(`Task/${noteLink.TaskId}/DettachNote`, { noteLink: noteLink.$ref } , onErrorShowAlert);

        if(refreshParent)
            await refreshParent()
    }

    async function moveUp()
    {
        await reef.get(`${noteLink.$ref}/MoveUp`, onErrorShowAlert)
        if(refreshParent)
            await refreshParent(noteLink.$ref)
    }

    async function moveDown()
    {
        await reef.get(`${noteLink.$ref}/MoveDown`, onErrorShowAlert)
        if(refreshParent)
            await refreshParent(noteLink.$ref)
    }

    async function copyNoteToBasket()
    {
        await reef.post(`Task/${noteLink.TaskId}/CopyNoteToBasket`, { noteLink: noteLink.$ref } , onErrorShowAlert);
    }

    async function cutNoteToBasket()
    {
        await reef.post(`Task/${noteLink.TaskId}/CutNoteToBasket`, { noteLink: noteLink.$ref } , onErrorShowAlert);
        if(refreshParent)
            await refreshParent()
    }

    async function runPopupExplorerToPlaceElement(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            canSelectRootElements: true,
            onAttach: async (tmp, references) => {
                await reef.post(`${noteLink.$ref}/AttachMeTo`, { references: references }, onErrorShowAlert)
            },
            ownCloseButton: true
        })
    }

</script>


{#key noteId + (isReadOnly ? 100000 : 200000)}
{#if note != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
            <h1     class=" relative left-[-0.5rem] pl-2 pb-1
                            border border-transparent {focusedClass} {selectedClass}"
                    tabindex="0"
                    use:selectable={note}
                    on:click={activate}
                    bind:this={noteTitleElement}>
                {#if isHeaderActive}
                    <a href={note.href} use:link class="not-prose underline cursor-pointer">
                        <Editable self={note} a='Title' id="{descriptionElementsId}_Title" focusOnClick={false} readonly={isReadOnly}/>
                    </a>
                {:else}
                    <span>
                        {note.Title}
                    </span>
                {/if}
            </h1>

            <div class="relative">
                <Editor     on:click={(e) => e.stopPropagation()}
                            class="mb-5"
                            a='Content'
                            self={note}
                            compact={true}
                            bind:this={description}
                            readOnly={isReadOnly}
                            onFocusCb={() => activateFormattingTools()}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded()}
                            onAddImage={uploadImage}
                            onRemoveImage={removeImage}
                            onLinkClick={editorLinkClicked}
                            extraInsertPaletteCommands={extraInsertPalletteCommands}
                            />
                {#if isContentEmpty() && !isEditorFocused && !isReadOnly}
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

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/> <!-- capture="environment" -->
{/if}
{/key}

<Modal title={i18n(['Uploading...', 'Carga...', 'Przesyłanie...'])}
    bind:open={pendingUploading} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/>
    <span class="ml-3">_; Your file is uploading to the server; Tu archivo se está cargando en el servidor; Twój plik jest przesyłany na serwer</span>
</Modal>

<NoteProperties bind:this={notePropertiesDialog} />

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