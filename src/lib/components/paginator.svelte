<script>
    
    export let pageNo
    export let allPagesNo
    export let onPage
    export let visiblePagesNo = 4

    let visiblePages = []
    $: update()

    export function updatePageNo(p)
    {
        pageNo = p
        update()
    }

    export function updateAllPagesNo(allP)
    {
        allPagesNo = allP
        update()
    }

    function update(...args)
    {
        const absStart = 0
        const absEnd = allPagesNo-1

        if(pageNo < absStart)
            pageNo = absStart

        if(pageNo > absEnd)
            pageNo = absEnd

        let visStart = pageNo - Math.floor(visiblePagesNo/2)
        if(visStart < absStart)
            visStart = absStart

        let visEnd = visStart + visiblePagesNo - 1
        if(visEnd > absEnd)
        {
            visEnd = absEnd
            visStart = Math.max(absStart, visEnd - visiblePagesNo + 1)
        }

        visiblePages = []
        for(let p=visStart; p<= visEnd; p++)
            visiblePages.push(p)
    }
    
    function onPrevPage(e)
    {
        if(pageNo > 0)
            onPage(pageNo-1)
    }

    function onNextPage(e)
    {
        if(pageNo <= allPagesNo-2)
           onPage(pageNo+1) 
    }
    
</script>

<nav aria-label="Page navigation example" class="">
    {#if visiblePages.length > 1}
        <ul class="flex items-center -space-x-px h-8 text-sm">
            <li>
                <button on:click={onPrevPage} 
                    class="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-stone-500 bg-white border border-e-0 border-stone-300 rounded-s-lg hover:bg-stone-100 hover:text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-white">
                    <span class="sr-only">Previous</span>
                        <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4"/>
                        </svg>
                </button>
            </li>
            

            {#each visiblePages as p (p)}
                <li>
                    {#if p == pageNo}
                        <button disabled class="z-10 flex items-center justify-center px-3 h-8 leading-tight text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-stone-700 dark:bg-stone-700 dark:text-white">
                            {p+1}
                        </button>
                    {:else}
                        <button on:click={(e) => onPage(p)} class="flex items-center justify-center px-3 h-8 leading-tight text-stone-500 bg-white border border-stone-300 hover:bg-stone-100 hover:text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-white">
                            {p+1}
                        </button>
                    {/if}
                </li>
                
            {/each}

            
            <!--a href="#" aria-current="page" class="">3</a-->
            <li>
                <button on:click={onNextPage} class="flex items-center justify-center px-3 h-8 leading-tight text-stone-500 bg-white border border-stone-300 rounded-e-lg hover:bg-stone-100 hover:text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-white">
                    <span class="sr-only">Next</span>
                        <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                        </svg>
                </button>
            </li>
        </ul>
    {/if}
</nav>