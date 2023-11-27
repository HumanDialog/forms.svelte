<script lang="ts">
    import {getContext} from 'svelte'
    import type {rList_definition} from './List'

    export let a        :string;
    export let editable :boolean = false;
    export let on_change :Function | undefined = undefined; // i.e. function(element, text, property)
    export let readonly :boolean = false;
    
    let definition :rList_definition = getContext("rList-definition");
    
    definition.summary = a;
    definition.summary_editable = editable;
    definition.on_summary_changed = on_change;
    definition.summary_readonly = readonly;

</script>
