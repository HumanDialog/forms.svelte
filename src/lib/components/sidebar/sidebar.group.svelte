<script>
    import {FaChevronDown, FaChevronUp} from 'svelte-icons/fa'

    export let border = false;
    export let title = ''
    export let collapsable = false;
    export let onExpand = undefined

    let border_class = border ? " pt-4 mt-4 border-t border-stone-200 dark:border-stone-700" : ""
    let title_border = title ? border_class : ""
    let list_border = title ? "" : border_class
    let collapsed = true;

    function toggleCollapsed()
    {
        if(collapsed && !!onExpand)
            onExpand();

        collapsed = !collapsed;
    }
</script>

{#if title}
    <p class="text-base sm:text-xs uppercase font-semibold {title_border}">
        {title}
        {#if collapsable}
            <button class="inline-block ml-3 sm:ml-2 sm:mt-0.5 w-4 sm:w-3 h-4 sm:h-3" on:click={toggleCollapsed}>
                {#if collapsed}
                    <FaChevronDown/>
                {:else}
                    <FaChevronUp/>
                {/if}
            </button>
        {/if}
    </p>
{/if}

{#if !collapsable}
    <ul class="space-y-2 {list_border}">
        <slot/>
    </ul>
{:else if !collapsed}
    <ul class="space-y-2 {list_border}">
        <slot/>
    </ul>
{/if}

