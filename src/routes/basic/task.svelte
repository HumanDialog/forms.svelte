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
            IcH1, IcH2, IcH3, IcH4
            } from '$lib'
	import { onMount, tick } from 'svelte';
    import {location, querystring, push, link} from 'svelte-spa-router'
    import TaskSteps from './task.steps.svelte'
    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo, FaSave, FaCloudUploadAlt, FaFont,
        FaPen, FaList, FaTimes, FaCopy, FaCut,  FaFileDownload, FaImage, FaTable, FaPaperclip, FaBold, FaItalic,
        FaUnderline, FaStrikethrough, FaRemoveFormat, FaCode, FaComment, FaQuoteRight, FaExclamationTriangle, FaInfo,
        FaListUl
    } from 'svelte-icons/fa/'
    import FaBasketPlus from './icons/basket.plus.svelte'
	import AttachedFile from './attached.file.svelte'

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

        let res = await reef.get('/group/Lists?fields=$ref,Name', onErrorShowAlert)
        allLists = res.TaskList

        //res = await reef.get('/app/Users?fields=$ref,Name')
        res = await reef.post('group/query',
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
                                    Expressions:['Id', 'Index', 'Title','Summary', 'Description', 'DueDate', 'Tags', 'State', 'AttachedFiles', '$ref', '$type', '$acc'],
                                    SubTree:[
                                        {
                                            Id: 10,
                                            Association: 'Steps',
                                            Sort: 'Order',
                                        },
                                        {
                                            Id: 11,
                                            Association: 'Actor',
                                            Expressions:['$ref', 'Name']
                                        },
                                        {
                                            Id: 12,
                                            Association: 'TaskList',
                                            Expressions:['$ref', 'Name', 'TaskStates', 'href']
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
                    if(e.state == 1000)
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

    }

    async function onTitleChanged(text)
    {
        task.Title = text;
        await reef.post(`${taskRef}/set`, {Title: text}, onErrorShowAlert)
    }

    async function onSummaryChanged(text)
    {
        task.Summary = text;
        await reef.post(`${taskRef}/set`, {Summary: text}, onErrorShowAlert)

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
                    caption: 'Undo',
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
                    caption: 'Done',
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
                    caption: 'Task',
                    tbr: 'B',
                    operations: [
                        {
                            caption: "Save",
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => saveCurrentEditable(),
                            fab: 'T02',
                            tbr: 'A'
                        },
                        {
                            caption: 'Edit...',
                            hideToolbarCaption: true,
                            icon: FaPen,
                            grid: addOperations,
                            fab: 'M20',
                            tbr: 'A'
                        },
                        {
                            caption: 'Add to basket',
                            icon: FaBasketPlus,   // MdLibraryAdd
                            action: (f) => copyTaskToBasket(),
                            fab: 'M04',
                            tbr: 'A', hideToolbarCaption: true

                        }
                    ]
                },
                {
                    caption: 'Step',
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
            caption: 'Summary',
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
            caption: 'List',
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
            caption: 'Due Date',
            icon: FaCalendarAlt,
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
            caption: 'Responsible',
            icon: FaUser,
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
            caption: 'Tag',
            icon: FaTag,
            action: async (f) => runTagInserter()
        },
        {
            caption: 'Step',
            icon: FaCheck,
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
            caption: 'Attachement',
            icon: FaFileDownload,
            action: async (f) => runFileAttacher()
        },
        {
            caption: 'Description',
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
                    caption: 'Task',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: "Save",
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => saveCurrentEditable(),
                            fab: 'T02',
                            tbr: 'A'
                        },
                        {
                            caption: 'Edit...',
                            hideToolbarCaption: true,
                            icon: FaPen,
                            grid: addOperations,
                            fab: 'M20',
                            tbr: 'A'
                        },

                        {
                            caption: 'Add to basket',
                            icon: FaBasketPlus,   // MdLibraryAdd
                            action: (f) => copyTaskToBasket(),
                            fab: 'M04',
                            tbr: 'A',hideToolbarCaption: true

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
            tbr: 'C',
            preAction: description.preventBlur,
            operations: [
                {
                    caption: 'Task',
                    //tbr: 'B',
                    operations: [
                        {
                            caption: "Save",
                            hideToolbarCaption: true,
                            icon: FaSave,
                            action: (f) => description?.save(),
                            //fab: 'S00',
                            tbr: 'A'
                        },
                        {
                            caption: 'Edit...',
                            hideToolbarCaption: true,
                            icon: FaPen,
                            grid: addOperations,
                       //     fab: 'M10',
                        //    tbr: 'A'
                        },

                        {
                            caption: 'Add to basket',
                            icon: FaBasketPlus,   // MdLibraryAdd
                            action: (f) => copyTaskToBasket(),
                        //    fab: 'M04',
                        //    tbr: 'A'

                        },
                    ]
                },
                {
                    caption: 'Insert',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: 'Image',
                            icon: FaImage,
                            action: (f) => description.setImage(),
                            activeFunc: description.isActiveImage,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Table',
                            icon: FaTable,
                            action: (f) => description.setTable(),
                            activeFunc: description.isActiveTable
                        },
                        {
                            caption: 'Attachement',
                            icon: FaPaperclip,
                            action: (f) => runFileAttacher(),
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Tag',
                            icon: FaTag,
                            action: (f) => runTagInserter()
                        }
                    ]
                },
                {
                    caption: 'Text',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: 'Bold',
                            icon: FaBold,
                            action: (f) => description.setBold(),
                            activeFunc: description.isActiveBold,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Italic',
                            icon: FaItalic,
                            action: (f) => description.setItalic(),
                            activeFunc: description.isActiveItalic,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                        {
                            caption: 'Underline',
                            icon: FaUnderline,
                            action: (f) => description.setUnderline(),
                            activeFunc: description.isActiveUnderline,
                            tbr: 'A', hideToolbarCaption: true
                        },
                        {
                            caption: 'Strikethrough',
                            icon: FaStrikethrough,
                            action: (f) => description.setStrikethrough(),
                            activeFunc: description.isActiveStrikethrough,
                        },
                    ]
                },
                {
                    caption: 'Styles',
                    //tbr: 'B',
                    preAction: description.preventBlur,
                    operations: [
                        {
                            caption: 'Normal',
                            icon: FaRemoveFormat,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setNormal(),
                            activeFunc: description.isActiveNormal,
                        },
                        {
                            caption: 'Heading 1',
                            icon: IcH1,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setHeading(1),
                            activeFunc: () => description.isActiveHeading(1)
                        },
                        {
                            caption: 'Heading 2',
                            icon: IcH2,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setHeading(2),
                            activeFunc: () => description.isActiveHeading(2)
                        },
                        {
                            caption: 'Heading 3',
                            icon: IcH3,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setHeading(3),
                            activeFunc: () => description.isActiveHeading(3)
                        },
                        {
                            caption: 'Heading 4',
                            icon: IcH4,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setHeading(4),
                            activeFunc: () => description.isActiveHeading(4)
                        },
                        {
                            caption: 'Code',
                            icon: FaCode,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setCode(),
                            activeFunc: description.isActiveCode,
                        },
                        {
                            caption: 'Quote',
                            icon: FaQuoteRight,
                            tbr: 'A', hideToolbarCaption: true,
                            action: (f) => description.setQuote(),
                            activeFunc: description.isActiveQuote,
                        },
                        {
                            caption: 'BulletList',
                            icon: FaListUl,
                            action: (f) => description.setBulletList(),
                            activeFunc: description.isActiveBulletList,
                            tbr: 'A',
                            hideToolbarCaption: true
                        },
                    ]
                }
            ]
        }

    }

    const extraPaletteCommands = [
        {
            caption: 'Save',
            icon: FaSave,
            action: () => description?.save(),
        },
        {
            caption: 'Add to basket',
            icon: FaBasketPlus,   // MdLibraryAdd
            action: () => copyTaskToBasket(),
        }
    ]

    const extraInsertPalletteCommands = [
        {
            caption: 'Attachement',
            icon: FaPaperclip,
            action: runFileAttacher
        },
        {
            caption: 'Tag',
            icon: FaTag,
            action: () => setTimeout(() => runTagInserter(), 500)
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
                        // todo: editor path imgPath
                        /*const dataPath = `${taskRef}/Images/blob?key=${newKey}`

                        //console.log('upload success for ', dataPath)
                        if(imgEditorActionAfterSuccess)
                            imgEditorActionAfterSuccess(dataPath)
                        */
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
            clearsContext=''
            title={task.Title}>
    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2">
            <section class="w-full flex flex-row justify-between">
                    <p class="">
                        {task.Index}
                    </p>
                    <div>
                        {#if task.TaskList || onListPlaceholder}
                            <p>
                                <a href={task.TaskList.href} use:link >
                                    {task.TaskList.Name}
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
            <p>
                {#each attachedFiles as fileInfo (fileInfo.name)}
                    <AttachedFile self={task} a='AttachedFiles' {fileInfo}/>
                {/each}
            </p>
            {/if}



            {#if (task.Steps && task.Steps.length > 0) || stepsPlaceholder}
                <TaskSteps steps={task.Steps}
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
                <Editor   a='Description'
                            compact={true}
                            bind:this={description}
                            onFocusCb={() => activateFormattingTools()}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded()}
                            onAddImage={uploadImage}
                            onRemoveImage={removeImage}
                            extraFrontPaletteCommands={extraPaletteCommands}
                            extraInsertPaletteCommands={extraInsertPalletteCommands}/>

            {/if}

        </article>



    </section>

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/> <!-- capture="environment" -->
    <input hidden type="file" id="attachementFile" accept="*/*" bind:this={attInput} on:change={onAttachementSelected}/>
</Page>
{/if}

<Modal title='Uploading...' bind:open={pendingUploading} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/>
    <span class="ml-3">Your file is uploading to the server</span>
</Modal>
