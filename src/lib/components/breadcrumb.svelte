<script>
    import {location, link, querystring} from 'svelte-spa-router'
	import { breadcrumbParse, breadcrumbStringify } from './breadcrumb_utils';
	
    export let path;

    let segments = []
    let userClass = $$props.class ?? ''

    $: init($location, $querystring)

    function init(...args)
    {
        segments = breadcrumbParse(path);
    }

    function getSegmentHRef(href, idx)
    {
        let prevSegments = []
        if(idx > 0)
            prevSegments = segments.slice(0, idx)
        
        const prevPath = breadcrumbStringify(prevSegments)
        return `${href}?path=${prevPath}` 

    }

</script>

<nav class="flex {userClass}" aria-label="Breadcrumb">
  <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse flex-wrap">
    
        {#if (segments && segments.length > 1)}
            {#each segments as segment, idx (segment.href)}
                {@const isFirst = idx == 0}
                {@const isLast = idx == segments.length-1}
                <li>
                    <div class="flex items-center">
                        {#if !isFirst}
                            <svg class="rtl:rotate-180 w-3 h-3 text-stone-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                            </svg>
                        {/if}
                        {#if isLast}
                            <span class="ms-1 text-sm md:ms-2 font-semibold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                                {segment.name}
                            </span>
                        {:else}
                            <a href={getSegmentHRef(segment.href, idx)} use:link class="ms-1 text-sm font-medium md:ms-2 text-stone-700 hover:text-stone-900  dark:text-stone-400 dark:hover:text-white whitespace-nowrap">
                                {segment.name}
                            </a>
                        {/if}
                    </div>
                </li>
            {/each}
        {/if}
    
  </ol>
</nav>
