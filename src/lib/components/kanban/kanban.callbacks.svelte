<script lang="ts">
    import {getContext} from 'svelte'
    import type {rKanban_definition} from './Kanban'

    export let onAdd:       Function | undefined = undefined;
    export let onOpen:      Function | undefined = undefined;
    export let onReplace:   Function | undefined = undefined;
    
    export let getCardOperations: Function | undefined = undefined;
    
    let definition :rKanban_definition = getContext("rKanban-definition");
    
    definition.onAdd = onAdd;
    definition.onOpen = onOpen;
    definition.onReplace = onReplace;
    definition.getCardOperations = getCardOperations;

</script>
