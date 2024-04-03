<script lang="ts">
    import {getContext} from 'svelte'
    import type {rKanban_definition} from './Kanban'

    export let a: string;
    export let onChange: Function | undefined = undefined

    let definition :rKanban_definition = getContext("rKanban-definition");
    definition.titleAttrib = a;
    definition.titleOnChange = onChange;

</script>

