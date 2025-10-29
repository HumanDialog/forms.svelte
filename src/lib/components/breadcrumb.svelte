<script>
    import {location, link, querystring} from 'svelte-spa-router'
    import {randomString, isDeviceSmallerThan} from '../utils'
    import { ext } from '$lib/i18n.js';
	import { afterUpdate } from 'svelte';
	
    export let path;
    export let collapseLonger = false

    let segments = []
    let userClass = $$props.class ?? ''
    
    $: init($location, $querystring)

    function init(...args)
    {
        if(path && Array.isArray(path) && path.length > 0)
        {
            path.forEach(el => 
                segments.push({
                    name: el.Name,
                    href: el.href ?? '',
                    uniqueKey: randomString(5)
                })
            )
        }
        else
            segments = []

    }

    
    function shouldBeCollapsed(idx)
    {
        const isSmall = isDeviceSmallerThan("sm")
        const entriesNo = segments.length
        const maxEntriesNo = isSmall ? 2 : 5        //todo: depending on elements real widths
        const isCollaspable = collapseLonger && entriesNo > maxEntriesNo

        if(!isCollaspable)
            return false

        return idx < entriesNo-maxEntriesNo
    }

    let containerElement
    let scrollableElement
    /*let isScrolling = false
    let startScrollLeft = 0
    let startDragX = 0
    let startDragY = 0
    function mouseDown(e)
    {
        
        isScrolling = true
        startDragX = e.offsetX
        startDragY = e.offsetY
        startScrollLeft = scrollableElement.scrollLeft
    }

    function mouseMove(e)
    {
        if(isScrolling)
        {
            const deltaX = startDragX - e.offsetX        
            //console.log('mouseMove', deltaX)

            scrollableElement.scrollLeft = startScrollLeft + deltaX
        }
    }

    function mouseUp(e)
    {
        console.log('mouseUp', e)
        isScrolling = false
        startDragX = 0
        startDragY = 0
        startScrollLeft = 0
    }
    */

    let pathElements = []
    afterUpdate( () => 
    {
        const elementsNo = pathElements.length
        if(elementsNo > 0)
        {
            // container: "nearest" not supported on iOS and mobile FF 
            //const lastElement = pathElements[elementsNo-1]    
            //lastElement.scrollIntoView({ container: "nearest"})  

            const containerRect = containerElement.getBoundingClientRect()
            const wholeWidth = containerElement.scrollWidth
            const visibleWidth = containerRect.width
            containerElement.scrollLeft = wholeWidth - visibleWidth
            
        }
    })

</script>

<nav class="{userClass} w-full sm:w-fit sm:max-w-full overflow-x-auto sm:overflow-x-hidden" aria-label="Breadcrumb" bind:this={containerElement}>
  <ol class="flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse flex-nowrap min-h-[1.25rem]" bind:this={scrollableElement}>
    
        {#if (segments && segments.length > 0)}
            {#each segments as segment, idx (segment.uniqueKey)}
                {@const isFirst = idx == 0}
                {@const isCollapsed = shouldBeCollapsed(idx)}
                {@const isFirstCollapsed = isCollapsed && idx == 0}
                
                {#if isCollapsed}
                    {#if isFirstCollapsed}
                        <!--svg class="rtl:rotate-180 w-3 h-3 text-stone-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                        </svg-->
                        <span class="ms-1 text-sm md:ms-2 font-semibold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                            ...
                        </span>
                    {/if}
                {:else}
                    <li bind:this={pathElements[idx]}>
                        <div class="flex items-center">
                            {#if !isFirst}
                                <!--svg class="rtl:rotate-180 w-3 h-3 text-stone-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                                </svg-->
                                <span class="text-sm font-medium text-stone-700  dark:text-stone-400 ">
                                    /
                                </span>
                            {/if}
                            
                            {#if segment.href}
                                <a href={segment.href} use:link class="ms-1 text-sm font-medium md:ms-2 text-stone-700 hover:text-stone-900  dark:text-stone-400 dark:hover:text-white whitespace-nowrap">
                                    {ext(segment.name)}
                                </a>
                            {:else}
                                <span class="ms-1 text-sm font-medium md:ms-2 text-stone-700  dark:text-stone-400 whitespace-nowrap">
                                    {ext(segment.name)}
                                </span>
                            {/if}
                
                        </div>
                    </li>
                {/if}
            {/each}
        {/if}
    
  </ol>
</nav>
