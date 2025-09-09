<script>
    import {FaChevronDown, FaChevronUp} from 'svelte-icons/fa'
    import {i18n} from '../../i18n'
    import {link} from 'svelte-spa-router'

    export let border = false;
    export let title = ''
    export let collapsable = false;
    export let onExpand = undefined
    export let moreHref = undefined

    let border_class = border ? " pt-4 mt-4 border-t border-stone-200 dark:border-stone-700" : "mt-6"
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
    <div class="w-full flex flex-row justify-between {title_border} mb-2">
        <p class="text-xs uppercase font-semibold">
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

        {#if moreHref}
            <p class="text-xs uppercase font-semibold mr-2 text-stone-900 dark:text-stone-400">
                <a href={moreHref} class="text-right" use:link>
                    {i18n({en: 'More...', es: 'Más...', pl: 'Więcej...'})}
                </a>
            </p>
        {/if}
    </div>

{/if}

{#if !collapsable}
    <ul class= "{list_border}">
        <slot/>
    </ul>
{:else if !collapsed}
    <ul class="{list_border}">
        <slot/>
    </ul>
{/if}

