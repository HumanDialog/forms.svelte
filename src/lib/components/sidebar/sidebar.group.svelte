<script>
    import Icon from '../icon.svelte'
    import Edit from '../edit.field.svelte'
    import {FaPlus} from 'svelte-icons/fa'

    export let border = false;
    export let inserter = undefined;
    export let inserterPlaceholder = 'New'

    let border_class = border ? " pt-4 mt-4 border-t border-stone-200 dark:border-stone-700" : ""
</script>

<ul class="space-y-2 {border_class}">
    <slot/>

    {#if inserter}
        <Edit class="p-3 sm:p-2 text-lg sm:text-base font-normal text-stone-500 rounded-lg dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700" onEnter={inserter} placeholder={inserterPlaceholder} inserter={true}>
            <Icon size={5} component={FaPlus} class="mr-3"/>
        </Edit>
    {/if}
</ul>