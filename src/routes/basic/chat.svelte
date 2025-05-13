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
			getNiceStringDate,
            showFloatingToolbar
            } from '$lib'
	import { onMount, tick } from 'svelte';
    import {location, link} from 'svelte-spa-router'
    
    import {FaShoppingBasket, FaArrowCircleRight, FaTimes, FaRegFile, FaRegCircle} from 'svelte-icons/fa/'
    import BasketPreview from './basket.preview.svelte'
    
    let channelRef = ''
    let channel = null;
    let allTags = '';
   
    let pendingUploading = false;
    let isReadOnly = false;
    const s = session;
    
    $: onParamsChanged($location)

    async function onParamsChanged(...args)
    {
        //console.log('channel: ', $location)
        const segments = $location.split('/');
        const foundIdx = segments.findIndex( s => s == 'chat');
        if(foundIdx < 0)
            return;

        const channelId = segments[segments.length-1]
        channelRef = `./MessageChannel/${channelId}`

        reef.get('/group/AllTags', onErrorShowAlert).then((res) => {
            allTags=res
            reloadVisibleTags()
        })

       await reloadData();
       scrollDown();
    }

    

    async function reloadData()
    {
        if(!channelRef)
            return;
        
        let res = await reef.post(`${channelRef}/query`, 
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
                                                    'GetTitle',
                                                    'Summary', 
                                                    'Status',
                                                    'Order', 
                                                    '$ref', 
                                                    '$type', 
                                                    '$acc'],
                                    SubTree:[
                                        {
                                            Id: 11,
                                            Association: 'Messages',
                                            Expressions:['$ref', "Text", "Tags", "Index", "Kind", "State", "Date", "Images"],
                                            Sort: "Date",
                                            //Filter: last few days?
                                            SubTree: [
                                                {
                                                    Id:111,
                                                    Association: 'Author',
                                                    Expressions:['$ref', 'Name']
                                                },
                                                {
                                                    Id:112,
                                                    Association: 'Notes',
                                                    Expressions:['$ref', 'Title', 'href']
                                                },
                                                {
                                                    Id:113,
                                                    Association: 'Tasks',
                                                    Expressions:['$ref', 'Title', 'href']
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        onErrorShowAlert)
        
        channel = res.MessageChannel

        if(channel.GetTitle)
            channel.Title = channel.GetTitle

        isReadOnly = (channel.$acc & 0x2) == 0

    }

    function getPageOperations()
    {
        return [];
    }

    const dateTimeFormat2 = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });

    function printTime(dt)
    {
        return dateTimeFormat2.format(dt)
    }

    let newMessage = {
        text: ''
    }
    let newMessageElement;
    let newMessageContent = ''

    async function onContentChanged(content)
    {

    }

    const descriptionActive = { }
    function activateFormattingTools()
    {
        //activateItem('props', descriptionActive, getPageOperationsWithFormattingTools())
    }

    function deactivateFormattingToolsIfNeeded()
    {
        //if(isActive('props', descriptionActive))
        //    clearActiveItem('props')
    }

    function uploadImage(editorActionAfterSuccess)
    {
     
    }

    function removeImage(dataPath)
    {
    }

    function scrollDown()
    {
        newMessageElement?.scrollIntoView(
                {
                    block: "end"
                });
        return;

        const messagesNo = messageElements.length
        if(messagesNo)
        {
            const lastMessage = messageElements[messagesNo-1]
            lastMessage.scrollIntoView(
                {
                    block: "end"
                }
            )
        }
    }

    let messageElements = [];
    async function onSubmit(messageText)
    {
        const res = await reef.post(`${channelRef}/AddMessage`, {
            text: messageText,
            attachements: newMessageAttachements
        }, onErrorShowAlert)
        
        if(res)
        {
            await reloadData();
            await tick();   // rerender
            scrollDown();
        }
    }

    function onKeyDown(e)
    {
        if(e && e.key == 'Enter' && (!e.ctrlKey) && (!e.shiftKey))
        {
            if(newMessageContent)
            {
                onSubmit(newMessageContent)
                newMessageContent = ''  
                newMessageAttachements = []
            }
            e.stopPropagation()
            e.preventDefault() 
        }
    }

    function onSubmitClick(e)
    {
        if(newMessageContent)
        {
            onSubmit(newMessageContent)
            newMessageContent = ''  
            newMessageAttachements = []
        }
    }

    function byteLengthUTF8(str) 
    {
        let s = str.length;
        for (let i=str.length-1; i>=0; i--) 
        {
            const code = str.charCodeAt(i);
            if (code > 0x7f && code <= 0x7ff) s++;
            else if (code > 0x7ff && code <= 0xffff) s+=2;
            if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
        }
        return s;
    }

    function additionalBytesSize(str) 
    {
        let no = 0;
        for (let i=str.length-1; i>=0; i--) 
        {
            const code = str.charCodeAt(i);
            if (code > 0x7f && code <= 0x7ff) no++;
            else if (code > 0x7ff && code <= 0xffff) no+=2;
            if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
        }
        return no;
    }

    function showBasket(e)
    {
        let owner = e.target;
        while(owner && ((owner.tagName != 'BUTTON') && (owner.tagName != 'LI')))
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()

        const margin = 15;
        rect.x -= margin;
        rect.y -= margin;
        rect.width += 2*margin;
        rect.height += 2*margin;

        showFloatingToolbar(rect, BasketPreview, {
                        onAttach: onAttachBasket,
                        onAttachAndClear: onAttachAndClearBasket
                        
                    });
    }

    // tmp
    let newMessageAttachements = []
    /*{
        "Type": "Folder",
        "Id": 42
    },
    {
        "Type": "Note",
        "Id": 29
    },
    {
        "Type": "Task",
        "Id": 56
    }
]*/
    async function onAttachBasket(basketItem)
    {
        if(!basketItem)
            return;

       const res = await reef.post(`${basketItem.$ref}/GetBasketContents`, {}, onErrorShowAlert)
       if(res)
       {
            newMessageAttachements = [...res]
       }
    } 

    async function onAttachAndClearBasket(basketItem)
    {
        if(!basketItem)
            return;

       const res = await reef.post(`${basketItem.$ref}/GetBasketContentsAndClear`, {}, onErrorShowAlert)
       if(res)
       {
            newMessageAttachements = [...res]
       }
    }

    function clearAttachements(e)
    {
        newMessageAttachements = []
    }

</script>

<svelte:head>
    {#if channel && channel.Title}
        <title>{channel.Title} | {__APP_TITLE__}</title>
    {:else}
        <title>{__APP_TITLE__}</title>
    {/if}
</svelte:head>

{#if channel != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={channel} 
            toolbarOperations={getPageOperations()}
            clearsContext=''
            title={channel.Title}>
    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2 prose-img:rounded-xl ">
            <!--section class="w-full flex flex-row justify-between">
                    <p class="">
                        {channel.Index}
                    </p>
                    <div>
                        {#if creationDate}
                            <p>
                                {getNiceStringDate(creationDate)}
                            </p>
                        {/if}
                    </div>
            </section-->

            <h1>
                {channel.Title}
            </h1>

            {#if channel.Summary}
                <p  class="lead">
                    {channel.Summary}
                </p>
           {/if}
            
            {#if channel.Messages && channel.Messages.length > 0}
                {#each channel.Messages as message, idx}
                    {@const dt = new Date(message.Date)}
                    {@const notesNo = message.Notes ? message.Notes.length : 0}
                    {@const tasksNo = message.Tasks ? message.Tasks.length : 0}
                    
                    <!--section bind:this={messageElements[idx]}-->
                        <h4>{message.Author.Name} 
                            <span class="ml-2 text-xs font-normal opacity-70">
                                {printTime(dt)},   {getNiceStringDate(dt)} 
                            </span>
                        </h4>

                        <p class="whitespace-pre-wrap">
                            {message.Text}
                            <br>
                            <span class="text-xs">  
                                {#if notesNo>0 || tasksNo>0}
                                    
                                        {#if notesNo>0}
                                            {#each message.Notes as att}
                                                <a      class="mr-2 font-normal"
                                                        href={att.href}
                                                        use:link
                                                        >
                                                    <span class="inline-block w-3 h-3">
                                                        <FaRegFile/>
                                                    </span>
                                                    {att.Title}
                                                </a>
                                            {/each}
                                        {/if}

                                        {#if tasksNo > 0}
                                            {#each message.Tasks as att}
                                                <a      class="mr-2  font-normal"
                                                        href={att.href}
                                                        use:link
                                                        >
                                                    <span class="inline-block w-3 h-3">
                                                        <FaRegCircle/>
                                                    </span>
                                                    {att.Title}
                                                </a>
                                            {/each}
                                        {/if}
                                        
                                    
                                {/if}
                            </span>
                        </p>  
                    
                    <!---/section-->
                {/each}
            {:else}
                <p class="">No messages here</p>
            {/if}
            <!--p class="h-20"></p-->

            
            <section class="not-prose
                            mt-4  
                            min-h-20 w-full 
                            border border-sto
                            ne-300 dark:border-stone-600 rounded-lg p-2
                            bg-stone-100 dark:bg-stone-800"
                            bind:this={newMessageElement}>
                            
                <textarea   class="w-full bg-stone-100 dark:bg-stone-800 outline-none"
                            bind:value={newMessageContent}
                            maxlength={196-additionalBytesSize(newMessageContent)}
                            placeholder="Type new message"
                            on:keydown={onKeyDown}/>

                <div class="w-full flex flex-row gap-2">
                    
                    {#if newMessageAttachements.length > 0}
                        <section class="flex flex-row gap-2 flex-wrap">
                            {#each newMessageAttachements as att}
                                <p class="px-2  text-nowrap
                                            border rounded border-stone-300 dark:border-stone-600
                                            text-xs">
                                    {#if att.Title}
                                        {att.Title}
                                    {:else}
                                        {att.Type}/{att.Id}
                                    {/if}
                                </p>
                            {/each}
                            <button class="w-3 h-3 mt-0.5" on:click={clearAttachements}>
                                <FaTimes/>
                            </button>
                        </section>
                    {/if}

                    <p class="flex-none ml-auto pt-0.5 text-xs m-0">
                        {byteLengthUTF8(newMessageContent)}/196
                    </p>

                    <button class="flex-none w-5 h-5" on:click={showBasket}>
                        <FaShoppingBasket/>
                    </button>
                    
                    <button class="flex-none w-5 h-5" on:click={onSubmitClick}>
                        <FaArrowCircleRight/>
                    </button>
                </div>

            </section>

        </article>

    

    </section>

    
    
    <!--input hidden type="file" id="imageFile" accept="image/*" bind:this={imgInput} on:change={onImageSelected}/--> <!-- capture="environment" -->
</Page>
{/if}




