<script>
    import {reef, session} from '@humandialog/auth.svelte'
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
            IcH1, IcH2, IcH3, IcH4,
            informModification,
			pushChanges,
            hasModifications,
            refreshToolbarOperations,
            informModificationEx,
            Breadcrumb, i18n, ext,
            showFloatingToolbar,
			randomString,
			showMenu,
            SHOW_MENU_BELOW,
            List, ListTitle, ListSummary, Icon
            } from '$lib'
	import { onMount, tick } from 'svelte';
    import {location, querystring, push, link} from 'svelte-spa-router'
    import TaskSteps from './task.steps.svelte'
    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo, FaSave, FaCloudUploadAlt, FaFont,
        FaPen, FaList, FaTimes, FaUpload, FaCut,  FaFile, FaImage, FaTable, FaPaperclip, FaBold, FaItalic,
        FaUnderline, FaStrikethrough, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle, FaInfo,
        FaListUl, FaLink, FaRegFolder, FaRegFile, FaDownload, FaTrash, FaRegCalendar
    } from 'svelte-icons/fa/'
    import AttachedFile from './attached.file.svelte'
    import BasketPreview from './basket.preview.svelte'
    import PopupExplorer from './popup.explorer.svelte'
    import {fetchComposedClipboard4Editor, fetchComposedClipboard4Task, transformClipboardToJSONReferences, pushBrowserRecentElements, setBrowserRecentElement, getBrowserRecentElements} from './basket.utils'
	
    let taskRef = ''
    let task = null;
    let allTags = '';
    let allLists = [];
    let allActors = [];
    let availableStates = [];
    let pendingUploading = false;

    let attachedFiles = []

    let isReadOnly = false;
    const s = session;

    const STATE_FINISHED = 7000

    $: onParamsChanged($location)

    async function onParamsChanged(...args)
    {
        //console.log('task: ', $location)
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'task');
        if(foundIdx < 0)
            return;

        const taskId = segments[segments.length-1]
        taskRef = `./Task/${taskId}`

        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags = res
            reloadVisibleTags()
        })

        //let res = await reef.get('/group/Lists?fields=$ref,Name', onErrorShowAlert)
        //allLists = res.TaskList

        //res = await reef.get('/app/Users?fields=$ref,Name')
        let res = await reef.post('group/query',
                            {
                                Id: 1,
                                Name: 'Users',
                                Tree:[
                                    {
                                        Id: 1,
                                        Association: 'Members/User',
                                        Expressions:['$ref', 'Name']
                                    }
                                ]
                            },
                            onErrorShowAlert
                        )
        allActors = res.User;

        await reloadData();

        if(task)
            pushBrowserRecentElements( task.Id, task.$type, task.$ref, task.Title, task.Summary, "Task", task.href)
    }

    async function reloadData()
    {
        if(!taskRef)
            return;

        let res = await reef.post(`${taskRef}/query`,
                        {
                            Id: 1,
                            Name: "collector",
                            ExpandLevel: 3,
                            Tree:
                            [
                                {
                                    Id: 1,
                                    Association: '',
                                    Expressions:['Id', 'Index', 'Title','Summary', 'Description', 'DueDate', 'Tags', 'State', 'AttachedFiles', 'GetCanonicalPath', '$ref', '$type', '$acc', 'href'],
                                    SubTree:[
                                        {
                                            Id: 10,
                                            Association: 'Steps',
                                            Sort: 'Order',
                                        },
                                        {
                                            Id: 11,
                                            Association: 'Actor',
                                            Expressions:['$ref', 'Name', 'href']
                                        },
                                        {
                                            Id: 12,
                                            Association: 'TaskList',
                                            Expressions:['$ref', 'Name', 'Summary', 'TaskStates', 'href']
                                        },
                                        {
                                            Id: 13,
                                            Association: 'InFolders/Folder',
                                            Expressions:['$ref', 'Title', 'Summary', 'href', 'icon']
                                        },
                                        {
                                            Id: 14,
                                            Association: 'Notes',
                                            Expressions:['$ref', 'Title', 'Summary', 'href', 'IsCanonical']
                                        },
                                        {
                                            Id: 15,
                                            Association: 'Files',
                                            Expressions:['$ref', 'Title', 'Summary', 'href', 'IsCanonical']
                                        }
                                    ]
                                }
                            ]
                        },
                        onErrorShowAlert)

        task = res.Task
        if(task.TaskList?.TaskStates)
        {
            try{
                availableStates = JSON.parse(task.TaskList.TaskStates);
                availableStates.forEach( e => {
                    if(e.state == STATE_FINISHED)
                        e.icon = FaCheck;
                    else
                        e.icon = null;
                })
            }
            catch(e)
            {
                availableStates = [];
            }
        }
        else
            availableStates = [];

        if(task.Steps == undefined)
            task.Steps = []

        isReadOnly = (task.$acc & 0x2) == 0

        if(task.AttachedFiles)
        {
            attachedFiles = []
            const names = task.AttachedFiles.split(';');
            names.forEach(n => {
                attachedFiles.push({
                    name: n,
                    downloading: false
                })
            })
        }

        task.connectedToList = []
        if(task['InFolders/Folder'] && task['InFolders/Folder'].length > 0)
        {
            task['InFolders/Folder'].forEach((f) => {
                    task.connectedToList.push({
                        Title: f.Title,
                        Summary: f.Summary,
                        href: f.href,
                        $ref: f.$ref,
                        icon: f.icon
                })
            })
        }

        if(task.TaskList)
            task.connectedToList.push({
                Title: task.TaskList.Name,
                Summary: task.TaskList.Summary,
                href: task.TaskList.href,
                $ref: task.TaskList.$ref,
                icon: 'TaskList'
        })

        if(task.Actor)
            task.connectedToList.push({
                Title: task.Actor.Name,
                Summary: '',
                href: task.Actor.href,
                $ref: task.Actor.$ref,
                icon: 'User'
        })

    }

    async function onTitleChanged(text)
    {
        task.Title = text;
        informModification(task, 'Title')
        pushChanges(refreshToolbarOperations)
        //await reef.post(`${taskRef}/set`, {Title: text}, onErrorShowAlert)
    }

    async function onSummaryChanged(text)
    {
        task.Summary = text;
        informModification(task, 'Summary'),
        pushChanges(refreshToolbarOperations)
        //await reef.post(`${taskRef}/set`, {Summary: text}, onErrorShowAlert)

    }

    function onPropertySingleChange(txt, attrib)
    {
        informModificationEx(task.$type, task.Id, attrib, txt)
        refreshToolbarOperations()
    }

    async function onUpdateAllTags(newAllTags)
    {
        allTags  = newAllTags
        await reef.post('group/set', { AllTags: allTags}, onErrorShowAlert)
    }

    async function onAddStep(txt, beforeIdx)
    {
        if(task.Steps == undefined)
            task.Steps = []

        if(beforeIdx >= task.Steps.length)
            beforeIdx = undefined;

        const newStep = {
                Label: txt,
                Done: false,
                Order: 0}

        if(beforeIdx == undefined)
        {
            let maxOrder = 0;
            task.Steps.forEach(s => {
                if(s.Order > maxOrder)
                    maxOrder = s.Order;});

            newStep.Order = maxOrder + 64;
        }
        else
        {
            const next = task.Steps[beforeIdx]
            if(beforeIdx > 0)
            {
                const prev = task.Steps[beforeIdx-1]
                const orderSpace = next.Order - prev.Order;
                newStep.Order = prev.Order + Math.floor(orderSpace / 2)
            }
            else
                newStep.Order = next.Order - 64;
        }

        await reef.post(`${taskRef}/Steps/new`, {...newStep}, onErrorShowAlert)
        await reloadData();
    }

    async function onChangeStep(txt, idx)
    {
        const taskStep = task.Steps[idx];
        taskStep.Label = txt;
        await reef.post(`${taskRef}/Steps/${taskStep.Id}/set`, { Label: txt}, onErrorShowAlert)
    }

    async function onRemoveStep(idx)
    {
        const taskStep = task.Steps[idx];
        await reef.delete(`${taskRef}/Steps/${taskStep.Id}`, onErrorShowAlert)
        await reloadData();
    }

    async function setStepDone(value, taskStep)
    {
        taskStep.Done = value;
        task.Steps = [...task.Steps]
        await reef.post(`${taskRef}/Steps/${taskStep.Id}/set`, {Done: value}, onErrorShowAlert)
    }

    function getPageOperationsWithStepTools(step)
    {
        let checkOperation;
        if(step.Done)
        {
            checkOperation =
                {
                    caption: '_; Undo; Deshacer; Cofnij',
                    icon: FaUndo,
                    action: async (f) =>
                    {
                        await setStepDone( false, step)
                        activateItem('props', step, getPageOperationsWithStepTools(step))
                    },
               //     fab: 'M02',
                    tbr: 'A'
                }
        }
        else
        {
            checkOperation =
                {
                    caption: '_; Done; Hecho; Zrobione',
                    icon: FaCheck,
                    action: async (f) =>
                    {
                        await setStepDone( true, step)
                        activateItem('props', step, getPageOperationsWithStepTools(step))
                    },
                //    fab: 'M02',
                    tbr: 'A'
                }
        }

        return {
            opver: 2,
            fab: 'M00',
            operations: [
                {
                    caption: '_; Task; Tarea; Zadanie',
                    tbr: 'B',
                    operations: [
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            icon: FaPen,
                            grid: addOperations,
                            fab: 'M20',
                            tbr: 'A'
                        },
                        {
                            caption: '_; Send; Enviar; Wyślij',
                            icon: FaUpload, 
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
                                    disabled: true
                                }
                            ]

                        },
                        {
                            icon: FaDownload,
                            caption: '_; Insert; Insertar; Wstaw',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S10',
                            menu: [
                                {
                                    caption: '_; Paste; Pegar; Wklej',
                                    action: pasteRecentClipboardElement4Task
                                },
                                {
                                    caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                                    action: runPasteBasket4Task
                                },
                                {
                                    caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                                    action: runPasteBrowserRecent4Task
                                },
                                {
                                    caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                                    action: runPopupExplorer4Task
                                }
                            ]
                        },
                        {
                            caption: "_; Save; Guardar; Zapisz",
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => saveCurrentEditable(),
                            fab: 'T02',
                            tbr: 'C',
                            disabledFunc: () => !hasModifications()
                        },
                    ]
                },
                {
                    caption: '_; Step; Paso; Krok',
                    operations: [checkOperation]
                }
            ]
        }
    }

    function onSelectStep(idx)
    {
        let step = task.Steps[idx];
        activateItem('props', step, getPageOperationsWithStepTools(step))
    }

    function onUnselectStep(idx)
    {
        let step = task.Steps[idx];
        if(isActive('props', step))
            clearActiveItem('props')
    }

    async function runPasteBasket4Task(btt, aroundRect)
    {
        const clipboardElements = await fetchComposedClipboard4Task()

        showFloatingToolbar(aroundRect, BasketPreview, 
            {
                destinationContainer: taskRef,
                onRefreshView: async (f) => await reloadWithAttachements(),
                clipboardElements: clipboardElements
            }
        )
    }

    async function pasteRecentClipboardElement4Task(btt, aroundRect) 
    {
        const clipboardElements = await fetchComposedClipboard4Task()
        if(clipboardElements && clipboardElements.length > 0)
        {
            const references = transformClipboardToJSONReferences([clipboardElements[0]])
            const res = await reef.post(`${taskRef}/AttachClipboard`, { references: references }, onErrorShowAlert)
            if(res)
                await reloadWithAttachements();
            
        }
    }

    async function runPasteBrowserRecent4Task(btt, aroundRect)
    {
        const clipboardElements = getBrowserRecentElements()
        showFloatingToolbar(aroundRect, BasketPreview, {
            destinationContainer: taskRef,
            onRefreshView: async (f) => await reloadWithAttachements(),
            clipboardElements: clipboardElements,
            browserBasedClipboard: true
        })
    }

    async function runPopupExplorer4Task(btt, aroundRect)
    {
        showFloatingToolbar(aroundRect, PopupExplorer, {
            destinationContainer: taskRef,
            onRefreshView: async (f) => await reloadWithAttachements()
        })
    }

    async function reloadWithAttachements()
    {
        await reloadData();
        attachementsNotesComponent.reload(task, attachementsNotesComponent.CLEAR_SELECTION);
        attachementsFilesComponent.reload(task, attachementsFilesComponent.CLEAR_SELECTION);
    }

    let summary;
    let summaryPlaceholder = false;

    let dueDate;
    let dueDatePlaceholder = false

    let onList;
    let onListPlaceholder = false

    let responsible;
    let responsiblePlaceholder = false

    let tags;
    let tagsPlaceholder = false

    let steps;
    let stepsPlaceholder = false;

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
    /*    {
            caption: '_; List; Lista; Lista',
            action: async (f) =>
                {
                    if(onList)
                        onList.show();
                    else
                    {
                        onListPlaceholder = true;
                        await tick();
                        onList?.show(undefined, () => {onListPlaceholder = false})
                    }
                }
        }, */
        {
            caption: '_; Due Date; Fecha; Termin',
        //    icon: FaCalendarAlt,
            action: async (f) =>
                {
                    if(dueDate)
                        dueDate.show();
                    else
                    {
                        dueDatePlaceholder = true;
                        await tick();
                        dueDate?.show(undefined, () => {dueDatePlaceholder = false})
                    }
                }
        },
        {
            separator: true
        },
        {
            caption: '_; Responsible; Responsable; Odpowiedzialny',
        //    icon: FaUser,
            action: async (f) =>
                {
                    if(responsible)
                        responsible.show();
                    else
                    {
                        responsiblePlaceholder = true;
                        await tick();
                        responsible?.show(undefined, () => {responsiblePlaceholder = false;})
                    }
                }
        },

        {
            caption: '_; Tag; Etiqueta; Etykieta',
       //     icon: FaTag,
            action: async (f) => runTagInserter()
        },
        {
            caption: '_; Step; Paso; Krok',
        //    icon: FaCheck,
            action: async (f) =>
                {
                    if(steps)
                        steps.run();
                    else
                    {
                        stepsPlaceholder = true;

                        if(task.Steps == undefined)
                            task.Steps = []

                        await tick();
                        steps?.run(steps.END_OF_LIST, '', () => {stepsPlaceholder = false})
                    }
                }
        },
        {
            separator: true
        },
        {
            caption: '_; Attachement; Anexo; Załącznik',
       //     icon: FaFile,
            action: async (f) => runFileAttacher()
        },
        {
            caption: '_; Description; Descripción; Opis',
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

    ];


    function getPageOperations()
    {
        return {
            opver: 2,
            fab: 'M00',
            tbr: 'D',
            operations: [
                {
                    caption: '_; Task; Tarea; Zadanie',
                    //tbr: 'B',
                    operations: [
                        
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            icon: FaPen,
                            grid: addOperations,
                            fab: 'M20',
                            tbr: 'A'
                        },

                        {
                            caption: '_; Send; Enviar; Wyślij',
                            icon: FaUpload,
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
                                    disabled: true
                                }
                            ]

                        },
                        {
                            icon: FaDownload,
                            caption: '_; Insert; Insertar; Wstaw',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S10',
                            menu: [
                                {
                                    caption: '_; Paste; Pegar; Wklej',
                                    action: pasteRecentClipboardElement4Task
                                },
                                {
                                    caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                                    action: runPasteBasket4Task
                                },
                                {
                                    caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                                    action: runPasteBrowserRecent4Task
                                },
                                {
                                    caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                                    action: runPopupExplorer4Task
                                }
                            ]
                        },
                        {
                            caption: "_; Save; Guardar; Zapisz",
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => saveCurrentEditable(),
                            fab: 'T02',
                            tbr: 'C',
                            disabledFunc: () => !hasModifications()
                        },
                    ]
                }
            ]
        }
    }


    function getPageOperationsWithFormattingTools()
    {
        const mobile = isDeviceSmallerThan("sm")

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
                            icon: IcH1,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setHeading(1),
                            activeFunc: description.isActiveH1
                        },
                        {
                            caption: '_; Heading 2; Título 2; Nagłówek 2',
                            icon: IcH2,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setHeading(2),
                            activeFunc: description.isActiveH2
                        },
                        {
                            caption: '_; Heading 3; Título 3; Nagłówek 3',
                            icon: IcH3,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setHeading(3),
                            activeFunc: description.isActiveH3
                        },
                        {
                            caption: '_; Heading 4; Título 4; Nagłówek 4',
                            icon: IcH4,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setHeading(4),
                            activeFunc: description.isActiveH4
                        },
                        {
                            caption: '_; Normal; Normal; Normalny',
                            icon: FaRemoveFormat,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setNormal(),
                            activeFunc: description.isActiveNormal,
                        },
                        {
                            caption: '_; Code; Código; Kod',
                            icon: FaCode,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setCode(),
                            activeFunc: description.isActiveCode,
                        },
                        {
                            caption: '_; Quote; Cita; Cytat',
                            icon: FaQuoteRight,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setQuote(),
                            activeFunc: description.isActiveQuote,
                        },
                        {
                            caption: '_; BulletList; Lista con viñetas; Lista punktowana',
                            icon: FaListUl,
                            action: (f) => description.setBulletList(),
                            activeFunc: description.isActiveBulletList,
                            tbr: 'A',
                            hideToolbarCaption: true
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
                            tbr: 'A', hideToolbarCaption: true
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
                    icon: FaDownload,
                    caption: '_; Insert; Insertar; Wstaw',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: '_; Image; Imagen; Obraz',
                            icon: FaImage,
                            action: (f) => description.setImage(),
                            activeFunc: description.isActiveImage,
                            tbr: 'A',
                            hideToolbarCaption: true
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
                    caption: '_; Task; Tarea; Zadanie',
                    //tbr: 'B',
                    operations: [
                        
                        {
                            caption: '_; Edit...; Editar...; Edytuj...',
                            icon: FaPen,
                            grid: addOperations,
                       //     fab: 'M10',
                        //    tbr: 'A'
                        },

                        {
                            caption: '_; Send; Enviar; Wyślij',
                            icon: FaUpload,
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
                                    disabled: true
                                }
                            ]

                        },
                        {
                            icon: FaDownload,
                            caption: '_; Insert; Insertar; Wstaw',
                            hideToolbarCaption: true,
                            tbr: 'C',
                            fab: 'S10',
                            menu: [
                                {
                                    caption: '_; Paste; Pegar; Wklej',
                                    action: pasteRecentClipboardElement4Task
                                },
                                {
                                    caption: '_; Select from clipboard; Seleccionar del portapapeles; Wybierz ze schowka',
                                    action: runPasteBasket4Task
                                },
                                {
                                    caption: '_;Select from recent elements; Seleccionar entre elementos recientes; Wybierz z ostatnich elementów',
                                    action: runPasteBrowserRecent4Task
                                },
                                {
                                    caption: '_; Select from folders; Seleccionar de las carpetas; Wybierz z folderów',
                                    action: runPopupExplorer4Task
                                }
                            ]
                        },
                        {
                            caption: "_; Save; Guardar; Zapisz",
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => description?.save(),
                            //fab: 'S00',
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
            icon: FaSave,
            action: () => description?.save(),
            disabledFunc: () => !hasModifications()
        }
    ]

    const extraInsertPalletteCommands = [
        {
            icon: FaDownload,
            caption: '_; Insert; Insertar; Wstaw',
            action: () => {
                const operations = [
                    {
                        caption: '_; Paste; Pegar; Wklej',
                        action: pasteRecentClipboardElement
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

    async function pasteRecentClipboardElement(btt, aroundRect) 
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
            caption: '_; Attachement; Anexo; Załącznik',
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
            caption: '_; Send; Enviar; Wyślij',
            icon: FaUpload,
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
    function activateFormattingTools()
    {
        activateItem('props', descriptionActive, getPageOperationsWithFormattingTools())
    }

    function deactivateFormattingToolsIfNeeded()
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

            const res = await reef.post(`${taskRef}/Images/blob?name=${file.name}&size=${resizedImage.size}`, {}, onErrorShowAlert)
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
                        const dataPath = `${taskRef}/Images/blob?key=${newKey}`

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

    async function copyTaskToBasket()
    {
        await reef.post(`${taskRef}/CopyToBasket`, { } , onErrorShowAlert);
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

             let fileLink = await reef.post(`${taskRef}/CreateFile`,
                                    { 
                                        title: file.name,
                                        mimeType: file.type,
                                        size: file.size,
                                        order: 0
                                    }, onErrorShowAlert)
            if(!fileLink)
                return null;

            fileLink = fileLink.TaskFile
            const res = await reef.post(`UploadedFile/${fileLink.FileId}/Key/blob?name=${file.name}&size=${file.size}`, {}, onErrorShowAlert)
            

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

            const res = await reef.post(`${taskRef}/AttachedFiles/blob?name=${file.name}&size=${file.size}`, {}, onErrorShowAlert)
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

    let attachementsNotesComponent
    let attachementsFilesComponent
    let connectedToComponent
    const attList = (kind) => kind == 'TaskNote' ? attachementsNotesComponent : attachementsFilesComponent
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
                },
                {
                    caption: '_; Set as primary location; Establecer como ubicación principal; Ustaw jako główną lokalizację',
                    action: (f) => setAttachementLocationAsCanonical(element, kind)
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
                                icon: FaPen,
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
                                caption: '_; Send; Enviar; Wyślij',
                                hideToolbarCaption: true,
                                icon: FaUpload,
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
                                        disabled: true
                                    }
                                ]
                            },
                            {
                                separator: true
                            },
                            ...linkOperations
                        ]
                    }
                ]
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
        case 'TaskNote':
            return copyNoteToBasket(element)
        case 'UploadedFile':
        case 'TaskFile':
            return copyFileToBasket(element)
        }
    }

    async function cutAttachementToBasket(element, kind)
    {
        switch(kind)
        {
        case 'Note':
        case 'TaskNote':
            return cutNoteToBasket(element)
        case 'UploadedFile':
        case 'TaskFile':
            return cutFileToBasket(element)
        }
    }

    async function copyNoteToBasket(note)
    {
        await reef.post(`${taskRef}/CopyNoteToBasket`, { noteLink: note.$ref } , onErrorShowAlert);
    }

    async function cutNoteToBasket(note)
    {
        await reef.post(`${taskRef}/CutNoteToBasket`, { noteLink: note.$ref } , onErrorShowAlert);
        await reloadData();
        attachementsNotesComponent.reload(task, attachementsNotesComponent.SELECT_NEXT);
    }

    async function copyFileToBasket(file)
    {
        await reef.post(`${taskRef}/CopyFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
    }

    async function cutFileToBasket(file)
    {
        await reef.post(`${taskRef}/CutFileToBasket`, { fileLink: file.$ref } , onErrorShowAlert);
        await reloadData();
        attachementsFilesComponent.reload(task, attachementsFilesComponent.SELECT_NEXT);
    }

    async function dettachAttachement(element, kind)
    {
        switch(kind)
        {
        case 'Note':
        case 'TaskNote':
            return dettachNote(element)
        case 'UploadedFile':
        case 'TaskFile':
            return dettachFile(element)
        }
    }

    async function dettachNote(note)
    {
        await reef.post(`${taskRef}/DettachNote`, { noteLink: note.$ref } , onErrorShowAlert);
        await reloadData();
        attachementsNotesComponent.reload(task, attachementsNotesComponent.SELECT_NEXT);
    }

    async function dettachFile(file)
    {
        await reef.post(`${taskRef}/DettachFile`, { fileLink: file.$ref } , onErrorShowAlert);
        await reloadData();
        attachementsFilesComponent.reload(task, attachementsFilesComponent.SELECT_NEXT);
    }

    async function setAttachementLocationAsCanonical(element, kind)
    {
        await reef.get(`${element.$ref}/SetLocationAsCanonical`, onErrorShowAlert)
        await reloadData();

        switch(kind)
        {
        case 'Note':
        case 'TaskNote':
            attachementsNotesComponent.reload(task, attachementsNotesComponent.KEEP_SELECTION);
        case 'UploadedFile':
        case 'TaskFile':
            attachementsFilesComponent.reload(task, attachementsFilesComponent.KEEP_SELECTION);
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
        case 'TaskNote':
            await reef.post(`${taskRef}/DeletePermanentlyNote`, { noteLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await reloadData();
            attachementsNotesComponent.reload(task, attachementsNotesComponent.SELECT_NEXT);
            break;

        case 'UploadedFile':
        case 'TaskFile':
            await reef.post(`${taskRef}/DeletePermanentlyFile`, { fileLink: objectToDelete.$ref } , onErrorShowAlert);
            deleteModal.hide();
            await reloadData();
            attachementsFilesComponent.reload(task, attachementsFilesComponent.SELECT_NEXT);
            break;
        }
    }

    function connectedToOperations(element)
    {
        return {
                opver: 2,
                fab: 'M00',
                tbr: 'D',
                disabled: true,
                operations: [
                    {
                        caption: '_; Element; Elemento; Element',
                        operations: [
                            
                        ]
                    }
                ]
            }
    }

    function getElementIcon(element)
    {
        switch(element.icon)
        {
        case 'Folder':
            return FaRegFolder

        case 'Note':
            return FaRegFile;

        case 'Task':
            return FaRegCalendar;

        case 'UploadedFile':
        case 'File':
            return FaFile;

        case 'TaskList':
            return FaList;

        case 'User':
            return FaUser;
        }
    }

</script>

<svelte:head>
    {#if task && task.Title}
        <title>{task.Title} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>

{#if task != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={task}
            toolbarOperations={getPageOperations()}
            clearsContext='props'
            title={task.Title}>
    <section class="w-full flex flex-col items-center">
        {#if task.GetCanonicalPath}
            <Breadcrumb class="mt-1 sm:min-w-[65ch]" path={task.GetCanonicalPath}/>
        {/if}

        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2">
            <section class="w-full flex flex-row justify-between">
                    <p class="">
                        {task.Index}
                    </p>
                    <div>
                        {#if false && (task.TaskList || onListPlaceholder)}
                            <p>
                                <a href={task.TaskList.href} use:link >
                                    {ext(task.TaskList.Name)}
                                </a>
                            </p>
                            <!--Combo  compact
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
                            </Combo-->
                        {/if}
                    </div>
                    <div>
                        {#if task.DueDate || dueDatePlaceholder}
                            <DatePicker     a='DueDate'
                                            compact
                                            s="prose"
                                            inContext="data"
                                            bind:this={dueDate}
                                />
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
                {task.Title}
            </h1>

            {#if task.Summary || summaryPlaceholder}
                {#key task.Summary}
                    <p  class="lead"
                        use:editable={{
                            action: (text) => onSummaryChanged(text),
                            onSingleChange: (txt) => onPropertySingleChange(txt, 'Summary'),
                            active: true,
                            readonly: isReadOnly}}
                        tabindex="0"
                        bind:this={summary}>
                        {task.Summary}
                    </p>
                {/key}

            {/if}

            <section class="w-full flex flex-row flex-wrap justify-between">
                <div class="grow-0">
                    {#if task.Actor || responsiblePlaceholder}
                        <Combo  compact={true}
                                inContext='data'
                                a='Actor'
                                isAssociation
                                icon={false}
                                placeholder='Responsible'
                                s='prose'
                                hasNone
                                changed={(k,n) => { /*fake assignment for component rer-ender*/ task.Actor = task.Actor; }}
                                bind:this={responsible}>
                            <ComboSource    objects={allActors}
                                            key="$ref"
                                            name='Name'/>
                        </Combo>
                    {/if}
                </div>

                <div>
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
                </div>

                <div>
                    {#if task.Tags || tagsPlaceholder}
                        <Tags class="w-full "
                            a='Tags'
                            s='prose'
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
                        <AttachedFile self={task} a='AttachedFiles' {fileInfo}/>
                    {/each}
                </p-->
            {/if}



            {#if (task.Steps && task.Steps.length > 0) || stepsPlaceholder}
                <TaskSteps      on:click={(e) => e.stopPropagation()}
                                steps={task.Steps}
                                a='Label'
                                checkedAttribute='Done'
                                onRemove={onRemoveStep}
                                onChange={onChangeStep}
                                onAdd={onAddStep}
                                onSelect={onSelectStep}
                                onUnselect={onUnselectStep}
                                bind:this={steps}/>
            {/if}

            {#if task.Description || descriptionPlaceholder}
                <hr/>
                <Editor     on:click={(e) => e.stopPropagation()}
                            class="mb-20"
                            a='Description'
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

            {/if}

            <hr/>

            {#if (task.Notes && task.Notes.length > 0) || (task.Files && task.Files.length > 0)}
                <h4 class="ml-2">_;Attachments; Anexos; Załączniki</h4>
                <section class="not-prose"> 
                    {#if task.Notes && task.Notes.length > 0}
                        <List   self={task}
                                a='Notes'
                                bind:this={attachementsNotesComponent}
                                toolbarOperations={(el) => attachementOperations(el, 'TaskNote')}>
                            
                            <ListTitle      a='Title'
                                            hrefFunc={(el) => `${el.href}`}
                                            onChange={changeAttachementProperty}/>

                            <ListSummary    a='Summary' 
                                            onChange={changeAttachementProperty}/>

                            <span slot="left" let:element>
                                <Icon component={FaRegFile}
                                    class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1"/>
                            </span>
                        </List>
                    {/if}

                    {#if task.Files && task.Files.length > 0}
                        <List   self={task}
                                a='Files'
                                bind:this={attachementsFilesComponent}
                                toolbarOperations={(el) => attachementOperations(el, 'TaskFile')}>
                            
                            <ListTitle      a='Title'
                                            hrefFunc={(el) => `${el.href}`}
                                            downloadable
                                            onOpen={async (f) => await downloadFileFromHRef(f.href, f.Title)}
                                            onChange={changeAttachementProperty}/>

                            <ListSummary    a='Summary'
                                            onChange={changeAttachementProperty}/>

                            <span slot="left" let:element>
                                <Icon component={FaFile}
                                    class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1"/>
                            </span>
                        </List>
                    {/if}
                </section>
            {/if}

            <h4 class="ml-2">_; Attached to; Adjunto a; Przyłączony do</h4>
            <section class="not-prose"> 
                <List   self={task}
                        a='connectedToList'
                        bind:this={connectedToComponent}
                        toolbarOperations = {(el) => connectedToOperations(el)}>
                
                    <ListTitle      a='Title'
                                    hrefFunc={(el) => `${el.href}`}
                                    readonly/>

                    <ListSummary    a='Summary' 
                                    readonly/>

                    <span slot="left" let:element>
                        <Icon component={getElementIcon(element)}
                            class="h-5 w-5 text-stone-700 dark:text-stone-400 cursor-pointer mt-0.5  ml-2  mr-1"/>
                    </span>
                </List>
            </section>

            <!-- empty section fot have bottom free area -->
            <section class="mb-64">

            </section>

        </article>



    </section>

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/> <!-- capture="environment" -->
    <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>
</Page>
{/if}

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