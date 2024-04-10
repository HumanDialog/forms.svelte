<script lang="ts">
    import {getContext} from 'svelte'
    import type {rList_definition} from './List'

    export let action :Function;
    export let icon :boolean = false;

    
    let definition :rList_definition = getContext("rList-definition");
    
    definition.can_insert = true
    definition.onInsert = action;
    definition.inserter_icon = icon;
</script>
