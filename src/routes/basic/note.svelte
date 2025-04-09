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

			getNiceStringDate

            } from '$lib'
	import { onMount, tick } from 'svelte';
    import {location, querystring, push} from 'svelte-spa-router'
    
    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo, FaSave, FaCloudUploadAlt, FaFont, FaPen, FaList} from 'svelte-icons/fa/'
	
    let noteRef = ''
    let note = null;
    let allTags = '';
   
    let availableStates = [];
    let pendingUploading = false;
    let isReadOnly = false;
    const s = session;
    let creationDate = null
    let modificationDate = null

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

        allTags = await reef.get('/group/AllTags', onErrorShowAlert);

       await reloadData();
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
                                                    'Kind', 
                                                    'State', 
                                                    '$ref', 
                                                    '$type', 
                                                    '$acc'],
                                    SubTree:[
                                        {
                                            Id: 11,
                                            Association: 'CreatedBy',
                                            Expressions:['$ref', 'Name']
                                        },
                                        {
                                            Id: 12,
                                            Association: 'ModifiedBy',
                                            Expressions:['$ref', 'Name']
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
        
        isReadOnly = note.$acc === 1

    }

    async function onTitleChanged(text)
    {
        note.Title = text;
        await reef.post(`${noteRef}/SetTitle`, {val: text}, onErrorShowAlert)
    }

    async function onSummaryChanged(text)
    {
        note.Summary = text;
        await reef.post(`${noteRef}/SetSummary`, {val: text}, onErrorShowAlert)
        
    }

    async function onUpdateAllTags(newAllTags)
    {
        allTags  = newAllTags
        await reef.post('group/set', { AllTags: allTags}, onErrorShowAlert)
    }

    async function onTagsChanged(tags)
    {
        note.Tags = tags;
        await reef.post(`${noteRef}/SetTags`, {val: tags}, onErrorShowAlert)
    }

    async function onContentChanged(content)
    {
        note.Content = content;
        await reef.post(`${noteRef}/SetContent`, {val: content}, onErrorShowAlert)
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
        
        
        {
            separator: true
        },
        
        {
            caption: 'Tag',
            icon: FaTag,
            action: async (f) => 
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
        },
        
        {
            separator: true
        },
        {
            caption: 'Content',
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
            opver: 1,
            operations: [
                {
                    caption: 'View',
                    operations: [
                        {
                            icon: FaPen,
                            grid: addOperations,
                            fab: 'M10',
                            tbr: 'A'
                        },
                        {
                            icon: FaSave,
                            action: (f) => saveCurrentEditable(),
                            fab: 'S00',
                            tbr: 'A'
                        },
                       
                    ]
                }
            ]
        }
    }
    

    function getPageOperationsWithFormattingTools() 
    {
        const mobile = isDeviceSmallerThan("sm")
        if(mobile)
        {
            return [
                {
                    icon: FaFont,
                    //aboveKeyboard: true,
                    menu: description.getFormattingOperations(true)
                }
            ]
        }
        else
        {
            const addOperation = {
                icon: FaPen,
                caption: '',
                grid: addOperations
            };

            const saveOperation = {
                icon: FaSave,
                action: (f) => { description?.save() }
            }

            const separator = {
                separator: true
            }

            let formattingOperations = description.getFormattingOperations();
            if(!isDeviceSmallerThan('sm'))
                formattingOperations = [saveOperation, ...formattingOperations]

            let operations = [addOperation,  separator, ...formattingOperations]
            return operations
        }
    }

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

</script>

<svelte:head>
    {#if note && note.Title}
        <title>{note.Title} | Octopus Basic</title>
    {:else}
        <title>Octopus Basic</title>
    {/if}
</svelte:head>

{#if note != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={note} 
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title={note.Title}>
    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2 prose-img:rounded-xl prose-p:my-0">
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
                    <p> {note.CreatedBy.Name} </p>
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
            
            
            
                
            <!--{#if note.Content || descriptionPlaceholder}-->
                <hr/>    
                <Editor   a='Content'
                            compact={true}
                            bind:this={description}
                            onChange={onContentChanged}
                            onFocusCb={() => activateFormattingTools()}
                            onBlurCb={() => deactivateFormattingToolsIfNeeded()}
                            onAddImage={uploadImage}
                            onRemoveImage={removeImage}/>
            <!--{/if}-->

        </article>
        
        
        
    </section>

    <input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/> <!-- capture="environment" -->
</Page>
{/if}

<Modal title='Uploading...' bind:open={pendingUploading} mode={3} icon={FaCloudUploadAlt}>
    <Spinner delay={0}/> 
    <span class="ml-3">Your image is uploading to the server</span>
</Modal>

