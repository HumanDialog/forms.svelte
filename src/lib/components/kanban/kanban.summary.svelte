<script lang="ts">
    import {getContext} from 'svelte'
    import type {rKanban_definition} from './Kanban'

    export let a: string;

    let definition :rKanban_definition = getContext("rKanban-definition");
    definition.summaryAttrib = a;
</script>