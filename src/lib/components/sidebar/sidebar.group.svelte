<script>
    import Icon from '../icon.svelte'
    import Edit from '../edit.field.svelte'
    import {FaPlus} from 'svelte-icons/fa'

    export let border = false;
    export let inserter = undefined;
    export let inserter_placeholder = 'New'

    let border_class = border ? " pt-4 mt-4 border-t border-gray-200 dark:border-gray-700" : ""
</script>

<ul class="space-y-2 {border_class}">
    <slot/>

    {#if inserter}
        <Edit class="p-2 text-base font-normal text-gray-500 rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" on_enter={inserter} placeholder={inserter_placeholder} inserter={true}>
            <Icon size={5} component={FaPlus} class="mr-3"/>
        </Edit>
    {/if}
</ul>