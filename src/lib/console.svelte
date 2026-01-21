<script>
	import { reef, session } from "@humandialog/auth.svelte";
	import { afterUpdate } from "svelte";
    import { contextTypesStore, contextItemsStore, bottom_bar_visible_store} from './stores.js'
    import Ricon from './components/r.icon.svelte'

	let prevLines = [];
    let prompt = '>'
    let input = ""
    let inputElement;
    let protocol = 'cons';
    let protoButtonBorderClass = ''
    let history = []
    let currentHistoryElementIdx = -1

    async function onKeyDown(e)
    {
        if(!$session.isActive && !$session.isUnauthorizedGuest)
        {
            prevLines = [...prevLines, "Sign-in first"]
            input = "";
        }

        if(e.key == 'Enter')
        {
            prevLines = [...prevLines, `${prompt} ${input}`];

            const orgInput = input
            if(input.startsWith('self'))
            {
                let navItem = getNav('props');
                if(!navItem)
                    navItem = getNav('data')

                if(navItem)
                    input = input.replace('self', navItem)
            }

            const req = input;
            input = "";

        //    console.log('console', req)

            const apiVer = $session.configuration.api_version;
            const result = await reef.fetch(`/${protocol}/${apiVer}/${req}`)
            const res = await result.text();
            prevLines = [...prevLines, res]
            
            updateHistory(orgInput)
        }
        else if(e.key == 'Esc' || e.key == 'Escape')
        {
            input = "";
        }
        else if(e.key == 'ArrowUp')
        {
            if(history.length > 0)
            {
                if(currentHistoryElementIdx < 0)
                {
                    currentHistoryElementIdx = history.length-1
                    input = history[currentHistoryElementIdx]
                }
                else if(currentHistoryElementIdx > 0)
                {
                    currentHistoryElementIdx--;
                    input = history[currentHistoryElementIdx]
                }
                else
                {
                    
                }
                moveCursorAtEnd()
            }
        }
        else if(e.key == 'ArrowDown')
        {
            if(history.length > 0)
            {
                if(currentHistoryElementIdx >= 0)
                {
                    currentHistoryElementIdx++
                    if(currentHistoryElementIdx >= history.length)
                    {
                        currentHistoryElementIdx = -1
                        input = ''
                    }
                    else
                        input = history[currentHistoryElementIdx]
                }  
                moveCursorAtEnd()
            }
        }
    }

    
    function updateHistory(command)
    {
        const idx = history.findIndex(c => c == command)
        if(idx < 0)
            history.push(command)
        else
        {
            history.splice(idx, 1)
            history.push(command)
        }

        currentHistoryElementIdx = -1
    }

    function getNav(contextLevel)
    {
        let navItem = '';
        const pageItem = $contextItemsStore[contextLevel]
        if(pageItem)
        {
            if(pageItem.$ref)
                navItem = pageItem.$ref; //.substr(2); 
            else if(pageItem.Id)
            {
                if(pageItem.$type)
                    navItem = pageItem.$type + '/' + pageItem.Id;
                else if(pageItem.oclType)
                    navItem = pageItem.oclType + '/' + pageItem.Id;
                else if($contextTypesStore[contextLevel])
                    navItem = $contextTypesStore[contextLevel] + '/' + pageItem.Id;
            }
        }
        return navItem;
    }

    function moveCursorAtEnd()
    {
        return;
        setTimeout( () => 
        {
            const sel = window.getSelection();
            if(!sel)
                return;
            if(sel.focusNode == inputElement)
                console.log(sel.focusOffset)    
            //sel.setPosition(inputElement, input.length)        
        }, 100)
    } 

    afterUpdate(() =>
    {
        inputElement?.scrollIntoView();
        
            //const selection = window.getSelection()
            //if(selection?.focusNode == inputElement)
            //{
            //    selection?.setPosition(inputElement, input.length-1)        
            //}
           
    })


    function protoChange()
    {
        if(protocol == 'cons')
        {
            protocol = 'json';
            protoButtonBorderClass = "border border-stone-400"
        }
        else
        {
            protocol = 'cons';
            protoButtonBorderClass = ""
        }
    }

    function closeConsole()
    {
        $bottom_bar_visible_store = false
    }

</script>

<div class="h-full overflow-y-auto overscroll-contain">
    <!--button class="fixed right-0 m-2 w-6 h-6 text-stone-200 {protoButtonBorderClass}" on:click={protoChange}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4C14 4 11 5 11 9C11 13 11 15 11 18C11 21 6 23 6 23C6 23 11 25 11 28C11 31 11 35 11 39C11 43 14 44 16 44"/>
            <path d="M32 4C34 4 37 5 37 9C37 13 37 15 37 18C37 21 42 23 42 23C42 23 37 25 37 28C37 31 37 35 37 39C37 43 34 44 32 44"/>
        </svg>
    </button-->
    <button class="fixed right-0 m-2 w-6 h-6 text-stone-200 {protoButtonBorderClass}" on:click={closeConsole}>
        <Ricon icon='x' />
    </button>
    

    <div class="p-2 w-full min-h-full  
                bg-stone-800 border-l border-t border-black font-mono text-stone-200">
        {#each prevLines as line}
            <p class="whitespace-pre-wrap">{line}</p>
        {/each}
        <p bind:this={inputElement} class="whitespace-pre-wrap">{prompt} 
            <input  type=text name="cmd" id="cmd" 
                    autocomplete="off"
                    class="bg-stone-800 w-11/12"
                    bind:value={input} 
                    on:keydown={onKeyDown}
                    placeholder="Type command here">
        </p>
    </div>
</div>
<style>
    input:focus {
    outline: 0px solid transparent;
  }

  svg {
        stroke: currentColor;
        fill: currentColor;
        stroke-width: 0;
        width: 100%;
        height: auto;
        max-height: 100%;
    }  
</style>
