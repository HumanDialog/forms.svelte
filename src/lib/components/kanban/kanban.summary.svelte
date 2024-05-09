<script lang="ts">
    import {getContext} from 'svelte'
    import type {rKanban_definition} from './Kanban'

    export let a: string;
    export let onChange: Function | undefined = undefined;
    export let readOnly: boolean = false;


    let definition :rKanban_definition = getContext("rKanban-definition");
    definition.summaryAttrib = a;
    definition.summaryOnChange = onChange;
    definition.summaryReadOnly = readOnly;
</script>