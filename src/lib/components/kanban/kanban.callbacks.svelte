<script lang="ts">
    import {getContext} from 'svelte'
    import type {rKanban_definition} from './Kanban'

    export let onUp:        Function | undefined = undefined;
    export let onDown:      Function | undefined = undefined;
    export let onAdd:       Function | undefined = undefined;
    export let onRemove:    Function | undefined = undefined;
    export let onReplace:   Function | undefined = undefined;
    export let onOpen:      Function | undefined = undefined;

    let definition :rKanban_definition = getContext("rKanban-definition");
    
    definition.onUp = onUp;
    definition.onDown = onDown;
    definition.onAdd = onAdd;
    definition.onRemove = onRemove;
    definition.onReplace = onReplace;
    definition.onOpen = onOpen;

</script>
