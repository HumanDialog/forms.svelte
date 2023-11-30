<script lang="ts">
    import {getContext} from 'svelte'
    import type {rList_definition} from './List'
	
    export let a        :string;
    export let editable :boolean = false;
    export let on_change :Function | undefined = undefined; // function(element, text, property)
    export let readonly :boolean = false;

    
    let definition :rList_definition = getContext("rList-definition");
    
    definition.title=a;
    definition.title_editable=editable;
    definition.on_title_changed=on_change;
    definition.title_readonly = readonly;

</script>